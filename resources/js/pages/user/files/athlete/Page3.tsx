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
    contact_no?: string;
    home_address?: string;
    present_address?: string;
    signature?: string;
  };
}

export default function AthletePage3({ patient }: Props) {
  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  // Page 2 data
  const page2Data = sessionStorage.getItem('athlete_page_2');
  const parsedPage2 = page2Data ? JSON.parse(page2Data) : {};
  const studentName = parsedPage2.name || '';
  const sport_event = parsedPage2.sport_event || '';
  const student_id = parsedPage2.student_id || '';
  const activity = parsedPage2.activity || '';
  const activity_participated = parsedPage2.activity_participated || '';
  const organized_by = parsedPage2.organized_by || '';

  const today = new Date();
  const todayFormatted = `${String(today.getMonth() + 1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;

  // Helper to format birthdate
    function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
    }

  // Form state
  const form = useForm({
    student: studentName,
    home_address: patient.home_address || '',
    school_address: patient.present_address || '',
    contact_no: patient.contact_no || '',
    birthdate: formatDate(patient.birthdate),
    sport_event: sport_event,
    student_id: student_id,
    printed_name: `${patient.last_name || ''} ${patient.first_name || ''}`, // default to student's full name
    date: todayFormatted,
  });

  // Load previous Page 3 data if exists
  useEffect(() => {
    const page3Data = sessionStorage.getItem('athlete_page_3');
    if (page3Data) {
      form.setData({ ...form.data, ...JSON.parse(page3Data) });
    }
  }, []);

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem('athlete_page_3', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/athlete-medical/page-4';
  };

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 3" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          ATHLETE / PERFORMER MEDICAL DATA SHEET
        </h1>

        <h2 className="text-lg font-semibold text-center mt-4">
          CONSENT FOR THE RELEASE OF PROTECTED HEALTH INFORMATION
        </h2>

        <form onSubmit={submitPage} className="space-y-6 mt-6 text-sm">
          {/* Student */}
          <div>
            Student:{' '}
            <input
              type="text"
              className={`${lineInput} inline w-96 mx-1`}
              value={form.data.student}
              readOnly
            />
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              Address:
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.home_address}
                readOnly
              />
            </div>
            <div>
              Address while in school:
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.school_address}
                readOnly
              />
            </div>
          </div>

          {/* Contact No and Birthdate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              Contact No:{' '}
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.contact_no}
                readOnly
              />
            </div>
            <div>
              Date of Birth:{' '}
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.birthdate}
                readOnly
              />
            </div>
          </div>

          {/* Sport/Event and Student ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              Sport(s) / Event(s):{' '}
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.sport_event}
                readOnly
              />
            </div>
            <div>
              Student ID:{' '}
              <input
                type="text"
                className={`${lineInput} inline w-full`}
                value={form.data.student_id}
                readOnly
              />
            </div>
          </div>

          {/* Consent Text */}
        <div className="text-sm mt-4 space-y-2 p-4">
          <p>
            I hereby grant Bohol Island State University the authorization to release my protected health information. This information may include the following:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Injury or illness relevant to my past, present, or future participation in the {' '}
                    <input
                    type="text"
                    value={activity}
                    readOnly
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />{' '} activities.
            </li>
            <li>
              Information contained in my personal medical record that is unrelated to my participation in <input
                    type="text"
                    value={activity_participated}
                    readOnly
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />{' '} at <input
                    type="text"
                    value={organized_by}
                    readOnly
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />{' '}.
            </li>
            <li>
              Information regarding my medical status, medical condition, injuries, prognosis, diagnosis, and other personally identifiable health information. This includes injury reports, test results, x-rays, progress reports, and any other documentation related to my health status.
            </li>
          </ol>
          <p>I authorize the release of my protected health information to the following parties:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>My parents/guardians and/or spouse, to assist me in making healthcare decisions while I am a student-athlete/performer.</li>
            <li>Coaches, assistant coaches, trainers, and other staff members involved in making decisions regarding my athletic/performance ability and suitability to compete.</li>
            <li>Students (RCY volunteers) participating in the provision of healthcare and first-aid to assist in providing healthcare to me.</li>
            <li>The University Director of Sports and Culture and Arts and the Dean of my department, for the purpose of making decisions regarding my academic ability and suitability to perform.</li>
            <li>Insurance providers for processing insurance claims.</li>
            <li>Medical personnel for the purpose of ensuring continuity of care.</li>
          </ol>
        </div>

        {/* Signature + Date in one row */}
        <div className="flex justify-between mt-6 items-center">
            {/* Left: Signature over Printed Name */}
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
                value={form.data.printed_name}
                readOnly
                />
                <p className="text-xs">Signature over Printed Name of Student</p>
            </div>

            {/* Right: Date */}
            <div className="w-1/3 text-center space-y-1">
                <input
                type="text"
                className={`${lineInput} text-center`}
                value={form.data.date || todayFormatted} // default to today's date
                onChange={(e) => form.setData('date', e.target.value)}
                />
                <p className="text-xs">Date</p>
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
                sessionStorage.setItem('athlete_page_3', JSON.stringify(form.data));
                window.location.href = '/user/fill-forms/athlete-medical/page-2';
              }}
            >
              {savingPrev ? 'Going back…' : 'Previous'}
            </Button>
            <Button type="submit" disabled={savingNext || savingPrev}>
              {savingNext ? 'Continuing…' : 'Next'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
