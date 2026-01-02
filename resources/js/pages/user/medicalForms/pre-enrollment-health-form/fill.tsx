import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  service: {
    title: string;
    slug: string;
  };
  patient: {
    name: string;
    birthdate?: string;
    sex?: string;
  };
}

// Define the form structure per serviceSlug
const FORM_FIELDS: Record<string, any> = {
  'pre-enrollment-health-form': {
    patient: { name: '', birthdate: '', sex: '' },
    medical_history: { allergies: '', previous_conditions: '' },
    consent: { signature: '' },
  },
  'pre-employment-health-form': {
    patient: { name: '', birthdate: '', sex: '' },
    employment_history: { previous_employer: '', position: '' },
    medical_clearance: { cleared: false },
  },
  'athlete-health-form': {
    patient: { name: '', birthdate: '', sex: '' },
    sports_history: { sport: '', injuries: '' },
    consent: { signature: '' },
  }
};

export default function FillForm({ service, patient }: Props) {
  const [formData, setFormData] = useState<any>({});
  const form = useForm({ responses: {} });

  // Load form structure dynamically
  useEffect(() => {
    setFormData(FORM_FIELDS[service.slug] || {});
  }, [service.slug]);

  const handleChange = (path: string, value: any) => {
    // Update nested values dynamically
    const keys = path.split('.');
    let updated = { ...formData };
    let temp = updated;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) temp[k] = value;
      else temp[k] = temp[k] || {};
      temp = temp[k];
    });
    setFormData(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(`/user/medical-forms/${service.slug}/store`, { responses: formData });
  };

  const renderInputs = (obj: any, parentKey = '') => {
    return Object.entries(obj).map(([key, value]) => {
      const path = parentKey ? `${parentKey}.${key}` : key;
      if (typeof value === 'object') return renderInputs(value, path);
      return (
        <div key={path} className="mb-4">
          <label className="block mb-1 font-medium">{key.replace('_', ' ')}</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={value}
            onChange={(e) => handleChange(path, e.target.value)}
          />
        </div>
      );
    });
  };

  return (
    <AppLayout>
      <Head title={`Fill ${service.title}`} />
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{service.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderInputs(formData)}
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </AppLayout>
  );
}
