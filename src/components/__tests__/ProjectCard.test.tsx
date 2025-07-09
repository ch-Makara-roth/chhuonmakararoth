import { render, screen } from '@testing-library/react';
import ProjectCard from '../ProjectCard';
import { defaultLocale } from '@/app/i18n/settings';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
  Github: () => <span data-testid="github-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-footer">{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-title">{children}</div>
  ),
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-description">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, className, variant, size }: any) => (
    <button className={className} data-variant={variant} data-size={size} data-asChild={asChild}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    slug: 'test-project',
    title: 'Test Project',
    shortDescription: 'A test project description',
    description: 'Full description of the test project',
    technologies: ['React', 'TypeScript', 'Tailwind'],
    imageUrl: '/images/test-project.jpg',
    repoLink: 'https://github.com/user/test-project',
    liveLink: 'https://test-project.com',
    dataAiHint: 'project image',
    featured: true,
    startDate: '2023-01-01',
  };

  it('renders the project information correctly', () => {
    render(<ProjectCard project={mockProject} lang={defaultLocale} />);
    
    // Check if title and description are rendered
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
    
    // Check if technologies are rendered
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind')).toBeInTheDocument();
    
    // Check if links are rendered correctly
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('View Details').closest('a')).toHaveAttribute('href', `/projects/${mockProject.slug}`);
    
    // Check if external links are rendered
    expect(screen.getByLabelText('GitHub Repository')).toHaveAttribute('href', mockProject.repoLink);
    expect(screen.getByLabelText('Live Preview')).toHaveAttribute('href', mockProject.liveLink);
  });

  it('constructs the correct project path with non-default locale', () => {
    const nonDefaultLocale = 'fr';
    render(<ProjectCard project={mockProject} lang={nonDefaultLocale} />);
    
    expect(screen.getByText('View Details').closest('a')).toHaveAttribute('href', `/${nonDefaultLocale}/projects/${mockProject.slug}`);
  });

  it('does not render GitHub link if repoLink is not provided', () => {
    const projectWithoutRepo = { ...mockProject, repoLink: undefined };
    render(<ProjectCard project={projectWithoutRepo} lang={defaultLocale} />);
    
    expect(screen.queryByLabelText('GitHub Repository')).not.toBeInTheDocument();
  });

  it('does not render live link if liveLink is not provided', () => {
    const projectWithoutLive = { ...mockProject, liveLink: undefined };
    render(<ProjectCard project={projectWithoutLive} lang={defaultLocale} />);
    
    expect(screen.queryByLabelText('Live Preview')).not.toBeInTheDocument();
  });
}); 