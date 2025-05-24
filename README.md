
# Next.js Full-Stack Portfolio with Admin Panel

This is a personal portfolio website built with Next.js, featuring a dynamic frontend, API routes for content management (Projects, Experience, Skills), and a MongoDB backend accessed via Prisma. It includes a custom admin panel with authentication to manage portfolio content. The site supports internationalization for English (en) and Khmer (km).

## Key Features

*   **Dynamic Portfolio Frontend**: Showcasing projects, professional experience/journey, and skills.
*   **Internationalization (i18n)**: Supports English and Khmer languages.
*   **Next.js API Routes & Server Actions**: Manages content for projects, experience, and skills.
*   **Prisma ORM**: Provides a type-safe database access layer for MongoDB.
*   **Custom Admin Panel**:
    *   Accessible at `/admin`.
    *   Protected by username/password authentication (NextAuth.js).
    *   CRUD (Create, Read, Update, Delete) operations for Projects, Experience, and Skills.
    *   Image uploads for projects (local storage for development).
*   **ShadCN UI & Tailwind CSS**: For modern and responsive styling.
*   **Typing Animation**: Engaging hero section with a typing effect.
*   **Theme Switcher**: Light and dark mode support.
*   **Smooth Scrolling**: For navigation links.

## Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, ShadCN UI
*   **Database**: MongoDB
*   **ORM**: Prisma
*   **Authentication**: NextAuth.js (Credentials Provider)
*   **Internationalization**: `react-i18next`, `i18next`
*   **Deployment**: Configured for Vercel (see Deployment section)

## Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   Bun (or npm/yarn/pnpm - scripts are generally compatible)
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    # or
    npm install
    # or
    yarn install
    ```

### Environment Variables

1.  Create a `.env.local` file in the root of your project by copying the example:
    ```bash
    cp .env.example .env.local
    ```

2.  Update `.env.local` with your specific credentials and settings:
    *   `DATABASE_URL`: Your MongoDB connection string. **Important:** It must include the database name (e.g., `...mongodb.net/yourDatabaseName?retryWrites...`).
    *   `NEXTAUTH_URL`: The base URL for your application when running locally (e.g., `http://localhost:9002`). This is important for NextAuth.js OAuth callbacks and other functions.
    *   `NEXTAUTH_SECRET`: A random string used to hash tokens, sign cookies, and generate cryptographic keys. You can generate one using `openssl rand -base64 32` or an online generator.
    *   `NEXT_PUBLIC_APP_URL`: The base URL for your application, accessible by the client-side (e.g., `http://localhost:9002`).

### Prisma Setup

1.  **Generate Prisma Client:**
    After setting up your `DATABASE_URL` in `.env.local`, generate the Prisma client:
    ```bash
    npm run prisma:generate
    # or bun run prisma:generate
    ```

2.  **Push Schema to Database:**
    This command will synchronize your Prisma schema with your MongoDB database, creating collections and indexes if they don't exist.
    ```bash
    npm run prisma:dbpush
    # or bun run prisma:dbpush
    ```

3.  **Seed Your Database:**
    To populate your database with initial admin user and sample data:
    ```bash
    npm run prisma:seed
    # or bun run prisma:seed
    ```
    The default admin credentials (if seeded by `prisma/seed.ts`) are:
    *   Email: `admin@gmail.com`
    *   Password: `Admin@123`

### Running the Application

1.  **Development Server:**
    ```bash
    bun run dev
    # or
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:9002`.

2.  **Genkit Development Server (if using Genkit features - currently not integrated):**
    ```bash
    npm run genkit:dev
    ```

### Available Scripts

*   `bun run dev` / `npm run dev`: Starts the Next.js development server.
*   `bun run build` / `npm run build`: Builds the application for production.
*   `bun run start` / `npm run start`: Starts a Next.js production server.
*   `bun run lint` / `npm run lint`: Runs Next.js ESLint.
*   `bun run typecheck` / `npm run typecheck`: Runs TypeScript type checking.
*   `npm run prisma:generate`: Generates Prisma Client.
*   `npm run prisma:dbpush`: Pushes the Prisma schema state to the database.
*   `npm run prisma:studio`: Opens Prisma Studio to view/edit data.
*   `npm run prisma:seed`: Seeds the database with initial data.

## Project Structure

