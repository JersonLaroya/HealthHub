import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

interface Props {
  patient: {
    first_name?: string;
    last_name?: string;
    middle_initial?: string;
    birthdate?: string; // YYYY-MM-DD
    signature?: string;
  };
}

export default function PreenrollmentPage1({ patient }: Props) {

    console.log('Patient data:', patient);

    const middleInitial = patient.middle_name
        ? `${patient.middle_name.charAt(0).toUpperCase()}.`
        : '';
  // helpers
  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();
  const printedName = `${patient.first_name} ${middleInitial} ${patient.last_name}`.replace(/\s+/g, ' ').trim();

  const formatBirthdate = () => {
    if (!patient.birthdate) return '';
    const d = new Date(patient.birthdate);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const form = useForm({
    name: fullName,
    birthdate: formatBirthdate(),

    data_privacy_consent: false,
    assessment_consent: false,

    signature_printed: `${printedName}  ${todayFormatted}`,
  });

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    form.post('/user/medical-forms/preenrollment/page-1');
  };

  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  return (
    <AppLayout>
      <Head title="Preenrollment – Page 1" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        <form onSubmit={submitPage} className="space-y-6">

          {/* NAME + BIRTHDATE (ONE ROW) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="sm:col-span-3 flex items-center gap-3">
              <span className="font-semibold whitespace-nowrap">Name:</span>
              <input
                className={lineInput}
                value={form.data.name}
                readOnly
              />
            </div>

            <div className="sm:col-span-1 flex items-center gap-3 justify-end">
              <span className="font-semibold whitespace-nowrap">Birthdate:</span>
              <input
                className={lineInput}
                value={form.data.birthdate}
                readOnly
              />
            </div>
          </div>

          {/* DATA SUBJECT CONSENT */}
          <div className="text-sm leading-relaxed text-center">
            <p className="font-semibold mb-2">DATA SUBJECT CONSENT</p>
            <p className="mx-auto max-w-3xl">
              In accordance with the provisions of the Data Privacy Act of 2012
              and its corresponding regulations, we implement appropriate
              security measures to safeguard the personal data we collect. We
              assure you that your personal data will be collected, processed,
              and stored with the utmost care for the purpose of health
              assessment, treatment, and/or research, adhering to ethical
              research guidelines to enhance healthcare services. The Bohol
              Island State University Health Service maintains strict security
              and confidentiality protocols when handling personal data.
            </p>
          </div>

          {/* FIRST CHECKBOX */}
          <div className="flex items-start justify-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.data.data_privacy_consent}
              onChange={e =>
                form.setData('data_privacy_consent', e.target.checked)
              }
              className="mt-1"
            />
            <span className="max-w-3xl text-left">
              By providing my authorization and consent, I acknowledge and agree
              to the aforementioned purposes. I understand that this consent
              will remain valid until I choose to revoke it in writing.
            </span>
          </div>

          {/* CONSENT FOR ASSESSMENT */}
          <div className="text-center mt-4">
            <p className="font-semibold text-sm">CONSENT FOR ASSESSMENT</p>

            <div className="flex items-start justify-center gap-2 mt-1 text-sm">
              <input
                type="checkbox"
                checked={form.data.assessment_consent}
                onChange={e =>
                  form.setData('assessment_consent', e.target.checked)
                }
                className="mt-1"
              />
              <span className="max-w-3xl text-left">
                I hereby provide my voluntary consent for the healthcare
                professionals at Bohol Island State University Health Service to
                perform a comprehensive physical examination and mental health
                screening, review my laboratory tests, and administer any
                necessary treatment before admission to the University.
              </span>
            </div>
          </div>

          {/* SIGNATURE */}
          <div className="flex justify-end mt-10">
            <div className="w-80 text-center space-y-2">

              {patient.signature && (
                <img
                  src={patient.signature.startsWith('http') ? patient.signature : `/storage/${patient.signature}`}
                  alt="Signature"
                  className="h-20 mx-auto object-contain w-full"
                />
              )}

              <input
                className={lineInput + ' text-center uppercase'}
                value={form.data.signature_printed}
                readOnly
              />

              <p className="text-xs">
                Signature over Printed Name / Date signed
              </p>
            </div>
          </div>

          {/* NEXT */}
          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
