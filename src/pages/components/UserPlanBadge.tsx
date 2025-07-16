import { BadgeInfo, BadgeDollarSign } from "lucide-react";

interface UserPlanBadgeProps {
  userPlan: string | null;
  currentUserEmail: string | null;
  currentUserRole?: string | null;
}

export default function UserPlanBadge({ userPlan, currentUserEmail, currentUserRole }: UserPlanBadgeProps) {
  return (
    <div className="flex flex-col items-end space-y-1">
      {userPlan && (
        <div className="flex items-center text-xs font-medium bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-full" title="Your current subscription plan">
          <BadgeDollarSign className="h-3.5 w-3.5 mr-1.5" />
          Plan - <span className="font-bold ml-1">{userPlan}</span>
        </div>
      )}
      {currentUserEmail && (
        <div className="flex items-center text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full" title="Your role in this room">
          <BadgeInfo className="h-3.5 w-3.5 mr-1.5" />
          Role: <span className="capitalize ml-1">{currentUserRole || 'Unknown'}</span>
        </div>
      )}
    </div>
  );
} 