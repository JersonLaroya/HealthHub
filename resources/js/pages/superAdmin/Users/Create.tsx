import { useEffect, useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  roles: string[];
  yearLevels: { id: number; name: string }[];
  courses: { id: number; code: string }[];
  offices: { id: number; name: string; code?: string | null }[];
}

export default function Create({ roles, yearLevels, courses, offices }: Props) {
  const { flash } = usePage().props as any;

  const [showPassword, setShowPassword] = useState(false);

  // useEffect(() => {
  //   if (flash?.success) toast.success(flash.success);
  //   if (flash?.error) toast.error(flash.error);
  // }, [flash]);

  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    ismis_id: "",
    //password: "",
    role: "",
    course_id: "",
    year_level_id: "",
    office_id: "",
  });

  const isStudent = data.role === "Student";

  const isFormInvalid =
    !data.first_name ||
    !data.last_name ||
    !data.email ||
    !data.role ||
    (isStudent && (!data.course_id || !data.year_level_id)) ||
    (!isStudent && data.role && !data.office_id);

  return (
    <AppLayout>
      <Head title="Add User" />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add User</h1>

          <Button variant="outline" onClick={() => router.get("/superadmin/users")}>
            Back
          </Button>
        </div>

        <Card className="p-6 space-y-4 w-full max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              post("/superadmin/users", {
                onSuccess: () => {
                  toast.success("User created successfully");
                  reset();
                },
                onError: () => {
                  toast.error("Failed to create user");
                },
              });
            }}
            className="space-y-4"
          >
            {/* ISMIS ID */}
            <div>
              <Label>ISMIS ID</Label>
              <Input
                className="w-full sm:w-64"
                value={data.ismis_id}
                onChange={(e) => setData("ismis_id", e.target.value)}
              />
            </div>

            {/* First name */}
            <div>
              <Label>First name</Label>
              <Input
                className="w-full"
                value={data.first_name}
                onChange={(e) => setData("first_name", e.target.value)}
              />
            </div>

            {/* Middle name */}
            <div>
              <Label>Middle name</Label>
              <Input
                className="w-full"
                value={data.middle_name}
                onChange={(e) => setData("middle_name", e.target.value)}
              />
            </div>

            {/* Last name */}
            <div>
              <Label>Last name</Label>
              <Input
                className="w-full"
                value={data.last_name}
                onChange={(e) => setData("last_name", e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <Input
                className="w-full"
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
            </div>

            {/* Role */}
            <div>
              <Label>Role</Label>
              <Select
                value={data.role}
                onValueChange={(v) => {
                  setData("role", v);
                  setData("course_id", "");
                  setData("year_level_id", "");
                  setData("office_id", "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* STUDENT */}
            {data.role === "Student" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Course</Label>
                  <Select
                    value={data.course_id}
                    onValueChange={(v) => setData("course_id", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Year level</Label>
                  <Select
                    value={data.year_level_id}
                    onValueChange={(v) => setData("year_level_id", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearLevels.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* NON-STUDENT */}
            {data.role && data.role !== "Student" && (
              <div>
                <Label>Office</Label>
                <Select
                  value={data.office_id}
                  onValueChange={(v) => setData("office_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.code ?? o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.get("/superadmin/users")}>
                Cancel
              </Button>

              <Button type="submit" disabled={processing || isFormInvalid}>
              {processing ? "Creating..." : "Create User"}
            </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
