#!/bin/sh
set -e

# Function to wait for MongoDB
wait_for_mongo() {
  echo "Waiting for MongoDB to be ready..."
  until nc -z mongodb 27017; do
    echo "MongoDB is unavailable - sleeping"
    sleep 2
  done
  echo "MongoDB is ready!"
}

# Function to setup database
setup_database() {
  echo "Setting up database schema..."
  npx prisma db push --accept-data-loss || {
    echo "Database push failed, retrying in 5 seconds..."
    sleep 5
    npx prisma db push --accept-data-loss
  }
  
  echo "Seeding database..."
  npm run prisma:seed || echo "Seeding failed or data already exists"
}

# Wait for MongoDB and setup database
wait_for_mongo
setup_database

# Start the application
echo "Starting Next.js application..."
exec "$@"