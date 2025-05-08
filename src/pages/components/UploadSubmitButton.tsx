import { Loader2, UploadCloud } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function UploadSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading... </>
      ) : (
        <> <UploadCloud className="mr-2 h-4 w-4" /> Upload Document </>
      )}
    </Button>
  );
}

export default UploadSubmitButton;
