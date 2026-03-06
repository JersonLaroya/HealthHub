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
import GuestFooter from "@/components/GuestFooter";

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

                                {errors.auth && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {errors.auth}
                                    </div>
                                )}

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
                                        className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                                        className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        <InputError message={errors.password} />

                                        <button
                                        type="button"
                                        onClick={togglePassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {canResetPassword && (
                                        <div className="flex justify-end">
                                        <TextLink href={request()} className="text-sm">
                                            Forgot password?
                                        </TextLink>
                                        </div>
                                    )}
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
            <GuestFooter />

        </div>
    );
}
