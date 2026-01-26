import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import Heading from '@/components/heading';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Separator } from '@/components/ui/separator';

export default function SuperAdminProfile({ mustVerifyEmail, status }) {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  const { auth } = usePage().props as any;
  const user = auth.user;

  console.log("user role: ", user.user_role);

  useEffect(() => {
    if (status) toast.success(status);
  }, [status]);

  return (
    <AppLayout>
      <Head title="Profile settings" />

      <SettingsLayout>
        {/* PROFILE INFO */}
        <div className="space-y-6">
          <Heading title="Profile information" />

          <Form {...ProfileController.update.form()} className="space-y-6">
            {({ errors, processing }) => (
              <>
                <div className="grid gap-2">
                  <Label>First name</Label>
                  <Input name="first_name" defaultValue={user.first_name} />
                  <InputError message={errors.first_name} />
                </div>

                <div className="grid gap-2">
                  <Label>Middle name</Label>
                  <Input name="middle_name" defaultValue={user.middle_name || ''} />
                </div>

                <div className="grid gap-2">
                  <Label>Last name</Label>
                  <Input name="last_name" defaultValue={user.last_name} />
                  <InputError message={errors.last_name} />
                </div>

                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" name="email" defaultValue={user.email} />
                  <InputError message={errors.email} />
                </div>

                <Button disabled={processing}>Save</Button>
              </>
            )}
          </Form>
        </div>

        <Separator className="my-8" />

        {/* PASSWORD */}
        <div className="space-y-6">
          <Heading title="Update password" />

          <Form {...PasswordController.update.form()}
            options={{
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Profile updated successfully");
                },
            }}
          className="space-y-6">
            {({ errors, processing }) => (
              <>
                <div className="grid gap-2">
                  <Label>Current password</Label>
                  <Input name="current_password" type="password" />
                  <InputError message={errors.current_password} />
                </div>

                <div className="grid gap-2">
                  <Label>New password</Label>
                  <Input name="password" type="password" />
                  <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                  <Label>Confirm password</Label>
                  <Input name="password_confirmation" type="password" />
                </div>

                <Button disabled={processing}>Save password</Button>
              </>
            )}
          </Form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
