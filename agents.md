# CV Scoring System - Agent Instructions

## Project Overview

A Laravel 9+ backend service for automated CV scoring against job offers. The system uses AI (via Vercel AI Gateway → OpenAI) for criteria generation and CV extraction, with deterministic scoring logic.

**Stack:** Laravel 9+ | PostgreSQL 16 | Queue (Database Driver) | Sanctum Auth | smalot/pdfparser | openai-php/client

---

## MUST Follow

### Architecture

1. **Service Layer Pattern**
   - All business logic lives in `app/Services/`
   - Controllers only handle HTTP concerns (validation, response formatting)
   - Services are injected via interfaces from `app/Contracts/Services/`

2. **Interface-First Design**
   - Every service MUST have a corresponding interface
   - Bind interfaces to implementations in `AppServiceProvider`
   - Never type-hint concrete service classes in constructors

3. **Model Conventions**
   - Use `public_id` (UUID) for external identifiers, never expose `id`
   - Override `getRouteKeyName()` to return `'public_id'`
   - Always use `SoftDeletes` trait on main entities
   - Define `$fillable` explicitly, never use `$guarded = []`

4. **Database Transactions**
   - Wrap multi-model writes in `DB::transaction()`
   - Never rely on implicit transactions

5. **Form Request Validation**
   - All validation in dedicated `app/Http/Requests/` classes
   - Controllers should not contain validation logic

### Code Standards

1. **Language:** All code, comments, commits, and documentation in **English only**
2. **Comments:** Only when adding context that code cannot express. Code must be self-explanatory.
3. **Naming:**
   - Services: `{Domain}Service` (e.g., `ScoringService`)
   - Jobs: `{Action}{Domain}Job` (e.g., `CalculateScoringJob`)
   - Interfaces: `{Domain}ServiceInterface`
   - Requests: `{Action}{Domain}Request` (e.g., `StoreCandidateRequest`)

4. **No Magic Strings**
   - Use constants or enums for status values, types, priorities
   - Define in model classes or dedicated `app/Enums/` directory

### API Design

1. **Versioned Namespace:** `App\Http\Controllers\Api\V1`
2. **RESTful Conventions:**
   - `GET /resources` → index
   - `POST /resources` → store
   - `GET /resources/{id}` → show
   - `PUT/PATCH /resources/{id}` → update
   - `DELETE /resources/{id}` → destroy
3. **Consistent Response Structure:**
   ```json
   {
     "data": { ... },
     "meta": { "pagination": { ... } }
   }
   ```
4. **HTTP Status Codes:**
   - 200: Success
   - 201: Created
   - 202: Accepted (async job dispatched)
   - 400: Bad Request
   - 401: Unauthorized
   - 404: Not Found
   - 422: Validation Error
   - 500: Server Error

### Background Jobs

1. **Always use jobs for:**
   - AI API calls (criteria generation, CV extraction)
   - Scoring calculation
   - Any operation > 5 seconds

2. **Job Configuration:**
   ```php
   public $tries = 3;
   public $backoff = [60, 120, 300];
   public $timeout = 120;
   ```

3. **Error Handling:**
   - Implement `failed()` method to update entity status
   - Log failures with context

4. **Status Tracking:**
   - Entities with async processing must have `status` column
   - Valid statuses: `pending`, `processing`, `completed`, `failed`

### AI Integration

1. **Separation of Concerns:**
   - AI generates/extracts structured data only
   - Scoring logic is deterministic (no AI in scoring calculation)

2. **Structured Output:**
   - Always use `response_format` with `json_schema`
   - Define schemas explicitly, use `strict: true`

3. **Error Handling:**
   - Retry on 429 (rate limit), 5xx (server errors)
   - Fail fast on 4xx (client errors except 429)
   - Always set timeouts on HTTP calls

4. **Caching:**
   - Cache CV extraction by `cv_hash` (SHA-256)
   - Cache criteria per `job_offer_id`
   - Never reprocess identical content

### Testing

1. **Feature Tests Required For:**
   - All API endpoints
   - Job dispatch verification
   - Service methods with complex logic

2. **Mock External Services:**
   - Always mock `AIServiceInterface` in tests
   - Use `Storage::fake()` for file uploads

3. **Test Naming:** `test_{action}_{context}_{expected_result}`

---

## RECOMMENDED

### Code Organization

1. **DTOs for Complex Data**
   - Use Data Transfer Objects for AI responses
   - Located in `app/DTOs/`

2. **Events for Decoupling**
   - Fire events on significant state changes
   - `ScoringCompletedEvent`, `CriteriaGeneratedEvent`

