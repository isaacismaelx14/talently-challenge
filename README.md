# CV Scoring System

A full-stack automated CV scoring platform built for precise candidate evaluation against job requirements. The system uses AI-powered criteria generation and CV extraction with deterministic scoring algorithms to provide objective candidate assessments.

> Built by [isaacismaelx14](https://github.com/isaacismaelx14) with love ♥

[![AI Quickstart Prompt](https://img.shields.io/static/v1?label=AI+Quickstart&message=Open+Prompt+%E2%86%92&color=6366f1&style=for-the-badge&logo=openai&logoColor=white)](./docs/quickstart-prompt.md)

## 🔑 Test Credentials

After setup, you can log in with:
- **Email**: `test@example.local`  
- **Password**: `admin`

---

## Table of Contents

- [Stack](#stack)
- [Prerequisites — AI Gateway Setup](#prerequisites--ai-gateway-setup)
- [Quickstart — Docker (preferred)](#quickstart--docker-preferred)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Root Scripts Reference](#root-scripts-reference)
- [API Highlights](#api-highlights)
- [Frontend Highlights](#frontend-highlights)
- [Notes on AI Usage](#notes-on-ai-usage)

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | **Bun** + Turborepo monorepo |
| API | Laravel 9+ · PHP 8.2+ · PostgreSQL 16 · Sanctum Auth |
| Packages | smalot/pdfparser · openai-php/client · Queue (Database Driver) |
| Web | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| AI | Vercel AI Gateway → OpenAI GPT-4o |
| Containers | Docker · docker-compose |

---

## Prerequisites — AI Gateway Setup

Before running this project, you need a **Vercel AI Gateway API Key** for the AI-powered features:

1. Visit **[Vercel AI Gateway](https://vercel.com/docs/ai-gateway)**
2. Create an account or sign in
3. Set up a credit card (you get **$5 free credits**)
4. Create an API Gateway and copy your API key
5. You'll use this key in the setup process below

> **Note:** The AI Gateway is used for criteria generation from job descriptions and CV text extraction. Without it, the scoring features won't work.

---

## Quickstart — Docker (preferred)

The fastest way to run everything together. Builds both images and wires them up with PostgreSQL.

```bash
# 1. Install dependencies and run interactive setup
bun setup                     # This creates .env files and prompts for setup mode

# 2. When prompted during setup, choose "Preview Mode"
# You'll be asked for your Vercel AI Gateway API key

# Web UI  →  http://localhost:3000
# API     →  http://localhost:8080/v1
# API docs → http://localhost:8080/api/documentation
```

To stop:

```bash
bun preview:down
```

> **No Bun?** `npm run setup` and `npm run preview:down` work without installing Bun. If you want Bun: [https://bun.sh/docs/installation](https://bun.sh/docs/installation)

> **How it works:** The setup script offers three modes: Preview (full Docker), Local Development (DB + dependencies), or Environment Only. Choose Preview for the quickest demo experience.

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [PHP](https://www.php.net) ≥ 8.2 with extensions: `pdo_pgsql`, `gd`, `zip`, `mbstring`
- [Composer](https://getcomposer.org) ≥ 2.0
- [Docker](https://www.docker.com) (for PostgreSQL)

### 1. Install dependencies

```bash
bun install          # JS/TS workspace deps
cd apps/api && composer install    # PHP deps
```

### 2. Configure environment & setup database

```bash
bun setup            # Interactive setup - choose "Local Development"
```

This will:
- Create `.env` files for both API and web
- Prompt for your Vercel AI Gateway API key  
- Start PostgreSQL in Docker
- Run database migrations
- Create test user account

Key environment variables:

| Variable | Default | Description |
|---|---|---|
| `AI_GATEWAY_API_KEY` | (required) | Your Vercel AI Gateway API key |
| `AI_GATEWAY_BASE_URL` | `https://ai-gateway.vercel.sh/v1` | Vercel AI Gateway endpoint |
| `AI_MODEL` | `openai/gpt-4o` | AI model for criteria generation and CV extraction |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port (auto-detected, may vary) |

### 3. Run API + Web

```bash
# In separate terminals:
bun dev:api     # Laravel on http://localhost:8000 (auto-reload)
bun dev:web     # Vite on http://localhost:5173 (HMR)

# Or run both together:
bun dev
```

---

## Project Structure

```
talently-challenge/
├── apps/
│   ├── api/           # Laravel 9+ backend — CV scoring engine
│   │   ├── app/
│   │   │   ├── Contracts/Services/      # Service interfaces
│   │   │   ├── Http/Controllers/Api/V1/ # RESTful API endpoints
│   │   │   ├── Http/Requests/          # Form validation
│   │   │   ├── Jobs/                   # Background job processing
│   │   │   ├── Models/                 # Eloquent models
│   │   │   └── Services/               # Business logic layer
│   │   ├── database/migrations/        # Database schema
│   │   └── tests/                      # API tests
│   └── web/           # React frontend — CV scoring dashboard
│       ├── src/
│       │   ├── features/              # Feature-based organization
│       │   ├── components/            # Reusable UI components
│       │   └── api/                   # API client
│       └── tests/                     # Frontend tests
├── docker-compose.preview.yml         # Full preview (postgres + api + web)
└── docs/                              # Documentation and guides
```

---

## Root Scripts Reference

```bash
bun setup        # Interactive setup with mode selection (recommended)
bun setup:api    # API-only setup
bun dev          # Run API + Web in development mode
bun dev:api      # Laravel development server
bun dev:web      # Vite development server  
bun build        # Build all workspaces
bun test         # Run API tests
bun preview      # docker-compose up (full preview)
bun preview:down # Stop preview containers
bun db:start     # Start PostgreSQL only
bun db:stop      # Stop PostgreSQL
```

---

## API Highlights

- **AI-Powered Criteria Generation** — Automatically extracts scoring criteria from job descriptions using GPT-4o
- **CV Text Extraction** — PDF parsing and AI-enhanced extraction for structured candidate data
- **Deterministic Scoring** — Transparent, rule-based scoring algorithm (no AI bias in final scores)
- **Async Processing** — Background jobs for AI operations with status tracking
- **Service Layer Architecture** — Clean separation of concerns with interface contracts
- **Sanctum Authentication** — Token-based API authentication
- **Queue System** — Database-driven job queue for scalable processing
- **RESTful API** — Versioned endpoints (`/v1`) following REST conventions
- **Structured Validation** — Form request classes for all input validation

### Scoring Algorithm

| Criteria Type | Weight Calculation | Evaluation Method |
|---|---|---|
| `boolean` | High: 1.0, Medium: 0.6, Low: 0.3 | Exact match |
| `years` | Based on priority level | `>= threshold` or proportional |
| `enum` | Weighted by priority | Exact or partial match |
| `score_1_5` | Priority-weighted | Proportional calculation |

---

## Frontend Highlights

- **shadcn/ui + Tailwind CSS** — Modern, accessible component library for rapid UI development
- **CV Upload & Management** — Drag-and-drop PDF upload with progress tracking
- **Real-time Scoring** — Live updates as scoring jobs complete in the background
- **Job Offer Management** — Create and manage job requirements with AI-generated criteria
- **Scoring Dashboard** — Detailed scoring breakdowns with criteria explanations
- **Authentication Flow** — Secure login with Sanctum tokens
- **TypeScript** — Full type safety across the application

> **Note:** The frontend was primarily built with AI assistance to focus development time on the core backend scoring logic and architecture.

---

## Notes on AI Usage

This project strategically leveraged AI assistance across different components:

### **API (Core Logic + AI Refactoring)**
- **Hand-built foundation** — All core scoring logic, architecture patterns, and business rules were designed and implemented by hand
- **AI-enhanced optimization** — Used AI to refactor code for Laravel best practices, optimize database queries, and improve code organization
- **Reviewed implementation** — Every AI suggestion was manually reviewed and tested to ensure correctness and maintainability

### **Setup Script (90% AI Generated)**
- **Interactive setup automation** — The `apps/api/setup.js` script was primarily generated by AI with manual review
- **Port conflict resolution** — Intelligent Docker port management and environment configuration
- **Multi-mode setup** — Preview, Local Development, and Environment-only modes

### **Frontend (AI-First Approach)**  
- **Rapid prototyping** — Since this is a backend-focused challenge, the entire React frontend was built with AI assistance
- **Component generation** — UI components, forms, and layout generated using shadcn/ui patterns
- **Minor manual adjustments** — Visual tweaks and integration fixes (authentication flow still has some spacing issues that could be polished)

### **Docker Optimization**
- **Image size optimization** — Used AI to optimize Dockerfiles for minimal image sizes
- **Multi-stage builds** — Efficient build processes for both API and web containers

### **What Remains Human-Crafted**
- **System architecture** — Service layer pattern, interface design, and overall application structure
- **Scoring algorithms** — All mathematical calculations and business logic for CV evaluation  
- **Database design** — Schema design, relationships, and migration strategy
- **Algorithm validation** — Comprehensive testing of scoring edge cases and criteria evaluation

The AI was used as a powerful **code generation and optimization tool**, but all **critical business logic and architectural decisions** were made by human judgment to ensure the system is robust, maintainable, and meets the specific requirements of a production CV scoring platform.

---

*Created by [isaacismaelx14](https://github.com/isaacismaelx14) with love ♥*