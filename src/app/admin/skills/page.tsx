
import type { Skill } from '@prisma/client'; // Assuming Skill model from Prisma
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
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Trash2, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

async function getSkillsDirectly(): Promise<Skill[]> {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: {
        proficiency: 'desc',
      },
    });
    return skills;
  } catch (e: any) {
    console.error(`Failed to fetch skills directly from DB:`, e.message);
    throw new Error(`Failed to fetch skills. Error: ${e.message}`);
  }
}

export default async function AdminSkillsPage() {
  let skills: Skill[] = [];
  let error: string | null = null;

  try {
    skills = await getSkillsDirectly();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Skills</h2>
        <p>{error}</p>
        <p>Please ensure your database is correctly configured and accessible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Manage Skills</h1>
         {/* <Button asChild disabled> // Enable when 'new skill' page is ready
          <Link href="/admin/skills/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Skill
          </Link>
        </Button> */}
      </div>

      {skills.length === 0 && !error && (
         <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground">No skills found. CRUD operations will be implemented soon.</p>
          </CardContent>
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[150px]">Proficiency</TableHead>
                    <TableHead>Related Tech</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {skills.map((skill) => (
                    <TableRow key={skill.id}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell>{skill.category}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Progress value={skill.proficiency} className="h-2 w-full" />
                                <span className="text-xs text-muted-foreground">{skill.proficiency}%</span>
                            </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {skill.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                            ))}
                        </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            {skills.length > 0 && (
            <CardFooter className="justify-between items-center py-4 px-6 border-t">
                <p className="text-sm text-muted-foreground">
                    Total {skills.length} skill(s).
                </p>
                {/* Placeholder for pagination */}
            </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
