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

// Disease/Problem list for page 4
const diseaseProblemsPage4 = [
  'Anemia/Blood Disorder',
  'Asthma',
  'Cancer',
  'Chickenpox',
  'Convulsions',
  'Dengue',
  'Diabetes',
  'Diphtheria',
  'Ear disease/defect',
  'Eye disease/defect',
  'Gonorrhea',
  'Heart disease',
  'Hepatitis (indicate type)',
  'Hernia',
  'High blood pressure',
  'Influenza (indicate date)',
  'Joint pains',
  'Kidney disease',
  'Malaria',
  'Measles',
  'Mental problem/disorder',
  'Mumps',
  'Neurologic problem/disorder',
  'Pertussis (whooping cough)',
  'Pleurisy',
  'Pneumonia',
  'Poliomyelitis',
  'Rheumatic fever',
  'Skin disease',
  'Syphilis',
  'Thyroid disease',
  'Tonsillitis',
  'Tuberculosis (Primary Complex)',
  'Typhoid',
  'Ulcer (peptic)',
  'Ulcer (skin)',
  'COVID-19',
  'Other conditions: please list',
];

// Difficulty tables
const difficulties = [
  'Do you have difficulty seeing, even if wearing glasses?',
  'Do you have difficulty hearing, even if using a hearing aid?',
  'Do you have difficulty walking or climbing steps?',
  'Do you have difficulty remembering or concentrating?',
  'Do you have difficulty with self-care such as washing all over or dressing?',
  'Do you have difficulty communicating?',
];

const tirednessQuestions = [
  'In the past 3 months, how often do you feel very tired or exhausted?',
  'Over the last 2 weeks, how often did you have little interest or pleasure in doing things?',
  'Over the last 2 weeks, how often did you feel down, depressed or hopeless?',
];

const malariaIndex = diseaseProblemsPage4.findIndex(d => d === 'Malaria');

