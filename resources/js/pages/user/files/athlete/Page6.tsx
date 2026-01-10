import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { fillAthleteMedicalForm } from '@/utils/fillAthleteMedicalForm';
import { toast } from 'sonner';

interface Props {
  patient: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    signature?: string;
  };
}

export default function AthletePage6({ patient }: Props) {
  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  // Load Page 5 data
  const page5Data = sessionStorage.getItem('athlete_page_5');
  const parsedPage5 = page5Data ? JSON.parse(page5Data) : {};
  const age = parsedPage5.age || '';
  const sex = parsedPage5.sex || '';
  const civil_status = parsedPage5.civil_status || '';

  const today = new Date();
  const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(
    today.getDate()
).padStart(2, '0')}/${today.getFullYear()}`;

  const printedName = `${patient.first_name || ''} ${
    patient.middle_name ? patient.middle_name.charAt(0) + '.' : ''
  } ${patient.last_name || ''}`.trim();

  useEffect(() => {
  // Initialize Physical Exam data in sessionStorage if it doesn't exist
  const savedPhysicalExam = sessionStorage.getItem('athlete_page_6_physical_exam');

  if (!savedPhysicalExam) {
    const emptyPhysicalExam = {
      vital_signs: {
        bp: '',       // mmHg
        pr: '',       // bpm
        rr: '',       // cpm
        temp: '',     // ℃
        o2_sat: '',   // %
      },
      anthropometric: {
        height: '',   // cm
        weight: '',   // kg
        bmi: '',      // calculated or manually input
      },
      general_health: '', // Excellent / Good / Fair / Poor

      organ_systems: {
        skin: { status: '', findings: '' },
        head_scalp: { status: '', findings: '' },
        eyes: { status: '', findings: '' },
        ears: { status: '', findings: '' },
        nose: { status: '', findings: '' },
        mouth_oropharynx: { status: '', findings: '' },
        neck: { status: '', findings: '' },
        heart: { status: '', findings: '' },
        lungs: { status: '', findings: '' },
        back_spine: { status: '', findings: '' },
        abdomen: { status: '', findings: '' },
        extremities: { status: '', findings: '' },
        genito_urinary: { status: '', findings: '' },
        neurologic: { status: '', findings: '' },
      },

      assessment: '',
      recommendations: '',

      no_participation: '',
      limited_participation: '',
      cleared_after_evaluation: '',
      full_clearance: '',
      participation_limited_info: '',
      participation_rehab_info: '',

      examined_by: '',
      prc_license_no: '',
      date_examined: '',
    };

    sessionStorage.setItem(
      'athlete_page_6_physical_exam',
      JSON.stringify(emptyPhysicalExam)
    );

    console.log('Initialized empty physical exam in sessionStorage');
  }
}, []);


  const form = useForm({
    name: printedName,
    signature: patient.signature || null,
    date_signed: todayFormatted,
    age: age,
    sex: sex,
    civil_status: civil_status,
  });

  useEffect(() => {
    const savedData = sessionStorage.getItem('athlete_page_6');
    if (savedData) {
      form.setData({ ...form.data, ...JSON.parse(savedData) });
    }
  }, []);

  const [savingPrev, setSavingPrev] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    sessionStorage.setItem('athlete_page_6', JSON.stringify(form.data));
    console.log('Submitting Page 6 data:', form.data);
    // post to backend if needed
  };

const previewPdf = async () => {
  setLoading(true);
  try {
    // Gather all data from previous pages
    const page1 = JSON.parse(sessionStorage.getItem('athlete_page_1') || '{}');
    const page2 = JSON.parse(sessionStorage.getItem('athlete_page_2') || '{}');
    const page3 = JSON.parse(sessionStorage.getItem('athlete_page_3') || '{}');
    const page4 = JSON.parse(sessionStorage.getItem('athlete_page_4') || '{}');
    const page5 = JSON.parse(sessionStorage.getItem('athlete_page_5') || '{}');
    const page6 = JSON.parse(sessionStorage.getItem('athlete_page_6') || '{}');
    const physicalExam = JSON.parse(
      sessionStorage.getItem('athlete_page_6_physical_exam') || '{}'
    );

    const allData = {
      page1,
      page2,
      page3,
      page4,
      page5,
      page6,
      physical_exam: physicalExam,
    };

    const pdfBytes = await fillAthleteMedicalForm(allData, 'athlete-medical');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    console.error('Failed to generate PDF preview:', err);
    toast.error('Failed to generate PDF preview.');
  } finally {
    setLoading(false);
  }
};

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 6" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          ATHLETE / PERFORMER FORM – PAGE 6
        </h1>

        {/* ACKNOWLEDGMENT */}
        <div className="space-y-4 text-sm p-4">
          <p>
            By signing this form, I acknowledge that I have truthfully answered all the questions
            and provided details to the best of my knowledge.
          </p>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold">Name:</label>
            <input
              type="text"
              className={`${lineInput} mt-1`}
              value={form.data.name || printedName}
              readOnly
            />
          </div>

          {/* Signature + Date */}
          <div className="flex gap-4 mt-2 items-center">
            <div className="flex-1 text-center">
              <label className="text-xs font-semibold block mb-1">Signature:</label>

              {patient.signature ? (
                <img
                  src={patient.signature.startsWith('http') ? patient.signature : `/storage/${patient.signature}`}
                  alt="Signature"
                  className="h-16 mx-auto object-contain w-full border-b border-black"
                />
              ) : (
                <div className="h-16 border-b border-black w-full mx-auto" />
              )}
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold">Date:</label>
              <input
                type="text"
                className={`${lineInput} mt-1`}
                value={form.data.date_signed || todayFormatted}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* PRE-PARTICIPATION PHYSICAL EVALUATION */}
        <div className="mt-6 space-y-2 text-sm p-4">
          <h2 className="font-semibold">PRE-PARTICIPATION PHYSICAL EVALUATION</h2>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold">Name:</label>
            <input type="text" className={lineInput} value={form.data.name} readOnly />
          </div>

          {/* Age, Sex, Civil Status */}
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <label className="text-xs font-semibold">Age:</label>
              <input type="text" className={lineInput} value={form.data.age} readOnly />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold">Sex:</label>
              <input type="text" className={lineInput} value={form.data.sex} readOnly />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold">Civil Status:</label>
              <input
                type="text"
                className={lineInput}
                value={form.data.civil_status}
                onChange={(e) => form.setData('civil_status', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={savingPrev || submitting}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('athlete_page_6', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/athlete-medical/page-5';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <div className="flex gap-3 items-center">
            <Button variant="outline" onClick={previewPdf} disabled={loading}>
              {loading ? 'Previewing PDF…' : 'Preview PDF'}
            </Button>

            <Button onClick={submitPage} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
