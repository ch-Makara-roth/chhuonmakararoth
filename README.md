
# Next.js Full-Stack Portfolio with Admin Panel

This is a personal portfolio website built with Next.js, featuring a dynamic frontend, API routes for content management (Projects, Experience, Skills), and a MongoDB backend accessed via Prisma. It includes a custom admin panel with authentication to manage portfolio content. The site supports internationalization for English (en) and Khmer (km).

## Key Features

*   **Dynamic Portfolio Frontend**: Showcasing projects, professional experience/journey, and skills.
*   **Internationalization (i18n)**: Supports English and Khmer languages using `react-i18next`.
*   **MongoDB Backend**: Data stored in MongoDB and accessed via Prisma ORM.
*   **Custom Admin Panel**:
    *   Accessible at `/admin`.
    *   Protected by email/password authentication using NextAuth.js (user stored in MongoDB).
    *   CRUD (Create, Read, Update, Delete) operations for Projects, Experience, and Skills.
    *   Image uploads for projects (local storage for development, see production notes).
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
*   **Authentication**: NextAuth.js (Credentials Provider with database users)
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
    *   `DATABASE_URL`: Your MongoDB connection string. **Important:** It must include the database name (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/yourDatabaseName?retryWrites=true&w=majority`).
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
*   `bun run build` / `npm run build`: Builds the application for production. This script now also runs `prisma generate`, `prisma db push`, and `npm run prisma:seed`. See "Database Seeding on Vercel" under Deployment for implications.
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
│   └── robots.txt
├── src/
│   ├── ai/                 # Genkit AI flows and configuration (if used)
│   ├── app/                # Next.js App Router
│   │   ├── [lang]/         # Language-specific routes (public facing)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx    # Main public landing page
│   │   │   └── projects/[slug]/page.tsx # Project detail page
│   │   ├── admin/          # Admin panel pages (layout.tsx, page.tsx, CRUD pages)
│   │   ├── api/            # API route handlers (e.g., for auth)
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Global root layout (for non-localized routes like admin/login)
│   │   └── login/page.tsx  # Admin login page
│   ├── components/         # UI components (ShadCN, custom)
│   │   ├── admin/          # Admin specific components (forms, action menus)
│   │   ├── layout/         # Layout specific components (Header, ThemeProvider, etc.)
│   │   ├── sections/       # Page sections (Hero, Projects, Skills)
│   │   └── ui/             # ShadCN UI components
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization configuration and locales
│   │   ├── locales/
│   │   │   ├── en/common.json
│   │   │   └── km/common.json
│   │   └── settings.ts
│   ├── lib/                # Utility functions, data definitions, Prisma client, validators
│   │   ├── data.ts         # Static data examples, interfaces (used for seeding)
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

## Deployment

### Vercel

This project is configured for easy deployment to Vercel.

1.  **Push your code to a Git repository** (GitHub, GitLab, Bitbucket).
2.  **Import your project on Vercel.**
3.  **Configure Environment Variables** in your Vercel project settings:
    *   `DATABASE_URL`: Your MongoDB Atlas connection string. **Crucially, ensure the database name is included in the URI and it's correctly formatted** (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/yourDbName?retryWrites=true&w=majority`). Double-check for any typos.
    *   `NEXTAUTH_URL`: The canonical URL of your Vercel deployment (e.g., `https://your-project-name.vercel.app`). This is automatically set by Vercel but good to be aware of.
    *   `NEXTAUTH_SECRET`: A strong, unique secret for NextAuth.js. Generate one using `openssl rand -base64 32` or an online generator.
    *   `NEXT_PUBLIC_APP_URL`: The canonical URL of your Vercel deployment (same as `NEXTAUTH_URL`).

4.  **MongoDB Atlas IP Access List**:
    *   When Vercel builds and runs your application, it uses dynamic IP addresses. The `Server selection timeout` and `Name or service not known` errors during `prisma db push` often mean your MongoDB Atlas cluster is not allowing connections from these IPs.
    *   **To resolve this, go to your MongoDB Atlas dashboard -> Network Access -> IP Access List and add `0.0.0.0/0` (Allow Access From Anywhere).**
    *   **Security Note**: If you allow access from anywhere, ensure your database user credentials (`username` and `password` in your `DATABASE_URL`) are very strong and unique.

5.  **Build Command**: Vercel typically uses the `build` script from your `package.json`. The current `build` script is:
    `npm run prisma:generate && npm run prisma:dbpush && next build && npm run prisma:seed`
    This ensures the Prisma client is generated and schema changes are pushed before the Next.js app is built, and then data is seeded. See "Database Seeding on Vercel" below for important considerations.
    *Note: The Prisma scripts in `package.json` have been updated to not rely on `dotenv-cli` for Vercel builds, as Vercel injects environment variables directly.*

6.  **File Uploads (Important Consideration for Production)**:
    The current project image upload implementation saves files to the local `public/uploads/` directory. This approach **will not work reliably on Vercel's serverless environment** because its filesystem is ephemeral (temporary). Uploaded files will be lost after a deployment or when the serverless function instance recycles.

    **For production image hosting, you should use a cloud-based storage solution:**
    *   **Vercel Blob**: Integrated directly with Vercel, good for ease of use.
    *   **Cloudinary**: A popular service for image and video management with a generous free tier.
    *   **AWS S3** (or Google Cloud Storage, Azure Blob Storage): Robust and scalable cloud storage.

    You will need to modify the project image upload logic in `src/app/admin/projects/actions.ts` to upload files to your chosen cloud provider and store the returned URL in the database, instead of saving locally.

7.  **Database Seeding on Vercel**:
    The `build` script in `package.json` (`npm run prisma:generate && npm run prisma:dbpush && next build && npm run prisma:seed`) now includes steps to push schema changes and seed your database on every Vercel deployment.
    *   **How it works**: When Vercel builds your application, it will execute these commands. It uses the `DATABASE_URL` you set in Vercel's environment variables.
    *   **Idempotency**: Your `prisma/seed.ts` script uses `upsert` operations, which means it will create data if it doesn't exist and update it if it does (based on unique identifiers like project `slug` or user `email`). This makes it generally safe to run multiple times.
    *   **Implications**:
        *   The seed script runs on **every deployment**. If you modify data in `src/lib/data.ts` (which your seed script uses), these changes will be applied to your production database on the next deployment.
        *   If schema changes are made (`prisma/schema.prisma`), `prisma db push` will attempt to apply them.
    *   **Recommendation for One-Time Seeding**: For a typical portfolio, you usually only need to seed the database once with initial content (like the admin user and sample projects). After your first successful deployment and seed on Vercel:
        *   You might want to **remove `&& npm run prisma:seed`** from the `build` command in `package.json` for subsequent deployments to prevent re-seeding every time.
        *   You might also consider removing `&& npm run prisma:dbpush` if your database schema becomes stable, to avoid running it on every build.
    *   **Alternative - Manual Seeding**: For more control, especially for the initial seed or major data changes, you can run the seed script manually from your local machine, configured to point to your production MongoDB Atlas database. To do this:
        1.  Temporarily set your local `.env.local` file's `DATABASE_URL` to your production MongoDB connection string.
        2.  Run `npm run prisma:seed` locally.
        3.  **Important**: Revert your local `DATABASE_URL` back to your development database URI afterward. Ensure your IP is whitelisted in MongoDB Atlas if you do this.

8.  **Deploy!**

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

