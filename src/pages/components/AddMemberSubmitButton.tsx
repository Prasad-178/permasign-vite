import { Button } from "../../components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useFormStatus } from "react-dom";

function AddMemberSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding... </>
      ) : (
        <> <UserPlus className="mr-2 h-4 w-4" /> Add Member </>
      )}
    </Button>
  );
}

export default AddMemberSubmitButton;
