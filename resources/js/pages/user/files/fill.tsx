import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

interface Props {
  service: {
    title: string;
    slug: string;
    id?: number;
  };
  patient: {
    name: string;
    birthdate?: string;
    sex?: string;
  };
}

export default function FillForm({ service, patient }: Props) {
  const form = useForm({
    // replace these keys with your actual form fields
    symptom: '',
    notes: '',
  });

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(`/user/medical-forms/${service.slug}/submit`);
  };

  return (
    <AppLayout>
      <Head title={`Fill ${service.title}`} />

      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">{service.title}</h1>
        <p className="mb-6">Patient: {patient.name}</p>

        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Symptom</label>
            <input
              type="text"
              value={form.data.symptom}
              onChange={(e) => form.setData('symptom', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Notes</label>
            <textarea
              value={form.data.notes}
              onChange={(e) => form.setData('notes', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </div>
    </AppLayout>
  );
}
