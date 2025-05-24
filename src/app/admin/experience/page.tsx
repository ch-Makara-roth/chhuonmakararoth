
import type { JourneyItem } from '@/lib/data'; // Using JourneyItem for experience
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { Briefcase, CalendarDays } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

function getApiUrl(path: string): string {
  let baseUrl = APP_URL;
  // Replace localhost with 127.0.0.1 to avoid potential IPv6/SSL issues in local dev
  if (baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('localhost', '127.0.0.1');
  }
  return `${baseUrl}${path}`;
}

async function getExperience(): Promise<JourneyItem[]> {
  const apiUrl = getApiUrl('/api/experience');
  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch experience:', res.status, errorText);
    throw new Error(`Failed to fetch experience. Status: ${res.status}`);
  }
  return res.json();
}

export default async function AdminExperiencePage() {
  let experiences: JourneyItem[] = [];
  let error: string | null = null;

  try {
    experiences = await getExperience();
  } catch (e: any)
 {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    const apiUrlForErrorMessage = getApiUrl('/api/experience');
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Experience Data</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiUrlForErrorMessage}</code> is running and accessible.</p>
      </div>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Experience</h1>
          {/* <Button asChild variant="default">
            <Link href="/admin/experience/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Experience</Link>
          </Button> */}
        </div>
        <p className="text-lg text-muted-foreground">No experience entries found. CRUD operations coming soon!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Experience</h1>
        {/* <Button asChild variant="default">
          <Link href="/admin/experience/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Experience</Link>
        </Button> */}
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
            {/* <CardFooter className="border-t pt-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/experience/edit/${item.id}`}><Pencil className="mr-1 h-4 w-4" />Edit</Link>
                </Button>
                <Button variant="destructive" size="sm" disabled>
                  <Trash2 className="mr-1 h-4 w-4" />Delete
                </Button>
              </div>
            </CardFooter> */}
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
