
import type { Skill } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Pencil, Trash2, PlusCircle, Target, Database, Server, Smartphone, Wrench, Palette } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

// Temporary icon mapping, ideally Skill type would include icon name string
// const categoryIcons: Record<Skill['category'], React.ElementType> = {
//   Frontend: Palette,
//   Backend: Database,
//   DevOps: Server,
//   Mobile: Smartphone,
//   Tools: Wrench,
//   Other: Target,
// };

function getApiUrl(path: string): string {
  let baseUrl = APP_URL;
  // Replace localhost with 127.0.0.1 to avoid potential IPv6/SSL issues in local dev
  if (baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('localhost', '127.0.0.1');
  }
  return `${baseUrl}${path}`;
}

async function getSkills(): Promise<Skill[]> {
  const apiUrl = getApiUrl('/api/skills');
  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch skills:', res.status, errorText);
    throw new Error(`Failed to fetch skills. Status: ${res.status}`);
  }
  return res.json();
}

export default async function AdminSkillsPage() {
  let skills: Skill[] = [];
  let error: string | null = null;

  try {
    skills = await getSkills();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    const apiUrlForErrorMessage = getApiUrl('/api/skills');
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Skills</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiUrlForErrorMessage}</code> is running and accessible.</p>
      </div>
    );
  }
  
  if (!skills || skills.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Skills</h1>
          {/* <Button asChild variant="default">
            <Link href="/admin/skills/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Skill</Link>
          </Button> */}
        </div>
        <p className="text-lg text-muted-foreground">No skills found. CRUD operations coming soon!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Skills</h1>
        {/* <Button asChild variant="default">
          <Link href="/admin/skills/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Skill</Link>
        </Button> */}
      </div>
      <p className="mb-6 text-muted-foreground">Currently viewing {skills.length} skill(s). Full CRUD functionality will be added soon.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skills.map((skill) => {
          // const Icon = categoryIcons[skill.category] || Target;
          return (
            <Card key={skill.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{skill.name}</CardTitle>
                  {/* <Icon className="h-5 w-5 text-muted-foreground" /> */}
                </div>
                <CardDescription>{skill.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Progress value={skill.proficiency} className="w-full h-2 mb-3" aria-label={`${skill.name} proficiency ${skill.proficiency}%`} />
                <p className="text-xs text-muted-foreground mb-2">{skill.proficiency}% Proficiency</p>
                {skill.technologies && skill.technologies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Related:</h4>
                    <div className="flex flex-wrap gap-1">
                      {skill.technologies.map(tech => (
                        <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              {/* <CardFooter className="mt-auto pt-4 border-t">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/admin/skills/edit/${skill.id}`}><Pencil className="mr-1 h-4 w-4" />Edit</Link>
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" disabled>
                    <Trash2 className="mr-1 h-4 w-4" />Delete
                  </Button>
                </div>
              </CardFooter> */}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
