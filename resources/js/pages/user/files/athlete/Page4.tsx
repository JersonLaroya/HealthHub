import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Props {
  patient: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    signature?: string;
  };
}

export default function AthletePage4({ patient }: Props) {
  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  // Page 2 data
  const page2Data = sessionStorage.getItem('athlete_page_2');
  const parsedPage2 = page2Data ? JSON.parse(page2Data) : {};
  const activity = parsedPage2.activity || '';
  const organized_by = parsedPage2.organized_by || '';

  const today = new Date();
  const todayFormatted = `${String(today.getMonth() + 1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;

  const printedName = `${patient.first_name || ''} ${patient.middle_name ? patient.middle_name.charAt(0) + '.' : ''} ${patient.last_name || ''}`.trim();

  // Form state
  const form = useForm({
    // Acknowledgement section
    ack_printed_name: printedName,
    ack_signature: patient.signature || null,
    ack_date: todayFormatted,

    // Consent to Treat section
    consent_printed_name: printedName,
    consent_signature: patient.signature || null,
    consent_date: todayFormatted,
  });

  // Load previous Page 4 data if exists
  useEffect(() => {
    const page4Data = sessionStorage.getItem('athlete_page_4');
    if (page4Data) {
      form.setData({ ...form.data, ...JSON.parse(page4Data) });
    }
  }, []);

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem('athlete_page_4', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/athlete-medical/page-5';
  };

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 4" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          ATHLETE / PERFORMER MEDICAL DATA SHEET
        </h1>

        {/* ACKNOWLEDGEMENT OF HEALTH SCREENING */}
        <div className="space-y-4 text-sm p-4">
          <h2 className="font-semibold text-center">ACKNOWLEDGEMENT OF HEALTH SCREENING</h2>

          <p className="whitespace-pre-wrap">
            I hereby confirm that since my last health screening, I have not experienced any significant illnesses or injuries. I believe that I am physically capable of participating in the{' '}
            <input
              type="text"
              value={activity}
              readOnly
              className="inline w-48 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
            />{' '}
            through practices and competitions. However, in the event that I feel unable to practice or compete due to any injury or illness during the competition, I understand that it is {' '}
            <strong>MY RESPONSIBILITY TO IMMEDIATELY INFORM</strong>{' '} the medical staff and coaches/trainers.
          </p>

          <p className="whitespace-pre-wrap">
            I acknowledge that I am undergoing a pre-participation health screening, which is a requirement for my participation in the{' '}
            <input
              type="text"
              value={activity}
              readOnly
              className="inline w-48 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
            />.
          </p>

          {/* Signature + Date */}
          <div className="flex justify-between mt-4 items-center">
            <div className="w-1/2 text-center space-y-1">
              {patient.signature && (
                <img
                  src={patient.signature.startsWith('http') ? patient.signature : `/storage/${patient.signature}`}
                  alt="Signature"
                  className="h-16 mx-auto object-contain w-full"
                />
              )}
              <input
                type="text"
                className={`${lineInput} text-center uppercase`}
                value={form.data.ack_printed_name}
                readOnly
              />
              <p className="text-xs">Signature over Printed Name of Student</p>
            </div>

            <div className="w-1/3 text-center space-y-1">
              <input
                type="text"
                className={`${lineInput} text-center`}
                value={form.data.ack_date}
                onChange={(e) => form.setData('ack_date', e.target.value)}
              />
              <p className="text-xs">Date</p>
            </div>
          </div>
        </div>

        {/* CONSENT TO TREAT */}
        <div className="space-y-4 text-sm p-4">
          <h2 className="font-semibold text-center">CONSENT TO TREAT</h2>

          <p className="whitespace-pre-wrap">
            I give permission for the University Health Services to evaluate, provide necessary treatment and/or referral to a specialist for any injuries or illnesses that occurs as a result of my participation at{' '}
            <input
              type="text"
              value={activity}
              readOnly
              className="inline w-48 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
            /> of{' '}
            <input
              type="text"
              value={organized_by}
              readOnly
              className="inline w-48 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
            />. This participation may include practices, competition and/or traveling with the team.
          </p>

          {/* Signature + Date */}
          <div className="flex justify-between mt-4 items-center">
            <div className="w-1/2 text-center space-y-1">
              {patient.signature && (
                <img
                  src={patient.signature.startsWith('http') ? patient.signature : `/storage/${patient.signature}`}
                  alt="Signature"
                  className="h-16 mx-auto object-contain w-full"
                />
              )}
              <input
                type="text"
                className={`${lineInput} text-center uppercase`}
                value={form.data.consent_printed_name}
                readOnly
              />
              <p className="text-xs">Signature over Printed Name of Student</p>
            </div>

            <div className="w-1/3 text-center space-y-1">
              <input
                type="text"
                className={`${lineInput} text-center`}
                value={form.data.consent_date}
                onChange={(e) => form.setData('consent_date', e.target.value)}
              />
              <p className="text-xs">Date</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={savingPrev || savingNext}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('athlete_page_4', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/athlete-medical/page-3';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>
          <Button type="submit" disabled={savingNext || savingPrev} onClick={submitPage}>
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
