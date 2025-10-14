import { Head, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Forms() {
  const { patient, assignedForms } = usePage().props as {
    patient: any;
    assignedForms: any[];
  };

  const handleOpenForm = (formId: number) => {
    router.get(`/admin/forms/${formId}/patients/${patient?.id}`);
  };

  const firstName = patient?.user?.user_info?.first_name ?? "";
  const lastName = patient?.user?.user_info?.last_name ?? "";

  return (
    <AppLayout>
      <Head title={`Clinic Forms - ${firstName} ${lastName}`} />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Clinic Forms</h1>
        </div>

        {/* Patient Info */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
          {patient?.user ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Name:</strong> {firstName} {lastName}
              </div>
              <div>
                <strong>Sex:</strong> {patient.user.user_info?.sex ?? "-"}
              </div>
              <div>
                <strong>Birthdate:</strong>{" "}
                {patient.user.user_info?.birthdate
                  ? new Date(patient.user.user_info.birthdate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "-"}
              </div>
              <div>
                <strong>Course/Office:</strong>{" "}
                {patient.user.course
                  ? `${patient.user.course.name} ${patient.user.yearLevel?.name || ""}`
                  : patient.user.office?.name || "-"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No patient information available.
            </p>
          )}
        </Card>

        {/* Forms Section */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Available Forms</h2>
          {assignedForms?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assignedForms.map((assignment) => (
                <Button
                  key={assignment.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenForm(assignment.form.id)}
                >
                  {assignment.form.title}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No forms assigned to this patient.
            </p>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
