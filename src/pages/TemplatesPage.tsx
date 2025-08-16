"use client";

import { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useActiveAddress, useConnection } from '@arweave-wallet-kit/react';
import { usePostHog } from 'posthog-js/react';

import { createRoomFromTemplateAction, generateAITemplateAction } from '../services/roomActionsClient';
import { generateRoomKeyPairPem } from "../actions/cryptoClient";
import { type Template, type CreateRoomFromTemplateInput, type CreateRoomResult } from '../types/types';
import { templates as hardcodedTemplates } from '../lib/templates'; // Import local templates

import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Loader2, FileText, CheckCircle, Users, ScrollText, PlusCircle, Trash2, ArrowRight, X, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CustomLoader } from "../components/ui/CustomLoader";
import { Badge } from "../components/ui/badge";

interface OwnerOthentDetails {
    email: string;
    name?: string;
}

export default function TemplatesPage() {
    const navigate = useNavigate();
    const api = useApi();
    const activeAddress = useActiveAddress();
    const { connected } = useConnection();
    const posthog = usePostHog();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [editedTemplate, setEditedTemplate] = useState<Template | null>(null);
    const [roomName, setRoomName] = useState("");
    const [isRoomNameTouched, setIsRoomNameTouched] = useState(false);
    const [modalStep, setModalStep] = useState(0);
    const [newRoleName, setNewRoleName] = useState("");
    const [newPermissionNames, setNewPermissionNames] = useState<{ [key: string]: string }>({});
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGeneratingAiTemplate, startAiGenerationTransition] = useTransition();

    const [ownerOthentDetails, setOwnerOthentDetails] = useState<OwnerOthentDetails | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [editingPermission, setEditingPermission] = useState<{ role: string; permission: string } | null>(null);

    const formatName = (name: string) => {
        return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    if (selectedTemplate) {}

    const handleUpdateRoleName = (oldName: string, newName: string) => {
        if (!newName.trim() || newName.trim() === oldName) {
            setEditingRole(null);
            return;
        }
        setEditedTemplate(prev => {
            if (!prev) return null;
            const formattedNewName = formatName(newName.trim());
            if (prev.roles.includes(formattedNewName)) {
                toast.error("Role already exists.");
                return prev;
            }
            const updatedRoles = prev.roles.map(r => (r === oldName ? formattedNewName : r));
            const updatedPermissions = { ...prev.permissions };
            if (oldName in updatedPermissions) {
                updatedPermissions[formattedNewName] = updatedPermissions[oldName];
                delete updatedPermissions[oldName];
            }
            return { ...prev, roles: updatedRoles, permissions: updatedPermissions };
        });
        setEditingRole(null);
    };

    const handleUpdatePermissionName = (role: string, oldPermission: string, newPermission: string) => {
        if (!newPermission.trim() || newPermission.trim() === oldPermission) {
            setEditingPermission(null);
            return;
        }
        setEditedTemplate(prev => {
            if (!prev) return null;
            const formattedNewPermission = formatName(newPermission.trim());
            if (prev.permissions[role].includes(formattedNewPermission)) {
                toast.error("Permission already exists for this role.");
                return prev;
            }
            const updatedPermissions = { ...prev.permissions };
            updatedPermissions[role] = updatedPermissions[role].map(p =>
                p === oldPermission ? formattedNewPermission : p
            );
            return { ...prev, permissions: updatedPermissions };
        });
        setEditingPermission(null);
    };

    useEffect(() => {
        setTemplates(Object.values(hardcodedTemplates));
        setIsLoadingTemplates(false);
    }, []);

    useEffect(() => {
        const getUserEmail = async () => {
            if (connected && activeAddress && !ownerOthentDetails && !isFetchingDetails) {
                // Check if we have either wauth or othent available
                if (!api || (!api.authData && !api.othent)) return;

                setIsFetchingDetails(true);
                try {
                    let email: string;
                    let name: string | undefined;

                    // Check if using wauth authentication
                    if (api.id === "wauth-google") {
                        if (!api.authData?.email) {
                            throw new Error("Could not retrieve your email from wauth. Please ensure your Google account is properly linked.");
                        }
                        email = api.authData.email;
                        name = api.authData.name;
                    } else {
                        // Fall back to othent authentication
                        if (!api.othent) {
                            throw new Error("Authentication method not available. Please ensure your wallet is properly connected.");
                        }
                        const othentData: any = await api.othent.getUserDetails();
                        if (!othentData?.email) {
                            throw new Error("Could not retrieve your email. Please ensure your wallet is linked with an email.");
                        }
                        email = othentData.email;
                        name = othentData.name;
                    }

                    setOwnerOthentDetails({ email, name });
                } catch (err: any) {
                    toast.error("Authentication Error", { description: `Could not retrieve your details: ${err.message}.` });
                    setOwnerOthentDetails(null);
                } finally {
                    setIsFetchingDetails(false);
                }
            }
        };
        getUserEmail();
    }, [api, activeAddress, connected, ownerOthentDetails, isFetchingDetails]);

    const handleUseTemplateClick = (template: Template) => {
        const formattedTemplate = {
            ...template,
            roles: template.roles.map(formatName),
            permissions: Object.entries(template.permissions).reduce((acc, [role, perms]) => {
                acc[formatName(role)] = perms.map(formatName);
                return acc;
            }, {} as { [key: string]: string[] }),
        };

        setSelectedTemplate(formattedTemplate);
        const newEditedTemplate = JSON.parse(JSON.stringify(formattedTemplate));
        if (!newEditedTemplate.roles.some((role: string) => role.toLowerCase() === 'member')) {
            newEditedTemplate.roles.push('Member');
            newEditedTemplate.permissions['Member'] = [];
        }
        if (!newEditedTemplate.roles.some((role: string) => role.toLowerCase() === 'founder')) {
            newEditedTemplate.roles.unshift('Founder');
            newEditedTemplate.permissions['Founder'] = newEditedTemplate.permissions['Founder'] || [];
        }
        setEditedTemplate(newEditedTemplate);
        setRoomName("");
        setIsRoomNameTouched(false);
        setModalStep(0);
        setIsCreateModalOpen(true);
    };

    const handleRemoveRole = (roleToRemove: string) => {
        if (roleToRemove === 'Founder' || roleToRemove === 'Member') return;
        setEditedTemplate(prev => {
            if (!prev) return null;
            const newRoles = prev.roles.filter(r => r !== roleToRemove);
            const newPermissions = { ...prev.permissions };
            delete newPermissions[roleToRemove];
            return { ...prev, roles: newRoles, permissions: newPermissions };
        });
    };

    const handleRemovePermission = (role: string, permissionToRemove: string) => {
        setEditedTemplate(prev => {
            if (!prev) return null;
            const newPermissions = { ...prev.permissions };
            newPermissions[role] = newPermissions[role].filter(p => p !== permissionToRemove);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleAddRole = () => {
        const formattedRoleName = formatName(newRoleName.trim());
        if (!formattedRoleName || editedTemplate?.roles.includes(formattedRoleName)) {
            if (formattedRoleName) toast.error("Role already exists.");
            return;
        }
        setEditedTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                roles: [...prev.roles, formattedRoleName],
                permissions: { ...prev.permissions, [formattedRoleName]: [] }
            };
        });
        setNewRoleName("");
    };

    const handleAddPermission = (role: string) => {
        const newPermissionName = newPermissionNames[role] || "";
        const formattedPermissionName = formatName(newPermissionName.trim());
        if (!formattedPermissionName) return;
        if (editedTemplate?.permissions[role]?.includes(formattedPermissionName)) {
            toast.error("Permission already exists for this role.");
            return;
        }
        setEditedTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [role]: [...prev.permissions[role], formattedPermissionName]
                }
            };
        });
        setNewPermissionNames(prev => ({ ...prev, [role]: '' }));
    };

    const handleGenerateAiTemplate = async () => {
        if (!aiPrompt.trim()) {
            toast.error("Input Required", { description: "Please enter a prompt for AI template generation." });
            return;
        }
        startAiGenerationTransition(async () => {
            const toastId = toast.loading("Generating AI template...", { description: "This may take a moment." });
            try {
                const result = await generateAITemplateAction(aiPrompt);
                if (result.success && result.data) {
                    const generatedTemplate = result.data;
                    const formattedTemplate = {
                        ...generatedTemplate,
                        roles: generatedTemplate.roles.map(formatName),
                        permissions: Object.entries(generatedTemplate.permissions).reduce((acc, [role, perms]) => {
                            acc[formatName(role)] = (perms as string[]).map(formatName);
                            return acc;
                        }, {} as { [key: string]: string[] }),
                    };

                    // Ensure default roles are present but use proper casing
                    if (!formattedTemplate.roles.some(role => role.toLowerCase() === 'founder')) {
                        formattedTemplate.roles.unshift('Founder');
                        formattedTemplate.permissions['Founder'] = formattedTemplate.permissions['Founder'] || [];
                    }
                    if (!formattedTemplate.roles.some(role => role.toLowerCase() === 'member')) {
                        formattedTemplate.roles.push('Member');
                        formattedTemplate.permissions['Member'] = formattedTemplate.permissions['Member'] || [];
                    }
                    setSelectedTemplate(formattedTemplate);
                    setEditedTemplate(JSON.parse(JSON.stringify(formattedTemplate)));
                    setRoomName("");
                    setIsRoomNameTouched(false);
                    setModalStep(0);
                    setIsAiModalOpen(false);
                    setIsCreateModalOpen(true);
                    toast.success("AI Template Generated!", { id: toastId });
                } else {
                    throw new Error(result.message || result.error || "Failed to generate AI template.");
                }
            } catch (err: any) {
                toast.error("AI Generation Failed", { id: toastId, description: err.message });
            }
        });
    };

    const handleSubmit = async () => {
        if (!connected || !activeAddress || !ownerOthentDetails?.email) {
            toast.error("Not Ready", { description: "Please connect your wallet and wait for email to load." });
            return;
        }
        if (!roomName.trim() || !editedTemplate) {
            toast.error("Input Required", { description: "Company name and a template are required." });
            return;
        }

        startAiGenerationTransition(async () => {
            const toastId = toast.loading("Generating keys and creating company...", { description: `Using customized '${editedTemplate.name}' template.` });
            try {
                const { publicKeyPem, privateKeyPem } = await generateRoomKeyPairPem();
                
                // Filter out default roles ('Founder', 'Member') from templateRoles to avoid duplicates
                // The Lua script always creates 'founder' and 'member' as default non-deletable roles
                const customRoles = editedTemplate.roles.filter(role => 
                    role.toLowerCase() !== 'founder' && role.toLowerCase() !== 'member'
                );
                
                // Map permissions to use lowercase for default roles to match Lua script
                const normalizedPermissions = { ...editedTemplate.permissions };
                if (normalizedPermissions['Founder']) {
                    normalizedPermissions['founder'] = normalizedPermissions['Founder'];
                    delete normalizedPermissions['Founder'];
                }
                if (normalizedPermissions['Member']) {
                    normalizedPermissions['member'] = normalizedPermissions['Member']; 
                    delete normalizedPermissions['Member'];
                }

                const input: CreateRoomFromTemplateInput = {
                    roomName: roomName.trim(),
                    ownerEmail: ownerOthentDetails.email,
                    templateName: editedTemplate.name,
                    roles: customRoles, // Only send custom roles, not default ones
                    permissions: normalizedPermissions, // Use lowercase for default roles
                    roomPublicKeyPem: publicKeyPem,
                    roomPrivateKeyPem: privateKeyPem,
                };

                const result: CreateRoomResult = await createRoomFromTemplateAction(input);

                if (result.success && result.roomId) {
                    posthog?.capture('company_created_from_template', {
                        companyId: result.roomId,
                        companyName: roomName.trim(),
                        templateName: editedTemplate.name,
                        customized: true,
                    });
                    toast.success("Success!", {
                        id: toastId,
                        description: `Company '${roomName.trim()}' created! Redirecting...`,
                    });
                    setIsCreateModalOpen(false);
                    navigate(`/companies/${result.roomId}`);
                } else {
                    throw new Error(result.message || result.error || "Failed to create company.");
                }
            } catch (err: any) {
                toast.error("Creation Failed", { id: toastId, description: err.message });
            }
        });
    };

    if (isLoadingTemplates) {
        return <div className="flex h-screen items-center justify-center"><CustomLoader text="Loading templates..." /></div>;
    }

    const isLoading = isFetchingDetails || isGeneratingAiTemplate;

    return (
        <RequireLogin>
            <div className="container mx-auto max-w-6xl py-12 px-4 animate-fade-in">
                <div className="text-center mb-12">
                    <FileText className="mx-auto h-14 w-14 text-muted-foreground/80" strokeWidth={1.5} />
                    <h1 className="text-4xl font-bold tracking-tighter mt-4">Create a Company from a Template</h1>
                    <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Select a template to rapidly set up your company. You can customize roles and permissions before creation.
                    </p>
                    <Button onClick={() => setIsAiModalOpen(true)} className="mt-6 text-lg px-8 py-3"><Sparkles className="w-5 h-5 mr-2"/> Generate with AI</Button>
                </div>

                <div className="template-card-grid mb-12">
                    {templates.map(template => (
                        <Card key={template.name} className="template-card flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <FileText className="w-7 h-7 text-muted-foreground/80 flex-shrink-0" />
                                    <span>{template.name}</span>
                                </CardTitle>
                                <CardDescription className="pt-1 text-base">{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow pt-2">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span className="font-medium">{template.roles.length} Custom Roles</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <ScrollText className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span className="font-medium">{new Set(Object.values(template.permissions).flat()).size} Document Types</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="mt-auto pt-5">
                                <Button className="w-full btn-hover-effect" onClick={() => handleUseTemplateClick(template)}>
                                    <CheckCircle className="w-4 h-4 mr-2"/> Customize & Use Template
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Generate Template with AI</DialogTitle>
                            <DialogDescription>
                                Describe your use case or workflow, and AI will suggest roles and document permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="ai-prompt" className="font-semibold">Your Use Case Description</Label>
                            <Input
                                id="ai-prompt"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., 'A legal firm managing client contracts and case files.'"
                                className="mt-2"
                                disabled={isGeneratingAiTemplate}
                            />
                            <p className="text-sm text-muted-foreground mt-1">Example: 'A startup raising a seed round, needing roles for investors, auditors, and legal counsel.'</p>
                        </div>
                        <Button onClick={handleGenerateAiTemplate} disabled={isGeneratingAiTemplate || !aiPrompt.trim()}>
                            {isGeneratingAiTemplate ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>) : (<><Sparkles className="w-4 h-4 mr-2"/> Generate Template</>)}
                        </Button>
                    </DialogContent>
                </Dialog>

                {editedTemplate && (
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Customize '{editedTemplate.name}' Template</DialogTitle>
                                <DialogDescription>
                                    {modalStep === 0 ? "Select roles and permissions, or add new ones."
                                     : "Review your configuration and name your company."
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            
                            {modalStep === 0 && (
                                <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
                                    {['Founder', 'Member', ...editedTemplate.roles.filter(r => r !== 'Founder' && r !== 'Member')].map(role => (
                                        <div key={role} className="p-4 rounded-lg bg-muted/50 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {editingRole === role ? (
                                                        <Input
                                                            defaultValue={role}
                                                            onBlur={(e) => handleUpdateRoleName(role, e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateRoleName(role, e.currentTarget.value)}
                                                            autoFocus
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        <h4 className="font-semibold capitalize flex items-center text-base cursor-pointer" onClick={() => role !== 'Founder' && role !== 'Member' && setEditingRole(role)}>
                                                            <Users className="w-4 h-4 mr-2 text-primary" />
                                                            {role}
                                                        </h4>
                                                    )}
                                                    {(role === 'Founder' || role === 'Member') && (
                                                        <Badge variant="outline" className="flex items-center gap-1 text-xs"><ShieldCheck className="w-3 h-3"/>System Role</Badge>
                                                    )}
                                                </div>
                                                {(role !== 'Founder' && role !== 'Member') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(role)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {editedTemplate.permissions[role]?.map(doc => (
                                                    <Badge key={doc} variant="secondary" className="flex items-center gap-1">
                                                        {editingPermission?.role === role && editingPermission?.permission === doc ? (
                                                            <Input
                                                                defaultValue={doc}
                                                                onBlur={(e) => handleUpdatePermissionName(role, doc, e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePermissionName(role, doc, e.currentTarget.value)}
                                                                autoFocus
                                                                className="h-6 text-xs"
                                                            />
                                                        ) : (
                                                            <span className="cursor-pointer" onClick={() => setEditingPermission({ role, permission: doc })}>{doc}</span>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleRemovePermission(role, doc)}>
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center mt-2">
                                                <Input value={newPermissionNames[role] || ''} onChange={(e) => setNewPermissionNames(prev => ({ ...prev, [role]: e.target.value }))} placeholder="New permission" className="h-8" />
                                                <Button onClick={() => handleAddPermission(role)} size="sm" className="ml-2"><PlusCircle className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center mt-4">
                                        <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="New role name" />
                                        <Button onClick={handleAddRole} className="ml-2"><PlusCircle className="w-4 h-4 mr-2" />Add Role</Button>
                                    </div>
                                    <Button onClick={() => setModalStep(1)} className="mt-4 w-full">Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
                                </div>
                            )}

                            {modalStep === 1 && (
                                <div className="py-4">
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-lg mb-2">Configuration Summary</h3>
                                        <div className="p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                                            {['Founder', 'Member', ...editedTemplate.roles.filter(r => r !== 'Founder' && r !== 'Member')].map(role => (
                                                <div key={role} className="mb-2">
                                                    <h4 className="font-semibold capitalize">{role}</h4>
                                                    <p className="text-sm text-muted-foreground">{editedTemplate.permissions[role]?.join(', ') || "No permissions"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="roomName" className="font-semibold">Company Name</Label>
                                        <Input
                                            id="roomName"
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                            onBlur={() => setIsRoomNameTouched(true)}
                                            placeholder="e.g., QuantumLeap AI, Inc."
                                            required
                                            disabled={isLoading}
                                            className="mt-2"
                                        />
                                        {isRoomNameTouched && !roomName.trim() && <p className="text-sm text-destructive pt-2">Company name is required.</p>}
                                    </div>
                                    <div className="flex justify-between mt-6">
                                        <Button variant="outline" onClick={() => setModalStep(0)}>Back</Button>
                                        <Button onClick={handleSubmit} disabled={isLoading || !roomName.trim()}>
                                            {isGeneratingAiTemplate ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Company"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </RequireLogin>
    );
}