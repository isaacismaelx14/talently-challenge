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

    private const HTTP_TIMEOUT = 60;

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
            $response = $this->client->chat()->create([
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Extract selection criteria from the job description.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $jobDescription,
                    ],
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
                                                'additionalProperties' => false
                                            ]
                                        ],
                                        'required' => ['key', 'label', 'type', 'required', 'priority', 'expected_value'],
                                        'additionalProperties' => false
                                    ]
                                ]
                            ],
                            'required' => ['criteria'],
                            'additionalProperties' => false
                        ]
                    ]
                ]
            ]);

            $result = json_decode($response->choices[0]->message->content, true);
            return $result['criteria'] ?? [];
        });
    }

    public function extractCVData(string $cvText, array $criteria): array
    {
        return $this->retryWithBackoff(function () use ($cvText, $criteria) {
            $response = $this->client->chat()->create([
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Extract CV data according to the job criteria.',
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode(['cv_text' => $cvText, 'criteria' => $criteria]),
                    ],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'cv_extraction',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'skills' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string']
                                ],
                                'experience' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'title' => ['type' => 'string'],
                                            'company' => ['type' => 'string'],
                                            'years' => ['type' => 'number']
                                        ],
                                        'required' => ['title', 'company', 'years'],
                                        'additionalProperties' => false
                                    ]
                                ],
                                'education' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'degree' => ['type' => 'string'],
                                            'institution' => ['type' => 'string']
                                        ],
                                        'required' => ['degree', 'institution'],
                                        'additionalProperties' => false
                                    ]
                                ],
                                'languages' => [
                                    'type' => 'array',
                                    'items' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'language' => ['type' => 'string'],
                                            'level' => ['type' => 'string']
                                        ],
                                        'required' => ['language', 'level'],
                                        'additionalProperties' => false
                                    ]
                                ]
                            ],
                            'required' => ['skills', 'experience', 'education', 'languages'],
                            'additionalProperties' => false
                        ]
                    ]
                ]
            ]);

            return json_decode($response->choices[0]->message->content, true);
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

                // Exponential backoff: 2s, 4s, 8s (or whatever is desired, using a simplified one here)
                sleep(pow(2, $attempt));
            }
        }
    }
}
