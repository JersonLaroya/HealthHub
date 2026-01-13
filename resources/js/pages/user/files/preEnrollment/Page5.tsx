import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
  patient: {
    sex?: string;
  };
}

export default function PreenrollmentPage5({ patient }: Props) {
  const savedData = sessionStorage.getItem('preenrollment_page_5');
  let parsedData = savedData ? JSON.parse(savedData) : {};

  const femaleHealth = parsedData.femaleHealth
  ? Array.isArray(parsedData.femaleHealth)
    ? {
        menstruationAge: parsedData.femaleHealth[0] || '',
        menstruationRegularity: parsedData.femaleHealth[1] || '',
        menstruationDuration: parsedData.femaleHealth[2] || '',
        menstruationFlow: parsedData.femaleHealth[3] || '',
        dysmenorrhea: parsedData.femaleHealth[4] || '',
        lastMenstrualPeriod: parsedData.femaleHealth[5] || '',
        breastTrouble: parsedData.femaleHealth[6] || '',
        breastDetails: parsedData.femaleHealth[7] || '',
        pregnantNow: parsedData.femaleHealth[8] || '',
        haveChildren: parsedData.femaleHealth[9] || false,
        numberOfChildren: parsedData.femaleHealth[10] || '',
      }
    : parsedData.femaleHealth
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

    const form = useForm({
      ...parsedData,
      immunization: parsedData.immunization ?? Array(15).fill(''),
      femaleHealth, // normalized object
    });

  const immunizationErrors = form.data.immunization.map(v => !v || !v.trim());
  const immunizationValid = immunizationErrors.every(v => v === false);

  const isFemale = patient.sex === 'Female';

const femaleErrors = {
  menstruationAge: isFemale && !form.data.femaleHealth.menstruationAge,
  menstruationDuration: isFemale && !form.data.femaleHealth.menstruationDuration,
  lastMenstrualPeriod: isFemale && !form.data.femaleHealth.lastMenstrualPeriod,

  breastDetails:
    isFemale &&
    form.data.femaleHealth.breastTrouble === 'Yes' &&
    !form.data.femaleHealth.breastDetails,

  numberOfChildren:
    isFemale &&
    form.data.femaleHealth.haveChildren &&
    !form.data.femaleHealth.numberOfChildren,
};

const femaleValid =
  !isFemale ||
  (
    !femaleErrors.menstruationAge &&
    !femaleErrors.menstruationDuration &&
    !femaleErrors.lastMenstrualPeriod &&
    !femaleErrors.breastDetails &&
    !femaleErrors.numberOfChildren &&
    form.data.femaleHealth.menstruationRegularity &&
    form.data.femaleHealth.menstruationFlow &&
    form.data.femaleHealth.dysmenorrhea &&
    form.data.femaleHealth.breastTrouble &&
    form.data.femaleHealth.pregnantNow
  );

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';
    const [savingNext, setSavingNext] = useState(false);
    const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    sessionStorage.setItem('preenrollment_page_5', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-6';
  };


  return (
    <AppLayout>
      <Head title="Pre-Enrollment – Page 5" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        <h2 className="text-lg font-semibold">IMMUNIZATION RECORD</h2>

        {/* IMMUNIZATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        {/* COLUMN 1 */}
        <div className="space-y-2">
          {[
            ['BCG', 0], // Index for bcg
            ['Hepa B – Dose 1', 1], // hepaB1
            ['Hepa B – Dose 2', 2], // hepaB2
            ['Hepa B – Dose 3', 3], // hepaB3
            ['Tetanus Toxoid', 4], // tetanusToxoid
            ['Rabies Vaccine', 5], // rabiesVaccine
            ['Flu', 6], // flu
            ['Pneumococcal', 7], // pneumococcal
          ].map(([label, idx]) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex-1">{label}</span>
              <input
                className={
                  "w-32 border-b bg-transparent focus:outline-none " +
                  (immunizationErrors[idx] ? "border-red-600" : "border-black")
                }
                placeholder="Date / Year or N/A"
                value={form.data.immunization[idx]}
                onChange={(e) =>
                  form.setData(`immunization.${idx}`, e.target.value)
                }
              />
            </div>
          ))}
          <p className="text-xs italic">
            * Write N/A if vaccine not given
          </p>
        </div>

        {/* COLUMN 2 */}
        <div className="space-y-2">
          {[
            ['Hepa A – Dose 1', 8], // hepaA1
            ['Hepa A – Dose 2', 9], // hepaA2
            ['COVID-19 Vaccine Brand', 10], // covidBrand
            ['COVID-19 – Dose 1', 11], // covidDose1
            ['COVID-19 – Dose 2', 12], // covidDose2
            ['COVID-19 – Booster 1', 13], // covidBooster1
            ['COVID-19 – Booster 2', 14], // covidBooster2
          ].map(([label, idx]) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex-1">{label}</span>
              <input
                className={
                  "w-32 border-b bg-transparent focus:outline-none " +
                  (immunizationErrors[idx] ? "border-red-600" : "border-black")
                }
                placeholder="Date / Year"
                value={form.data.immunization[idx]}
                onChange={(e) =>
                  form.setData(`immunization.${idx}`, e.target.value)
                }
              />
            </div>
          ))}
          <p className="text-xs italic">
            * Write year of birth if vaccine given at &lt; 1 year old
          </p>
        </div>
      </div>

      {/* FEMALE ONLY */}
      {patient.sex === 'Female' && (
        <>
          <h2 className="text-lg font-semibold mt-6">
            FOR FEMALE STUDENTS ONLY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label>Menstruation: Age of onset</label>
              <input
                className={`${lineInput} ${femaleErrors.menstruationAge ? 'border-red-600' : ''}`}
                value={form.data.femaleHealth.menstruationAge}
                onChange={(e) =>
                  form.setData('femaleHealth', {
                    ...form.data.femaleHealth,
                    menstruationAge: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Regularity <span className="text-red-600">*</span></label>
              <div className="flex gap-4 mt-1">
                {['Regular', 'Irregular'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth.menstruationRegularity === opt}
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
                className={`${lineInput} ${femaleErrors.menstruationDuration ? 'border-red-600' : ''}`}
                value={form.data.femaleHealth.menstruationDuration}
                onChange={(e) =>
                  form.setData('femaleHealth', {
                    ...form.data.femaleHealth,
                    menstruationDuration: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Flow <span className="text-red-600">*</span></label>
              <div className="flex gap-4 mt-1">
                {['Light', 'Moderate', 'Heavy'].map((flow) => (
                  <label key={flow} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth.menstruationFlow === flow}
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
              <label>Dysmenorrhea <span className="text-red-600">*</span></label>
              <div className="flex gap-4 mt-1">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth.dysmenorrhea === opt}
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
              <label>Last menstrual period (month and year)</label>
              <input
                className={`${lineInput} ${femaleErrors.lastMenstrualPeriod ? 'border-red-600' : ''}`}
                value={form.data.femaleHealth.lastMenstrualPeriod}
                onChange={(e) =>
                  form.setData('femaleHealth', {
                    ...form.data.femaleHealth,
                    lastMenstrualPeriod: e.target.value,
                  })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label>Have you had any trouble with your breasts, such as lumps, tumor, surgery? <span className="text-red-600">*</span></label>
              <div className="flex gap-4 mt-1">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth.breastTrouble === opt}
                      onChange={() =>
                        form.setData('femaleHealth', {
                          ...form.data.femaleHealth,
                          breastTrouble: opt,
                          breastDetails: opt === 'Yes'
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
                  className={`${lineInput} mt-1 ${femaleErrors.breastDetails ? 'border-red-600' : ''}`}
                  value={form.data.femaleHealth.breastDetails}
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      breastDetails: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <div>
              <label>Are you pregnant NOW? <span className="text-red-600">*</span></label>
              <div className="flex gap-4 mt-1">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth.pregnantNow === opt}
                      onChange={() =>
                        form.setData('femaleHealth', {
                          ...form.data.femaleHealth,
                          pregnantNow: opt,
                        })
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.data.femaleHealth.haveChildren}
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      haveChildren: e.target.checked,
                      numberOfChildren: e.target.checked
                        ? form.data.femaleHealth.numberOfChildren
                        : '',
                    })
                  }
                />
                Do you have children?
              </label>

              {form.data.femaleHealth.haveChildren && (
                <input
                  className={`${lineInput} mt-1 ${femaleErrors.numberOfChildren ? 'border-red-600' : ''}`}
                  value={form.data.femaleHealth.numberOfChildren}
                  placeholder="Number of children (e.g., 3)"
                  onChange={(e) =>
                    form.setData('femaleHealth', {
                      ...form.data.femaleHealth,
                      numberOfChildren: e.target.value,
                    })
                  }
                />
              )}

              <p className="text-xs italic mt-1">
                * provide special needs form if single parent
              </p>
            </div>
          </div>
        </>
      )}

        {/* NAVIGATION */}
        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('preenrollment_page_5', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-4';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <Button
            disabled={savingNext || savingPrev || !immunizationValid || !femaleValid}
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
