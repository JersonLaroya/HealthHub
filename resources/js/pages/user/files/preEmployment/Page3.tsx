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
    sex?: string;
  };
}

// Disease/Problem list
const diseaseProblems = [
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
  'Tuberculosis/Primary complex',
  'Typhoid',
  'Ulcer (peptic)',
  'Ulcer (skin)',
  'COVID-19',
  'Other conditions: please list',
];

const malariaIndex = diseaseProblems.findIndex(
  (d) => d === 'Malaria'
);

export default function PreemploymentPage3({ patient }: Props) {
  // Load saved data
  const savedData = sessionStorage.getItem('preemployment_page_3');
  const parsedData = savedData ? JSON.parse(savedData) : {};

  const form = useForm({
    age_have:
      parsedData.age_have ??
      diseaseProblems.map(() => ({
        age: '',
        na: false,
      })),
    immunization:
      parsedData.immunization ?? Array(15).fill(''),
  });

  useEffect(() => {
    if (savedData) {
      console.log('Preemployment Page 3 data:', parsedData);
      form.setData(parsedData);
    }
  }, []);

  const lineInput =
    'w-16 text-center border-b border-black focus:outline-none focus:ring-0';
  const lineInputWide =
    'w-32 border-b border-black bg-transparent focus:outline-none text-sm';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem(
      'preemployment_page_3',
      JSON.stringify(form.data)
    );
    window.location.href =
      '/user/fill-forms/pre-employment-health-form/page-4';
  };

  return (
    <AppLayout>
      <Head title="Pre-employment – Page 3" />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          PRE-EMPLOYMENT HEALTH FORM
        </h1>

        {/* AGE SECTION */}
        <h2 className="text-lg font-semibold">
          HEALTH CONDITIONS
        </h2>

        <p className="font-semibold text-sm">
          At what AGE did you have the following? Check N/A if it
          does not apply.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-12 justify-center">
          {/* COLUMN 1 */}
          <div className="space-y-1 mx-auto">
            {diseaseProblems
              .slice(0, malariaIndex + 1)
              .map((d, idx) => (
                <div
                  key={d}
                  className="flex items-center justify-center gap-2 text-sm"
                >
                  <span className="w-40 text-center">
                    {d}
                  </span>
                  <input
                    className={lineInput}
                    placeholder="Age"
                    value={form.data.age_have[idx].age}
                    disabled={form.data.age_have[idx].na}
                    onChange={(e) =>
                      form.setData(
                        `age_have.${idx}.age`,
                        e.target.value
                      )
                    }
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={form.data.age_have[idx].na}
                      onChange={(e) =>
                        form.setData(
                          `age_have.${idx}.na`,
                          e.target.checked
                        )
                      }
                    />
                    N/A
                  </label>
                </div>
              ))}
          </div>

          {/* COLUMN 2 */}
          <div className="space-y-1 mx-auto">
            {diseaseProblems
              .slice(malariaIndex + 1)
              .map((d, idx) => {
                const globalIdx =
                  malariaIndex + 1 + idx;
                return (
                  <div
                    key={d}
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <span className="w-40 text-center">
                      {d}
                    </span>
                    <input
                      className={lineInput}
                      placeholder="Age"
                      value={
                        form.data.age_have[globalIdx].age
                      }
                      disabled={
                        form.data.age_have[globalIdx].na
                      }
                      onChange={(e) =>
                        form.setData(
                          `age_have.${globalIdx}.age`,
                          e.target.value
                        )
                      }
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          form.data.age_have[globalIdx].na
                        }
                        onChange={(e) =>
                          form.setData(
                            `age_have.${globalIdx}.na`,
                            e.target.checked
                          )
                        }
                      />
                      N/A
                    </label>
                  </div>
                );
              })}
          </div>
        </div>

        {/* IMMUNIZATION */}
        <h2 className="text-lg font-semibold mt-6">
          IMMUNIZATION RECORD
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm justify-center">
          {/* COLUMN 1 */}
          <div className="space-y-2 mx-auto">
            {[
              ['BCG', 0],
              ['Hepa B – Dose 1', 1],
              ['Hepa B – Dose 2', 2],
              ['Hepa B – Dose 3', 3],
              ['Tetanus Toxoid', 4],
              ['Rabies Vaccine', 5],
              ['Flu', 6],
              ['Pneumococcal', 7],
            ].map(([label, idx]) => (
              <div
                key={idx}
                className="flex items-center gap-3"
              >
                <span className="flex-1">
                  {label}
                </span>
                <input
                  className={lineInputWide}
                  value={form.data.immunization[idx]}
                  onChange={(e) =>
                    form.setData(
                      `immunization.${idx}`,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>

          {/* COLUMN 2 */}
          <div className="space-y-2 mx-auto">
            {[
              ['Hepa A – Dose 1', 8],
              ['Hepa A – Dose 2', 9],
              ['COVID-19 Vaccine Brand', 10],
              ['COVID-19 – Dose 1', 11],
              ['COVID-19 – Dose 2', 12],
              ['COVID-19 – Booster 1', 13],
              ['COVID-19 – Booster 2', 14],
            ].map(([label, idx]) => (
              <div
                key={idx}
                className="flex items-center gap-3"
              >
                <span className="flex-1">
                  {label}
                </span>
                <input
                  className={lineInputWide}
                  value={form.data.immunization[idx]}
                  onChange={(e) =>
                    form.setData(
                      `immunization.${idx}`,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem(
                'preemployment_page_3',
                JSON.stringify(form.data)
              );
              window.location.href =
                '/user/fill-forms/pre-employment-health-form/page-2';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <Button
            disabled={savingNext || savingPrev}
            onClick={submitPage}
          >
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
