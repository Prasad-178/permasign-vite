"use client";

import { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom"; // Changed from next/navigation
import { useApi, useActiveAddress, useConnection } from '@arweave-wallet-kit/react';
import { generateRoomKeyPairPem } from "../actions/cryptoClient"; // Adjusted path
import { createRoomWithKmsAction } from '../services/roomActionsClient'; // Adjusted path
import { CreateRoomInput, CreateRoomResult } from '../types/types'; // Adjusted path

import RequireLogin from "@/components/RequireLogin"; // Adjusted path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Define interface for Othent details if not already global
interface OwnerOthentDetails {
    email: string;
    name?: string;
}

export default function CreateRoomPage() {
  const navigate = useNavigate(); // Changed from useRouter
  const api = useApi();
  const activeAddress = useActiveAddress();
  const { connected } = useConnection();

  const [roomName, setRoomName] = useState("");
  const [ownerOthentDetails, setOwnerOthentDetails] = useState<OwnerOthentDetails | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getOthentEmail = async () => {
      if (connected && api?.othent && activeAddress && !ownerOthentDetails && !isFetchingDetails) {
        setIsFetchingDetails(true);
        console.log("Fetching Othent email...");
        try {
          const othentData: any = await api.othent.getUserDetails();
          if (othentData?.email) {
            console.log("Othent details fetched:", othentData);
            setOwnerOthentDetails({ email: othentData.email, name: othentData.name });
          } else {
            console.warn("Othent email not found in fetched data.");
            toast.error("Email Not Found", { description: "Could not retrieve your email from Othent. Ensure you are logged in." });
            setOwnerOthentDetails(null);
          }
        } catch (err: any) {
          console.error("Error Fetching Othent User Details:", err);
          toast.error("Othent Error", { description: `Could not retrieve your details: ${err.message}. Please try reconnecting wallet.` });
          setOwnerOthentDetails(null);
        } finally {
          setIsFetchingDetails(false);
        }
      } else if (!connected || !activeAddress) {
        if (ownerOthentDetails) setOwnerOthentDetails(null);
        if (isFetchingDetails) setIsFetchingDetails(false);
      }
    };
    getOthentEmail();
  }, [api, activeAddress, connected, ownerOthentDetails, isFetchingDetails]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!connected || !activeAddress || !ownerOthentDetails?.email) {
          setError("Please connect your wallet and ensure email is loaded.");
          toast.error("Not Ready", { description: "Connect wallet and wait for email to load."});
          return;
      }
      if (!roomName.trim()) {
          setError("Please enter a company name.");
          toast.error("Input Required", { description: "Company name cannot be empty."});
          return;
      }

      startProcessingTransition(async () => {
        console.log("Starting room creation process...");
        const toastId = toast.loading("Generating keys and creating room...", { description: "Please wait..." });

        try {
          console.log("Generating RSA key pair for the room...");
          const { publicKeyPem: roomPublicKey, privateKeyPem: roomPrivateKey } = await generateRoomKeyPairPem();
          console.log("Room keys generated successfully client-side.");

          console.log("Calling createRoomWithKmsAction client service (which calls external API)...");
          const actionInput: CreateRoomInput = {
              roomName: roomName.trim(),
              ownerEmail: ownerOthentDetails.email,
              roomPublicKeyPem: roomPublicKey,
              roomPrivateKeyPem: roomPrivateKey,
          };
          const result: CreateRoomResult = await createRoomWithKmsAction(actionInput);

          console.log("Client service action result received:", result);

          if (result.success && result.roomId) {
              toast.success("Success!", {
                  id: toastId,
                  description: `Company '${roomName.trim()}' created! Redirecting...`,
                  duration: 3000,
              });
              // Perform navigation after toast has had a chance to be seen or onAutoClose
              // For simplicity, navigating after a short delay or directly
              console.log(`Redirecting to /rooms/${result.roomId}`);
              setRoomName(""); // Reset form on success
              navigate(`/rooms/${result.roomId}`); // Changed from router.push
          } else {
              const errorDesc = result.message + (result.error ? ` Details: ${result.error}` : '');
              toast.error("Room Creation Failed", { id: toastId, description: errorDesc, duration: 7000 });
              setError(result.message || "Failed during room creation.");
          }
        } catch (err: any) {
            console.error("Error during client-side room creation process:", err);
            setError(`Client-side error: ${err.message}`);
            toast.error("Client Error", { id: toastId, description: `Failed during key generation or action call: ${err.message}` });
        }
      });
  };

  const isLoading = isFetchingDetails || isProcessing;

  return (
    <RequireLogin>
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create a New Company</CardTitle>
            <CardDescription>
              Enter a name. Your email ({isFetchingDetails ? 'loading...' : ownerOthentDetails?.email || 'not available - connect wallet'}) will be linked as the owner.
              {ownerOthentDetails?.name && ` Welcome, ${ownerOthentDetails.name}!`}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isFetchingDetails && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin"/> <span>Loading email...</span>
                </div>
              )}
              {!isFetchingDetails && connected && !ownerOthentDetails?.email && (
                 <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4"/> <span>Could not load email. Check Othent connection or try reconnecting.</span>
                 </div>
               )}
              {error && (
                 <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4"/> <span>Error: {error}</span>
                 </div>
              )}

              <div>
                <Label htmlFor="roomName">Company Name</Label>
                <Input
                  id="roomName"
                  name="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Project Phoenix Q3 Data"
                  required
                  disabled={isLoading || !connected || !ownerOthentDetails?.email}
                  aria-describedby="roomNameError"
                />
                 {!roomName.trim() && <p id="roomNameError" className="text-xs text-destructive pt-1">Company name is required.</p>}
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !roomName.trim() || !connected || !ownerOthentDetails?.email} className="w-full">
                {isProcessing ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating... </>)
                 : isFetchingDetails ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Details... </>)
                 : ("Create Company")
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </RequireLogin>
  );
} 