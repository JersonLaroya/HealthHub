<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\UserRole;
use App\Models\Office;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;
    
    // Static variables to cache default IDs
    protected static ?int $defaultUserRoleId = null;
    protected static ?int $defaultOfficeId = null;

    public function definition(): array
    {
        // Only query DB the first time
        if (static::$defaultUserRoleId === null) {
            $defaultUserRole = UserRole::where('name', 'Student')->first();
            static::$defaultUserRoleId = $defaultUserRole?->id;
        }

        if (static::$defaultOfficeId === null) {
            $defaultOffice = Office::where('name', 'None')->first();
            static::$defaultOfficeId = $defaultOffice?->id;
        }

        return [
            'name' => fake()->name(),
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional()->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'user_role_id' => static::$defaultUserRoleId,
            'office_id' => static::$defaultOfficeId,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
