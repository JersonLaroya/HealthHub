import { Head, useForm, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

export default function Bulk() {
  const { data, setData, post, processing, errors } = useForm<{
    file: File | null;
    role: string;
    }>({
    file: null,
    role: "",
  });

  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    }, [flash]);

  return (
    <AppLayout>
      <Head title="Bulk Add Users" />

      <div className="p-6 max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bulk Add Users</h1>

          <Button variant="outline" onClick={() => router.get("/superadmin/users")}>
            Back
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              post("/superadmin/users/bulk", {
                forceFormData: true,
                onSuccess: () => toast.success("Users imported successfully"),
                onError: () => toast.error("Import failed"),
              });
            }}
            className="space-y-4"
          >

            <div>
                <Label>Role</Label>
                <Select value={data.role} onValueChange={(v) => setData("role", v)}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Nurse">Nurse</SelectItem>
                    </SelectContent>
                </Select>

                {errors.role && (
                    <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                )}
            </div>

            <div>
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setData("file", e.target.files?.[0] || null)}
              />
              {errors.file && (
                <p className="text-sm text-red-500 mt-1">{errors.file}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p className="font-medium">Sample format (CSV):</p>

                <a href="/storage/samples/bulk-users-sample.csv" download>
                    <Button type="button" variant="outline" className="flex items-center gap-2">
                        Download sample CSV
                    </Button>
                </a>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.get("/superadmin/users")}>
                Cancel
              </Button>

              <Button type="submit" disabled={processing}>
                {processing ? "Uploading..." : "Upload CSV"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
