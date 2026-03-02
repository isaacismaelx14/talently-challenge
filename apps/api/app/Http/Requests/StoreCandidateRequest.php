<?php

namespace App\Http\Requests;

use App\Models\JobOffer;
use Illuminate\Foundation\Http\FormRequest;

class StoreCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $jobOffer = JobOffer::where('public_id', $this->job_offer_id)->first();

        if (!$jobOffer) {
            return false;
        }

        return $this->user()->id === $jobOffer->created_by;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'cv' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:10240'],
            'job_offer_id' => ['required', 'string', 'uuid', 'exists:job_offers,public_id'],
        ];
    }
}
