import { Loader2, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";

interface RemoveMemberSubmitButtonProps {
  email: string;
  isPending: boolean;
  onClick: () => void;
}

function RemoveMemberSubmitButton({ isPending, onClick }: RemoveMemberSubmitButtonProps) {
  return (
    <Button 
      type="button" // Changed from submit to button
      variant="ghost" 
      size="sm" 
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={isPending}
      onClick={onClick} // Use the passed onClick handler
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

export default RemoveMemberSubmitButton;
