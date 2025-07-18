"use client";

import { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useActiveAddress, useConnection } from '@arweave-wallet-kit/react';
import { usePostHog } from 'posthog-js/react';

import { listTemplatesAction, createRoomFromTemplateAction } from '../services/roomActionsClient';
import { generateRoomKeyPairPem } from "../actions/cryptoClient";
import { type Template, type CreateRoomFromTemplateInput, type CreateRoomResult } from '../types/types';

import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Loader2, AlertCircle, FileText, CheckCircle, Info, Users, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { CustomLoader } from "../components/ui/CustomLoader";

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
    const [templatesError, setTemplatesError] = useState<string | null>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [roomName, setRoomName] = useState("");
    const [isRoomNameTouched, setIsRoomNameTouched] = useState(false);

    const [ownerOthentDetails, setOwnerOthentDetails] = useState<OwnerOthentDetails | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isProcessing, startProcessingTransition] = useTransition();

    const [viewedTemplate, setViewedTemplate] = useState<Template | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingTemplates(true);
            setTemplatesError(null);
            try {
                const result = await listTemplatesAction();
                if (result.success && result.data) {
                    setTemplates(result.data);
                } else {
                    throw new Error(result.message || "Failed to load templates.");
                }
            } catch (error: any) {
                setTemplatesError(error.message);
                toast.error("Failed to load templates", { description: error.message });
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        fetchTemplates();
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
        setRoomName("");
        setIsRoomNameTouched(false);
        setIsCreateModalOpen(true);
    };

    const handleViewDetails = (template: Template) => {
        setViewedTemplate(template);
        setIsViewModalOpen(true);
    };
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsRoomNameTouched(true);

        if (!connected || !activeAddress || !ownerOthentDetails?.email) {
            toast.error("Not Ready", { description: "Please connect your wallet and wait for email to load." });
            return;
        }
        if (!roomName.trim() || !selectedTemplate) {
            toast.error("Input Required", { description: "Company name and a template are required." });
            return;
        }

        startProcessingTransition(async () => {
            const toastId = toast.loading("Generating keys and creating company...", { description: `Using '${selectedTemplate.name}' template.` });
            try {
                const { publicKeyPem, privateKeyPem } = await generateRoomKeyPairPem();
                
                const input: CreateRoomFromTemplateInput = {
                    roomName: roomName.trim(),
                    ownerEmail: ownerOthentDetails.email,
                    templateName: selectedTemplate.name,
                    roomPublicKeyPem: publicKeyPem,
                    roomPrivateKeyPem: privateKeyPem,
                };

                const result: CreateRoomResult = await createRoomFromTemplateAction(input);

                if (result.success && result.roomId) {
                    posthog?.capture('company_created_from_template', {
                        companyId: result.roomId,
                        companyName: roomName.trim(),
                        templateName: selectedTemplate.name,
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

    if (templatesError) {
        return (
            <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
                <Card className="border-destructive bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center justify-center gap-2">
                            <AlertCircle /> Error Loading Templates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{templatesError}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isLoading = isFetchingDetails || isProcessing;
    const isFormDisabled = isLoading || !connected || !ownerOthentDetails?.email;
    const showRoomNameError = isRoomNameTouched && !roomName.trim();

    return (
        <RequireLogin>
            <div className="container mx-auto max-w-6xl py-12 px-4 animate-fade-in">
                <div className="text-center mb-12">
                    <FileText className="mx-auto h-14 w-14 text-muted-foreground/80" strokeWidth={1.5} />
                    <h1 className="text-4xl font-bold tracking-tighter mt-4">Create a Company from a Template</h1>
                    <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Select a template to rapidly set up your company with predefined roles and document categories, ensuring best practices from the start.
                    </p>
                </div>

                <div className="template-card-grid mb-12">
                    {templates.map(template => {
                        const uniqueDocTypesCount = new Set(Object.values(template.permissions).flat()).size;
                        
                        return (
                            <Card 
                                key={template.name} 
                                className="template-card flex flex-col h-full">
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
                                            <span className="font-medium">
                                                {template.roles.length > 0
                                                    ? `${template.roles.length} Custom Role${template.roles.length > 1 ? 's' : ''}`
                                                    : 'Standard Founder Role'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <ScrollText className="h-4 w-4 mr-3 flex-shrink-0" />
                                            <span className="font-medium">
                                                {uniqueDocTypesCount} Pre-defined Document Types
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-3 mt-auto pt-5">
                                    <Button variant="outline" className="w-full btn-hover-effect" onClick={() => handleViewDetails(template)}>
                                        <Info className="w-4 h-4 mr-2"/> View Details
                                    </Button>
                                    <Button className="w-full btn-hover-effect" onClick={() => handleUseTemplateClick(template)}>
                                        <CheckCircle className="w-4 h-4 mr-2"/> Use Template
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {selectedTemplate && (
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Create Company from '{selectedTemplate.name}'</DialogTitle>
                                <DialogDescription>
                                    You have selected the <span className="font-semibold text-primary">{selectedTemplate.name}</span> template. Please provide a name for your new company.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid gap-6 pt-4">
                                <div>
                                    <Label htmlFor="roomName" className="font-semibold">Company Name</Label>
                                    <Input
                                        id="roomName"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        onBlur={() => setIsRoomNameTouched(true)}
                                        placeholder="e.g., QuantumLeap AI, Inc."
                                        required
                                        disabled={isFormDisabled}
                                        className="mt-2"
                                    />
                                    {showRoomNameError && <p className="text-sm text-destructive pt-2">Company name is required.</p>}
                                </div>
                                
                                {!isFetchingDetails && connected && !ownerOthentDetails?.email && (
                                    <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-md border border-destructive/20">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                                        <span>Could not load your email. Please try reconnecting your wallet.</span>
                                    </div>
                                )}

                                <Button type="submit" disabled={isFormDisabled || !roomName.trim()} className="w-full" size="lg">
                                    {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Company...</>)
                                    : isFetchingDetails ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Account...</>)
                                    : ("Create & Launch Company")
                                    }
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {viewedTemplate && (
                    <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                        <DialogContent className="sm:max-w-[625px] template-card-details-modal">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-2xl"><FileText /> {viewedTemplate.name}</DialogTitle>
                                <DialogDescription className="text-base">{viewedTemplate.description}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
                                <h3 className="font-semibold mb-4 text-lg">Roles & Document Permissions</h3>
                                <div className="space-y-4">
                                    {Object.entries(viewedTemplate.permissions).map(([role, docs]) => (
                                        <div key={role} className="p-4 rounded-lg bg-muted/50 role-permission-item">
                                            <h4 className="font-semibold capitalize flex items-center mb-2 text-base"><Users className="w-4 h-4 mr-2 text-primary" />{role}</h4>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pl-2">
                                                {docs.map(doc => (
                                                    <li key={doc} className="text-sm flex items-start">
                                                        <ScrollText className="w-3.5 h-3.5 mr-2 mt-0.5 text-primary/80 flex-shrink-0" />
                                                        {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </RequireLogin>
    );
}
