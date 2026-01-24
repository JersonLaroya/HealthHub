import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

import { useEffect, useRef } from 'react';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from 'sonner';

import SignaturePad from "signature_pad";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

import { useForm } from "@inertiajs/react";

function PasswordField({ id, name, placeholder }: { id: string; name: string; placeholder: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="pr-10" 
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);

    const [activeTab, setActiveTab] = useState("draw");
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [isSignatureLoading, setIsSignatureLoading] = useState(false);
    const [signatureError, setSignatureError] = useState(false);

    useEffect(() => {
        if (status) {
            toast.success(status);
        }
    }, [status]);

    useEffect(() => {
    if (activeTab !== "draw") return;

        const canvas = signatureCanvasRef.current;
        if (!canvas) return;

        // wait for tab to render
        requestAnimationFrame(() => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);

            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;

            const ctx = canvas.getContext("2d");
            if (ctx) ctx.scale(ratio, ratio);

            signaturePadRef.current?.off();
            signaturePadRef.current = new SignaturePad(canvas);
        });
    }, [activeTab, signaturePreview]);

    useEffect(() => {
    if (data.signature) {
        setIsSignatureLoading(true);
        setSignaturePreview(data.signature);
    }
    }, []);


    const { auth } = usePage<{ auth: { user: { 
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
        email_verified_at: string | null;
        user_role: { id: number; name: string };
        signature?: string | null;
        // office?: string;
        // course?: string;
        // year?: string;
    } } }>().props;

const user = auth.user;

const { data, setData, put, processing, errors } = useForm({
    first_name: user.first_name || "",
    middle_name: user.middle_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    signature: user.signature || "",
});


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {/* <HeadingSmall title="Profile information" description="Update your name and email address" /> */}
                    <Heading title="Profile information" />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* First Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        defaultValue={data.first_name}
                                        placeholder="First Name"
                                    />
                                    <InputError message={errors.first_name} />
                                    </div>

                                    <div className="grid gap-2">
                                    <Label htmlFor="middle_name">Middle Name</Label>
                                    <Input
                                        id="middle_name"
                                        name="middle_name"
                                        defaultValue={data.middle_name}
                                        placeholder="Middle Name"
                                    />
                                    <InputError message={errors.middle_name} />
                                    </div>

                                    <div className="grid gap-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        defaultValue={data.last_name}
                                        placeholder="Last Name"
                                    />
                                    <InputError message={errors.last_name} />
                                    </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={data.email}
                                        name="email"
                                        required
                                        placeholder="Email address"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Signature */}
                                <div className="grid gap-2">
                                <Label>Signature</Label>

                                {signaturePreview && (
                                    <div className="border rounded p-3 flex flex-col items-center gap-2">
                                        
                                        {/* Loading state */}
                                        {isSignatureLoading && (
                                        <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                                            Loading signature…
                                        </div>
                                        )}

                                        {/* Error state */}
                                        {signatureError && (
                                        <div className="h-24 flex items-center justify-center text-sm text-red-500">
                                            Failed to load signature
                                        </div>
                                        )}

                                        <img
                                        src={signaturePreview}
                                        alt="Signature"
                                        className={`max-h-32 object-contain ${isSignatureLoading ? 'hidden' : ''}`}
                                        onLoad={() => setIsSignatureLoading(false)}
                                        onError={() => {
                                            setIsSignatureLoading(false);
                                            setSignatureError(true);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSignaturePreview(null)}
                                    >
                                        Change signature
                                    </Button>
                                    </div>
                                )}

                                {!signaturePreview && (
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="w-full">
                                        <TabsTrigger value="draw" className="w-1/2">Draw</TabsTrigger>
                                        <TabsTrigger value="upload" className="w-1/2">Upload</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="draw">
                                        <div className="border rounded bg-white">
                                        <canvas
                                            ref={signatureCanvasRef}
                                            className="w-full h-32"
                                            style={{ touchAction: "none" }}
                                        />
                                        </div>

                                        <div className="flex justify-end gap-2 mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => signaturePadRef.current?.clear()}
                                        >
                                            Clear
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                            if (!signaturePadRef.current?.isEmpty()) {
                                                const sig = signaturePadRef.current.toDataURL();
                                                setSignaturePreview(sig);
                                                setData("signature", sig);
                                            }
                                            }}
                                        >
                                            Select
                                        </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="upload">
                                        <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const reader = new FileReader();
                                            reader.onload = () => {
                                            const base64 = reader.result as string;
                                            setSignaturePreview(base64);
                                            setData("signature", base64);
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        />
                                    </TabsContent>
                                    </Tabs>
                                )}
                                </div>

                                <input type="hidden" name="signature" value={data.signature} />

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the verification email.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <Separator className="my-6 lg:hidden" />

                {/* Update Password */}
                <div className="space-y-6">
                    <Heading title="Update password" />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">Current password</Label>
                                    <PasswordField id="current_password" name="current_password" placeholder="Current password" />
                                    {/* <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        type="password"
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    /> */}

                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">New password</Label>
                                    <PasswordField id="password" name="password" placeholder="New password" />
                                    {/* <Input
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        type="password"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="New password"
                                    /> */}

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm password</Label>
                                    <PasswordField id="password_confirmation" name="password_confirmation" placeholder="Confirm password" />
                                    {/* <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                    /> */}

                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save password</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* <DeleteUser /> */}
            </SettingsLayout>
        </AppLayout>
    );
}
