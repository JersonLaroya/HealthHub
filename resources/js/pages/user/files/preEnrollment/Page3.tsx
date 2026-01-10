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

export default function PreenrollmentPage3({ patient }: Props) {
  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';
  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();

  const form = useForm({
    food_allergies: '',
    drug_allergies: '',
    no_known_allergies: false,
    medications_regularly: '',
    medications_details: '',
    diseases: diseaseQuestions.reduce((acc, q) => {
      acc[q] = { yes: false, no: false, remarks: '' };
      return acc;
    }, {} as Record<string, { yes: boolean; no: boolean; remarks: string }>),
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('preenrollment_page_3');
    if (saved) {
      form.setData(JSON.parse(saved));
    }
  }, []);


  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);


  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('preenrollment_page_3', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-4';
    console.log('Page 3 Data:', form.data); // log the filled data
  };

  return (
    <AppLayout>
      <Head title="Preenrollment – Page 3" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">PRE-ENROLLMENT HEALTH FORM</h1>

        <h2 className="text-lg font-semibold">PERSONAL HISTORY</h2>

        {/* Allergies */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-sm">

          {/* Food Allergies */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.data.food_allergies_checkbox}
                onChange={(e) => {
                  form.setData('food_allergies_checkbox', e.target.checked);
                  if (!e.target.checked) form.setData('food_allergies', '');
                }}
              />
              Food Allergies?
            </label>
            {form.data.food_allergies_checkbox && (
              <input
                className={lineInput}
                placeholder="Specify if any"
                value={form.data.food_allergies}
                onChange={(e) => form.setData('food_allergies', e.target.value)}
              />
            )}
          </div>

          {/* Drug Allergies */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.data.drug_allergies_checkbox}
                onChange={(e) => {
                  form.setData('drug_allergies_checkbox', e.target.checked);
                  if (!e.target.checked) form.setData('drug_allergies', '');
                }}
              />
              Drug Allergies?
            </label>
            {form.data.drug_allergies_checkbox && (
              <input
                className={lineInput}
                placeholder="Specify if any"
                value={form.data.drug_allergies}
                onChange={(e) => form.setData('drug_allergies', e.target.value)}
              />
            )}
          </div>

          {/* No Known Allergies */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.data.no_known_allergies}
              onChange={(e) => form.setData('no_known_allergies', e.target.checked)}
            />
            No known allergies
          </label>
        </div>


        {/* Medications */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-sm">
            <span>Are you taking medications regularly?</span>

            <label className="flex items-center gap-2">
                <input
                type="radio"
                name="medications_regularly"
                checked={form.data.medications_regularly === 'Yes'}
                onChange={() => form.setData('medications_regularly', 'Yes')}
                />
                Yes
            </label>

            <label className="flex items-center gap-2">
                <input
                type="radio"
                name="medications_regularly"
                checked={form.data.medications_regularly === 'No'}
                onChange={() => {
                    form.setData('medications_regularly', 'No');
                    form.setData('medications_details', ''); // auto-clear if No
                }}
                />
                No
            </label>

            {/* Fillable line appears only if Yes */}
            {form.data.medications_regularly === 'Yes' && (
                <div className="col-span-full flex items-center gap-2">
                <span>If yes, please specify:</span>
                <input
                    type="text"
                    className={lineInput + ' flex-1'}
                    value={form.data.medications_details}
                    onChange={(e) => form.setData('medications_details', e.target.value)}
                    placeholder="Specify medications"
                />
                </div>
            )}
            </div>

        {/* Diseases Table */}
        <div className="text-sm overflow-x-auto">
          <p className="font-semibold mb-2">
            Have you experienced any of the following diseases or problems? Check the corresponding box.
          </p>

          <table className="table-auto border-collapse w-full text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Disease/Problem</th>
                <th className="border px-2 py-1">Yes</th>
                <th className="border px-2 py-1">No</th>
                <th className="border px-2 py-1">Remarks</th>
              </tr>
            </thead>
            <tbody>
                {diseaseQuestions.map((q) => (
                    <tr key={q}>
                    <td className="border px-2 py-1">{q}</td>
                    <td className="border px-2 py-1 text-center">
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
                    <td className="border px-2 py-1 text-center">
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
                    <td className="border px-2 py-1">
                        <input
                        type="text"
                        className={lineInput}
                        value={form.data.diseases[q].remarks}
                        onChange={(e) =>
                            form.setData(`diseases.${q}.remarks`, e.target.value)
                        }
                        />
                    </td>
                    </tr>
                ))}
                </tbody>

          </table>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('preenrollment_page_3', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-2';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>
          <Button
            type="button"
            disabled={savingNext || savingPrev}
            onClick={(e) => {
              setSavingNext(true);
              submitPage(e); // call the function directly
            }}
          >
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
