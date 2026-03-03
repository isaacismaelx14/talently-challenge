# CV Scoring System - AI Quickstart Prompt

Copy and paste the block below into any AI assistant (ChatGPT, Claude, Gemini, Copilot Chat, etc.) to get guided through running this CV scoring platform from scratch.

> **Before you paste:** the repo must already be cloned on your machine.
> - **Code assistants** (Copilot, Cursor, etc.) — run commands directly in the integrated terminal from the workspace root.
> - **Chat assistants** (ChatGPT, Claude, etc.) — the AI will instruct you to run each command in your terminal from the repo root.

---

```
I want to run a full-stack CV Scoring System locally using Docker.
Help me execute each step, diagnose any errors, and confirm everything is working.

## Project overview
- Laravel 9+ backend with AI-powered CV analysis (via Vercel AI Gateway → OpenAI GPT-4o)  
- React 18 frontend with TypeScript for candidate management
- PostgreSQL database with queue system for background AI processing
- Everything runs via Docker Compose — no local PHP or Node installation required
- Uses Vercel AI Gateway for criteria generation and CV text extraction

## Prerequisites to verify first
1. Docker Desktop is installed and running (`docker info`)
2. Either `bun` (https://bun.sh/docs/installation) OR `npm` / `node` is available
3. A Vercel AI Gateway API key (get one from https://vercel.com/docs/ai-gateway)

## Steps to run

### Step 1 — Get Vercel AI Gateway API Key
- Visit https://vercel.com/docs/ai-gateway
- Create account, add credit card (get $5 free credits)
- Create AI Gateway and copy your API key
- Keep this key handy for the setup process

### Step 2 — Install dependencies and run setup
If bun is installed:
  bun setup
Otherwise:
  npm run setup

This launches an interactive setup with 3 options:
1. **Preview Mode** (recommended) - Full Docker stack  
2. **Local Development** - PostgreSQL + local servers
3. **Environment Only** - Just create .env files

Choose **Preview Mode** for the quickest experience.

### Step 3 — Provide your AI Gateway key
**Option A: Direct flag (recommended)**
```bash
bun setup --api-key="vg_your_api_key_here"
```
This skips the interactive prompt and goes straight to setup.

**Option B: Interactive prompt**  
If you prefer not to provide the API key in the command, simply run `bun setup`, select option 1 (Preview Mode), and you'll be prompted to enter your key during the setup process.

During setup, you may also be prompted for:
- Database settings (use defaults)
- Port configuration (use auto-detected ports)

### Step 4 — Wait for Docker build
First build takes ~3-5 minutes due to:
- Laravel dependencies installation
- React build process  
- PostgreSQL initialization
- Database migrations

### Step 5 — Verify services are running
- Web UI   → http://localhost:3000 (or the port shown in setup)
- API      → http://localhost:8080/v1 (or the port shown in setup)  
- API docs → http://localhost:8080/api/documentation

### Step 6 — Test the application
Login credentials (created during setup):
- **Email**: test@example.local
- **Password**: admin

Try these features:
1. **Create Job Offer** - Upload a job description, AI generates scoring criteria
2. **Upload CV** - Upload a PDF CV, AI extracts candidate information  
3. **Run Scoring** - System calculates compatibility score between CV and job requirements
4. **View Results** - See detailed scoring breakdown with explanations

### Troubleshooting common issues

**Port conflicts:**
- The setup script auto-detects port conflicts and suggests alternatives
- If ports are still busy, manually edit .env and docker-compose.preview.yml

**AI Gateway errors:**
- Verify your API key is correct and has credits remaining
- Check https://vercel.com/dashboard for usage and billing

**Docker issues:**  
- Ensure Docker Desktop is running and has sufficient resources
- Try `docker system prune` to clean up if builds fail

**Database connection issues:**
- Wait for PostgreSQL to fully initialize (check logs with `bun preview:logs`)
- Migrations run automatically, but may take 30-60 seconds

### Stop the application
bun preview:down

### Reset everything
bun preview:down
docker system prune -f
bun setup  # Start fresh
```

---

**Next steps after successful setup:**
1. Explore the codebase architecture in `apps/api/` (Laravel service layer pattern)
2. Check the React frontend in `apps/web/src/`  
3. Review the scoring algorithm in the API documentation
4. Test different CV formats and job descriptions to see AI-powered extraction in action