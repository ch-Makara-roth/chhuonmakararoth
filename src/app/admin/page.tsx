
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GanttChartSquare, Briefcase, Lightbulb } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Welcome to the Admin Dashboard</h1>
      <p className="mb-8 text-lg text-foreground/80">
        This is where you can manage the content for your portfolio website.
        Currently, you can view existing items. CRUD operations and database integration will be added soon.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GanttChartSquare className="mr-2 h-6 w-6 text-accent" />
              Projects
            </CardTitle>
            <CardDescription>View and manage your project entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-6 w-6 text-accent" />
              Experience
            </CardTitle>
            <CardDescription>View and manage your career journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/experience">Go to Experience</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-6 w-6 text-accent" />
              Skills
            </CardTitle>
            <CardDescription>View and manage your skills list.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/skills">Go to Skills</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
