export interface JourneyItem {
  id: string;
  date: string;
  title: string;
  company?: string;
  description: string;
  tags?: string[];
}

export interface Skill {
  id: string;
  name: string;
  proficiency: number; // 0-100
  technologies?: string[];
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Mobile' | 'Tools' | 'Other';
  icon?: React.ElementType; // Lucide icon
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string; // Longer description for detail page
  imageUrl: string;
  technologies: string[];
  liveLink?: string;
  repoLink?: string;
  startDate: string;
  endDate?: string;
  detailsImages?: string[]; // Additional images for project detail page
  features?: string[]; // Key features for project detail page
  dataAiHint?: string;
}

export interface Contribution {
  id: string;
  title: string;
  project: string;
  description: string;
  codeSnippet?: string;
  architectureImageUrl?: string;
  hotspots?: Array<{ id: string; area: string; // Can be line numbers, text, or coordinates for image
    details: string }>;
  repoLink?: string;
  dataAiHint?: string;
}

export const journeyData: JourneyItem[] = [
  {
    id: '1',
    date: '2023 - Present',
    title: 'Senior Software Engineer',
    company: 'Tech Solutions Inc.',
    description: 'Leading development of scalable web applications using Next.js, TypeScript, and microservices architecture. Mentoring junior developers and driving agile practices.',
    tags: ['Next.js', 'TypeScript', 'AWS', 'Leadership'],
  },
  {
    id: '2',
    date: '2020 - 2023',
    title: 'Full-Stack Developer',
    company: 'Innovatech Ltd.',
    description: 'Developed and maintained full-stack applications, focusing on API development with Node.js and frontend with React. Contributed to database design and CI/CD pipelines.',
    tags: ['React', 'Node.js', 'MongoDB', 'Docker'],
  },
  {
    id: '3',
    date: '2018 - 2020',
    title: 'Junior Developer',
    company: 'Startup X',
    description: 'Gained foundational experience in web development, working on various client projects. Learned quickly and adapted to new technologies.',
    tags: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
  },
];

export const skillsData: Skill[] = [
  { id: 's1', name: 'TypeScript', proficiency: 90, category: 'Frontend', technologies: ['React', 'Next.js'] },
  { id: 's2', name: 'React', proficiency: 95, category: 'Frontend', technologies: ['Redux', 'Next.js', 'Vite'] },
  { id: 's3', name: 'Node.js', proficiency: 85, category: 'Backend', technologies: ['Express.js', 'NestJS'] },
  { id: 's4', name: 'Python', proficiency: 70, category: 'Backend', technologies: ['Django', 'Flask'] },
  { id: 's5', name: 'AWS', proficiency: 75, category: 'DevOps', technologies: ['EC2', 'S3', 'Lambda', 'DynamoDB'] },
  { id: 's6', name: 'Docker', proficiency: 80, category: 'DevOps' },
  { id: 's7', name: 'SQL', proficiency: 80, category: 'Backend', technologies: ['PostgreSQL', 'MySQL'] },
  { id: 's8', name: 'Git', proficiency: 95, category: 'Tools'},
  { id: 's9', name: 'JavaScript', proficiency: 95, category: 'Frontend'},
  { id: 's10', name: 'HTML5 & CSS3', proficiency: 90, category: 'Frontend', technologies: ['TailwindCSS', 'SASS'] },
];

