
"use client";

import { useState, useTransition, type ComponentProps } from "react";
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ActionsDropdownMenuProps {
  itemId: string;
  itemName: string;
  editPath: string;
  deleteAction: (id: string) => Promise<{ success: boolean; message: string }>;
  onDeleteSuccess?: () => void;
}

export default function ActionsDropdownMenu({
  itemId,
  itemName,
  editPath,
  deleteAction,
  onDeleteSuccess,
}: ActionsDropdownMenuProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

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
        setIsAlertOpen(false); 
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editPath} className="flex items-center cursor-pointer w-full">
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer w-full"
            onSelect={(e) => {
              e.preventDefault();
              setIsAlertOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{itemName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)} disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isPending ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
