
import HeroSection from '@/components/sections/HeroSection';
import JourneyTimeline from '@/components/sections/JourneyTimeline';
import SkillBloom from '@/components/sections/SkillBloom';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ContributionsSection from '@/components/sections/ContributionsSection';
import { languages } from '@/app/i18n/settings';

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

interface HomeProps {
  params: { lang: string };
}

export default async function Home({ params: { lang } }: HomeProps) {
  return (
    <>
      <HeroSection /> {/* HeroSection is client, uses useTranslation for lang */}
      <JourneyTimeline lang={lang} /> {/* Pass lang prop */}
      <SkillBloom lang={lang} /> {/* Pass lang prop */}
      <ProjectsSection lang={lang} /> {/* Pass lang prop */}
      <ContributionsSection /> {/* Contributions section remains static for now */}
    </>
  );
}
