import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@headlessui/react";

export default function Show({ assignment }: any) {
  const { form, admin, status } = assignment;
  const [submitting, setSubmitting] = useState(false);

  // Initialize form response state
  const { data, setData, post } = useForm({
    responses: {},
  });

  const handleChange = (field: string, value: string) => {
    setData("responses", { ...data.responses, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    post(route("user.medical-forms.submit", assignment.id), {
      onSuccess: () => {
        toast.success("Form submitted successfully!");
        setSubmitting(false);
      },
      onError: () => {
        toast.error("Failed to submit the form.");
        setSubmitting(false);
      },
    });
  };

  return (
    <AppLayout>
      <Head title={`Form - ${form.title}`} />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{form.title}</h1>
          {/* <Link href={route("user.medical-forms.index")}>
            <Button variant="outline">Back</Button>
          </Link> */}
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow space-y-3">
          <p><strong>Assigned By:</strong> {admin?.name || "—"}</p>
          <p><strong>Status:</strong> {status}</p>
          {form.description && <p>{form.description}</p>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 p-6 rounded shadow space-y-4">
          {form.fields && form.fields.length > 0 ? (
            form.fields.map((field: any, index: number) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {field.label}
                </label>
                {field.type === "text" && (
                  <Input
                    type="text"
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
                {field.type === "number" && (
                  <Input
                    type="number"
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No fields defined for this form.</p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
