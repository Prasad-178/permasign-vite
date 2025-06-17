"use client";
import { Button } from "../../components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteRoleSubmitButtonProps {
    roleName: string;
    onClick: () => void;
}

export default function DeleteRoleSubmitButton({ roleName, onClick }: DeleteRoleSubmitButtonProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={onClick}
            title={`Delete role ${roleName}`}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
