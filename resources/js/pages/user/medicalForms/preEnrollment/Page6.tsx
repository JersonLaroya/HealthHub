import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

interface Props {
  patient: {
    civil_status?: string;
  };
}

const hereditaryDiseases = [
  'Cancer',
  'Heart disease',
  'High blood pressure',
  'Stroke',
  'Tuberculosis',
  'Kidney Disease',
  'Arthritis/Rheumatism',
  'Diabetes',
  'Mental disorder',
  'Asthma',
  'Neurologic problems/convulsions',
  'Bleeding disorders',
  'Digestive problems',
  'Skin disease',
];

export default function PreenrollmentPage6({ patient }: Props) {
  const savedData = sessionStorage.getItem('preenrollment_page_6');

  const form = useForm(
    savedData
      ? JSON.parse(savedData)
      : {
          family: {
            mother: {
              status: '',
              age_alive: '',
              diseases: '',
              medications: '',
              age_death: '',
              cause_death: '',
            },
            father: {
              status: '',
              age_alive: '',
              diseases: '',
              medications: '',
              age_death: '',
              cause_death: '',
            },
            siblings_count: '',
            siblings_illnesses: '',
            spouse: {
              status: '',
              age_alive: '',
              diseases: '',
              medications: '',
              age_death: '',
              cause_death: '',
            },
            children_count: '',
            children_health_problems: '',
            hereditary: hereditaryDiseases.reduce((acc, d) => {
              acc[d] = { answer: '', relation: '' };
              return acc;
            }, {} as Record<string, { answer: string; relation: string }>),
          },
          social_history: {
            alcohol_use: { answer: '', details: '' },
            reduce_alcohol: { answer: '', details: '' },
            smoking: { answer: '', details: '' },
            vape_tobacco: { answer: '', details: '' },
            other_conditions: { answer: '', details: '' },
          },
        }
  );

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';

  const isMarried = patient.civil_status?.toLowerCase() === 'married';

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('preenrollment_page_6', JSON.stringify(form.data));
    window.location.href =
      '/user/fill-forms/pre-enrollment-health-form/page-7';
  };

  return (
    <AppLayout>
      <Head title="Preenrollment – Page 6" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-sm">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        <h2 className="text-lg font-semibold">FAMILY HISTORY</h2>

        {/* MOTHER */}
        <div className="space-y-2">
          <p className="font-medium">Mother:</p>
          <div className="flex gap-4">
            {['Alive', 'Deceased'].map((s) => (
              <label key={s} className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={form.data.family.mother.status === s}
                  onChange={() =>
                    form.setData('family.mother.status', s)
                  }
                />
                {s}
              </label>
            ))}
          </div>

          {form.data.family.mother.status === 'Alive' && (
            <input
              className={lineInput}
              placeholder="Current age"
              value={form.data.family.mother.age_alive}
              onChange={(e) =>
                form.setData('family.mother.age_alive', e.target.value)
              }
            />
          )}

          {form.data.family.mother.status === 'Deceased' && (
            <>
              <input
                className={lineInput}
                placeholder="Age at time of death"
                value={form.data.family.mother.age_death}
                onChange={(e) =>
                  form.setData('family.mother.age_death', e.target.value)
                }
              />
              <input
                className={lineInput}
                placeholder="Cause of death"
                value={form.data.family.mother.cause_death}
                onChange={(e) =>
                  form.setData('family.mother.cause_death', e.target.value)
                }
              />
            </>
          )}

          <input
            className={lineInput}
            placeholder="Diseases"
            value={form.data.family.mother.diseases}
            onChange={(e) =>
              form.setData('family.mother.diseases', e.target.value)
            }
          />
          <input
            className={lineInput}
            placeholder="Maintenance medications"
            value={form.data.family.mother.medications}
            onChange={(e) =>
              form.setData('family.mother.medications', e.target.value)
            }
          />
        </div>

        {/* FATHER */}
        <div className="space-y-2">
          <p className="font-medium">Father:</p>
          <div className="flex gap-4">
            {['Alive', 'Deceased'].map((s) => (
              <label key={s} className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={form.data.family.father.status === s}
                  onChange={() =>
                    form.setData('family.father.status', s)
                  }
                />
                {s}
              </label>
            ))}
          </div>

          {form.data.family.father.status === 'Alive' && (
            <input
              className={lineInput}
              placeholder="Current age"
              value={form.data.family.father.age_alive}
              onChange={(e) =>
                form.setData('family.father.age_alive', e.target.value)
              }
            />
          )}

          {form.data.family.father.status === 'Deceased' && (
            <>
              <input
                className={lineInput}
                placeholder="Age at time of death"
                value={form.data.family.father.age_death}
                onChange={(e) =>
                  form.setData('family.father.age_death', e.target.value)
                }
              />
              <input
                className={lineInput}
                placeholder="Cause of death"
                value={form.data.family.father.cause_death}
                onChange={(e) =>
                  form.setData('family.father.cause_death', e.target.value)
                }
              />
            </>
          )}

          <input
            className={lineInput}
            placeholder="Diseases"
            value={form.data.family.father.diseases}
            onChange={(e) =>
              form.setData('family.father.diseases', e.target.value)
            }
          />
          <input
            className={lineInput}
            placeholder="Maintenance medications"
            value={form.data.family.father.medications}
            onChange={(e) =>
              form.setData('family.father.medications', e.target.value)
            }
          />
        </div>

        {/* HEREDITARY TABLE */}
        <div className="overflow-x-auto">
          <p className="font-medium mb-2">
            Among your blood relatives, is there a history of:
          </p>

          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Disease</th>
                <th className="border px-2 py-1">Yes</th>
                <th className="border px-2 py-1">No</th>
                <th className="border px-2 py-1">Relation</th>
              </tr>
            </thead>
            <tbody>
              {hereditaryDiseases.map((d) => (
                <tr key={d}>
                  <td className="border px-2 py-1">{d}</td>
                  <td className="border text-center">
                    <input
                      type="radio"
                      checked={form.data.family.hereditary[d].answer === 'Yes'}
                      onChange={() =>
                        form.setData(`family.hereditary.${d}.answer`, 'Yes')
                      }
                    />
                  </td>
                  <td className="border text-center">
                    <input
                      type="radio"
                      checked={form.data.family.hereditary[d].answer === 'No'}
                      onChange={() =>
                        form.setData(`family.hereditary.${d}.answer`, 'No')
                      }
                    />
                  </td>
                  <td className="border px-2">
                    <input
                      className={lineInput}
                      value={form.data.family.hereditary[d].relation}
                      onChange={(e) =>
                        form.setData(
                          `family.hereditary.${d}.relation`,
                          e.target.value
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SOCIAL HISTORY */}
        <div className="space-y-4 mt-6 text-sm">
        <h2 className="text-lg font-semibold">SOCIAL HISTORY</h2>
        <p className="italic">
            Please answer the following questions HONESTLY. For medical purposes only.
        </p>

        {/* 1. Alcohol */}
        <div className="space-y-1">
            <p>
            1. Do you consume alcohol? If so, please specify the frequency and quantity.
            </p>
            <div className="flex gap-4 items-center">
            {['Yes', 'No'].map((a) => (
                <label key={a} className="flex items-center gap-1">
                <input
                    type="radio"
                    name="alcohol_use"
                    checked={form.data.social_history.alcohol_use.answer === a}
                    onChange={() =>
                    form.setData('social_history.alcohol_use.answer', a)
                    }
                />
                {a}
                </label>
            ))}
            </div>
            {form.data.social_history.alcohol_use.answer === 'Yes' && (
            <input
                className={lineInput}
                placeholder="Frequency and quantity"
                value={form.data.social_history.alcohol_use.details}
                onChange={(e) =>
                form.setData(
                    'social_history.alcohol_use.details',
                    e.target.value
                )
                }
            />
            )}
        </div>

        {/* 2. Reduce alcohol */}
        <div className="space-y-1">
            <p>
            2. Do you feel the need or desire to reduce your alcohol consumption?
            </p>
            <div className="flex gap-4 items-center">
            {['Yes', 'No'].map((a) => (
                <label key={a} className="flex items-center gap-1">
                <input
                    type="radio"
                    name="reduce_alcohol"
                    checked={form.data.social_history.reduce_alcohol.answer === a}
                    onChange={() =>
                    form.setData('social_history.reduce_alcohol.answer', a)
                    }
                />
                {a}
                </label>
            ))}
            </div>
            {form.data.social_history.reduce_alcohol.answer === 'Yes' && (
            <input
                className={lineInput}
                placeholder="Please specify"
                value={form.data.social_history.reduce_alcohol.details}
                onChange={(e) =>
                form.setData(
                    'social_history.reduce_alcohol.details',
                    e.target.value
                )
                }
            />
            )}
        </div>

        {/* 3. Smoking */}
        <div className="space-y-1">
            <p>
            3. Do you smoke? If yes, please indicate the frequency and amount.
            </p>
            <div className="flex gap-4 items-center">
            {['Yes', 'No'].map((a) => (
                <label key={a} className="flex items-center gap-1">
                <input
                    type="radio"
                    name="smoking"
                    checked={form.data.social_history.smoking.answer === a}
                    onChange={() =>
                    form.setData('social_history.smoking.answer', a)
                    }
                />
                {a}
                </label>
            ))}
            </div>
            {form.data.social_history.smoking.answer === 'Yes' && (
            <input
                className={lineInput}
                placeholder="Frequency and amount"
                value={form.data.social_history.smoking.details}
                onChange={(e) =>
                form.setData(
                    'social_history.smoking.details',
                    e.target.value
                )
                }
            />
            )}
        </div>

        {/* 4. Vape / Smokeless tobacco */}
        <div className="space-y-1">
            <p>
            4. Have you used smokeless tobacco or vape within the past year?
            </p>
            <div className="flex gap-4 items-center">
            {['Yes', 'No'].map((a) => (
                <label key={a} className="flex items-center gap-1">
                <input
                    type="radio"
                    name="vape_tobacco"
                    checked={form.data.social_history.vape_tobacco.answer === a}
                    onChange={() =>
                    form.setData('social_history.vape_tobacco.answer', a)
                    }
                />
                {a}
                </label>
            ))}
            </div>
            {form.data.social_history.vape_tobacco.answer === 'Yes' && (
            <input
                className={lineInput}
                placeholder="Please specify / awareness of risks"
                value={form.data.social_history.vape_tobacco.details}
                onChange={(e) =>
                form.setData(
                    'social_history.vape_tobacco.details',
                    e.target.value
                )
                }
            />
            )}
        </div>

        {/* 5. Other medical conditions */}
        <div className="space-y-1">
            <p>
            5. Are there any other medical conditions, illnesses, or relevant information that should be reported to the clinic?
            </p>
            <div className="flex gap-4 items-center">
            {['Yes', 'No'].map((a) => (
                <label key={a} className="flex items-center gap-1">
                <input
                    type="radio"
                    name="other_conditions"
                    checked={form.data.social_history.other_conditions.answer === a}
                    onChange={() =>
                    form.setData(
                        'social_history.other_conditions.answer',
                        a
                    )
                    }
                />
                {a}
                </label>
            ))}
            </div>
            {form.data.social_history.other_conditions.answer === 'Yes' && (
            <input
                className={lineInput}
                placeholder="Please specify"
                value={form.data.social_history.other_conditions.details}
                onChange={(e) =>
                form.setData(
                    'social_history.other_conditions.details',
                    e.target.value
                )
                }
            />
            )}
        </div>
        </div>


        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              sessionStorage.setItem(
                'preenrollment_page_6',
                JSON.stringify(form.data)
              );
              window.location.href =
                '/user/fill-forms/pre-enrollment-health-form/page-5';
            }}
          >
            Previous
          </Button>

          <Button onClick={submitPage}>Next</Button>
        </div>
      </div>
    </AppLayout>
  );
}