```
/
├── prisma/                 # Prisma schema and seed script
│   ├── schema.prisma
│   └── seed.ts
├── public/                 # Static assets (images, robots.txt, etc.)
│   └── uploads/            # Local image uploads (for development)
├── src/
│   ├── ai/                 # Genkit AI flows and configuration (if used)
│   ├── app/                # Next.js App Router
│   │   ├── [lang]/         # Language-specific routes (public facing)
│   │   │   ├── admin/      # (Old admin location, should be removed if not already)
│   │   │   ├── api/        # (Old API location, should be removed if not already)
│   │   │   ├── (public_routes)/ # Public facing pages (layout.tsx, page.tsx)
│   │   │   └── projects/[slug]/page.tsx
│   │   ├── admin/          # Admin panel pages (layout.tsx, page.tsx, CRUD pages)
│   │   ├── api/            # API route handlers (e.g., for auth)
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Global root layout
│   │   └── login/page.tsx  # Admin login page
│   ├── components/         # UI components (ShadCN, custom)
│   │   ├── admin/          # Admin specific components (forms)
│   │   ├── layout/         # Layout specific components (Header, ThemeProvider, etc.)
│   │   ├── sections/       # Page sections (Hero, Projects, Skills)
│   │   └── ui/             # ShadCN UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, data definitions, Prisma client, validators
│   │   ├── data.ts         # Static data examples, interfaces
│   │   ├── prisma.ts       # Prisma client instance
│   │   ├── utils.ts        # General utility functions
│   │   └── validators/     # Zod validation schemas
│   ├── middleware.ts       # Next.js middleware (for i18n routing)
├── .env.local              # Local environment variables (Gitignored)
├── .env.example            # Example environment variables
├── next.config.ts          # Next.js configuration
├── package.json
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Admin Panel

*   **Access**: Navigate to `/admin`. You will be redirected to `/login` if not authenticated.
*   **Authentication**: Uses email (`admin@gmail.com`) and password (`Admin@123`) after seeding.
*   **Capabilities**:
    *   Manage Projects (Create, Read, Update, Delete, Image Upload).
    *   Manage Experience (Create, Read, Update, Delete).
    *   Manage Skills (Create, Read, Update, Delete).

## API Endpoints

*   `/api/auth/...`: NextAuth.js authentication routes.
*   Other data fetching is done directly in Server Components using Prisma.

## Deployment

### Vercel

This project is configured for easy deployment to Vercel.

1.  **Push your code to a Git repository** (GitHub, GitLab, Bitbucket).
2.  **Import your project on Vercel.**
3.  **Configure Environment Variables** in your Vercel project settings:
    *   `DATABASE_URL`: Your MongoDB Atlas connection string. Ensure the database name is included in the URI (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/yourDbName?retryWrites=true&w=majority`).
    *   `NEXTAUTH_URL`: The canonical URL of your Vercel deployment (e.g., `https://your-project-name.vercel.app`).
    *   `NEXTAUTH_SECRET`: A strong, unique secret for NextAuth.js. Generate one using `openssl rand -base64 32` or an online generator.
    *   `NEXT_PUBLIC_APP_URL`: The canonical URL of your Vercel deployment (same as `NEXTAUTH_URL`).

4.  **Build Command**: Vercel typically uses the `build` script from your `package.json` (`next build`). The `next build` command should automatically run `prisma generate` if it detects Prisma in your project, ensuring the Prisma Client is available. If you encounter issues with Prisma Client not being found during the build, you might need to set the Vercel build command to `prisma generate && next build`.

5.  **File Uploads (Important Consideration for Production)**:
    The current project image upload implementation saves files to the local `public/uploads/` directory. This approach **will not work reliably on Vercel's serverless environment** because its filesystem is ephemeral (temporary). Uploaded files will be lost after a deployment or when the serverless function instance recycles.

    **For production image hosting, you should use a cloud-based storage solution:**
    *   **Vercel Blob**: Integrated directly with Vercel, good for ease of use.
    *   **Cloudinary**: A popular service for image and video management with a generous free tier.
    *   **AWS S3** (or Google Cloud Storage, Azure Blob Storage): Robust and scalable cloud storage.

    You will need to modify the project image upload logic in `src/app/admin/projects/actions.ts` to upload files to your chosen cloud provider and store the returned URL in the database, instead of saving locally.

6.  **Deploy!**

## Future Enhancements Planned

*   **Cloud-based Image Uploads**: Implement a robust solution for image uploads (e.g., Vercel Blob, Cloudinary).
*   **Blog/Articles Section**: Full CRUD for blog posts.
*   **Contact Form**: Implement a contact form with backend processing and email notifications.
*   **Advanced Admin Features**: Filtering, sorting, pagination in admin tables.
*   **Genkit AI Features**: Explore AI-powered content suggestions or other enhancements.

## Contributing

This is a personal portfolio project. However, if you have suggestions or find issues, feel free to open an issue.

## License

(Consider adding a license, e.g., MIT License)
```
This project is licensed under the MIT License - see the LICENSE.md file for details.
```
*(You would need to create a `LICENSE.md` file with the MIT license text if you choose to include this section).*

