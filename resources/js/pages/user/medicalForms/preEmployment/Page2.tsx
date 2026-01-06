import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  patient: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    birthdate?: string;
    civil_status?: string;
    birthplace?: string;
    home_address?: string;
    contact_no?: string;
  };
}

const diseaseQuestions = [
  'Headaches (frequent)',
  'Dizziness (frequent)',
  'Fainting/Loss of consciousness',
  'Insomnia',
  'Depressed mood (>2 weeks)',
  'Eye/Visual problems',
  'Hearing problems',
  'Cough (>2 weeks)',
  'Colds/ Nasal congestion',
  'Fever (frequent/recurrent)',
  'Frequent early morning sneezing',
  'Nosebleed (frequent)',
  'Sore throat (frequent)',
  'Chest pain',
  'Back pain',
  'Easily gets tired',
  'Difficulty breathing',
  'Palpitations',
  'Swelling of feet',
  'Nausea (frequent)',
  'Vomiting',
  'Abdominal pain/discomfort',
  'Loss of appetite',
  'Weight loss/gain',
  'Diarrhea/constipation',
  'Joint pains',
  'Muscle pain (frequent)',
  'Frequent urination',
  'Eczema/Skin problems',
  'Fracture',
  'Accident/Injuries',
  'Hospitalization',
  'Operation',
  'Others',
];

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

    // Personal history
    allergies: '',
    allergies_checkbox: false,
    no_known_allergies: false,
    medications_regularly: '',
    medications_details: '',
    diseases: diseaseQuestions.reduce((acc, q) => {
      acc[q] = { yes: false, no: false, remarks: '' };
      return acc;
    }, {} as Record<string, { yes: boolean; no: boolean; remarks: string }>),
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('preemployment_page_2');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Loaded from storage:', parsed);
      form.setData((prev) => ({
        ...prev,          // keep defaults
        ...parsed,        // overwrite only existing keys
        diseases: {
          ...prev.diseases,
          ...(parsed.diseases || {}),
        },
      }));
    }
  }, []);

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem('preemployment_page_2', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-employment-health-form/page-3';
  };

  return (
    <AppLayout>
      <Head title="Pre-employment – Page 2" />

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center">
          PRE-EMPLOYMENT HEALTH FORM
        </h1>

        <form onSubmit={submitPage} className="space-y-4">

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <label className="font-semibold">Name:</label>
              <input className={lineInput} value={form.data.name || ''} readOnly />
            </div>
            <div>
              <label className="font-semibold">Age:</label>
              <input className={lineInput} value={form.data.age || ''} readOnly />
            </div>
            <div className="col-span-full flex flex-wrap items-center gap-2 mt-5">
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
            <div className="col-span-full flex flex-wrap items-center gap-2 mt-5">
              <label className="font-semibold">Birthplace:</label>
              <input
                className={lineInput}
                value={form.data.birthplace || ''}
                onChange={(e) => form.setData('birthplace', e.target.value)}
              />
            </div>
            <div className="col-span-full flex flex-wrap items-center gap-2 mt-5">
              <label className="font-semibold">Home Address:</label>
              <input
                className={lineInput}
                placeholder="Street, Barangay / City / Province"
                value={form.data.home_address || ''}
                onChange={(e) => form.setData('home_address', e.target.value)}
              />
            </div>
            <div className="col-span-full flex flex-wrap items-center gap-2 mt-5">
              <label className="font-semibold">Contact No.:</label>
              <input
                className={lineInput}
                value={form.data.contact_no || ''}
                onChange={(e) => form.setData('contact_no', e.target.value)}
              />
            </div>
          </div>

          {/* PERSONAL HISTORY */}
          <div className="space-y-2">
            <h2 className="text-sm sm:text-base font-semibold">PERSONAL HISTORY</h2>

            {/* Allergies & Medications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center text-sm my-5">
            {/* Allergies */}
            <div>
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={form.data.allergies_checkbox}
                    onChange={(e) => {
                        form.setData('allergies_checkbox', e.target.checked);
                        if (!e.target.checked) form.setData('allergies', '');
                    }}
                />
                Allergies?
                </label>
                {form.data.allergies_checkbox && (
                    <input
                        className={lineInput}
                        placeholder="Specify"
                        value={form.data.allergies || ''}
                        onChange={(e) => form.setData('allergies', e.target.value)}
                    />
                )}
            </div>

            {/* No known allergies */}
            <div className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.no_known_allergies}
                onChange={(e) => form.setData('no_known_allergies', e.target.checked)}
                />
                No known allergies
            </div>

            {/* Medications */}
            <div className="col-span-full flex flex-wrap items-center gap-2">
                <span className="text-sm">Medications regularly?</span>
                {['Yes', 'No'].map((option) => (
                <label key={option} className="flex items-center gap-1">
                    <input
                    type="radio"
                    name="medications_regularly"
                    checked={form.data.medications_regularly === option}
                    onChange={() => {
                        form.setData('medications_regularly', option);
                        if (option === 'No') form.setData('medications_details', '');
                    }}
                    />
                    {option}
                </label>
                ))}
                {form.data.medications_regularly === 'Yes' && (
                <input
                    className={lineInput + ' flex-1'}
                    placeholder="Specify"
                    value={form.data.medications_details || ''}
                    onChange={(e) => form.setData('medications_details', e.target.value)}
                />
                )}
            </div>
            </div>

            {/* Diseases Table */}
            <div className="text-sm border border-gray-300 rounded">
            <table className="table-auto border-collapse w-full text-xs sm:text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="border px-1 py-1">Disease/Problem</th>
                    <th className="border px-1 py-1">Yes</th>
                    <th className="border px-1 py-1">No</th>
                    <th className="border px-1 py-1">Remarks</th>
                </tr>
                </thead>
                <tbody>
                {diseaseQuestions.map((q) => (
                    <tr key={q}>
                    <td className="border px-1 py-1">{q}</td>
                    <td className="border px-1 py-1 text-center">
                        <input
                        type="checkbox"
                        checked={form.data.diseases[q].yes}
                        onChange={(e) =>
                            form.setData(`diseases.${q}`, {
                            yes: e.target.checked,
                            no: e.target.checked ? false : form.data.diseases[q].no,
                            remarks: form.data.diseases[q].remarks,
                            })
                        }
                        />
                    </td>
                    <td className="border px-1 py-1 text-center">
                        <input
                        type="checkbox"
                        checked={form.data.diseases[q].no}
                        onChange={(e) =>
                            form.setData(`diseases.${q}`, {
                            yes: e.target.checked ? false : form.data.diseases[q].yes,
                            no: e.target.checked,
                            remarks: form.data.diseases[q].remarks,
                            })
                        }
                        />
                    </td>
                    <td className="border px-1 py-1">
                        <input
                        type="text"
                        className={lineInput + ' text-xs'}
                        value={form.data.diseases[q].remarks || ''}
                        onChange={(e) => form.setData(`diseases.${q}.remarks`, e.target.value)}
                        />
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
          </div>

          {/* NAVIGATION */}
        <div className="flex justify-between mt-2">
            <Button
                type="button"
                variant="secondary"
                disabled={savingPrev || savingNext} // disable if either is saving
                onClick={() => {
                setSavingPrev(true); // show "Going back…"
                sessionStorage.setItem('preemployment_page_2', JSON.stringify(form.data));
                window.location.href = '/user/fill-forms/pre-employment-health-form/page-1';
                }}
            >
                {savingPrev ? 'Going back…' : 'Previous'}
            </Button>

            <Button type="submit" disabled={savingNext || savingPrev}>
                {savingNext ? 'Continuing…' : 'Next'}
            </Button>
        </div>
        </form>
      </div>
    </AppLayout>
  );
}
