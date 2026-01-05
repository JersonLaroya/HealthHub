import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  patient: {
    sex?: string;
  };
}

export default function PreenrollmentPage4({ patient }: Props) {
  const savedData = sessionStorage.getItem('preemployment_page_4');
  const parsedData = savedData ? JSON.parse(savedData) : {};

  // FEMALE HEALTH (normalized)
  const femaleHealth = parsedData.femaleHealth
    ? {
        menstruationAge: parsedData.femaleHealth.menstruationAge || '',
        menstruationRegularity:
          parsedData.femaleHealth.menstruationRegularity || '',
        menstruationDuration:
          parsedData.femaleHealth.menstruationDuration || '',
        menstruationFlow: parsedData.femaleHealth.menstruationFlow || '',
        dysmenorrhea: parsedData.femaleHealth.dysmenorrhea || '',
        lastMenstrualPeriod:
          parsedData.femaleHealth.lastMenstrualPeriod || '',
        breastTrouble: parsedData.femaleHealth.breastTrouble || '',
        breastDetails: parsedData.femaleHealth.breastDetails || '',
        pregnantNow: parsedData.femaleHealth.pregnantNow || '',
        haveChildren: parsedData.femaleHealth.haveChildren || false,
        numberOfChildren: parsedData.femaleHealth.numberOfChildren || '',
      }
    : {
        menstruationAge: '',
        menstruationRegularity: '',
        menstruationDuration: '',
        menstruationFlow: '',
        dysmenorrhea: '',
        lastMenstrualPeriod: '',
        breastTrouble: '',
        breastDetails: '',
        pregnantNow: '',
        haveChildren: false,
        numberOfChildren: '',
      };

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

  // FAMILY HISTORY (normalized)
    const family = parsedData.family
    ? {
        mother: parsedData.family.mother || {
            living: '',
            age: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        father: parsedData.family.father || {
            living: '',
            age: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        spouse: parsedData.family.spouse || {
            living: '',
            age: '',
            generalHealth: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        children: parsedData.family.children || {
            number: '',
            healthProblems: '',
        },
        hereditary: Array.isArray(parsedData.family.hereditary)
            ? parsedData.family.hereditary
            : hereditaryDiseases.map((d) => ({
                disease: d,
                answer: '',
                relation: '',
            })),
        }
    : {
        mother: {
            living: '',
            age: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        father: {
            living: '',
            age: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        spouse: {
            living: '',
            age: '',
            generalHealth: '',
            diseases: '',
            medications: '',
            deceasedAge: '',
            causeOfDeath: '',
        },
        children: {
            number: '',
            healthProblems: '',
        },
        hereditary: hereditaryDiseases.map((d) => ({
            disease: d,
            answer: '',
            relation: '',
        })),
        };


  const form = useForm({
    ...parsedData,
    femaleHealth,
    family,
  });

  // Ensure nested objects exist
form.data.family = form.data.family || {};
form.data.family.mother = form.data.family.mother || {
  living: '',
  age: '',
  diseases: '',
  medications: '',
  deceasedAge: '',
  causeOfDeath: '',
};
form.data.family.father = form.data.family.father || {
  living: '',
  age: '',
  diseases: '',
  medications: '',
  deceasedAge: '',
  causeOfDeath: '',
};
form.data.family.spouse = form.data.family.spouse || {
  living: '',
  age: '',
  generalHealth: '',
  diseases: '',
  medications: '',
  deceasedAge: '',
  causeOfDeath: '',
};
form.data.family.children = form.data.family.children || {
  number: '',
  healthProblems: '',
};
form.data.family.hereditary =
  form.data.family.hereditary || hereditaryDiseases.map((d) => ({
    disease: d,
    answer: '',
    relation: '',
  }));

  useEffect(() => {
    if (savedData) {
      console.log('Loaded Page 4 data:', parsedData);
    }
  }, []);

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    console.log('Saving Page 4 data:', form.data);
    sessionStorage.setItem('preemployment_page_4', JSON.stringify(form.data));
    window.location.href =
      '/user/fill-forms/pre-employment-health-form/page-5';
  };

  return (
    <AppLayout>
      <Head title="Pre-Employment – Page 4" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        {/* FEMALE ONLY */}
        {patient.sex === 'Female' && (
          <>
            <h2 className="text-lg font-semibold">
              FOR FEMALE STUDENTS ONLY
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label>Menstruation: Age of onset</label>
                <input
                  className={lineInput}
                  value={form.data.femaleHealth.menstruationAge ?? ''}
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      menstruationAge: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Regularity</label>
                <div className="flex gap-4 mt-1">
                  {['Regular', 'Irregular'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={
                          form.data.femaleHealth.menstruationRegularity === opt
                        }
                        onChange={() =>
                          form.setData('femaleHealth', {
                            ...form.data.femaleHealth,
                            menstruationRegularity: opt,
                          })
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label>Duration (days)</label>
                <input
                  className={lineInput}
                  value={form.data.femaleHealth.menstruationDuration ?? ''}
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      menstruationDuration: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Flow</label>
                <div className="flex gap-4 mt-1">
                  {['Light', 'Moderate', 'Heavy'].map((flow) => (
                    <label key={flow} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={
                          form.data.femaleHealth.menstruationFlow === flow
                        }
                        onChange={() =>
                          form.setData('femaleHealth', {
                            ...form.data.femaleHealth,
                            menstruationFlow: flow,
                          })
                        }
                      />
                      {flow}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label>Dysmenorrhea</label>
                <div className="flex gap-4 mt-1">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={
                          form.data.femaleHealth.dysmenorrhea === opt
                        }
                        onChange={() =>
                          form.setData('femaleHealth', {
                            ...form.data.femaleHealth,
                            dysmenorrhea: opt,
                          })
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label>Last menstrual period (month & year)</label>
                <input
                  className={lineInput}
                  value={form.data.femaleHealth.lastMenstrualPeriod ?? ''}
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      lastMenstrualPeriod: e.target.value,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label>
                  Have you had any trouble with your breasts, such as lumps,
                  tumor, surgery?
                </label>
                <div className="flex gap-4 mt-1">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={
                          form.data.femaleHealth.breastTrouble === opt
                        }
                        onChange={() =>
                          form.setData('femaleHealth', {
                            ...form.data.femaleHealth,
                            breastTrouble: opt,
                            breastDetails:
                              opt === 'Yes'
                                ? form.data.femaleHealth.breastDetails
                                : '',
                          })
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                {form.data.femaleHealth.breastTrouble === 'Yes' && (
                  <input
                    className={lineInput + ' mt-1'}
                    placeholder="If so, give details:"
                    value={form.data.femaleHealth.breastDetails ?? ''}
                    onChange={(e) =>
                      form.setData('femaleHealth', {
                        ...form.data.femaleHealth,
                        breastDetails: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* FAMILY HISTORY */}
        <div className="space-y-4 text-sm">
          <h2 className="text-lg font-semibold">FAMILY HISTORY</h2>

          {/* FAMILY BACKGROUND */}
        <div className="space-y-4 text-sm">
        <h2 className="text-lg font-semibold">FAMILY BACKGROUND</h2>

        {/* MOTHER */}
        <div className="space-y-2">
            <p className="font-medium">Mother:</p>
            <div className="flex flex-wrap gap-4 items-center">
            <label>
                Living:
                <input
                className={lineInput + " ml-1 w-20"}
                placeholder="Age"
                value={form.data.family.mother.age_alive ?? ''}
                onChange={(e) =>
                    form.setData('family.mother.age_alive', e.target.value)
                }
                />
            </label>
            <label>
                Diseases:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.mother.diseases ?? ''}
                onChange={(e) =>
                    form.setData('family.mother.diseases', e.target.value)
                }
                />
            </label>
            <label>
                Maintenance medications:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.mother.medications ?? ''}
                onChange={(e) =>
                    form.setData('family.mother.medications', e.target.value)
                }
                />
            </label>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-1">
            <label>
                If deceased (age of death):
                <input
                className={lineInput + " ml-1 w-20"}
                value={form.data.family.mother.age_death ?? ''}
                onChange={(e) =>
                    form.setData('family.mother.age_death', e.target.value)
                }
                />
            </label>
            <label>
                Cause of death:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.mother.cause_death ?? ''}
                onChange={(e) =>
                    form.setData('family.mother.cause_death', e.target.value)
                }
                />
            </label>
            </div>
        </div>

        {/* FATHER */}
        <div className="space-y-2">
            <p className="font-medium">Father:</p>
            <div className="flex flex-wrap gap-4 items-center">
            <label>
                Living:
                <input
                className={lineInput + " ml-1 w-20"}
                placeholder="Age"
                value={form.data.family.father.age_alive ?? ''}
                onChange={(e) =>
                    form.setData('family.father.age_alive', e.target.value)
                }
                />
            </label>
            <label>
                Diseases:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.father.diseases ?? ''}
                onChange={(e) =>
                    form.setData('family.father.diseases', e.target.value)
                }
                />
            </label>
            <label>
                Maintenance medications:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.father.medications ?? ''}
                onChange={(e) =>
                    form.setData('family.father.medications', e.target.value)
                }
                />
            </label>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-1">
            <label>
                If deceased (age of death):
                <input
                className={lineInput + " ml-1 w-20"}
                value={form.data.family.father.age_death ?? ''}
                onChange={(e) =>
                    form.setData('family.father.age_death', e.target.value)
                }
                />
            </label>
            <label>
                Cause of death:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.father.cause_death ?? ''}
                onChange={(e) =>
                    form.setData('family.father.cause_death', e.target.value)
                }
                />
            </label>
            </div>
        </div>

        {/* SPOUSE */}
        <div className="space-y-2">
            <p className="font-medium">If married – Spouse:</p>
            <div className="flex flex-wrap gap-4 items-center">
            <label>
                Living:
                <input
                className={lineInput + " ml-1 w-20"}
                placeholder="Age"
                value={form.data.family.spouse.age_alive ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.age_alive', e.target.value)
                }
                />
            </label>
            <label>
                General health:
                <select
                className={lineInput + " ml-1 w-32"}
                value={form.data.family.spouse.generalHealth ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.generalHealth', e.target.value)
                }
                >
                <option value="">Select</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                </select>
            </label>
            <label>
                Diseases:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.spouse.diseases ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.diseases', e.target.value)
                }
                />
            </label>
            <label>
                Maintenance medications:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.spouse.medications ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.medications', e.target.value)
                }
                />
            </label>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-1">
            <label>
                If deceased (age of death):
                <input
                className={lineInput + " ml-1 w-20"}
                value={form.data.family.spouse.age_death ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.age_death', e.target.value)
                }
                />
            </label>
            <label>
                Cause of death:
                <input
                className={lineInput + " ml-1 w-40"}
                value={form.data.family.spouse.cause_death ?? ''}
                onChange={(e) =>
                    form.setData('family.spouse.cause_death', e.target.value)
                }
                />
            </label>
            </div>
        </div>

        {/* CHILDREN */}
        <div className="space-y-2">
            <p className="font-medium">Children:</p>
            <label>
                Number of children:
                <input
                    className={lineInput + " ml-1 w-20"}
                    value={form.data.family.children.number ?? ''}
                    onChange={(e) =>
                    form.setData('family.children.number', e.target.value)
                    }
                />
                </label>
                <label>
                Health problems:
                <input
                    className={lineInput + " ml-1 w-40"}
                    value={form.data.family.children.healthProblems ?? ''}
                    onChange={(e) =>
                    form.setData('family.children.healthProblems', e.target.value)
                    }
                />
                </label>
        </div>
        </div>

          <p className="font-medium">
            Among your blood relatives, is there a history of:
          </p>

          <div className="overflow-x-auto">
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
                {form.data.family?.hereditary?.map((item, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1">{item.disease}</td>

                    <td className="border text-center">
                      <input
                        type="radio"
                        checked={item.answer === 'Yes'}
                        onChange={() =>
                          form.setData(
                            `family.hereditary.${index}.answer`,
                            'Yes'
                          )
                        }
                      />
                    </td>

                    <td className="border text-center">
                      <input
                        type="radio"
                        checked={item.answer === 'No'}
                        onChange={() =>
                          form.setData(
                            `family.hereditary.${index}.answer`,
                            'No'
                          )
                        }
                      />
                    </td>

                    <td className="border px-2">
                      <input
                        className={lineInput}
                        value={item.relation}
                        onChange={(e) =>
                          form.setData(
                            `family.hereditary.${index}.relation`,
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
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem(
                'preemployment_page_4',
                JSON.stringify(form.data)
              );
              window.location.href =
                '/user/fill-forms/pre-employment-health-form/page-3';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <Button disabled={savingNext || savingPrev} onClick={submitPage}>
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
