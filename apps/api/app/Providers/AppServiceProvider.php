<?php

namespace App\Providers;

use App\Contracts\Services\JobOfferServiceInterface;
use App\Services\JobOfferService;
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
