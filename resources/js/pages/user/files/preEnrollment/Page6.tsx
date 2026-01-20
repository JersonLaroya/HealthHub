import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useEffect } from "react";

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

  // 👉 get civil status from page 2 session storage
  const page2Data = sessionStorage.getItem('preenrollment_page_2');
  const civilStatus = page2Data ? JSON.parse(page2Data)?.civil_status : null;
  console.log('civil status: ', civilStatus);
  const isMarried = civilStatus === 'Married';

  useEffect(() => {
    if (!isMarried) {
      form.setData('family.spouse', {
        status: '',
        age_alive: '',
        diseases: '',
        medications: '',
        age_death: '',
        cause_death: '',
      });

      form.setData('family.children_count', '');
      form.setData('family.children_health_problems', '');
    }
  }, [isMarried]);

  const normalizeHereditary = (data: any) => {
    if (!data.family.hereditary) {
      data.family.hereditary = hereditaryDiseases.map(d => ({
        disease: d,
        answer: '',
        relation: ''
      }));
    } else if (!Array.isArray(data.family.hereditary)) {
      // Convert old object structure to array
      data.family.hereditary = Object.entries(data.family.hereditary).map(
        ([disease, info]) => ({
          disease,
          answer: info.answer || '',
          relation: info.relation || '',
        })
      );
    }
    return data;
  };

  const savedData = sessionStorage.getItem('preenrollment_page_6');

  const form = useForm(
    savedData
      ? normalizeHereditary(JSON.parse(savedData))
      : {
          family: {
            mother: { status: '', age_alive: '', diseases: '', medications: '', age_death: '', cause_death: '' },
            father: { status: '', age_alive: '', diseases: '', medications: '', age_death: '', cause_death: '' },
            siblings_count: '',
            siblings_illnesses: '',
            spouse: { status: '', age_alive: '', diseases: '', medications: '', age_death: '', cause_death: '' },
            children_count: '',
            children_health_problems: '',
            hereditary: hereditaryDiseases.map(d => ({
              disease: d,
              answer: '',
              relation: ''
            })),
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

  const mother = form.data.family.mother;
const father = form.data.family.father;

const motherAlive = mother.status === 'Alive';
const motherDeceased = mother.status === 'Deceased';

const fatherAlive = father.status === 'Alive';
const fatherDeceased = father.status === 'Deceased';

const motherValid =
  mother.status &&
  (
    (motherAlive && mother.age_alive && mother.diseases && mother.medications) ||
    (motherDeceased && mother.age_death && mother.cause_death)
  );

const fatherValid =
  father.status &&
  (
    (fatherAlive && father.age_alive && father.diseases && father.medications) ||
    (fatherDeceased && father.age_death && father.cause_death)
  );

  const spouse = form.data.family.spouse;

const spouseAlive = spouse.status === 'Alive';
const spouseDeceased = spouse.status === 'Deceased';

const hereditaryErrors = form.data.family.hereditary.map(h => ({
  answer: !h.answer,
  relation: h.answer === 'Yes' && !h.relation
}));

const hereditaryValid = hereditaryErrors.every(
  h => !h.answer && !h.relation
);


const spouseValid = !isMarried
  ? true // not married → skip spouse validation
  : (
      (spouseAlive && spouse.age_alive && spouse.diseases && spouse.medications) ||
      (spouseDeceased && spouse.age_death && spouse.cause_death)
    );

const social = form.data.social_history;

const socialErrors = {
  alcohol: !social.alcohol_use.answer || (social.alcohol_use.answer === 'Yes' && !social.alcohol_use.details),
  reduce: !social.reduce_alcohol.answer || (social.reduce_alcohol.answer === 'Yes' && !social.reduce_alcohol.details),
  smoking: !social.smoking.answer || (social.smoking.answer === 'Yes' && !social.smoking.details),
  vape: !social.vape_tobacco.answer || (social.vape_tobacco.answer === 'Yes' && !social.vape_tobacco.details),
  other: !social.other_conditions.answer || (social.other_conditions.answer === 'Yes' && !social.other_conditions.details),
};

const socialValid = !Object.values(socialErrors).some(Boolean);



  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';
  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    sessionStorage.setItem('preenrollment_page_6', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-7';
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
          <p className="font-medium">Mother: <span className="text-red-600">*</span></p>
          <div className="flex gap-4">
            {['Alive', 'Deceased'].map((s) => (
              <label key={s} className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={form.data.family.mother.status === s}
                  onChange={() => {
                    if (s === 'Alive') {
                      form.setData('family.mother', {
                        ...form.data.family.mother,
                        status: 'Alive',
                        age_death: '',
                        cause_death: '',
                      });
                    } else {
                      form.setData('family.mother', {
                        ...form.data.family.mother,
                        status: 'Deceased',
                        age_alive: '',
                        diseases: '',
                        medications: '',
                      });
                    }
                  }}
                />
                {s}
              </label>
            ))}
          </div>

          {form.data.family.mother.status === 'Alive' && (
            <>
              <input
                className={`${lineInput} ${!mother.age_alive && motherAlive ? 'border-red-600' : ''}`}
                placeholder="Current age"
                value={form.data.family.mother.age_alive}
                onChange={(e) =>
                  form.setData('family.mother.age_alive', e.target.value)
                }
              />

              <input
              className={`${lineInput} ${!mother.diseases && motherAlive ? 'border-red-600' : ''}`}
              placeholder="Diseases"
              value={form.data.family.mother.diseases}
              onChange={(e) =>
                form.setData('family.mother.diseases', e.target.value)
              }
            />
            <input
              className={`${lineInput} ${!mother.medications && motherAlive ? 'border-red-600' : ''}`}
              placeholder="Maintenance medications"
              value={form.data.family.mother.medications}
              onChange={(e) =>
                form.setData('family.mother.medications', e.target.value)
              }
            />
            </>
          )}

          {form.data.family.mother.status === 'Deceased' && (
            <>
              <input
                className={`${lineInput} ${!mother.age_death && motherDeceased ? 'border-red-600' : ''}`}
                placeholder="Age at time of death"
                value={form.data.family.mother.age_death}
                onChange={(e) =>
                  form.setData('family.mother.age_death', e.target.value)
                }
              />
              <input
                className={`${lineInput} ${!mother.cause_death && motherDeceased ? 'border-red-600' : ''}`}
                placeholder="Cause of death"
                value={form.data.family.mother.cause_death}
                onChange={(e) =>
                  form.setData('family.mother.cause_death', e.target.value)
                }
              />
            </>
          )}
        </div>

        {/* FATHER */}
        <div className="space-y-2">
          <p className="font-medium">Father: <span className="text-red-600">*</span></p>
          <div className="flex gap-4">
            {['Alive', 'Deceased'].map((s) => (
              <label key={s} className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={form.data.family.father.status === s}
                  onChange={() => {
                    if (s === 'Alive') {
                      form.setData('family.father', {
                        ...form.data.family.father,
                        status: 'Alive',
                        age_death: '',
                        cause_death: '',
                      });
                    } else {
                      form.setData('family.father', {
                        ...form.data.family.father,
                        status: 'Deceased',
                        age_alive: '',
                        diseases: '',
                        medications: '',
                      });
                    }
                  }}
                />
                {s}
              </label>
            ))}
          </div>

          {form.data.family.father.status === 'Alive' && (
            <>
            <input
              className={`${lineInput} ${!father.age_alive && fatherAlive ? 'border-red-600' : ''}`}
              placeholder="Current age"
              value={form.data.family.father.age_alive}
              onChange={(e) =>
                form.setData('family.father.age_alive', e.target.value)
              }
            />
            <input
              className={`${lineInput} ${!father.diseases && fatherAlive ? 'border-red-600' : ''}`}
              placeholder="Diseases"
              value={form.data.family.father.diseases}
              onChange={(e) =>
                form.setData('family.father.diseases', e.target.value)
              }
            />
            <input
              className={`${lineInput} ${!father.medications && fatherAlive ? 'border-red-600' : ''}`}
              placeholder="Maintenance medications"
              value={form.data.family.father.medications}
              onChange={(e) =>
                form.setData('family.father.medications', e.target.value)
              }
            />
            </>
          )}

          {form.data.family.father.status === 'Deceased' && (
            <>
              <input
                className={`${lineInput} ${!father.age_death && fatherDeceased ? 'border-red-600' : ''}`}
                placeholder="Age at time of death"
                value={form.data.family.father.age_death}
                onChange={(e) =>
                  form.setData('family.father.age_death', e.target.value)
                }
              />
              <input
                className={`${lineInput} ${!father.cause_death && fatherDeceased ? 'border-red-600' : ''}`}
                placeholder="Cause of death"
                value={form.data.family.father.cause_death}
                onChange={(e) =>
                  form.setData('family.father.cause_death', e.target.value)
                }
              />
            </>
          )}
        </div>

        {/* SIBLINGS */}
        <div className="space-y-2 mt-4">
          <p className="font-medium">How many siblings do you have?</p>
          <input
            className={lineInput}
            placeholder="Number of siblings"
            value={form.data.family.siblings_count}
            onChange={(e) =>
              form.setData('family.siblings_count', e.target.value)
            }
          />

          <p className="font-medium mt-2">Any illnesses?</p>
          <input
            className={lineInput}
            placeholder="Illnesses of siblings"
            value={form.data.family.siblings_illnesses}
            onChange={(e) =>
              form.setData('family.siblings_illnesses', e.target.value)
            }
          />
        </div>

        {/* SPOUSE & CHILDREN */}
        {isMarried && (
          <div className="space-y-4 mt-4">
            <h2 className="font-medium">
              Answer the following questions IF YOU ARE MARRIED:
            </h2>

            {/* SPOUSE */}
            <p className="font-medium mt-2">Spouse:</p>
            <div className="flex gap-4">
              {['Alive', 'Deceased'].map((s) => (
                <label key={s} className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={form.data.family.spouse.status === s}
                    onChange={() => {
                      if (s === 'Alive') {
                        form.setData('family.spouse', {
                          ...spouse,
                          status: 'Alive',
                          age_death: '',
                          cause_death: '',
                        });
                      } else {
                        form.setData('family.spouse', {
                          ...spouse,
                          status: 'Deceased',
                          age_alive: '',
                          diseases: '',
                          medications: '',
                        });
                      }
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>

            {form.data.family.spouse.status === 'Alive' && (
              <>
              <input
                className={`${lineInput} ${!spouse.age_alive && spouseAlive ? 'border-red-600' : ''}`}
                placeholder="Current age"
                value={form.data.family.spouse.age_alive}
                onChange={(e) =>
                  form.setData('family.spouse.age_alive', e.target.value)
                }
              />
              <input
                className={`${lineInput} ${!spouse.diseases && spouseAlive ? 'border-red-600' : ''}`}
                placeholder="Diseases"
                value={form.data.family.spouse.diseases}
                onChange={(e) =>
                  form.setData('family.spouse.diseases', e.target.value)
                }
              />
              <input
                className={`${lineInput} ${!spouse.medications && spouseAlive ? 'border-red-600' : ''}`}
                placeholder="Maintenance medications"
                value={form.data.family.spouse.medications}
                onChange={(e) =>
                  form.setData('family.spouse.medications', e.target.value)
                }
              />
              </>
            )}

            {form.data.family.spouse.status === 'Deceased' && (
              <>
                <input
                  className={`${lineInput} ${!spouse.age_death && spouseDeceased  ? 'border-red-600' : ''}`}
                  placeholder="Age at time of death"
                  value={form.data.family.spouse.age_death}
                  onChange={(e) =>
                    form.setData('family.spouse.age_death', e.target.value)
                  }
                />
                <input
                  className={`${lineInput} ${!spouse.cause_death && spouseDeceased  ? 'border-red-600' : ''}`}
                  placeholder="Cause of death"
                  value={form.data.family.spouse.cause_death}
                  onChange={(e) =>
                    form.setData('family.spouse.cause_death', e.target.value)
                  }
                />
              </>
            )}

            {/* CHILDREN */}
            <p className="font-medium mt-2">Children:</p>
            <input
              className={lineInput}
              placeholder="Number of children"
              value={form.data.family.children_count}
              onChange={(e) =>
                form.setData('family.children_count', e.target.value)
              }
            />
            <input
              className={lineInput}
              placeholder="Health problems"
              value={form.data.family.children_health_problems}
              onChange={(e) =>
                form.setData('family.children_health_problems', e.target.value)
              }
            />
          </div>
        )}

        {/* HEREDITARY TABLE */}
        <div className="overflow-x-auto">
          <p className="font-medium mb-2">
            Among your blood relatives, is there a history of: <span className="text-red-600"> *</span>
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
              {form.data.family.hereditary.map((item, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1">{item.disease} <span className="text-red-600">*</span></td>
                  <td className="border text-center">
                    <input
                      type="radio"
                      checked={item.answer === 'Yes'}
                      onChange={() =>
                        form.setData(`family.hereditary.${index}.answer`, 'Yes')
                      }
                    />
                  </td>
                  <td className="border text-center">
                    <input
                      type="radio"
                      checked={item.answer === 'No'}
                      onChange={() =>
                        form.setData(`family.hereditary.${index}`, {
                          ...item,
                          answer: 'No',
                          relation: '',
                        })
                      }
                    />
                  </td>
                  <td className="border px-2">
                    <input
                      className={`${lineInput} ${hereditaryErrors[index].relation ? 'border-red-600' : ''}`}
                      value={item.relation}
                      onChange={(e) =>
                        form.setData(`family.hereditary.${index}.relation`, e.target.value)
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
            1. Do you consume alcohol? If so, please specify the frequency and quantity.  <span className="text-red-600">*</span>
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
                className={`${lineInput} ${social.alcohol_use.answer === 'Yes' && !social.alcohol_use.details ? 'border-red-600' : ''}`}
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
            2. Do you feel the need or desire to reduce your alcohol consumption?  <span className="text-red-600">*</span>
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
                className={`${lineInput} ${social.reduce_alcohol.answer === 'Yes' && !social.reduce_alcohol.details ? 'border-red-600' : ''}`}
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
            3. Do you smoke? If yes, please indicate the frequency and amount.  <span className="text-red-600">*</span>
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
                className={`${lineInput} ${social.smoking.answer === 'Yes' && !social.smoking.details ? 'border-red-600' : ''}`}
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
            4. Have you used smokeless tobacco or vape within the past year?  <span className="text-red-600">*</span>
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
                className={`${lineInput} ${social.vape_tobacco.answer === 'Yes' && !social.vape_tobacco.details ? 'border-red-600' : ''}`}
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
            5. Are there any other medical conditions, illnesses, or relevant information that should be reported to the clinic?  <span className="text-red-600">*</span>
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
                className={`${lineInput} ${social.other_conditions.answer === 'Yes' && !social.other_conditions.details ? 'border-red-600' : ''}`}
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
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('preenrollment_page_6', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-5';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <Button
            disabled={
              savingNext ||
              savingPrev ||
              !motherValid ||
              !fatherValid ||
              !spouseValid ||
              !hereditaryValid ||
              !socialValid
            }
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
