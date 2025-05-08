/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useApi, useActiveAddress } from '@arweave-wallet-kit/react'; // Import AWK hooks
import RequireLogin from "../components/RequireLogin"; // Adjusted path if necessary
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Link } from "react-router-dom"; // Changed from next/link
import { PlusCircle, ArrowRight, AlertCircle } from "lucide-react";
import { listMyDataRooms } from '../services/roomActionsClient'; // Adjusted path if necessary
import { CustomLoader } from '../components/ui/CustomLoader';
import { type RoomInfo } from '../types/types'; // Adjusted path if necessary

export default function RoomsPage() {
  const api = useApi();
  const activeAddress = useActiveAddress();

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
          <Link to="/rooms/create"> {/* Changed from next/link, removed passHref */}
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Company
            </Button>
          </Link>
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
          <Card className="shadow-md hover:shadow-lg dark:shadow-primary/10 transition-shadow duration-300 border border-border/60 animate-fade-in">
            <CardHeader>
              <CardTitle>No Companies Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You haven&apos;t created or joined any companies.</p>
            </CardContent>
            <CardFooter>
               <Link to="/rooms/create"> {/* Changed from next/link, removed passHref */}
                 <Button variant="secondary">Create your first company</Button>
               </Link>
            </CardFooter>
          </Card>
        )}

        {!isLoading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room: RoomInfo) => (
              <Card key={room.roomId} className="flex flex-col justify-between shadow-sm hover:shadow-md dark:shadow-primary/5 transition-shadow duration-300 border border-border/40 animate-fade-in">
                <CardHeader>
                  <CardTitle>{room.roomName}</CardTitle>
                  <CardDescription>Role: <span className="capitalize font-medium">{room.role}</span></CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground break-words">ID: {room.roomId}</p>
                </CardContent>
                <CardFooter>
                  <Link to={`/rooms/${room.roomId}`} className="ml-auto"> {/* Changed from next/link, removed passHref */}
                    <Button variant="outline" size="sm">
                      Open Company <ArrowRight className="ml-2 h-4 w-4" />
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