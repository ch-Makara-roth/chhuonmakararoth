import { contributionsData } from '@/lib/data';
import ContributionHotspotDisplay from '@/components/ContributionHotspotDisplay';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';

export default function ContributionsSection() {
  return (
    <SectionWrapper id="contributions">
      <SectionHeader
        title="Open Source & Contributions"
        description="Highlights of my contributions to open-source projects and community involvement."
      />
      <div className="space-y-8 md:space-y-12">
        {contributionsData.map((contribution) => (
          <ContributionHotspotDisplay key={contribution.id} contribution={contribution} />
        ))}
      </div>
    </SectionWrapper>
  );
}
