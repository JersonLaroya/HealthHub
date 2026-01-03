import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

interface Props {
  patient: {
    sex?: string;
  };
}

export default function PreenrollmentPage5({ patient }: Props) {
  const savedData = sessionStorage.getItem('preenrollment_page_5');

  const form = useForm({
  ...(
    savedData
      ? {
          ...JSON.parse(savedData),
          immunization: Array.isArray(JSON.parse(savedData).immunization)
            ? JSON.parse(savedData).immunization
            : [
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
              ],
        }
      : {
          immunization: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          femaleHealth: ['', '', '', '', '', '', '', '', '', false, ''],
        }
  ),
});

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('preenrollment_page_5', JSON.stringify(form.data));
    window.location.href =
      '/user/fill-forms/pre-enrollment-health-form/page-6';
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
                className="w-32 border-b border-black bg-transparent focus:outline-none"
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
                className="w-32 border-b border-black bg-transparent focus:outline-none"
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
                className={lineInput}
                value={form.data.femaleHealth[0]} // menstruationAge
                onChange={(e) =>
                  form.setData('femaleHealth.0', e.target.value)
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
                      checked={form.data.femaleHealth[1] === opt} // menstruationRegularity
                      onChange={() =>
                        form.setData('femaleHealth.1', opt)
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
                value={form.data.femaleHealth[2]} // menstruationDuration
                onChange={(e) =>
                  form.setData('femaleHealth.2', e.target.value)
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
                      checked={form.data.femaleHealth[3] === flow} // menstruationFlow
                      onChange={() =>
                        form.setData('femaleHealth.3', flow)
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
                      checked={form.data.femaleHealth[4] === opt} // dysmenorrhea
                      onChange={() =>
                        form.setData('femaleHealth.4', opt)
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
                className={lineInput}
                value={form.data.femaleHealth[5]} // lastMenstrualPeriod
                onChange={(e) =>
                  form.setData('femaleHealth.5', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label>Have you had any trouble with your breasts, such as lumps, tumor, surgery?</label>
              <div className="flex gap-4 mt-1">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth[6] === opt} // breastTrouble
                      onChange={() =>
                        form.setData('femaleHealth.6', opt)
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>

              {form.data.femaleHealth[6] === 'Yes' && (
                <input
                  className={lineInput + ' mt-1'}
                  placeholder="If so, give details"
                  value={form.data.femaleHealth[7]} // breastDetails
                  onChange={(e) =>
                    form.setData('femaleHealth.7', e.target.value)
                  }
                />
              )}
            </div>

            <div>
              <label>Are you pregnant NOW?</label>
              <div className="flex gap-4 mt-1">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.data.femaleHealth[8] === opt} // pregnantNow
                      onChange={() =>
                        form.setData('femaleHealth.8', opt)
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
                  checked={form.data.femaleHealth[9]} // haveChildren
                  onChange={(e) =>
                    form.setData('femaleHealth.9', e.target.checked)
                  }
                />
                Do you have children?
              </label>

              {form.data.femaleHealth[9] && (
                <input
                  className={lineInput + ' mt-1'}
                  placeholder="How many?"
                  value={form.data.femaleHealth[10]} // numberOfChildren
                  onChange={(e) =>
                    form.setData('femaleHealth.10', e.target.value)
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
            onClick={() => {
              sessionStorage.setItem(
                'preenrollment_page_5',
                JSON.stringify(form.data)
              );
              window.location.href =
                '/user/fill-forms/pre-enrollment-health-form/page-4';
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