export default function PreenrollmentPage4({ patient }: Props) {
  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';
  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();

  useEffect(() => {
    const saved = sessionStorage.getItem('preenrollment_page_4');
    if (saved) {
      form.setData(JSON.parse(saved));
    }
  }, []);

  const form = useForm({
    diseases: diseaseProblemsPage4.reduce((acc, d) => {
      acc[d] = false;
      return acc;
    }, {} as Record<string, boolean>),
    age_have: diseaseProblemsPage4.map(() => ({ age: '', na: false })),
    difficulty: difficulties.reduce((acc, d) => {
      acc[d] = ''; // 'No difficulty', 'Some difficulty', 'A lot of difficulty'
      return acc;
    }, {} as Record<string, string>),
    tiredness: tirednessQuestions.reduce((acc, q) => {
      acc[q] = ''; // 'Never', 'Some days', 'Most days', 'Every day'
      return acc;
    }, {} as Record<string, string>),
    equipment_help: '', // Yes/No
    equipment_list: {
      cane: false,
      walker: false,
      crutches: false,
      wheelchair: false,
      artificial_limb: false,
      assistance: false,
    },
    sign_language: null as null | boolean,
    anxious_medication: null as null | boolean,
    physical_deformities: '', // fillable
  });

  const equipmentChoiceValid = form.data.equipment_help === 'Yes' || form.data.equipment_help === 'No';
  const anxiousMedicationValid = form.data.anxious_medication !== null;

  // Validation helpers
  const requiredIf = (condition: boolean, value?: string) =>
    condition && (!value || !value.trim());

  // Check if all age fields are valid
  const ageValid = form.data.age_have.every(
    (a) => a.na || (a.age && a.age.trim())
  );

  const signLanguageValid = form.data.sign_language !== null;

  const ageWithError = form.data.age_have.map(
    (a) => !a.na && (!a.age || !a.age.trim())
  );

  // Check if all difficulty questions have a selection
  const difficultyValid = Object.values(form.data.difficulty).every((val) => val);

  // Check if all tiredness questions have a selection
  const tirednessValid = Object.values(form.data.tiredness).every((val) => val);

  // Check if equipment is valid if "Yes"
  const equipmentValid =
    form.data.equipment_help === 'Yes'
      ? Object.values(form.data.equipment_list).some((v) => v)
      : true;

  // Disable Next if any required validation fails
  const canNext =
  ageValid &&
  difficultyValid &&
  tirednessValid &&
  equipmentChoiceValid &&
  equipmentValid &&
  signLanguageValid &&
  anxiousMedicationValid;


  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';
  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('preenrollment_page_4', JSON.stringify(form.data));
    console.log('Page 4 Data:', form.data);
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-5';
  };

  return (
    <AppLayout>
      <Head title="Preenrollment – Page 4" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">PRE-ENROLLMENT HEALTH FORM</h1>

        <h2 className="text-lg font-semibold">HEALTH CONDITIONS</h2>

        {/* AGE Section */}
      <div className="space-y-2">
        <p className="font-semibold">
          At what AGE did you have the following? Check the N/A box if this does not apply to you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First column */}
          <div className="space-y-2">
            {diseaseProblemsPage4.slice(0, malariaIndex + 1).map((d, idx) => {
              const globalIdx = idx; // Global index for the array (starts at 0)
              return (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <span className="w-48">{d}</span>
                  <input
                    type="text"
                    className={
                      lineInput +
                      ' w-12 text-center ' +
                      (ageWithError[globalIdx] ? 'border-red-600' : '')
                    }
                    placeholder="Age"
                    value={form.data.age_have?.[globalIdx]?.age || ''}
                    onChange={(e) => {
                      // If user types age, uncheck N/A
                      form.setData(`age_have.${globalIdx}`, {
                        age: e.target.value,
                        na: false,
                      });
                    }}
                    disabled={form.data.age_have?.[globalIdx]?.na || false}
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.data.age_have?.[globalIdx]?.na || false}
                      onChange={(e) => {
                        form.setData(`age_have.${globalIdx}`, {
                          age: e.target.checked ? '' : form.data.age_have?.[globalIdx]?.age,
                          na: e.target.checked,
                        });
                      }}
                    />
                    N/A
                  </label>
                </div>
              );
            })}
          </div>

          {/* Second column */}
          <div className="space-y-2">
            {diseaseProblemsPage4.slice(malariaIndex + 1).map((d, idx) => {
              const globalIdx = malariaIndex + 1 + idx; // Global index for the array (continues from first column)
              return (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <span className="w-48">{d}</span>
                  <input
                    type="text"
                    className={
                      lineInput +
                      ' w-12 text-center ' +
                      (ageWithError[globalIdx] ? 'border-red-600' : '')
                    }
                    placeholder="Age"
                    value={form.data.age_have?.[globalIdx]?.age || ''}
                    onChange={(e) => {
                      // If user types age, uncheck N/A
                      form.setData(`age_have.${globalIdx}`, {
                        age: e.target.value,
                        na: false,
                      });
                    }}
                    disabled={form.data.age_have?.[globalIdx]?.na || false}
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.data.age_have?.[globalIdx]?.na || false}
                      onChange={(e) => {
                        form.setData(`age_have.${globalIdx}`, {
                          age: e.target.checked ? '' : form.data.age_have?.[globalIdx]?.age,
                          na: e.target.checked,
                        });
                      }}
                    />
                    N/A
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* Difficulty Table */}
        <div className="overflow-x-auto text-sm">
          <p className="font-semibold mb-2">Check the corresponding box:</p>
          <table className="table-auto border-collapse w-full text-sm mb-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">No difficulty</th>
                <th className="border px-2 py-1">Some difficulty</th>
                <th className="border px-2 py-1">A lot of difficulty</th>
                <th className="border px-2 py-1">Question</th>
              </tr>
            </thead>
            <tbody>
              {difficulties.map((q) => (
                <tr key={q}>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.difficulty[q] === 'No difficulty'}
                      onChange={() => form.setData(`difficulty.${q}`, 'No difficulty')}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.difficulty[q] === 'Some difficulty'}
                      onChange={() => form.setData(`difficulty.${q}`, 'Some difficulty')}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.difficulty[q] === 'A lot of difficulty'}
                      onChange={() => form.setData(`difficulty.${q}`, 'A lot of difficulty')}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    {q} <span className="text-red-600 font-bold">*</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tiredness/Depression Table */}
        <div className="overflow-x-auto text-sm">
          <p className="font-semibold mb-2">Frequency in recent periods:</p>
          <table className="table-auto border-collapse w-full text-sm mb-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">Never</th>
                <th className="border px-2 py-1">Some days</th>
                <th className="border px-2 py-1">Most days</th>
                <th className="border px-2 py-1">Every day</th>
                <th className="border px-2 py-1">Question</th>
              </tr>
            </thead>
            <tbody>
              {tirednessQuestions.map((q) => (
                <tr key={q}>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.tiredness[q] === 'Never'}
                      onChange={() => form.setData(`tiredness.${q}`, 'Never')}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.tiredness[q] === 'Some days'}
                      onChange={() => form.setData(`tiredness.${q}`, 'Some days')}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.tiredness[q] === 'Most days'}
                      onChange={() => form.setData(`tiredness.${q}`, 'Most days')}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="radio"
                      name={q}
                      checked={form.data.tiredness[q] === 'Every day'}
                      onChange={() => form.setData(`tiredness.${q}`, 'Every day')}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    {q} <span className="text-red-600 font-bold">*</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Equipment Assistance Row */}
        <div className="flex items-center gap-4 text-sm">
        <span className="flex-1">Do you use any equipment or receive help for getting around? <span className="text-red-600 font-bold">*</span></span>
        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="equipment_help"
            checked={form.data.equipment_help === 'Yes'}
            onChange={() => form.setData('equipment_help', 'Yes')}
            />
            Yes
        </label>
        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="equipment_help"
            checked={form.data.equipment_help === 'No'}
            onChange={() => form.setData('equipment_help', 'No')}
            />
            No
        </label>
        </div>

        {/* Equipment List (only if Yes) */}
        {form.data.equipment_help === 'Yes' && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.cane}
                onChange={(e) => form.setData('equipment_list.cane', e.target.checked)}
            />
            1. Cane or walking stick
            </label>
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.walker}
                onChange={(e) => form.setData('equipment_list.walker', e.target.checked)}
            />
            2. Walker or zimmer frame
            </label>
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.crutches}
                onChange={(e) => form.setData('equipment_list.crutches', e.target.checked)}
            />
            3. Crutches
            </label>
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.wheelchair}
                onChange={(e) => form.setData('equipment_list.wheelchair', e.target.checked)}
            />
            4. Wheelchair or scooter
            </label>
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.artificial_limb}
                onChange={(e) => form.setData('equipment_list.artificial_limb', e.target.checked)}
            />
            5. Artificial limb
            </label>
            <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={form.data.equipment_list.assistance}
                onChange={(e) => form.setData('equipment_list.assistance', e.target.checked)}
            />
            6. Someone’s assistance
            </label>
        </div>
        )}

        {/* Sign language Row */}
        <div className="flex items-center gap-4 mt-4 text-sm">
        <span className="flex-1">Do you use sign language? <span className="text-red-600 font-bold">*</span></span>

        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="sign_language"
            value="Yes"
            checked={form.data.sign_language === true}
            onChange={() => form.setData('sign_language', true)}
            />
            Yes
        </label>

        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="sign_language"
            value="No"
            checked={form.data.sign_language === false}
            onChange={() => form.setData('sign_language', false)}
            />
            No
        </label>
        </div>

        {/* Medication Row */}
        <div className="flex items-center gap-4 mt-2 text-sm">
        <span className="flex-1">
            Do you take any medication when you feel worried, anxious, or nervous?  <span className="text-red-600 font-bold">*</span>
        </span>

        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="anxious_medication"
            value="Yes"
            checked={form.data.anxious_medication === true}
            onChange={() => form.setData('anxious_medication', true)}
            />
            Yes
        </label>

        <label className="flex items-center gap-1">
            <input
            type="radio"
            name="anxious_medication"
            value="No"
            checked={form.data.anxious_medication === false}
            onChange={() => form.setData('anxious_medication', false)}
            />
            No
        </label>
        </div>

        {/* Physical Deformities */}
        <div className="mt-4 text-sm">
        <label className="block mb-1 font-medium">
            Do you have any physical deformities? Provide special needs form if any:
        </label>
        <input
            type="text"
            className={lineInput}
            value={form.data.physical_deformities}
            onChange={(e) => form.setData('physical_deformities', e.target.value)}
            placeholder="______________________________________________________________________"
        />
        </div>


        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('preenrollment_page_4', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-3';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>
          <Button
            type="button"
            disabled={savingNext || savingPrev || !canNext}
            onClick={(e) => {
              setSavingNext(true);
              submitPage(e);
            }}
          >
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
