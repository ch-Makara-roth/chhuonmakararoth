
# Next.js Full-Stack Portfolio with Admin Panel

This is a personal portfolio website built with Next.js, featuring a dynamic frontend, API routes for content management, and a MongoDB backend accessed via Prisma. It includes a custom admin panel to manage portfolio content.

## Key Features

*   **Dynamic Portfolio Frontend**: Showcasing projects, professional experience/journey, and skills.
*   **Next.js API Routes**: Serves content for projects, experience, and skills from a MongoDB database.
*   **Prisma ORM**: Provides a type-safe database access layer for MongoDB.
*   **Custom Admin Panel**: Basic interface (currently read-only) to view content stored in the database.
    *   Accessible at `/admin`.
    *   Displays projects, experience entries, and skills.
*   **ShadCN UI & Tailwind CSS**: For modern and responsive styling.
*   **Typing Animation**: Engaging hero section with a typing effect.
*   **Theme Switcher**: Light and dark mode support.

## Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, ShadCN UI
*   **Database**: MongoDB
*   **ORM**: Prisma
*   **Deployment**: (To be determined - Vercel, Firebase App Hosting, etc.)
*   **Generative AI (Planned)**: Genkit (for potential future AI-driven features)

## Getting Started

### Prerequisites

*   Node.js (version 18.x or higher recommended)
*   npm, yarn, or pnpm
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

1.  Create a `.env.local` file in the root of your project by copying the example:
    ```bash
    cp .env.example .env.local
    ```

2.  Update `.env.local` with your specific credentials and settings:
    *   `DATABASE_URL`: Your MongoDB connection string. **Important:** It must include the database name.
        *   Example: `mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority`
    *   `MONGODB_DB_NAME`: Your MongoDB database name (this is somewhat redundant if included in `DATABASE_URL` for Prisma, but kept for potential direct driver use or clarity).
    *   `NEXT_PUBLIC_APP_URL`: The base URL for your application when running locally (e.g., `http://localhost:9002`).

### Prisma Setup

1.  **Generate Prisma Client:**
    After setting up your `DATABASE_URL` in `.env.local`, generate the Prisma client:
    ```bash
    npm run prisma:generate
    ```
    Or, if you prefer using npx directly (ensure your environment variables are loaded, e.g., by your shell or a tool):
    ```bash
    npx prisma generate
    ```

2.  **Push Schema to Database:**
    This command will synchronize your Prisma schema with your MongoDB database, creating collections if they don't exist based on your models.
    ```bash
    npm run prisma:dbpush
    ```
    Or, using npx:
    ```bash
    npx prisma db push
    ```

    *Note: For MongoDB, `db push` is used instead of `migrate dev`. It does not create migration files but applies schema changes directly.*

3.  **Seed Your Database (Manual for now):**
    You'll need to populate your MongoDB collections (`Project`, `Experience`, `Skill`) with initial data. Refer to the structures in `src/lib/data.ts` for field guidance and `prisma/schema.prisma` for the model definitions.

### Running the Application

1.  **Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:9002`.

2.  **Genkit Development Server (if using Genkit features):**
    ```bash
    npm run genkit:dev
    ```

### Available Scripts

*   `npm run dev`: Starts the Next.js development server (with Turbopack).
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server.
*   `npm run lint`: Runs Next.js ESLint.
*   `npm run typecheck`: Runs TypeScript type checking.
*   `npm run prisma:generate`: Generates Prisma Client.
*   `npm run prisma:dbpush`: Pushes the Prisma schema state to the database.
*   `npm run prisma:studio`: Opens Prisma Studio to view/edit data.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.


## Project Structure

```
/
├── prisma/                 # Prisma schema and generated client
│   └── schema.prisma
├── public/                 # Static assets
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   ├── app/                # Next.js App Router (pages, layouts, API routes)
│   │   ├── admin/          # Admin panel pages
│   │   ├── api/            # API route handlers
│   │   ├── (public_routes)/ # Public facing pages
│   │   ├── globals.css     # Global styles
│   │   └── layout.tsx      # Root layout
│   ├── components/         # UI components (ShadCN, custom)
│   │   ├── layout/         # Layout specific components (Header, ThemeProvider)
│   │   ├── sections/       # Page sections (Hero, Projects, Skills)
│   │   └── ui/             # ShadCN UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, data definitions, Prisma client
│   │   ├── data.ts         # (Now primarily for type definitions/initial static data)
│   │   ├── prisma.ts       # Prisma client instance
│   │   └── utils.ts        # General utility functions
├── .env.local              # Local environment variables (Gitignored)
├── .env.example            # Example environment variables
├── next.config.ts          # Next.js configuration
├── package.json
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Admin Panel

*   **Access**: Navigate to `/admin`
*   **Current Capabilities**:
    *   View Projects from the database.
    *   View Experience entries from the database.
    *   View Skills from the database.
*   **Future Enhancements**:
    *   Authentication and Authorization.
    *   Full CRUD (Create, Read, Update, Delete) operations for all content types.
    *   File uploads for project images.

## API Endpoints

The following API endpoints are currently available for fetching data (GET requests):

*   `/api/projects`: Returns a list of all projects.
*   `/api/experience`: Returns a list of all experience/journey items.
*   `/api/skills`: Returns a list of all skills.

## Future Enhancements Planned

*   **Full CRUD Operations**: Implement Create, Update, and Delete functionality in the admin panel.
*   **Admin Authentication**: Secure the admin panel.
*   **Blog/Articles Section**: Add functionality for writing and displaying blog posts.
*   **Contact Form**: Implement a contact form with backend processing.
*   **Image Uploads**: Allow image uploads for projects in the admin panel.
*   **Advanced Animations & UI Polish**.
*   **Genkit AI Features**: Explore AI-powered content suggestions or other enhancements.

## Contributing

This is a personal portfolio project. However, if you have suggestions or find issues, feel free to open an issue.

## License

(Consider adding a license, e.g., MIT License)
```
This project is licensed under the MIT License - see the LICENSE.md file for details.
```

*(You would need to create a `LICENSE.md` file with the MIT license text if you choose to include this section).*
