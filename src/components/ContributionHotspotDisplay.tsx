"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { type Contribution } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Info, Github } from 'lucide-react';

interface ContributionHotspotDisplayProps {
  contribution: Contribution;
}

export default function ContributionHotspotDisplay({ contribution }: ContributionHotspotDisplayProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const renderCodeSnippetWithHotspots = (snippet: string, hotspots: Contribution['hotspots']) => {
    if (!hotspots || hotspots.length === 0) {
      return <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md overflow-x-auto">{snippet}</pre>;
    }

    let result = snippet;
    // Sort hotspots by length of area to replace longer matches first
    const sortedHotspots = [...hotspots].sort((a, b) => b.area.length - a.area.length);

    sortedHotspots.forEach(hotspot => {
      const regex = new RegExp(`(${hotspot.area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      result = result.replace(regex, (match) => 
        `<mark class="bg-primary/20 text-primary font-semibold rounded px-1 cursor-pointer transition-all hover:bg-primary/40" data-hotspot-id="${hotspot.id}" data-hotspot-details="${hotspot.details}">${match}</mark>`
      );
    });
    
    return (
      <pre
        className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: result }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'MARK' && target.dataset.hotspotId) {
            // Could trigger a popover or modal here, for simplicity, toggle local state
            setActiveHotspot(target.dataset.hotspotId === activeHotspot ? null : target.dataset.hotspotId);
          }
        }}
      />
    );
  };

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 w-full">
      <CardHeader>
        <CardTitle className="text-xl">{contribution.title}</CardTitle>
        <CardDescription>Project: {contribution.project}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80 mb-4">{contribution.description}</p>
        
        {contribution.codeSnippet && contribution.hotspots && (
          <div className="mb-4">
            {renderCodeSnippetWithHotspots(contribution.codeSnippet, contribution.hotspots)}
            {contribution.hotspots.map(hotspot => (
               activeHotspot === hotspot.id && (
                <div key={hotspot.id} className="mt-2 p-2 bg-accent/10 border-l-4 border-accent text-accent-foreground rounded-r-md text-sm">
                  <strong>{hotspot.area}:</strong> {hotspot.details}
                </div>
              )
            ))}
          </div>
        )}

        {contribution.architectureImageUrl && contribution.hotspots && (
          <div className="relative mb-4" data-ai-hint={contribution.dataAiHint || "architecture diagram"}>
            <Image 
              src={contribution.architectureImageUrl} 
              alt={`${contribution.title} architecture`} 
              width={700} height={450} 
              className="rounded-md border" 
            />
            {contribution.hotspots.map(hotspot => {
              // Basic coordinate parsing: "x,y,width,height"
              const coords = hotspot.area.startsWith('coordinates:') ? hotspot.area.substring('coordinates:'.length).split(',').map(Number) : null;
              if (!coords || coords.length !== 4) return null;
              const [x, y, w, h] = coords;

              return (
                <Popover key={hotspot.id}>
                  <PopoverTrigger asChild>
                    <button
                      className="absolute border-2 border-dashed border-accent rounded bg-accent/20 hover:bg-accent/40 transition-all animate-pulse"
                      style={{ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }}
                      aria-label={`Info about ${hotspot.details.substring(0,20)}...`}
                    >
                      <Info className="w-4 h-4 text-accent-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-sm">
                    <p><strong>Highlight:</strong> {hotspot.details}</p>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        )}

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
