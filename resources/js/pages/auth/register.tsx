import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController'
import { login } from '@/routes'
import { Form, Head } from '@inertiajs/react'
import { LoaderCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import InputError from '@/components/input-error'
import TextLink from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AuthLayout from '@/layouts/auth-layout'

export default function Register({ userRoles, offices }: { userRoles: Array<{id: number, name: string}>, offices: Array<{id: number, name: string}> }) {

    const [showPassword, setShowPassword] = useState(false)

    return (
        <AuthLayout title="Register" description="Create your HealthHub account">
            <Head title="Register" />
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* User Role */}
                            <div className="grid gap-2">
                                <Label htmlFor="user_role_id">Register As</Label>
                                <Select name="user_role_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userRoles.map((role) => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        {role.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <InputError message={errors.user_role_id} />
                            </div>

                            {/* Office */}
                            <div className="grid gap-2">
                                <Label htmlFor="office_id">Office</Label>
                                <Select name="office_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select office" />
                                </SelectTrigger>
                                <SelectContent>
                                    {offices.map((office) => (
                                    <SelectItem key={office.id} value={String(office.id)}>
                                        {office.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <InputError message={errors.office_id} />
                            </div>

                            {/* First Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                id="first_name"
                                type="text"
                                required
                                autoComplete="given-name"
                                name="first_name"
                                placeholder="First Name"
                                />
                                <InputError message={errors.first_name} />
                            </div>

                            {/* Middle Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input
                                id="middle_name"
                                type="text"
                                autoComplete="additional-name"
                                name="middle_name"
                                placeholder="Middle Name (optional)"
                                />
                                <InputError message={errors.middle_name} />
                            </div>

                            {/* Last Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                id="last_name"
                                type="text"
                                required
                                autoComplete="family-name"
                                name="last_name"
                                placeholder="Last Name"
                                />
                                <InputError message={errors.last_name} />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                name="email"
                                placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password with toggle */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                    ) : (
                                    <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Submit */}
                            <Button type="submit" className="mt-2 w-full">
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Create account
                            </Button>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()}>Log in</TextLink>
                            </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
