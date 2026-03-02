<?php

namespace App\Providers;

use App\Contracts\Services\JobOfferServiceInterface;
use App\Services\JobOfferService;
use App\Contracts\Services\AIServiceInterface;
use App\Services\AIService;
use App\Contracts\Services\CriteriaServiceInterface;
use App\Services\CriteriaService;
use App\Contracts\Services\CVExtractionServiceInterface;
use App\Services\CVExtractionService;
use App\Contracts\Services\ScoringServiceInterface;
use App\Services\ScoringService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(JobOfferServiceInterface::class, JobOfferService::class);
        $this->app->bind(AIServiceInterface::class, AIService::class);
        $this->app->bind(CriteriaServiceInterface::class, CriteriaService::class);
        $this->app->bind(CVExtractionServiceInterface::class, CVExtractionService::class);
        $this->app->bind(ScoringServiceInterface::class, ScoringService::class);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
