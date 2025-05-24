
import type { JourneyItem } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarDays } from 'lucide-react';
import { languages } from '@/app/i18n/settings';

function getApiBaseUrl(): string {
  // For server-side rendering (which these admin pages are),
  // we should always try to hit the internal address of the Next.js server.
  // The port 9002 is from your package.json dev script.
  // In a real production environment, you might use `process.env.PORT` if it's set by the host.
  const port = process.env.PORT || '9002';
  return `http://127.0.0.1:${port}`;
}

async function getExperience(): Promise<JourneyItem[]> {
  const baseUrl = getApiBaseUrl();
  const apiPath = `${baseUrl}/api/experience`;
  
  const res = await fetch(apiPath, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch experience from ${apiPath}:`, res.status, errorText);
    throw new Error(`Failed to fetch experience from ${apiPath}. Status: ${res.status}, Response: ${errorText}`);
  }
  try {
    const jsonData = await res.json();
    return jsonData;
  } catch (e: any) {
    console.error(`Failed to parse JSON from ${apiPath}:`, e.message);
    // Attempt to get the text response if JSON parsing fails, to help debugging
    const responseText = await fetch(apiPath, { cache: 'no-store' }).then(r => r.text()).catch(() => "Could not retrieve error body.");
    throw new Error(`Failed to parse JSON from ${apiPath}. Error: ${e.message}. Response body: ${responseText}`);
  }
}

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

interface AdminExperiencePageProps {
  params: { lang: string };
}

export default async function AdminExperiencePage({ params: { lang } }: AdminExperiencePageProps) {
  let experiences: JourneyItem[] = [];
  let error: string | null = null;

  try {
    experiences = await getExperience();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    // getApiBaseUrl() is already defined in this file.
    const apiPathForErrorMessage = `${getApiBaseUrl()}/api/experience`;
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Experience Data</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiPathForErrorMessage}</code> is running and accessible, and your database is correctly configured and seeded.</p>
      </div>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Experience</h1>
        </div>
        <p className="text-lg text-muted-foreground">No experience entries found. CRUD operations and the ability to add entries will be implemented soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Experience</h1>
      </div>
      <p className="mb-6 text-muted-foreground">Currently viewing {experiences.length} experience(s). Full CRUD functionality will be added soon.</p>
      <div className="space-y-6">
        {experiences.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              {item.company && (
                <CardDescription className="flex items-center text-base">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />{item.company}
                </CardDescription>
              )}
              <div className="text-sm text-muted-foreground flex items-center pt-1">
                <CalendarDays className="mr-2 h-4 w-4" /> {item.date}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 mb-3">{item.description}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
