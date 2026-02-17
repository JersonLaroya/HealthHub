import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword(p => !p);
    const { system } = usePage().props as any;

    return (
        <div className="min-h-screen flex flex-col bg-blue-50/30">

            {/* MAIN CONTENT */}
            <div className="flex-1">
                <AuthLayout
                    title="Log in"
                    description={`Sign in to your ${system?.app_name || "HealthHub"} account`}
                >
                    <Head title="Log in" />

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
                                                autoComplete="current-password"
                                                placeholder="Password"
                                            />

                                            <button
                                                type="button"
                                                onClick={togglePassword}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword
                                                    ? <EyeOff className="h-5 w-5" />
                                                    : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="
                                            mt-4 w-full
                                            bg-blue-800 hover:bg-blue-700
                                            text-white
                                            shadow-sm
                                            transition-all duration-200
                                            disabled:opacity-70
                                        "
                                    >
                                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Log in
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    {status && (
                        <div className="mb-4 text-center text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}
                </AuthLayout>
            </div>

            {/* FOOTER (same as Welcome) */}
            <footer className="border-t bg-white">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <h3 className="font-semibold text-lg">BISU Candijay Campus</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                University Health Services
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">System</h4>
                            <p className="text-sm text-muted-foreground">
                                {system?.app_name || "HealthHub"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                School Year: {system?.school_year || "—"}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-3">Information</h4>
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} BISU Candijay Campus.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
