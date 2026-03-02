<?php

namespace App\Services;

use App\Contracts\Services\AIServiceInterface;
use Exception;
use Illuminate\Support\Facades\Log;
use OpenAI;

class AIService implements AIServiceInterface
{
    protected \OpenAI\Client $client;
    protected string $model;

    private const HTTP_TIMEOUT = 90;

    public function __construct()
    {
        $this->client = OpenAI::factory()
            ->withBaseUri(config('ai.base_url', 'https://api.openai.com/v1'))
            ->withApiKey(config('ai.api_key'))
            ->withHttpClient(new \GuzzleHttp\Client(['timeout' => self::HTTP_TIMEOUT]))
            ->make();

        $this->model = config('ai.model', 'gpt-4o');
    }

    public function generateCriteria(string $jobDescription): array
    {
        return $this->retryWithBackoff(function () use ($jobDescription) {
            $systemPrompt = <<<'PROMPT'
You are an expert technical recruiter. Analyze the job description and extract structured selection criteria that can be used to score candidates.

RULES:
1. Distinguish between REQUIRED criteria (explicitly stated as requirements or "must have") and OPTIONAL criteria (nice-to-have, preferred, bonus).
2. Set priority correctly:
   - "high": Explicitly required skills/experience with specific thresholds (e.g., "4+ years React")
   - "medium": Preferred/encouraged qualifications, or required skills without specific thresholds
   - "low": Nice-to-have, bonus, or contextual qualifications
3. Choose the right type for each criterion:
   - "years": When the job specifies a number of years of experience (e.g., "4+ years production React"). Set expected_value.min to the number.
   - "boolean": For skill/technology presence checks WITHOUT a years threshold (e.g., "Strong TypeScript skills", "Proficiency with Tailwind CSS"). Set expected_value.value to true.
   - "enum": For proficiency levels (e.g., language fluency: B2, C1). Set expected_value.level to the expected level.
   - "score_1_5": For subjective/holistic assessments that require judgment (e.g., "leadership ability"). Set expected_value.min to the minimum acceptable score.
4. DO NOT over-fragment: "4+ years production React experience with hooks, context, and rendering optimization" = ONE criterion of type "years" with min=4, NOT separate criteria for hooks/context/optimization.
5. Generate stable snake_case keys (e.g., "react_experience_years", "typescript_skills", "nextjs_experience").
6. Labels should be clear, human-readable descriptions.
7. Include ALL criteria from the job description, both required and nice-to-have sections.
8. For compound requirements like "Solid Next.js experience (App Router, server components, API routes)", create ONE criterion that captures the main requirement.
PROMPT;

            $response = $this->client->chat()->create([
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $jobDescription],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'selection_criteria',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'criteria' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'key' => ['type' => 'string'],
                                            'label' => ['type' => 'string'],
                                            'type' => ['type' => 'string', 'enum' => ['boolean', 'years', 'enum', 'score_1_5']],
                                            'required' => ['type' => 'boolean'],
                                            'priority' => ['type' => 'string', 'enum' => ['high', 'medium', 'low']],
                                            'expected_value' => [
                                                'type' => ['object', 'null'],
                                                'properties' => [
                                                    'min' => ['type' => ['integer', 'null']],
                                                    'value' => ['type' => ['boolean', 'null']],
                                                    'level' => ['type' => ['string', 'null']],
                                                ],
                                                'required' => ['min', 'value', 'level'],
                                                'additionalProperties' => false,
                                            ],
                                        ],
                                        'required' => ['key', 'label', 'type', 'required', 'priority', 'expected_value'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                            ],
                            'required' => ['criteria'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
            ]);

            $result = json_decode($response->choices[0]->message->content, true);
            return $result['criteria'] ?? [];
        });
    }

    public function extractCVData(string $cvText): array
    {
        return $this->retryWithBackoff(function () use ($cvText) {
            $currentDate = now()->format('F Y');
            $systemPrompt = <<<PROMPT
You are an expert CV/resume parser. Extract structured data from the CV text provided.

CRITICAL RULES FOR EXPERIENCE DURATION:
1. Calculate each position's duration precisely from start and end dates. Today's date is {$currentDate}.
2. If a role says "Present" or "Current", calculate from the start date to today ({$currentDate}).
3. Calculate years as a decimal (e.g., "Apr 2022 - Apr 2024" = 2.0 years, "May 2025 - {$currentDate}" = calculate actual months).
4. For total_years_experience: calculate from the EARLIEST start date across all positions to today, accounting for overlapping roles (do not double-count overlapping periods). This represents total professional career span.

TECHNOLOGY EXPERIENCE AGGREGATION:
5. For technology_experience: For each technology/skill, sum up the duration across ALL roles where that technology was used. A technology is "used" in a role if:
   - It appears in the "Tools:" section for that role
   - It is mentioned in the job descriptions/bullet points for that role
   - It can be reasonably inferred from the work described (e.g., building React UIs implies React, JSX, component architecture)
6. Technologies should be specific: "React", "Next.js", "TypeScript", "Python", "Node.js", "Tailwind CSS", etc.
7. Round years to 1 decimal place.

SKILLS EXTRACTION:
8. List ALL technologies, frameworks, tools, and methodologies mentioned or inferable from the CV.
9. Include soft skills only if explicitly highlighted.

EXPERIENCE ENTRIES:
10. Include start_date and end_date as written in the CV (e.g., "May 2025", "Apr 2022").
11. List technologies used per role in the technologies array.
PROMPT;

            $response = $this->client->chat()->create([
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $cvText],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'cv_extraction',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'total_years_experience' => ['type' => 'number'],
                                'skills' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                ],
                                'technology_experience' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'technology' => ['type' => 'string'],
                                            'years' => ['type' => 'number'],
                                        ],
                                        'required' => ['technology', 'years'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                                'experience' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'title' => ['type' => 'string'],
                                            'company' => ['type' => 'string'],
                                            'start_date' => ['type' => 'string'],
                                            'end_date' => ['type' => 'string'],
                                            'years' => ['type' => 'number'],
                                            'technologies' => [
                                                'type' => 'array',
                                                'items' => ['type' => 'string'],
                                            ],
                                        ],
                                        'required' => ['title', 'company', 'start_date', 'end_date', 'years', 'technologies'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                                'education' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'degree' => ['type' => 'string'],
                                            'institution' => ['type' => 'string'],
                                            'year' => ['type' => 'string'],
                                        ],
                                        'required' => ['degree', 'institution', 'year'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                                'languages' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'language' => ['type' => 'string'],
                                            'level' => ['type' => 'string'],
                                        ],
                                        'required' => ['language', 'level'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                            ],
                            'required' => ['total_years_experience', 'skills', 'technology_experience', 'experience', 'education', 'languages'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
            ]);

            return json_decode($response->choices[0]->message->content, true);
        });
    }

    public function evaluateCVAgainstCriteria(string $cvText, array $extractedData, array $criteria): array
    {
        return $this->retryWithBackoff(function () use ($cvText, $extractedData, $criteria) {
            $currentDate = now()->format('F Y');
            $systemPrompt = <<<PROMPT
You are an expert technical recruiter evaluator. Given a candidate's CV text, their pre-extracted structured data, and a list of selection criteria from a job offer, evaluate how well the candidate meets EACH criterion.

Today's date is {$currentDate}.

EVALUATION RULES BY TYPE:

**"years" type** (expected_value has "min"):
- Cross-reference the technology across ALL positions in the CV, not just one role.
- If React appears in Tools for 3 consecutive jobs spanning Apr 2022 to Present, that's ~3.8 years of React experience, NOT just the duration of one job.
- Use the technology_experience data from extracted data as reference, but also verify against the raw CV.
- Score: if candidate_years >= expected_min → score=1.0 (match). If candidate_years > 0 but < expected_min → score=candidate_years/expected_min (partial). If 0 → score=0.0 (no_match).
- Evidence MUST state the calculated years and how you arrived at the number.

**"boolean" type** (expected_value has "value": true):
- DO NOT just look for exact keyword mentions. Analyze the full CV context.
- If a criterion asks "Ability to Implement Complex Layouts" and the CV shows the candidate built dashboards, reporting systems, admin interfaces, and e-commerce UIs — that strongly implies complex layout ability even if not stated verbatim.
- For inferred matches: result="match", score=0.7-0.9, confidence=0.6-0.8. Explain your reasoning in evidence.
- For explicit matches: result="match", score=1.0, confidence=1.0.
- For weak/speculative inferences: result="partial", score=0.3-0.6, confidence=0.4-0.6.
- Only return "unknown" with score=0.0 when there is genuinely ZERO signal in the entire CV.

**"enum" type** (expected_value has "level"):
- Match levels contextually. If the criterion asks for B2 English and the CV says "Fluent", that's equivalent or better → match.
- Use common level hierarchies (A1 < A2 < B1 < B2 < C1 < C2, or Beginner < Intermediate < Advanced < Fluent < Native).

**"score_1_5" type** (expected_value has "min"):
- Assess holistically based on all available evidence. Score 1-5 scale.
- Score = assessed_value / 5.0.

GENERAL RULES:
- NEVER return "unknown" if there's any reasonable inference possible from the CV content. Use "partial" with lower confidence instead.
- Confidence represents how certain you are about your assessment (0.0 to 1.0).
- Evidence must be a clear, specific explanation referencing actual CV content.
- Return one evaluation per criterion, keyed by criteria_key.
PROMPT;

            $userContent = json_encode([
                'cv_text' => $cvText,
                'extracted_data' => $extractedData,
                'criteria' => $criteria,
            ], JSON_UNESCAPED_UNICODE);

            $response = $this->client->chat()->create([
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'cv_evaluation',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'evaluations' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'criteria_key' => ['type' => 'string'],
                                            'result' => ['type' => 'string', 'enum' => ['match', 'partial', 'no_match', 'unknown']],
                                            'score' => ['type' => 'number'],
                                            'evidence' => ['type' => 'string'],
                                            'confidence' => ['type' => 'number'],
                                        ],
                                        'required' => ['criteria_key', 'result', 'score', 'evidence', 'confidence'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                            ],
                            'required' => ['evaluations'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
            ]);

            $result = json_decode($response->choices[0]->message->content, true);
            return $result['evaluations'] ?? [];
        });
    }

    protected function retryWithBackoff(callable $callback, int $maxRetries = 3)
    {
        $attempt = 0;

        while ($attempt < $maxRetries) {
            try {
                return $callback();
            } catch (Exception $e) {
                $attempt++;
                Log::warning("AI Request failed (attempt $attempt): " . $e->getMessage());

                if ($attempt >= $maxRetries) {
                    throw $e;
                }

                sleep(pow(2, $attempt));
            }
        }
    }
}
