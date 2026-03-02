#!/usr/bin/env bash

# Install backend dependencies
echo "Installing API dependencies..."
cd apps/api
composer install

echo "Setting up database..."
php artisan migrate

# Run the command to create the default user
echo "Creating default user..."
php artisan app:create-default-user

# Return to root
cd ../../

# Install frontend dependencies
echo "Installing Frontend & Monorepo dependencies..."
bun install

echo "Installation complete. You can now login with test@example.local and password 'admin'."
