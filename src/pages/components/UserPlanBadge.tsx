import { BadgeInfo } from "lucide-react";

interface UserPlanBadgeProps {
  userPlan: string | null;
  currentUserEmail: string | null;
  currentUserRole?: string | null;
}

export default function UserPlanBadge({ userPlan, currentUserEmail, currentUserRole }: UserPlanBadgeProps) {
  if (userPlan) {}
  return (
    <div className="flex flex-col items-end space-y-1">
      {currentUserEmail && (
        <div className="flex items-center text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full" title="Your role in this room">
          <BadgeInfo className="h-3.5 w-3.5 mr-1.5" />
          Role: <span className="capitalize ml-1">{currentUserRole || 'Unknown'}</span>
        </div>
      )}
    </div>
  );
} 