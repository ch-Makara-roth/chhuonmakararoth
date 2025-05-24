import HeroSection from '@/components/sections/HeroSection';
import JourneyTimeline from '@/components/sections/JourneyTimeline';
import SkillBloom from '@/components/sections/SkillBloom';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ContributionsSection from '@/components/sections/ContributionsSection';

export default function Home() {
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
