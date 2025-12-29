import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {

    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword(p => !p);

    return (
        <AuthLayout title="Log in" description="Sign in to your HealthHub account">
            <Head title="Log in" />

            {/* ✔ FIX: Removed invalid controller import */}
            <Form method="post" className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>

                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                    />

                                    <button
                                        type="button"
                                        onClick={togglePassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center">
                                {canResetPassword && (
                                    <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>

                            <Button type="submit" className="mt-4 w-full" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Log in
                            </Button>
                        </div>

                        <div className="w-full max-w-sm mx-auto mt-0">
                            <div className="flex items-center my-2">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="mx-4 text-gray-400 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            <div className="text-center">
                                <a
                                    href="/auth/google/redirect"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 active:scale-95 transition transform text-gray-700 font-medium"
                                    tabIndex={5}
                                >
                                    <img
                                        src="https://developers.google.com/identity/images/g-logo.png"
                                        alt="Google logo"
                                        className="w-5 h-5"
                                    />
                                    Sign in with Google
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
                Don’t have an account?{' '}
                <TextLink href={register()} tabIndex={6}>
                    Sign up
                </TextLink>
            </div>
        </AuthLayout>
    );
}
