/* eslint-disable @typescript-eslint/no-unused-vars */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from 'react';

import { Vault, Fingerprint, Users, Lock, History } from "lucide-react";

// Set the worker source for PDF.js

export default function Home() {
    const [isClient, setIsClient] = useState(false);

    // Use useEffect to ensure PDF rendering only happens client-side
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8 pb-16">

            <section className="text-center max-w-4xl w-full mb-12 md:mb-16 flex-col justify-center items-center">
                <div className="flex justify-center mb-3">
                    <img 
                        src="../../public/permaweb-logo.jpg" 
                        alt="PermaSign Logo" 
                        width={100} 
                        height={100} 
                        className="text-primary"
                    />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 leading-tight text-foreground animate-fade-in">
                    PermaSign
                </h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-6 text-muted-foreground animate-fade-in">
                    Cryptographic Verification for Agreements
                </h2>
                <p className="text-base sm:text-lg mb-6 text-muted-foreground max-w-3xl mx-auto animate-fade-in [animation-delay:50ms]">
                    Transform how you sign and verify critical documents. Leverage blockchain technology to create tamper-proof, cryptographically signed records that are permanently preserved and instantly verifiable.
                </p>
                <div className="flex justify-center gap-4 animate-fade-in [animation-delay:100ms]">
                    <Link to="/rooms">
                        <Button size="lg">Create a Company</Button>
                    </Link>
                </div>
            </section>

            <section className="w-full max-w-5xl px-4 mb-12 md:mb-16 animate-fade-in [animation-delay:200ms]">
                <h2 className="text-2xl font-bold text-center mb-8">Why PermaSign?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <Card className="shadow-md hover:shadow-lg dark:shadow-primary/10 transition-shadow duration-300 border border-border/60 animate-fade-in [animation-delay:300ms]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Lock className="h-4 w-4 text-primary" />
                                Secure Vaults
                            </CardTitle>
                            <CardDescription className="text-sm">Create encrypted, access-controlled spaces for your most critical documents on Arweave.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Manage document access with granular, role-based permissions on the permaweb.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg dark:shadow-primary/10 transition-shadow duration-300 border border-border/60 animate-fade-in [animation-delay:400ms]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Fingerprint className="h-4 w-4 text-primary" />
                                Cryptographic Signatures
                            </CardTitle>
                            <CardDescription className="text-sm">Sign documents using your Arweave wallet, creating an immutable, verifiable proof of authenticity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Replace traditional signatures with blockchain-secured, cryptographically linked verification.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg dark:shadow-primary/10 transition-shadow duration-300 border border-border/60 animate-fade-in [animation-delay:500ms]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="h-4 w-4 text-primary" />
                                Permanent Record
                            </CardTitle>
                            <CardDescription className="text-sm">Maintain an unalterable, chronological record of document signatures and versions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Create an immutable audit trail that provides complete transparency and trust.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <footer className="w-full max-w-5xl mt-12 pt-8 border-t border-border/40 text-center">
                <p className="text-sm text-muted-foreground">
                    PermaSign: Securing Trust Through Blockchain Verification
                </p>
                <p className="text-xs text-muted-foreground/80 mt-2">
                    © {new Date().getFullYear()} PermaSign.
                </p>
            </footer>
        </div>
    );
}
