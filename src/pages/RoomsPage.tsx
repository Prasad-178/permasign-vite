import { useState, useEffect } from 'react';
import { useApi, useActiveAddress, useConnection } from '@arweave-wallet-kit/react';
import { usePostHog } from 'posthog-js/react';
import RequireLogin from "../components/RequireLogin";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, ArrowRight, AlertCircle, FolderLock, FilePlus, Users, Star } from "lucide-react";
import { listMyDataRooms } from '../services/roomActionsClient';
import { CustomLoader } from '../components/ui/CustomLoader';
import { type RoomInfo } from '../types/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Badge } from '../components/ui/badge';

export default function RoomsPage() {
  useEffect(() => {
    document.title = "PermaSign | My Companies";
  }, []);

  const api = useApi();
  console.log(api);
  const activeAddress = useActiveAddress();
  const { connected } = useConnection();
  const posthog = usePostHog();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && connected && rooms.length === 0) {
      setIsCreateModalOpen(true);
    }
  }, [isLoading, error, connected, rooms.length]);

  const handleCreateCompanyClick = (from: 'header' | 'empty_state') => {
    posthog?.capture('create_company_clicked', { from_location: from });
    setIsCreateModalOpen(true);
  };

  const handleOpenCompanyClick = (roomId: string, roomName: string) => {
    posthog?.capture('company_opened', { companyId: roomId, companyName: roomName });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsCreateModalOpen(false);
  };

  useEffect(() => {
    const loadUserDataAndRooms = async () => {
      if (activeAddress === undefined) return;
      if (activeAddress === null) {
        setIsLoading(false);
        setRooms([]);
        setError(null);
        return;
      }

      // Check if we have either wauth or othent available
      if (!api || (!api.authData && !api.othent)) return;

      setError(null);
      try {
        let email: string;

        // Check if using wauth authentication
        if (api.id === "wauth-google") {
          if (!api.authData?.email) {
            throw new Error("Could not retrieve your email from wauth. Please ensure your Google account is properly linked.");
          }
          email = api.authData.email;
        } else {
          // Fall back to othent authentication
          if (!api.othent) {
            throw new Error("Authentication method not available. Please ensure your wallet is properly connected.");
          }
          const details = await api.othent.getUserDetails();
          if (!details?.email) {
            throw new Error("Could not retrieve your email. Please ensure your wallet is linked via Othent.");
          }
          email = details.email;
        }

        const result = await listMyDataRooms(email);
        if (result.success && result.data) {
          setRooms(result.data);
        } else {
          throw new Error(result.message + (result.error ? ` Details: ${result.error}` : ''));
        }
      } catch (err: any) {
        console.error("Error during data loading:", err);
        setError(err.message || 'An unknown error occurred.');
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDataAndRooms();
  }, [activeAddress, api]);

  return (
    <RequireLogin>
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">My Companies</h1>
          {!isLoading && !error && rooms.length > 0 && (
            <Button onClick={() => handleCreateCompanyClick('header')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Company
            </Button>
          )}
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create a New Secure Company</DialogTitle>
              <DialogDescription className="text-base">
                Choose a starting point for your new company space. You can use a pre-defined template, generate one with AI, or start from scratch.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="modal-option-card p-6 border rounded-lg relative recommended flex flex-col" onClick={() => handleNavigate('/companies/create/template')}>
                <Badge className="absolute top-4 right-4">Recommended</Badge>
                <div className="flex-grow">
                  <Users className="w-10 h-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">From a Template</h3>
                  <p className="text-muted-foreground text-sm mt-1">Use a pre-defined template with roles and document categories to get started faster.</p>
                </div>
                <Button className="w-full mt-6 premium-shine-button relative overflow-hidden">
                  <Star className="mr-2 h-4 w-4" /> Use a Template
                </Button>
              </div>
              <div className="modal-option-card p-6 border rounded-lg flex flex-col" onClick={() => handleNavigate('/companies/create')}>
                <div className="flex-grow">
                  <FilePlus className="w-10 h-10 text-primary mb-3" />
                  <h3 className="text-lg font-semibold">From Scratch</h3>
                  <p className="text-muted-foreground text-sm mt-1">Start with a blank slate. You'll be the founder and can invite members and define roles as you go.</p>
                </div>
                <Button className="w-full mt-6" variant="secondary">
                  Create Blank Company
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <CustomLoader size={48} text="Loading your companies..." />
          </div>
        )}

        {!isLoading && error && (
          <Card className="bg-destructive/10 border-destructive shadow-md animate-fade-in empty-state-card">
            <CardHeader className="flex flex-row items-center gap-3">
               <AlertCircle className="w-6 h-6 text-destructive" />
               <CardTitle className="text-xl">Error Loading Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">{error}</p>
              {(error?.includes("Othent") || error?.includes("wauth") || error?.includes("email")) && <p className="mt-2 text-sm text-muted-foreground">Please ensure your wallet is correctly linked with an email and try again.</p>}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && rooms.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/60 rounded-xl bg-card empty-state-card">
              <FolderLock className="w-20 h-20 text-muted-foreground/60 mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold tracking-tight">Welcome to PermaSign</h2>
              <p className="mt-3 text-muted-foreground max-w-md text-lg">
                Create your first secure company space to manage high-value agreements on the blockchain.
              </p>
              <Button size="lg" className="mt-8 btn-hover-effect" onClick={() => handleCreateCompanyClick('empty_state')}>
                <PlusCircle className="mr-2 h-5 w-5" /> Get Started Now
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {rooms.map((room: RoomInfo) => (
              <Card key={room.roomId} className="room-card flex flex-col justify-between shadow-sm hover:shadow-lg dark:shadow-primary/10">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold tracking-tight truncate">{room.roomName}</CardTitle>
                  <CardDescription className="pt-1">
                    Your role: <span className="font-medium capitalize text-foreground">{room.role}</span>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="room-card-footer px-6 py-4 border-t">
                  <Link to={`/companies/${room.roomId}`} className="w-full" onClick={() => handleOpenCompanyClick(room.roomId, room.roomName)}>
                    <Button variant="outline" className="w-full justify-between cursor-pointer btn-hover-effect">
                      Open Company
                      <ArrowRight className="h-5 w-5" />
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
