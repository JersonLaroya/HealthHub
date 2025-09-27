import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface PersonalInfoProps {
  personalInfo: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    suffix?: string;
    contact_no?: string;
    birthdate?: string;
    sex?: string;

    homeAddress?: {
      purok?: string;
      barangay?: string;
      town?: string;
      province?: string;
    };
    presentAddress?: {
      purok?: string;
      barangay?: string;
      town?: string;
      province?: string;
    };
    guardian?: {
      name?: string;
      contact_no?: string;
    };
  } | null;
  breadcrumbs: any;
}

export default function Edit({ personalInfo, breadcrumbs }: PersonalInfoProps) {
  const { data, setData, put, processing, errors } = useForm({
    first_name: personalInfo?.first_name || "",
    middle_name: personalInfo?.middle_name || "",
    last_name: personalInfo?.last_name || "",
    suffix: personalInfo?.suffix || "",
    contact_no: personalInfo?.contact_no || "",
    birthdate: personalInfo?.birthdate || "",
    sex: personalInfo?.sex || "",

    // Home Address
    home_purok: personalInfo?.homeAddress?.purok || "",
    home_barangay: personalInfo?.homeAddress?.barangay || "",
    home_town: personalInfo?.homeAddress?.town || "",
    home_province: personalInfo?.homeAddress?.province || "",

    // Present Address
    present_purok: personalInfo?.presentAddress?.purok || "",
    present_barangay: personalInfo?.presentAddress?.barangay || "",
    present_town: personalInfo?.presentAddress?.town || "",
    present_province: personalInfo?.presentAddress?.province || "",

    // Guardian
    guardian_name: personalInfo?.guardian?.name || "",
    guardian_contact: personalInfo?.guardian?.contact_no || "",
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    put("/user/personal-info", {
        onSuccess: () => {
            toast.success("Personal info updated", {
            description: "Your personal details were saved successfully.",
            });
        },
        onError: () => {
            toast.error("Update failed", {
            description: "Please check the form for errors.",
            });
        },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Personal Info" />

      <div className="p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Personal Information
            </h1>

            <Card className="p-6 bg-white dark:bg-neutral-800 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name */}
                <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                    id="first_name"
                    value={data.first_name}
                    onChange={(e) => setData("first_name", e.target.value)}
                />
                {errors.first_name && (
                    <p className="text-sm text-red-600">{errors.first_name}</p>
                )}
                </div>

                {/* Middle Name */}
                <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                    id="middle_name"
                    value={data.middle_name}
                    onChange={(e) => setData("middle_name", e.target.value)}
                />
                {errors.middle_name && (
                    <p className="text-sm text-red-600">{errors.middle_name}</p>
                )}
                </div>

                {/* Last Name */}
                <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                    id="last_name"
                    value={data.last_name}
                    onChange={(e) => setData("last_name", e.target.value)}
                />
                {errors.last_name && (
                    <p className="text-sm text-red-600">{errors.last_name}</p>
                )}
                </div>

                {/* Suffix */}
                <div>
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                    id="suffix"
                    value={data.suffix}
                    onChange={(e) => setData("suffix", e.target.value)}
                />
                {errors.suffix && <p className="text-sm text-red-600">{errors.suffix}</p>}
                </div>

                {/* Contact */}
                <div>
                <Label htmlFor="contact_no">Contact No</Label>
                <Input
                    id="contact_no"
                    value={data.contact_no}
                    onChange={(e) => setData("contact_no", e.target.value)}
                />
                </div>

                {/* Birthday */}
                <div>
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                    id="birthdate"
                    type="date"
                    value={data.birthdate}
                    onChange={(e) => setData("birthdate", e.target.value)}
                />
                </div>

                {/* Sex */}
                <div>
                <Label htmlFor="sex">Sex</Label>
                <select
                    id="sex"
                    value={data.sex}
                    onChange={(e) => setData("sex", e.target.value)}
                    className="mt-1 block w-full border rounded p-2 bg-white dark:bg-neutral-700"
                >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                </div>

                {/* Home Address */}
                <div>
                <h2 className="font-semibold mt-4 mb-2">Home Address</h2>
                <Input
                    placeholder="Purok"
                    value={data.home_purok}
                    onChange={(e) => setData("home_purok", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Barangay"
                    value={data.home_barangay}
                    onChange={(e) => setData("home_barangay", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Town"
                    value={data.home_town}
                    onChange={(e) => setData("home_town", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Province"
                    value={data.home_province}
                    onChange={(e) => setData("home_province", e.target.value)}
                />
                </div>

                {/* Present Address */}
                <div>
                <h2 className="font-semibold mt-4 mb-2">Present Address</h2>
                <Input
                    placeholder="Purok"
                    value={data.present_purok}
                    onChange={(e) => setData("present_purok", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Barangay"
                    value={data.present_barangay}
                    onChange={(e) => setData("present_barangay", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Town"
                    value={data.present_town}
                    onChange={(e) => setData("present_town", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Province"
                    value={data.present_province}
                    onChange={(e) => setData("present_province", e.target.value)}
                />
                </div>

                {/* Guardian */}
                <div>
                <h2 className="font-semibold mt-4 mb-2">Guardian</h2>
                <Input
                    placeholder="Name"
                    value={data.guardian_name}
                    onChange={(e) => setData("guardian_name", e.target.value)}
                    className="mb-2"
                />
                <Input
                    placeholder="Contact No"
                    value={data.guardian_contact}
                    onChange={(e) => setData("guardian_contact", e.target.value)}
                />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                <Button type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Save"}
                </Button>
                </div>
            </form>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
