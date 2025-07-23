import { MessageSquare, Terminal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "../../components/ui/sheet";

interface ChatSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatSidebar({ isOpen, onOpenChange }: ChatSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
        <div className="border-b p-4 flex items-center">
          <SheetTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Chat with Documents
          </SheetTitle>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          <Terminal className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Feature Coming Soon!</h3>
          <p className="text-sm text-muted-foreground/80 text-center mt-2">
            AI-powered chat with your room's documents is under development.
          </p>
          <p className="text-sm text-muted-foreground/80 text-center">
            Stay tuned for updates!
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
} 