import { useForm, usePage, Head } from "@inertiajs/react";
import { useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export default function Index({ settings }: any) {

  const { data, setData, post, processing } = useForm({
    app_name: settings?.app_name || "",
    school_year: settings?.school_year || "",
    app_logo: null as File | null,
    clinic_logo: null as File | null,
  });

  const [previewKey, setPreviewKey] = useState(Date.now());
  const [appLogoPreview, setAppLogoPreview] = useState<string | null>(
    settings?.app_logo ? `/storage/${settings.app_logo}` : null
  );

  const [clinicLogoPreview, setClinicLogoPreview] = useState<string | null>(
    settings?.clinic_logo ? `/storage/${settings.clinic_logo}` : null
  );

  function revokeIfBlob(url: string | null) {
    if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
    }


  return (
    <AppLayout>
      <Head title="System Settings" />

      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">System Settings</h1>

        <Card className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post("/superadmin/settings", {
                forceFormData: true,
                onSuccess: (page) => {
                toast.success("System settings updated successfully");

                const newSettings = (page.props as any).settings;

                revokeIfBlob(appLogoPreview);
                revokeIfBlob(clinicLogoPreview);

                setAppLogoPreview(
                    newSettings?.app_logo ? `/storage/${newSettings.app_logo}` : null
                );

                setClinicLogoPreview(
                    newSettings?.clinic_logo ? `/storage/${newSettings.clinic_logo}` : null
                );
                },
                onError: () => {
                    toast.error("Failed to update system settings");
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label>App name</Label>
              <Input
                value={data.app_name}
                onChange={(e) => setData("app_name", e.target.value)}
              />
            </div>

            <div>
              <Label>School year</Label>
              <Input
                placeholder="2025 - 2026"
                value={data.school_year}
                onChange={(e) => setData("school_year", e.target.value)}
              />
            </div>

            <div>
              <Label>App logo</Label>

              {appLogoPreview && (
                <img
                    src={appLogoPreview}
                    alt="App logo"
                    className="h-20 object-contain border rounded-md p-2 bg-white"
                />
                )}

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setData("app_logo", file);

                    if (file) {
                    revokeIfBlob(appLogoPreview);
                    setAppLogoPreview(URL.createObjectURL(file));
                    }
                }}
                />
            </div>

            <div>
              <Label>Clinic logo</Label>

              {clinicLogoPreview && (
                <img
                    src={clinicLogoPreview}
                    alt="Clinic logo"
                    className="h-20 object-contain border rounded-md p-2 bg-white"
                />
)}

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setData("clinic_logo", file);

                    if (file) {
                    revokeIfBlob(clinicLogoPreview);
                    setClinicLogoPreview(URL.createObjectURL(file));
                    }
                }}
                />
            </div>

            <div className="pt-2 flex justify-end">
              <Button disabled={processing}>
                {processing ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
