# Docker Setup Guide

This project includes Docker configuration for both development and production environments.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Production Setup

1. **Clone the repository and navigate to the project directory**

2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your specific values:
   - `NEXTAUTH_SECRET`: Generate a random secret key
   - `DATABASE_URL`: Will be automatically set by docker-compose
   - Other variables as needed

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   
   The application will automatically:
   - Wait for MongoDB to be ready
   - Set up the database schema
   - Seed the database with initial data
   - Start the Next.js application

5. **Access the application**
   - Application: http://localhost:3000
   - MongoDB: localhost:27017

### Development Setup

1. **Use the development compose file**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Initialize the database** (in a new terminal)
   ```bash
   docker-compose -f docker-compose.dev.yml exec app npx prisma db push
   docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed
   ```

## Docker Files Overview

### Production Files
- `Dockerfile`: Multi-stage production build
- `docker-compose.yml`: Production services configuration

### Development Files
- `Dockerfile.dev`: Development build with hot reload
- `docker-compose.dev.yml`: Development services with volume mounting

### Configuration Files
- `.dockerignore`: Excludes unnecessary files from Docker context
- `.env.example`: Template for environment variables

## Services

### App Service
- **Port**: 3000
- **Framework**: Next.js 15
- **Features**: 
  - Prisma ORM
  - NextAuth.js authentication
  - Internationalization (i18n)
  - Image optimization

### MongoDB Service
- **Port**: 27017
- **Version**: MongoDB 6
- **Database**: portfolio
- **Persistence**: Docker volume

## Common Commands

### Production
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build

# Execute commands in app container
docker-compose exec app <command>
```

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Execute commands in development container
docker-compose -f docker-compose.dev.yml exec app <command>
```

### Database Management
```bash
# Generate Prisma client
docker-compose exec app npx prisma generate

# Push schema to database
docker-compose exec app npx prisma db push

# Seed database
docker-compose exec app npm run prisma:seed

# Open Prisma Studio
docker-compose exec app npx prisma studio
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes | `mongodb://mongodb:27017/portfolio` |
| `NEXTAUTH_URL` | NextAuth.js URL | Yes | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes | - |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes | `http://localhost:3000` |
| `NODE_ENV` | Node environment | No | `production` |

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check if MongoDB is running
   docker-compose ps
   
   # View MongoDB logs
   docker-compose logs mongodb
   ```

3. **Prisma client issues**
   ```bash
   # Regenerate Prisma client
   docker-compose exec app npx prisma generate
   ```

4. **Build cache issues**
   ```bash
   # Clean build with no cache
   docker-compose build --no-cache
   ```

### Performance Optimization

1. **Use .dockerignore**: Already configured to exclude unnecessary files
2. **Multi-stage builds**: Production Dockerfile uses multi-stage builds
3. **Volume mounting**: Development setup mounts source code for hot reload
4. **Standalone output**: Next.js configured for optimal Docker builds

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Secrets**: Use strong, unique values for `NEXTAUTH_SECRET`
3. **Database**: MongoDB runs without authentication in development (secure for production)
4. **Network**: Services communicate through Docker's internal network

## Production Deployment

For production deployment:

1. **Use environment-specific values**
2. **Set up proper database authentication**
3. **Configure reverse proxy (nginx, traefik)**
4. **Set up SSL certificates**
5. **Configure monitoring and logging**
6. **Use Docker secrets for sensitive data**

## Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)