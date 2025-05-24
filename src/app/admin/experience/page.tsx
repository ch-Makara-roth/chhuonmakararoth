
import type { Experience } from '@prisma/client'; 
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { deleteExperience } from './actions';
import { revalidatePath } from 'next/cache';
import ActionsDropdownMenu from '@/components/admin/ActionsDropdownMenu';

async function getExperienceDirectly(): Promise<Experience[]> {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: {
        // Consider sorting by date if it's a comparable field, or by createdAt
        date: 'desc', // Assuming date field can be sorted this way; adjust if needed
        createdAt: 'desc', 
      },
    });
    return experiences;
  } catch (e: any) {
    console.error(`Failed to fetch experience data directly from DB:`, e.message, e.stack);
    throw new Error(`Failed to fetch experience data. Error: ${e.message}`);
  }
}

export default async function AdminExperiencePage() {
  let experiences: Experience[] = [];
  let error: string | null = null;

  try {
    experiences = await getExperienceDirectly();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  const handlePostDelete = () => {
    revalidatePath('/admin/experience');
  };

  if (error) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Experience Data</h2>
        <p>{error}</p>
        <p>Please ensure your database is correctly configured and accessible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Manage Experience</h1>
        <Button asChild>
          <Link href="/admin/experience/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Experience
          </Link>
        </Button>
      </div>

      {experiences.length === 0 && !error && (
         <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground">No experience entries found. Click "Add New Experience" to get started.</p>
          </CardContent>
        </Card>
      )}

      {experiences.length > 0 && (
        <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px]">Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {experiences.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.company || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{item.date}</TableCell>
                        <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                        </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionsDropdownMenu
                            itemId={item.id}
                            itemName={item.title}
                            editPath={`/admin/experience/edit/${item.id}`}
                            deleteAction={deleteExperience}
                            onDeleteSuccess={handlePostDelete}
                          />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            {experiences.length > 0 && (
            <CardFooter className="justify-between items-center py-4 px-6 border-t">
                <p className="text-sm text-muted-foreground">
                    Total {experiences.length} experience(s).
                </p>
            </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
