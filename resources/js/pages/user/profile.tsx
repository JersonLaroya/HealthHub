import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

// import DeleteUser from '@/components/delete-user';
// import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { toast } from 'sonner';

import { useEffect, useRef } from 'react';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
    // const { auth } = usePage<SharedData>().props;
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    
    // useEffect(() => {
    //     if (status) {
    //         toast.success(status);
    //     }
    // }, [status]);

    const { auth, offices, courses, years, roles } = usePage<{
        auth: {
            user: {
                id: number;
                first_name?: string;
                middle_name?: string;
                last_name?: string;
                email: string;
                email_verified_at: string | null;
                // office?: string;
                office_id?: number; 
                course_id?: number;
                year?: string;
                user_role?: { id: number; name: string };
                user_role_id?: number;
                year_level_id?: number;
            };
        };
        offices: { id: number; name: string }[];
        courses: { id: number; name: string; office_id: number }[];
        years: { id: number; name: string }[];
        roles: { id: number; name: string }[];
    }>().props;

    const user = auth.user;

   const { data, setData, put, processing, errors } = useForm({
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        email: user.email ?? '',
        office_id: user.office_id ?? null,
        course_id: user.course_id ?? null,
        year_level_id: user.year_level_id ?? null,
        user_role_id: user.user_role_id ?? null,
    });


    const [roleId, setRoleId] = useState(user.user_role_id ?? "");
    const [officeId, setOfficeId] = useState(user.office_id ?? "");
    const [courseId, setCourseId] = useState(user.course_id ?? "");
    const [yearId, setYearId] = useState(user.year_level_id ?? "");

    const roleName = roles.find((r) => r.id === Number(roleId))?.name;

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
                            onSuccess: () => {
                                toast.success("Profile updated successfully");
                            },
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
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
                                        className="mt-1 block w-full"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                {mustVerifyEmail && user.email_verified_at === null && (
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

                                <div className="grid gap-2">
                                    <Label htmlFor="user_role_id">Role</Label>
                                   {roles && roles.length > 0 ? (
                                    <select
                                        defaultValue={Number(data.user_role_id) ?? null}
                                        onChange={(e) => {
                                            const newRoleId = Number(e.target.value);
                                            console.log(newRoleId);
                                            setRoleId(newRoleId)

                                            const roleName = roles.find((r) => r.id === newRoleId)?.name;

                                            // if (roleName === "Student") {
                                            //     setOfficeId("");
                                            // } 
                                            // else {
                                            //     // Staff/Faculty → clear course + year level (not needed)
                                            //     setCourseId("");
                                            //     setYearId("");
                                            // }
                                        }}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                        id='user_role_id'
                                        name='user_role_id'
                                    >
                                        <option value="">-- Select Role --</option>
                                        {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                        ))}
                                    </select>
                                    ) : (
                                    <p className="text-sm text-gray-500">No Role available</p>
                                    )}
                                    {/* <input type="hidden" name="user_role_id" value={data.role_id ?? ""} /> */}
                                    <InputError className="mt-2" message={errors.role_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="office_id">Office</Label>
                                   {offices && offices.length > 0 ? (
                                    <select
                                        defaultValue={data.office_id !== null ? String(data.office_id) : ""}
                                        onChange={(e) => {
                                            const newOffice = e.target.value;
                                            setOfficeId(newOffice);

                                            // reset child fields
                                            // setCourseId("");
                                            // setYearId("");
                                        }}
                                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                        id='office_id'
                                        name='office_id'
                                        required
                                    >
                                        <option value="">-- Select Office --</option>
                                        {offices
                                            .filter((office) => {
                                                // const roleName = roles.find((r) => r.id === Number(data.user_role_id))?.name;
                                                return roleName === "Student"
                                                ? courses.some((course) => course.office_id === office.id)
                                                : true;
                                            })
                                            .map((office) => (
                                        <option key={office.id} value={office.id}>
                                            {office.name}
                                        </option>
                                        ))}
                                    </select>
                                    ) : (
                                    <p className="text-sm text-gray-500">No Office available</p>
                                    )}
                                    {/* <input type="hidden" name="office_id" value={data.office_id ?? ""} /> */}
                                    <InputError className="mt-2" message={errors.office_id} />
                                </div>

                                {roleName === "Student" && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="course_id">Course</Label>
                                            {courses && courses.length > 0 ? (
                                            <select
                                                defaultValue={data.course_id ?? ""}
                                                onChange={(e) => {
                                                const newCourse = e.target.value;
                                                    setCourseId(newCourse);

                                                    // reset year
                                                    // setYearId("");
                                                }}
                                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                                id="course_id"
                                                name='course_id'
                                                required
                                            >
                                                <option value="">-- Select Course --</option>
                                                {courses
                                                .filter((course) => course.office_id === Number(officeId))
                                                .map((course) => (
                                                    <option key={course.id} value={course.id}>
                                                    {course.name}
                                                    </option>
                                                ))}
                                            </select>
                                            ) : (
                                            <p className="text-sm text-gray-500">No courses available</p>
                                            )}
                                            {/* <input type="hidden" name="course_id" value={data.course_id ?? ""} /> */}
                                            <InputError className="mt-2" message={errors.course_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="year_level_id">Year Level</Label>
                                            {years && years.length > 0 ? (
                                                <select
                                                defaultValue={data.year_level_id ?? ""}
                                                onChange={(e) => setYearId(e.target.value)}
                                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                                id="year_level_id"
                                                name='year_level_id'
                                                required
                                                >
                                                <option value="">-- Select Year Level --</option>
                                                {years.map((year) => (
                                                    <option key={year.id} value={year.id}>
                                                    {year.name}
                                                    </option>
                                                ))}
                                                </select>
                                            ) : (
                                                <p className="text-sm text-gray-500">No year levels available</p>
                                            )}
                                            {/* <input type="hidden" name="year_level_id" value={data.year_level_id ?? ""} /> */}
                                            <InputError className="mt-2" message={errors.year_level_id} />
                                        </div>
                                    </>
                                )}


                                {/* <input type="hidden" name="office_id" value={data.office_id ?? ""} /> */}
                                {/* <input type="hidden" name="course_id" value={data.course_id ?? ""} />
                                <input type="hidden" name="year_level_id" value={data.year_level_id ?? ""} />
                                <input type="hidden" name="user_role_id" value={data.user_role_id ?? ""} /> */}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    {/* <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition> */}
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

                                    {/* <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition> */}


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
