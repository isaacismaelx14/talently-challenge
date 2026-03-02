<?php

namespace App\Http\Requests\JobOffer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'min:30'],
            'location' => ['nullable', 'string', 'max:120'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract'])],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'posted_at' => ['nullable', 'date'],
        ];
    }
}
