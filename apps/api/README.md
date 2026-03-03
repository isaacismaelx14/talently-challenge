# Talently API Base (Laravel 9+)

API-first Laravel backend skeleton with:
- PostgreSQL
- Sanctum token authentication
- Versioned API routes (`/v1`)
- Request validation + service layer + contract binding
- Queue-ready setup for async jobs

## 1) Project Structure (Clean and Scalable)

```text
apps/api
├── app
│   ├── Contracts
│   │   └── Services
│   │       └── JobOfferServiceInterface.php
│   ├── Http
│   │   ├── Controllers
│   │   │   └── Api
│   │   │       └── V1
│   │   │           ├── AuthController.php
│   │   │           └── JobOfferController.php
│   │   └── Requests
│   │       ├── Auth
│   │       │   ├── LoginRequest.php
│   │       │   └── RegisterRequest.php
│   │       └── JobOffer
│   │           └── StoreJobOfferRequest.php
│   ├── Models
│   │   ├── JobOffer.php
│   │   └── User.php
│   ├── Providers
│   │   └── AppServiceProvider.php
│   └── Services
│       └── JobOfferService.php
├── database
│   └── migrations
│       ├── 2026_02_25_000000_create_job_offers_table.php
│       └── 2026_02_25_000001_create_jobs_table.php
└── routes
    └── api.php
```

## 2) Required Composer Packages

Already included in `composer.json`:
- `laravel/framework:^9.19`
- `laravel/sanctum:^3.0`
- `guzzlehttp/guzzle:^7.2`

If starting from scratch:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## 3) Quick Setup

### Automated Setup (Recommended)

### Automated Setup (Recommended)

1. Run the interactive setup script:
   ```bash
   cd apps/api
   npm run setup
   ```
   
   You'll be prompted to choose your setup mode:
   - **Preview mode**: Full Docker stack for testing/demonstration
   - **Local development**: PostgreSQL + dependencies + migrations  
   - **Environment only**: Just creates .env files

2. Follow the on-screen prompts:
   - Enter your AI Gateway API Key
   - Configure database settings (or use defaults)
   - Set application preferences
   
3. The script will handle the rest based on your chosen mode!

After setup, you can test with:
- **Email**: test@example.local
- **Password**: admin

### Manual Setup (Alternative)

If you prefer manual configuration:

1. Install dependencies:
   ```bash
   composer install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. Edit `.env` file and set:
   - `AI_GATEWAY_API_KEY`: Your AI Gateway API key
   - Database credentials
   - Other application settings

4. Start PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```

5. Run migrations:
   ```bash
   php artisan migrate
   ```

### Start Development Server

Based on your setup mode choice:

**After Development Mode Setup:**
- PostgreSQL should already be running and migrations completed
- API server: `php artisan serve`
- Queue worker: `php artisan queue:work --tries=3 --backoff=10`

**After Environment Only Setup:**
1. Start PostgreSQL:
   ```bash
   npm run db:start         # Start PostgreSQL container
   ```
2. Install dependencies and migrate:
   ```bash
   npm run setup:development # Run composer install + migrate
   ```
3. Start servers:
   ```bash
   php artisan serve                              # API server
   php artisan queue:work --tries=3 --backoff=10 # Queue worker
   ```

**Database Management:**
```bash
npm run db:start         # Start PostgreSQL container
npm run db:stop          # Stop PostgreSQL container  
npm run db:logs          # View PostgreSQL logs
```

## 4) Important `.env` Variables

Defined in `.env.example`:

- `APP_ENV`, `APP_DEBUG`: runtime behavior and error verbosity.
- `DB_*`: PostgreSQL connection settings.
- `QUEUE_CONNECTION=database`: required for production-style async processing.
- `LOG_LEVEL=info`: production-safe baseline.
- `SANCTUM_STATEFUL_DOMAINS`: required when using Sanctum with SPA/cookie auth.
- `API_RATE_LIMIT_PER_MINUTE`: central control for API throttle policy.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: reserved for future AI scoring modules.

