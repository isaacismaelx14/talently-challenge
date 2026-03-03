# Talently Challenge - CV Scoring System

A full-stack application for automated CV scoring against job offers using AI-powered analysis.

**Stack:**
- **API**: Laravel 9+ with PostgreSQL, Sanctum auth, and AI integration
- **Web**: React with TypeScript and modern tooling

## Quick Start

### Complete Setup (API + Web)

```bash
# Install all dependencies and setup API environment
npm run setup
```

This will:
1. Install all dependencies (bun install)
2. Run interactive setup (creates both API and root .env files)
3. Install Laravel dependencies 
4. Run database migrations
5. Create default user

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

- `npm run setup` - Complete project setup
- `npm run dev` - Start both API and Web in development
- `npm run build` - Build all applications  
- `npm run test` - Run API tests
- `npm run preview` - Docker preview deployment

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
