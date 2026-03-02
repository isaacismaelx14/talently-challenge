#!/bin/sh
set -e

# Create .env file from environment variables if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "APP_KEY=" > /var/www/html/.env
fi

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force --no-interaction
    # Export the generated key so subsequent commands use it
    export APP_KEY=$(grep '^APP_KEY=' /var/www/html/.env | cut -d'=' -f2-)
fi

# Discover packages (production only, no dev providers)
php artisan package:discover --ansi

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force --no-interaction

# Create default test user
php artisan app:create-default-user

exec "$@"
