
import type { Skill } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

function getApiBaseUrl(): string {
  const port = process.env.PORT || '9002';
  if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
    return `http://127.0.0.1:${port}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || `http://127.0.0.1:${port}`;
}

async function getSkills(): Promise<Skill[]> {
  const baseUrl = getApiBaseUrl();
  const apiPath = `${baseUrl}/api/skills`;

  const res = await fetch(apiPath, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch skills from ${apiPath}:`, res.status, errorText);
    throw new Error(`Failed to fetch skills from ${apiPath}. Status: ${res.status}, Response: ${errorText}`);
  }
  try {
    const jsonData = await res.json();
    return jsonData;
  } catch (e: any) {
    console.error(`Failed to parse JSON from ${apiPath}:`, e.message);
    const responseText = await fetch(apiPath, { cache: 'no-store' }).then(r => r.text()).catch(() => "Could not retrieve error body.");
    throw new Error(`Failed to parse JSON from ${apiPath}. Error: ${e.message}. Response body: ${responseText}`);
  }
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
    const apiPathForErrorMessage = `${getApiBaseUrl()}/api/skills`;
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Skills</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiPathForErrorMessage}</code> is running and accessible, and your database is correctly configured and seeded.</p>
      </div>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Skills</h1>
        </div>
        <p className="text-lg text-muted-foreground">No skills found. CRUD operations and the ability to add skills will be implemented soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Skills</h1>
      </div>
      <p className="mb-6 text-muted-foreground">Currently viewing {skills.length} skill(s). Full CRUD functionality will be added soon.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skills.map((skill) => {
          return (
            <Card key={skill.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{skill.name}</CardTitle>
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
