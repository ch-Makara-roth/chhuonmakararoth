"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  itemId: string;
  itemName: string; // For display in the dialog, e.g., project title
  deleteAction: (id: string) => Promise<{ success: boolean; message: string }>;
  onDeleteSuccess?: () => void; // Optional callback after successful deletion & toast
  triggerButtonVariant?: ButtonProps["variant"];
  triggerButtonSize?: ButtonProps["size"];
  triggerButtonText?: string;
  showIcon?: boolean;
}

export default function DeleteConfirmationDialog({
  itemId,
  itemName,
  deleteAction,
  onDeleteSuccess,
  triggerButtonVariant = "ghost",
  triggerButtonSize = "icon",
  triggerButtonText = "Delete",
  showIcon = true,
}: DeleteConfirmationDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteAction(itemId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
        setIsOpen(false); // Close dialog on success
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete the item.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={triggerButtonVariant} 
          size={triggerButtonSize} 
          className={triggerButtonVariant === "destructive" || (triggerButtonVariant === "ghost" && triggerButtonSize === "icon") ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
          disabled={isPending}
        >
          {showIcon && <Trash2 className="mr-0 sm:mr-2 h-4 w-4" />}
          {triggerButtonSize !== "icon" && (triggerButtonText || "Delete")}
          {triggerButtonSize === "icon" && <span className="sr-only">{triggerButtonText || "Delete"}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item
            "{itemName}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className={buttonVariants({variant: "destructive"})}
          >
            {isPending ? "Deleting..." : "Yes, delete it"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Helper to import buttonVariants if not already globally available in this component's scope
// This is needed if using buttonVariants inside the component file itself.
import { cva } from "class-variance-authority";
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);