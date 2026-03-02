<?php

return [
    'base_url' => env('AI_GATEWAY_BASE_URL'),
    'api_key' => env('AI_GATEWAY_API_KEY'),
    'model' => env('AI_MODEL', 'openai/gpt-4o'),
];
