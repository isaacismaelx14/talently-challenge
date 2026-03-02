<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateDefaultUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-default-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a default user for local testing';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $email = 'test@example.local';
        $password = 'admin';

        $user = User::where('email', $email)->first();

        if ($user) {
            $this->info("User with email {$email} already exists.");
            return Command::SUCCESS;
        }

        User::create([
            'name' => 'Admin User',
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $this->info("Default user created successfully. Email: {$email}, Password: {$password}");

        return Command::SUCCESS;
    }
}
