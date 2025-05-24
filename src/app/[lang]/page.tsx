
import HeroSection from '@/components/sections/HeroSection';
import JourneyTimeline from '@/components/sections/JourneyTimeline';
import SkillBloom from '@/components/sections/SkillBloom';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ContributionsSection from '@/components/sections/ContributionsSection';
import { languages } from '@/app/i18n/settings'; // Import languages

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

interface HomeProps {
  params: { lang: string };
}

export default async function Home({ params: { lang } }: HomeProps) {
  // lang is now available if needed for this page, 
  // though child components might get it via useTranslation or useParams from next/navigation
  return (
    <>
      <HeroSection />
      <JourneyTimeline />
      <SkillBloom />
      <ProjectsSection />
      <ContributionsSection />
      {/* Placeholder for Footer if needed later */}
      {/* <footer className="py-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Chhuon MakaraRoth. All rights reserved.
      </footer> */}
    </>
  );
}