export const projectsData: Project[] = [
  {
    id: 'p1',
    slug: 'ecosmart-dashboard',
    title: 'EcoSmart Dashboard',
    shortDescription: 'An analytics platform for monitoring environmental impact.',
    description: 'EcoSmart Dashboard is a comprehensive analytics platform designed to help organizations track and reduce their environmental footprint. It features real-time data visualization, customizable reports, and actionable insights. Built with Next.js, TypeScript, and Chart.js for dynamic data representation.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'dashboard analytics',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Chart.js', 'Node.js'],
    liveLink: '#',
    repoLink: '#',
    startDate: 'Jan 2023',
    endDate: 'Jun 2023',
    features: ['Real-time data visualization', 'Customizable reports', 'User authentication', 'Role-based access control'],
    detailsImages: ['https://placehold.co/800x600.png', 'https://placehold.co/800x600.png']
  },
  {
    id: 'p2',
    slug: 'mobile-task-manager',
    title: 'Mobile Task Manager',
    shortDescription: 'A cross-platform mobile app for task management.',
    description: 'A sleek and intuitive cross-platform mobile application built with React Native and Firebase. It helps users organize their tasks, set reminders, and collaborate with teams. Features offline support and real-time synchronization.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'mobile app',
    technologies: ['React Native', 'Firebase', 'TypeScript', 'Redux'],
    liveLink: '#',
    startDate: 'Jul 2022',
    endDate: 'Dec 2022',
    features: ['Cross-platform (iOS & Android)', 'Offline data sync', 'Push notifications', 'Team collaboration tools'],
    detailsImages: ['https://placehold.co/400x800.png', 'https://placehold.co/400x800.png']
  },
  {
    id: 'p3',
    slug: 'ai-content-generator',
    title: 'AI Content Generator',
    shortDescription: 'A web tool leveraging AI to generate creative content.',
    description: 'This project is a web-based tool that uses advanced AI models (like GPT) to generate various types of creative content, including articles, social media posts, and product descriptions. The backend is powered by Python (Flask) and the frontend by React.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'ai content',
    technologies: ['React', 'Python', 'Flask', 'OpenAI API', 'Docker'],
    repoLink: '#',
    startDate: 'Mar 2022',
    features: ['Multiple content types', 'Customizable generation parameters', 'User-friendly interface', 'API for integration'],
    detailsImages: ['https://placehold.co/800x600.png']
  },
];

export const contributionsData: Contribution[] = [
//   {
//     id: 'c1',
//     title: 'Performance Optimization for UI Library',
//     project: 'OpenReactUI',
//     description: 'Identified and resolved performance bottlenecks in the core rendering logic of a popular open-source React UI library, resulting in a 30% speed improvement for complex components.',
//     repoLink: '#',
//     codeSnippet: `// Before optimization
// function ExpensiveComponent({ items }) {
//   return (
//     <ul>
//       {items.map(item => (
//         <li key={item.id} style={{ color: computeStyle(item) }}>
//           {item.name}
//         </li>
//       ))}
//     </ul>
//   );
// }

// // After optimization using React.memo and useMemo
// const OptimizedListItem = React.memo(({ item }) => {
//   const itemStyle = React.useMemo(() => computeStyle(item), [item]);
//   return <li style={{ color: itemStyle }}>{item.name}</li>;
// });

// function OptimizedExpensiveComponent({ items }) {
//   return (
//     <ul>
//       {items.map(item => (
//         <OptimizedListItem key={item.id} item={item} />
//       ))}
//     </ul>
//   );
// }`,
//     hotspots: [
//       { id: 'h1', area: 'React.memo', details: 'Used React.memo to prevent unnecessary re-renders of list items.' },
//       { id: 'h2', area: 'React.useMemo', details: 'Applied useMemo to cache expensive style computations.' },
//     ],
//     dataAiHint: 'code optimization'
//   },
  {
    id: 'c2',
    title: 'Code Editor',
    project: 'CommunityDocs Platform',
    description: 'Code Editor with Hotspots for code explanation and learning. It is a web-based tool that allows users to edit and learn from code snippets. It is built with React and TypeScript.',
    // architectureImageUrl: 'https://placehold.co/700x450.png',
    dataAiHint: 'code editor',
    codeSnippet: ``,
    hotspots: [
      { id: 'h3', area: 'coordinates:50,50,100,30', details: 'Language selection dropdown UI.' },
      { id: 'h4', area: 'coordinates:200,150,150,40', details: 'Translation file loading mechanism.' },
      { id: 'h5', area: 'languages', details: 'Array of supported languages with their codes and display names.' },
      { id: 'h6', area: 'LanguageDetector', details: 'Auto-detects user language preference from browser settings.' },
      { id: 'h7', area: 'resources', details: 'Translation key-value pairs for each supported language.' },
      { id: 'h8', area: 'useTranslation', details: 'React hook to access translation functions and the i18n instance.' },
      { id: 'h9', area: 'changeLanguage', details: 'Function to dynamically switch between languages.' },
      { id: 'h10', area: 'currentLang', details: 'Gets the current active language object based on i18n.language.' },
      { id: 'h11', area: 'Check', details: 'Shows a checkmark icon next to the currently selected language.' },
    ],
  },
];
