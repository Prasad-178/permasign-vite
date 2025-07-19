"use client";

import { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useActiveAddress, useConnection } from '@arweave-wallet-kit/react';
import { usePostHog } from 'posthog-js/react';

import { createRoomFromTemplateAction } from '../services/roomActionsClient';
import { generateRoomKeyPairPem } from "../actions/cryptoClient";
import { type Template, type CreateRoomFromTemplateInput, type CreateRoomResult } from '../types/types';
import { templates as hardcodedTemplates } from '../lib/templates'; // Import local templates

import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Loader2, AlertCircle, FileText, CheckCircle, Users, ScrollText, PlusCircle, Trash2, ArrowRight, X, ShieldCheck } from "lucide-react";
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

    const [ownerOthentDetails, setOwnerOthentDetails] = useState<OwnerOthentDetails | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isProcessing, startProcessingTransition] = useTransition();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        // Load templates from the local file
        setTemplates(Object.values(hardcodedTemplates));
        setIsLoadingTemplates(false);
    }, []);

    useEffect(() => {
        const getOthentEmail = async () => {
            if (connected && api?.othent && activeAddress && !ownerOthentDetails && !isFetchingDetails) {
                setIsFetchingDetails(true);
                try {
                    const othentData: any = await api.othent.getUserDetails();
                    if (othentData?.email) {
                        setOwnerOthentDetails({ email: othentData.email, name: othentData.name });
                    } else {
                        toast.error("Email Not Found", { description: "Could not retrieve your email from Othent." });
                        setOwnerOthentDetails(null);
                    }
                } catch (err: any) {
                    toast.error("Othent Error", { description: `Could not retrieve your details: ${err.message}.` });
                    setOwnerOthentDetails(null);
                } finally {
                    setIsFetchingDetails(false);
                }
            }
        };
        getOthentEmail();
    }, [api, activeAddress, connected, ownerOthentDetails, isFetchingDetails]);

    const handleUseTemplateClick = (template: Template) => {
        setSelectedTemplate(template);
        const newEditedTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
        if (!newEditedTemplate.roles.includes('member')) {
            newEditedTemplate.roles.push('member');
            newEditedTemplate.permissions['member'] = [];
        }
        setEditedTemplate(newEditedTemplate);
        setRoomName("");
        setIsRoomNameTouched(false);
        setModalStep(0);
        setIsCreateModalOpen(true);
    };

    const handleRemoveRole = (roleToRemove: string) => {
        if (roleToRemove === 'founder' || roleToRemove === 'member') return;
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
        if (!newRoleName.trim() || editedTemplate?.roles.includes(newRoleName.trim())) return;
        setEditedTemplate(prev => {
            if (!prev) return null;
            return {
                ...prev,
                roles: [...prev.roles, newRoleName.trim()],
                permissions: { ...prev.permissions, [newRoleName.trim()]: [] }
            };
        });
        setNewRoleName("");
    };

    const handleAddPermission = (role: string) => {
        const newPermissionName = newPermissionNames[role] || "";
        if (!newPermissionName.trim()) return;
        setEditedTemplate(prev => {
            if (!prev || !prev.permissions[role]) return null;
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [role]: [...prev.permissions[role], newPermissionName.trim()]
                }
            };
        });
        setNewPermissionNames(prev => ({ ...prev, [role]: '' }));
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

        startProcessingTransition(async () => {
            const toastId = toast.loading("Generating keys and creating company...", { description: `Using customized '${editedTemplate.name}' template.` });
            try {
                const { publicKeyPem, privateKeyPem } = await generateRoomKeyPairPem();
                
                const finalRoles = [...new Set(['founder', 'member', ...editedTemplate.roles])];

                const input: CreateRoomFromTemplateInput = {
                    roomName: roomName.trim(),
                    ownerEmail: ownerOthentDetails.email,
                    templateName: editedTemplate.name, // Pass customized data
                    roles: finalRoles,
                    permissions: editedTemplate.permissions,
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

    const isLoading = isFetchingDetails || isProcessing;

    return (
        <RequireLogin>
            <div className="container mx-auto max-w-6xl py-12 px-4 animate-fade-in">
                <div className="text-center mb-12">
                    <FileText className="mx-auto h-14 w-14 text-muted-foreground/80" strokeWidth={1.5} />
                    <h1 className="text-4xl font-bold tracking-tighter mt-4">Create a Company from a Template</h1>
                    <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Select a template to rapidly set up your company. You can customize roles and permissions before creation.
                    </p>
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
                                    {['founder', 'member', ...editedTemplate.roles.filter(r => r !== 'founder' && r !== 'member')].map(role => (
                                        <div key={role} className="p-4 rounded-lg bg-muted/50 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold capitalize flex items-center text-base"><Users className="w-4 h-4 mr-2 text-primary" />{role}</h4>
                                                    {(role === 'founder' || role === 'member') && (
                                                        <Badge variant="outline" className="flex items-center gap-1 text-xs"><ShieldCheck className="w-3 h-3"/>System Role</Badge>
                                                    )}
                                                </div>
                                                {(role !== 'founder' && role !== 'member') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(role)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {editedTemplate.permissions[role]?.map(doc => (
                                                    <Badge key={doc} variant="secondary" className="flex items-center gap-1">
                                                        {doc}
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
                                            {['founder', 'member', ...editedTemplate.roles.filter(r => r !== 'founder' && r !== 'member')].map(role => (
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
                                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Company"}
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