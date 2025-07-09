"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { type Contribution } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Info, Github } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeEditor from './codeEditor';

interface ContributionHotspotDisplayProps {
  contribution: Contribution;
}

export default function ContributionHotspotDisplay({ contribution }: ContributionHotspotDisplayProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Determine which language to use based on code snippet
  const detectLanguage = (codeSnippet?: string) => {
    if (!codeSnippet) return 'javascript';
    
    if (codeSnippet.includes('import React') || codeSnippet.includes('function') || codeSnippet.includes('const')) {
      return 'javascript';
    } else if (codeSnippet.includes('System.out.println')) {
      return 'java';
    } else if (codeSnippet.includes('print(') || codeSnippet.includes('def ')) {
      return 'python';
    } else if (codeSnippet.includes('std::cout')) {
      return 'cpp';
    } else if (codeSnippet.includes('fmt.Println')) {
      return 'go';
    } else if (codeSnippet.includes('println!')) {
      return 'rust';
    }
    
    return 'javascript';
  };

  // Handle hotspot click
  const handleHotspotClick = (hotspotId: string) => {
    setActiveHotspot(hotspotId === activeHotspot ? null : hotspotId);
  };

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 w-full">
      <CardHeader>
        <CardTitle className="text-xl">{contribution.title}</CardTitle>
        <CardDescription>Let's Learn</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80 mb-4">{contribution.description}</p>
        
        <Tabs defaultValue="code" className="mb-6">
          <TabsList className="mb-2">
            <TabsTrigger value="code">Interactive Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="mt-0">
            <CodeEditor 
              initialLanguage={detectLanguage(contribution.codeSnippet) as any}
              initialCode={contribution.codeSnippet || undefined}
              height="400px"
              hotspots={contribution.hotspots}
              onHotspotClick={handleHotspotClick}
            />
            {activeHotspot && contribution.hotspots && (
              <div className="mt-2 p-2 bg-accent/10 border-l-4 border-accent text-accent-foreground rounded-r-md text-sm">
                {contribution.hotspots.map(hotspot => (
                  activeHotspot === hotspot.id && (
                    <div key={hotspot.id}>
                      <strong>{hotspot.area}:</strong> {hotspot.details}
                    </div>
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {contribution.repoLink && (
          <Button asChild variant="outline" size="sm">
            <a href={contribution.repoLink} target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" /> View on GitHub
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
