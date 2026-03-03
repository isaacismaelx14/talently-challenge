# Talently Challenge - CV Scoring System

A full-stack application for automated CV scoring against job offers using AI-powered analysis.

**Stack:**
- **API**: Laravel 9+ with PostgreSQL, Sanctum auth, and AI integration
- **Web**: React with TypeScript and modern tooling

## Quick Start

### Complete Setup (API + Web)

### Complete Setup (API + Web)

```bash
# Interactive setup with mode selection
npm run setup
```

You'll be prompted to choose your setup mode:
1. **Preview mode** - Full Docker stack ready for testing
2. **Local development** - PostgreSQL + dependencies + migrations
3. **Environment only** - Just creates .env files for manual setup

The script will:
- Install all dependencies (bun install)  
- Run interactive setup (creates both API and root .env files)
- Execute your chosen setup mode automatically

### Test Credentials

After setup, you can log in with:
- **Email**: test@example.local  
- **Password**: admin

### Service URLs

**Preview Mode:**
- Dashboard: http://localhost:3000 (or auto-assigned port)
- API: http://localhost:8080/v1 (or auto-assigned port)

**Development Mode:**  
- API: http://localhost:8000/v1 (after running `php artisan serve`)
- Database: PostgreSQL @ localhost:5433 (or auto-assigned port)

### Individual Component Setup

**API Only:**
```bash
npm run setup:api
```

**Development Servers:**
```bash
# Start API server
npm run dev:api

# Start Web development server  
npm run dev:web

# Start both (parallel)
npm run dev
```

### Manual Setup

If you prefer to set up each component manually:

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure API:**
   ```bash
   cd apps/api
   npm run setup:env  # Interactive environment setup
   composer install
   php artisan migrate
   ```

3. **Start development:**
   ```bash
   npm run dev  # Starts both API and Web
   ```

## Project Structure

```
talently-challenge/
├── apps/
│   ├── api/           # Laravel 9+ backend API
│   └── web/           # React frontend
├── docker-compose.preview.yml
└── package.json       # Workspace scripts
```

## Available Scripts

- `npm run setup` - Interactive setup with mode selection
- `npm run dev` - Start both API and Web in development
- `npm run build` - Build all applications  
- `npm run test` - Run API tests
- `npm run preview` - Docker preview deployment

### Setup Modes Available
- **Preview**: Full Docker stack (npm run preview)
- **Development**: Local with PostgreSQL (npm run dev:api)  
- **Environment**: Manual configuration needed

### Database Management
- `npm run db:start` - Start PostgreSQL container
- `npm run db:stop` - Stop PostgreSQL container
- `npm run db:logs` - View PostgreSQL logs

## Requirements

- **Node.js** 18+ (for tooling and setup scripts)
- **PHP** 8.1+ (for Laravel API)
- **PostgreSQL** 16+ (database)
- **Composer** (PHP dependencies)
- **Bun** (JavaScript runtime - recommended)

## Configuration

The setup script will prompt you for:
- AI Gateway API Key (required)
- Database credentials
- Application settings

See `apps/api/README.md` for detailed API configuration.

## Troubleshooting

### Setup Mode Selection

**Preview Mode**
- Best for: Testing, demonstrations, production-like environment
- Requirements: Docker Desktop running
- What it does: Starts full containerized stack

**Local Development Mode**  
- Best for: Active development, debugging, code changes
- Requirements: Docker Desktop + PHP + Composer
- What it does: Local API with containerized database

**Environment Only Mode**
- Best for: Custom setups, CI/CD, specific configurations  
- Requirements: None (just creates files)
- What it does: Creates .env files for manual configuration

### Port Conflicts

The setup script automatically handles port conflicts for all modes:

**PostgreSQL Database Ports**
- Checks if port 5433 is available
- Suggests next available port if conflict exists  
- Updates .env files automatically

**Preview Mode Ports**  
- Checks if ports 3000 (web) and 8080 (api) are available
- Uses alternative ports if conflicts detected
- Shows actual URLs with assigned ports

**Manual Port Resolution**

If you need to manually change ports:
```bash
# For PostgreSQL
npm run db:stop
# Edit .env file to change POSTGRES_PORT and DB_PORT
npm run db:start

# For Preview mode
npm run preview:down
# Edit docker-compose.preview.yml or set WEB_PORT/API_PORT env vars
npm run preview
```