## 5) API Routes (`routes/api.php`)

- `GET /v1/health`
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `GET /v1/auth/me` (auth required)
- `POST /v1/auth/logout` (auth required)
- `GET /v1/job-offers` (auth required)
- `POST /v1/job-offers` (auth required)
- `GET /v1/job-offers/{job_offer}` (auth required, binds by `public_id`)

## 6) Why Each Layer Exists

- **Controller layer (`Http/Controllers`)**:
  Handles HTTP concerns only (request/response, auth context, status codes).

- **FormRequest layer (`Http/Requests`)**:
  Centralizes validation and keeps controllers thin.

- **Service layer (`Services`)**:
  Holds business use-cases and orchestration logic (transaction boundaries, creation rules).

- **Contract layer (`Contracts`)**:
  Applies dependency inversion (controllers depend on interfaces, not concrete classes).

- **Model layer (`Models`)**:
  Encapsulates persistence mapping and relationships.

- **Migration layer (`database/migrations`)**:
  Versioned schema evolution for reliable deployments.

## 7) Key Architectural Decisions

1. **API versioning (`/v1`)**: enables backward-compatible evolution.
2. **Sanctum token auth**: simple, secure, first-party API auth without OAuth complexity.
3. **Service + contract pattern**: improves testability and enforces separation of concerns.
4. **Database queue driver**: production-like async foundation without external infra dependency.
5. **`public_id` UUID for external URLs**: avoids exposing sequential internal IDs.
6. **Minimal but explicit structure**: clean base now, easy to extend later (scoring, AI extraction, background pipelines).

## 8) Example Components in This Base

- Example controller: `app/Http/Controllers/Api/V1/JobOfferController.php`
- Example service: `app/Services/JobOfferService.php`
- Example request validation: `app/Http/Requests/JobOffer/StoreJobOfferRequest.php`
- Example migration: `database/migrations/2026_02_25_000000_create_job_offers_table.php`

## 9) Setup Modes

**Preview Mode** (`npm run preview`)
- Best for: Testing the complete application stack
- Requirements: Docker, Docker Compose
- What it does: Starts web + API + database in containers
- Includes: Sample data, test user, automatic port conflict resolution

**Development Mode** (`npm run development`)  
- Best for: Active backend development
- Requirements: Docker, Docker Compose, local PHP/Composer
- What it does: Starts PostgreSQL, runs migrations, creates test user
- Includes: Queue monitoring, automatic port conflict resolution

**Environment Only Mode** (`npm run setup:env`)
- Best for: Custom setups, CI/CD, specific configurations
- Requirements: None (just creates files)  
- What it does: Creates .env files for manual configuration

## 10) Troubleshooting

### Port Conflicts

The setup script automatically handles common port conflicts:

**PostgreSQL Database** (Development/Preview)
- Default port: 5433
- Auto-detection: Checks availability before start
- Resolution: Suggests next available port (5434, 5435, etc.)
- Updates: Automatically modifies .env files

**Preview Services**
- Web application: Default port 3000
- API application: Default port 8080  
- Auto-detection: Checks both ports before starting containers
- Resolution: Uses alternative ports if needed
- Display: Shows actual URLs with assigned ports

**Manual Port Changes**
```bash
# PostgreSQL only
npm run db:stop
# Edit .env: POSTGRES_PORT=5434 and DB_PORT=5434  
npm run db:start

# Preview mode
npm run preview:down
# Set environment variables or edit docker-compose.preview.yml
WEB_PORT=3001 API_PORT=8081 npm run preview
```

### Common Issues

**Database Connection Errors**
- Ensure PostgreSQL is running: `npm run db:start`
- Check port conflicts: Setup script will detect and resolve
- Verify .env DB_* settings match POSTGRES_* values

**AI Gateway Errors**  
- Verify AI_GATEWAY_API_KEY is set in your .env file
- Check network connectivity to the AI gateway
- Review logs for specific error messages