3. **Resources for API Responses**
   - Use `JsonResource` classes for consistent output
   - Located in `app/Http/Resources/`

### Performance

1. **Eager Loading**
   - Always use `with()` to prevent N+1 queries
   - Define `$with` on models for always-loaded relations

2. **Database Indexes**
   - Index all foreign keys
   - Index columns used in `WHERE` clauses
   - Index `status` columns for queue queries

3. **Chunking**
   - Use `chunk()` or `cursor()` for large datasets
   - Never load unbounded collections into memory

### Security

1. **Input Sanitization**
   - Validate file types server-side, not just by extension
   - Limit file sizes explicitly

2. **Rate Limiting**
   - Apply rate limits to expensive endpoints (AI generation)
   - Configure in `RouteServiceProvider`

3. **Authorization**
   - Users can only access their own candidates/scorings
   - Use Policies for authorization logic

### Logging

1. **Structured Logging**
   ```php
   Log::info('Scoring completed', [
       'candidate_id' => $candidate->public_id,
       'job_offer_id' => $jobOffer->public_id,
       'score' => $scoring->total_score,
   ]);
   ```

2. **Log Levels:**
   - `error`: Failures requiring attention
   - `warning`: Degraded service (retries)
   - `info`: Significant business events
   - `debug`: Development only

---

## File Structure Reference

```
apps/api/
├── app/
│   ├── Contracts/
│   │   └── Services/
│   │       ├── AIServiceInterface.php
│   │       ├── CriteriaServiceInterface.php
│   │       ├── CVExtractionServiceInterface.php
│   │       └── ScoringServiceInterface.php
│   ├── DTOs/
│   │   ├── CriteriaDTO.php
│   │   └── ExtractedCVDTO.php
│   ├── Enums/
│   │   ├── CriteriaType.php
│   │   ├── Priority.php
│   │   ├── ScoringResult.php
│   │   └── ProcessingStatus.php
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── CandidateController.php
│   │   │   ├── CriteriaController.php
│   │   │   └── ScoringController.php
│   │   ├── Requests/
│   │   │   ├── Candidate/
│   │   │   │   └── StoreCandidateRequest.php
│   │   │   └── Scoring/
│   │   │       └── CalculateScoringRequest.php
│   │   └── Resources/
│   │       ├── CandidateResource.php
│   │       ├── CriteriaScoringResource.php
│   │       └── ScoringResource.php
│   ├── Jobs/
│   │   ├── CalculateScoringJob.php
│   │   ├── GenerateCriteriaJob.php
│   │   └── ProcessCVJob.php
│   ├── Models/
│   │   ├── Candidate.php
│   │   ├── CandidateScoring.php
│   │   ├── CriteriaScore.php
│   │   ├── JobOffer.php
│   │   ├── SelectionCriteria.php
│   │   └── User.php
│   ├── Services/
│   │   ├── AIService.php
│   │   ├── CriteriaService.php
│   │   ├── CVExtractionService.php
│   │   ├── JobOfferService.php
│   │   └── ScoringService.php
│   └── Providers/
│       └── AppServiceProvider.php
├── config/
│   └── ai.php
├── database/
│   └── migrations/
│       ├── *_create_selection_criteria_table.php
│       ├── *_create_candidates_table.php
│       ├── *_create_candidate_scorings_table.php
│       └── *_create_criteria_scores_table.php
└── tests/
    └── Feature/
        ├── CandidateUploadTest.php
        ├── CriteriaGenerationTest.php
        └── ScoringCalculationTest.php
```

---

## Quick Reference

### Weight Calculation
| Priority | Weight |
|----------|--------|
| high     | 1.0    |
| medium   | 0.6    |
| low      | 0.3    |

### Criteria Types
| Type | Expected Value Format | Evaluation |
|------|----------------------|------------|
| boolean | `{"value": true}` | Exact match |
| years | `{"min": 4}` | >= threshold or proportional |
| enum | `{"level": "B2"}` | Exact or partial match |
| score_1_5 | `{"min": 4}` | Proportional calculation |

### Scoring Result
| Result | Meaning |
|--------|---------|
| match | Full criteria satisfaction |
| partial | Partial satisfaction (enum levels) |
| no_match | Criteria not met |
| unknown | Information not found in CV |

---

## Environment Variables

```bash
# AI Configuration
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1
AI_GATEWAY_API_KEY=
AI_MODEL=openai/gpt-4o

# Queue
QUEUE_CONNECTION=database

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=talently_api
DB_USERNAME=postgres
DB_PASSWORD=
```
