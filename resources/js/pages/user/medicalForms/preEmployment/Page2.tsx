import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  patient: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    birthdate?: string; // YYYY-MM-DD
    civil_status?: string;
    birthplace?: string;
    home_address?: string;
    contact_no?: string;
  };
}

export default function PreemploymentPage2({ patient }: Props) {
  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';

  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  const form = useForm({
    name: fullName,
    age: patient.birthdate ? calculateAge(patient.birthdate) : '',
    civil_status: patient.civil_status || '',
    birthplace: patient.birthplace || '',
    home_address: patient.home_address || '',
    contact_no: patient.contact_no || '',
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('preemployment_page_2');
    if (saved) form.setData(JSON.parse(saved));
  }, []);

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const [savingNext, setSavingNext] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem('preemployment_page_2', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-employment-health-form/page-3';
  };

  return (
    <AppLayout>
      <Head title="Pre-employment – Page 2" />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">PRE-EMPLOYMENT HEALTH FORM</h1>

        <form onSubmit={submitPage} className="space-y-4">
          {/* NAME */}
          <div>
            <label className="font-semibold">Name:</label>
            <input className={lineInput} value={form.data.name} readOnly />
          </div>

          {/* AGE */}
          <div>
            <label className="font-semibold">Age:</label>
            <input className={lineInput} value={form.data.age} readOnly />
          </div>

          {/* CIVIL STATUS */}
          <div className="flex gap-4 text-sm items-center">
            <span className="font-semibold">Civil Status:</span>
            {['Single', 'Married', 'Widowed', 'Legally Separated'].map((status) => (
              <label key={status} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="civil_status"
                  checked={form.data.civil_status === status}
                  onChange={() => form.setData('civil_status', status)}
                />
                {status}
              </label>
            ))}
          </div>

          {/* BIRTHPLACE */}
          <div>
            <label className="font-semibold">Birthplace:</label>
            <input
              className={lineInput}
              value={form.data.birthplace}
              onChange={(e) => form.setData('birthplace', e.target.value)}
            />
          </div>

          {/* HOME ADDRESS */}
          <div>
            <label className="font-semibold">Home Address:</label>
            <input
              className={lineInput}
              placeholder="Street, Barangay / City / Province"
              value={form.data.home_address}
              onChange={(e) => form.setData('home_address', e.target.value)}
            />
          </div>

          {/* CONTACT NO */}
          <div>
            <label className="font-semibold">Contact No.:</label>
            <input
              className={lineInput}
              value={form.data.contact_no}
              onChange={(e) => form.setData('contact_no', e.target.value)}
            />
          </div>

          {/* NEXT BUTTON */}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={savingNext}>
              {savingNext ? 'Continuing…' : 'Next'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
