import { CalendarDays, UserCircle } from "lucide-react";
import { format } from 'date-fns';
import { type RoomDetails } from "../../types/types";
import DocumentTemplatesSidebar from "./DocumentTemplatesSidebar";
import UserPlanBadge from "./UserPlanBadge";

interface RoomHeaderProps {
  roomDetails: RoomDetails;
  currentUserEmail: string | null;
  currentUserRole?: string | null;
  isTemplatesSidebarOpen: boolean;
  onTemplatesSidebarChange: (open: boolean) => void;
}

export default function RoomHeader({ 
  roomDetails, 
  currentUserEmail, 
  currentUserRole,
  isTemplatesSidebarOpen,
  onTemplatesSidebarChange
}: RoomHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{roomDetails.roomName}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center" title={`Created on ${format(new Date(roomDetails.createdAt), 'PPP')}`}>
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
              {format(new Date(roomDetails.createdAt), 'PP')}
            </span>
            <span className="flex items-center" title={`Owner: ${roomDetails.ownerEmail}`}>
              <UserCircle className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
              {roomDetails.ownerEmail}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserPlanBadge 
            userPlan="Pro"
            currentUserEmail={currentUserEmail}
            currentUserRole={currentUserRole}
          />
          <DocumentTemplatesSidebar 
            isOpen={isTemplatesSidebarOpen}
            onOpenChange={onTemplatesSidebarChange}
          />
        </div>
      </div>
    </div>
  );
} 