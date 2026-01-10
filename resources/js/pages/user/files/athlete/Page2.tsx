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
    course?: string;
    contact_no?: string;
    year?: string;
    office?: string;
    home_address?: string;
    present_address?: string;
    guardian_name?: string;
    signature?: string;
  };
}

export default function AthletePage2({ patient }: Props) {
  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';
  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();
  const printedName = `${patient.first_name} ${middleInitial} ${patient.last_name}`.replace(/\s+/g, ' ').trim();

  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  function calculateAge(birthdate: string) {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const form = useForm({
    name: fullName,

    sport_event: '',
    student_id: '',
    activity: '',
    activity_participated: '',
    organized_by: '',
    hereby_release: '',

    printed_name: printedName,
    signature_image: patient.signature || null,
    date: todayFormatted,
  });

    useEffect(() => {
        const saved = sessionStorage.getItem('athlete_page_2');
        if (saved) {
            form.setData({
            ...form.data,         // keep current defaults
            ...JSON.parse(saved), // overwrite with saved values
            });
        }
    }, []);

  useEffect(() => {
    console.log('Live Athlete Form Data:', form.data);
  }, [form.data]);

  useEffect(() => {
  const savedPage1 = sessionStorage.getItem('athlete_page_1');
  if (savedPage1) {
    console.log('SessionStorage - Page 1 data:', JSON.parse(savedPage1));
  } else {
    console.log('No data found in sessionStorage for page 1');
  }
}, []);


  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true);
    sessionStorage.setItem('athlete_page_2', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/athlete-medical/page-3';
  };

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 2" />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        
        <h1 className="text-2xl font-semibold text-center">
            ATHLETE / PERFORMER MEDICAL DATA SHEET
        </h1>

        <form onSubmit={submitPage} className="space-y-6">
            {/* MEDICAL AGREEMENT */}
            <div className="space-y-4 text-sm p-4">
                <h2 className="font-semibold text-center">MEDICAL AGREEMENT</h2>

                {/* Sport/Event */}
                <div className="text-sm flex items-center space-x-2">
                    <label className="whitespace-nowrap">Sport/Event:</label>
                    <input
                    type="text"
                    value={form.data.sport_event}
                    onChange={(e) => form.setData('sport_event', e.target.value)}
                    className="w-[200px] border-b border-gray-400 focus:border-blue-500 focus:outline-none h-8 text-sm"
                    />
                </div>

                {/* First Paragraph */}
                <div className="text-sm whitespace-pre-wrap">
                    I,{' '}
                    <input
                    type="text"
                    value={form.data.name}
                    readOnly
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />{' '}
                    with student ID{' '}
                    <input
                    type="text"
                    value={form.data.student_id}
                    onChange={(e) => form.setData('student_id', e.target.value)}
                    className="inline w-24 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />, express my desire to participate in the{' '}
                    <input
                    type="text"
                    value={form.data.activity_participated}
                    onChange={(e) => form.setData('activity_participated', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />{' '}
                    organized by{' '}
                    <input
                    type="text"
                    value={form.data.organized_by}
                    onChange={(e) => form.setData('organized_by', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                    />. I acknowledge that the event involves various activities such as practices, weight training, competitions, travel, and injury treatment. I confirm that I am in good health and physical condition, and I commit to engaging only in activities that are within my physical capabilities.
                </div>

                {/* Second Paragraph */}
                <div className="text-sm whitespace-pre-wrap">
                I am fully aware and understand that participating in any{' '}
                <input
                    type="text"
                    value={form.data.activity}
                    onChange={(e) => form.setData('activity', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                />{' '}
                activities carry both known and unforeseen risks that may result in physical or mental illness. These risks include, but are not limited to: 1.) cuts, bruises, sprains, fractures, trauma, and/or disease; 2.) paralysis, which can involve the loss or impairment of movement, strength, feeling, or the use of a body part or function, potentially lasting a lifetime; 3.) disfigurement; 4.) death; 5.) injuries related to temperature or weather conditions, such as hyperthermia, dehydration, and heat exhaustion; 6.) injuries resulting from the use or non-use of sports equipment; 7.) injuries during travel to, from, and during{' '}
                <input
                    type="text"
                    value={form.data.activity}
                    onChange={(e) => form.setData('activity', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                />{' '}
                activities; 8.) injuries caused by negligent or intentional acts or omissions of university personnel, teammates, participants, officials, spectators, or others; and 9.) injuries due to the inaccessibility of emergency medical care or negligent medical care during injury treatment.
                </div>

                {/* Third Paragraph */}
                <div className="text-sm whitespace-pre-wrap">
                Given the potential risks, I recognize the importance of adhering to all rules and regulations pertaining to{' '}
                <input
                    type="text"
                    value={form.data.activity}
                    onChange={(e) => form.setData('activity', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                />{' '}
                activities, as well as following the instructions provided by my coaches and trainers regarding rules, techniques, training, equipment, and injuries. I understand that failure to comply with such rules and instructions may result in injury to myself or my opponents. Furthermore, I am aware that even when abiding by all rules and regulations and using appropriate safety equipment, there remains a significant risk of injury inherent in sports/activities. I agree to promptly report all injuries to the University Health Service and acknowledge my responsibility for seeking necessary follow-up care and treatment under the supervision of my coach or trainer.
                </div>

                {/* Fourth Paragraph */}
                <div className="text-sm whitespace-pre-wrap">
                In consideration of being allowed to participate in{' '}
                <input
                    type="text"
                    value={form.data.activity}
                    onChange={(e) => form.setData('activity', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                />{' '}
                activities, I hereby release{' '}
                <input
                    type="text"
                    value={form.data.hereby_release}
                    onChange={(e) => form.setData('hereby_release', e.target.value)}
                    className="inline w-40 border-b border-gray-400 focus:border-blue-500 focus:outline-none h-6 text-sm mx-1"
                />, its trustees, officers, employees, agents, representatives, coaches, trainers, and volunteers from any and all claims, demands, losses, liabilities, obligations, damages, causes of action, and costs.
                </div>

                {/* Fifth Paragraph */}
                <div className="text-sm whitespace-pre-wrap">
                    I affirm that I have carefully read and understood the terms of this agreement. I have entered into this agreement knowingly, voluntarily, and of my own free will, and I intend to comply with its provisions without exception.
                </div>

                {/* Signature + Date */}
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
                    className={lineInput + ' text-center uppercase'}
                    value={form.data.printed_name}
                    readOnly
                    />
                    <p className="text-xs">Signature over Printed Name of Student</p>
                </div>

                {/* Right: Date */}
                <div className="w-1/3 text-center space-y-1">
                    <input
                    type="text"
                    className={lineInput + ' text-center'}
                    value={form.data.date || todayFormatted} // can default to today's date
                    onChange={(e) => form.setData('date', e.target.value)}
                    />
                    <p className="text-xs">Date</p>
                </div>
                </div>
            </div>

          {/* NAVIGATION */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="secondary"
              disabled={savingPrev || savingNext}
              onClick={() => {
                setSavingPrev(true);
                sessionStorage.setItem('athlete_page_2', JSON.stringify(form.data));
                window.location.href = '/user/fill-forms/athlete-medical/page-1';
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
