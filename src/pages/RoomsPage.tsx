/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useApi, useActiveAddress } from '@arweave-wallet-kit/react'; // Import AWK hooks
import { usePostHog } from 'posthog-js/react';
import RequireLogin from "../components/RequireLogin"; // Adjusted path if necessary
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Link } from "react-router-dom"; // Changed from next/link
import { PlusCircle, ArrowRight, AlertCircle, FolderLock } from "lucide-react";
import { listMyDataRooms } from '../services/roomActionsClient'; // Adjusted path if necessary
import { CustomLoader } from '../components/ui/CustomLoader';
import { type RoomInfo } from '../types/types'; // Adjusted path if necessary

export default function RoomsPage() {
  const api = useApi();
  const activeAddress = useActiveAddress();
  const posthog = usePostHog();

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // const getInitials = (name: string) => {
  //   if (!name) return '??';
  //   const words = name.replace(/[^a-zA-Z0-9 ]/g, "").split(' ').filter(Boolean);
  //   if (words.length > 1) {
  //     return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  //   }
  //   return name.substring(0, 2).toUpperCase();
  // };

  const handleCreateCompanyClick = (from: 'header' | 'empty_state') => {
    posthog?.capture('create_company_clicked', { from_location: from });
  };

  const handleOpenCompanyClick = (roomId: string, roomName: string) => {
    posthog?.capture('company_opened', { companyId: roomId, companyName: roomName });
  };

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (activeAddress && api?.othent) {
        try {
          console.log("Attempting to fetch Othent user details...");
          const details = await api.othent.getUserDetails();
          console.log("Othent details received:", details);
          if (details && details.email) {
            setUserEmail(details.email);
          } else {
            setError("Could not retrieve email using Othent. Please ensure your wallet is linked.");
            setUserEmail(null);
          }
        } catch (err: any) {
          console.error("Error fetching Othent details:", err);
          setError(`Failed to get user details: ${err.message || 'Unknown error'}`);
          setUserEmail(null);
        }
      } else {
        setUserEmail(null);
      }
    };

    fetchUserEmail();
  }, [activeAddress, api]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (userEmail) {
        setIsLoading(true);
        setError(null);
        console.log("Fetching rooms for email:", userEmail);
        const result = await listMyDataRooms(userEmail);
        console.log("Rooms fetched:", result);

        if (result.success && result.data) {
          setRooms(result.data);
        } else {
          setError(result.error + (result.error ? ` (${result.error})` : ''));
          setRooms([]);
        }
        setIsLoading(false);
      } else if (activeAddress) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [userEmail, activeAddress]);

  return (
    <RequireLogin>
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold">My Companies</h1>
          {!isLoading && !error && rooms.length > 0 && (
            <Link to="/companies/create" onClick={() => handleCreateCompanyClick('header')}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Company
              </Button>
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <CustomLoader size={48} text="Loading..." />
          </div>
        )}

        {!isLoading && error && (
          <Card className="bg-destructive/10 border-destructive shadow-md animate-fade-in">
            <CardHeader className="flex flex-row items-center gap-2">
               <AlertCircle className="w-5 h-5 text-destructive" />
               <CardTitle>Error Loading Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              {!userEmail && activeAddress && <p className="mt-2 text-sm text-muted-foreground">Ensure you have linked an email via Othent.</p>}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && rooms.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/60 rounded-xl bg-card">
              <FolderLock className="w-16 h-16 text-muted-foreground/70 mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold tracking-tight">Manage Your High-Value Agreements Securely</h2>
              <p className="mt-3 text-muted-foreground max-w-md">
                Invite members, manage agreements, and sign contracts on PermaSign.
              </p>
              <Link to="/companies/create" className="mt-8" onClick={() => handleCreateCompanyClick('empty_state')}>
                <Button size="lg">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {rooms.map((room: RoomInfo) => (
              <Card key={room.roomId} className="flex flex-col justify-between shadow-sm hover:shadow-lg dark:shadow-primary/10 transition-shadow duration-300 border border-border/60">
                <CardHeader className="flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate font-semibold tracking-tight">{room.roomName}</CardTitle>
                      <CardDescription className="mt-1">
                        Your role: <span className="font-medium capitalize text-foreground">{room.role}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="bg-muted/30 dark:bg-muted/20 px-4 py-3 border-t">
                  <Link to={`/companies/${room.roomId}`} className="w-full" onClick={() => handleOpenCompanyClick(room.roomId, room.roomName)}>
                    <Button variant="ghost" className="w-full justify-between cursor-pointer">
                      Open Company
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireLogin>
  );
} 