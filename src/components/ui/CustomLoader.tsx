import { Vault } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomLoaderProps {
  className?: string;
  size?: number; // Size in pixels
  text?: string;
}

export function CustomLoader({ className, size = 32, text }: CustomLoaderProps) {
  const iconSize = Math.max(20, size * 0.75); // Ensure icon isn't too small

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className="relative flex items-center justify-center animate-subtle-pulse"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Optional: Add a background glow or shape if desired */}
        {/* <div className="absolute inset-0 rounded-full bg-primary/10 blur-md"></div> */}
        <Vault
          className="text-primary animate-vault-glow" // Apply glow animation
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
          strokeWidth={1.5} // Thinner stroke for aesthetics
        />
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
} 
