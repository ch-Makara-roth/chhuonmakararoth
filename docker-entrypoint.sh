#!/bin/sh
set -e

# Enhanced error handling and logging
exec > >(tee -a /app/logs/entrypoint.log)
exec 2>&1

echo "Starting container initialization at $(date)"
echo "Node.js version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"

# Function to wait for MongoDB with timeout
wait_for_mongo() {
  echo "Waiting for MongoDB to be ready..."
  local max_attempts=60
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if nc -z mongodb 27017; then
      echo "MongoDB is ready!"
      return 0
    fi
    echo "MongoDB is unavailable - sleeping (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "ERROR: MongoDB failed to start after $max_attempts attempts"
  return 1
}

# Function to setup database with retries
setup_database() {
  echo "Setting up database schema..."

  # Try to push schema with retries
  local max_retries=3
  local retry=1

  while [ $retry -le $max_retries ]; do
    echo "Attempting to push database schema (attempt $retry/$max_retries)..."
    if npx prisma db push --accept-data-loss; then
      echo "Database schema pushed successfully"
      break
    else
      echo "Database push failed, retrying in 10 seconds..."
      sleep 10
      retry=$((retry + 1))
    fi
  done

  if [ $retry -gt $max_retries ]; then
    echo "ERROR: Database schema push failed after $max_retries attempts"
    return 1
  fi

  echo "Seeding database..."
  if npm run prisma:seed; then
    echo "Database seeded successfully"
  else
    echo "WARNING: Database seeding failed or data already exists"
  fi
}

# Function to check application health
check_health() {
  echo "Performing health check..."
  local max_attempts=10
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if wget --no-verbose --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
      echo "Health check passed"
      return 0
    fi
    echo "Health check failed (attempt $attempt/$max_attempts), retrying in 5 seconds..."
    sleep 5
    attempt=$((attempt + 1))
  done

  echo "WARNING: Health check failed after $max_attempts attempts"
  return 1
}

# Function to handle graceful shutdown
cleanup() {
  echo "Received shutdown signal, cleaning up..."
  # Add any cleanup tasks here
  exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Main initialization
echo "Starting initialization process..."

# Wait for MongoDB and setup database
if wait_for_mongo; then
  echo "MongoDB connection established"
else
  echo "ERROR: Failed to connect to MongoDB"
  exit 1
fi

if setup_database; then
  echo "Database setup completed successfully"
else
  echo "ERROR: Database setup failed"
  exit 1
fi

# Start the application
echo "Starting Next.js application..."
echo "Application will be available at http://localhost:3000"
echo "Health check endpoint: http://localhost:3000/health"

# Start the application in background for health check
exec "$@" &
APP_PID=$!

# Wait a bit for the app to start
sleep 5

# Perform initial health check
if check_health; then
  echo "Application started successfully"
else
  echo "WARNING: Application may not be fully ready"
fi

# Wait for the application process
wait $APP_PID
