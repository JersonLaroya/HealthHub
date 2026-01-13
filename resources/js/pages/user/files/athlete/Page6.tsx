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
  alreadySubmitted?: boolean;
}

export default function AthletePage6({ patient, alreadySubmitted: initialSubmitted = false }: Props) {
  const [alreadySubmitted, setAlreadySubmitted] = useState(initialSubmitted);
  const [savingPrev, setSavingPrev] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const today = new Date();
  const todayFormatted = `${String(today.getMonth() + 1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;
  const middleInitial = patient.middle_name ? `${patient.middle_name.charAt(0)}.` : '';
  const printedName = `${patient.first_name || ''} ${middleInitial} ${patient.last_name || ''}`.trim();

  // Initialize physical exam if not present
  useEffect(() => {
    const savedPhysicalExam = sessionStorage.getItem('athlete_page_6_physical_exam');
    if (!savedPhysicalExam) {
      const emptyPhysicalExam = {
        vital_signs: { bp: '', pr: '', rr: '', temp: '', o2_sat: '' },
        anthropometric: { height: '', weight: '', bmi: '' },
        general_health: '',
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
      sessionStorage.setItem('athlete_page_6_physical_exam', JSON.stringify(emptyPhysicalExam));
    }
  }, []);

  // Load previous page5 data
  const page5Data = JSON.parse(sessionStorage.getItem('athlete_page_5') || '{}');
  const age = page5Data.age || '';
  const sex = page5Data.sex || '';

  // Initialize useForm with `responses` wrapper like Page7
  const form = useForm({
    responses: {
      page1: JSON.parse(sessionStorage.getItem('athlete_page_1') || '{}'),
      page2: JSON.parse(sessionStorage.getItem('athlete_page_2') || '{}'),
      page3: JSON.parse(sessionStorage.getItem('athlete_page_3') || '{}'),
      page4: JSON.parse(sessionStorage.getItem('athlete_page_4') || '{}'),
      page5: page5Data,
      page6: JSON.parse(sessionStorage.getItem('athlete_page_6') || '{}'),
      physical_exam: JSON.parse(sessionStorage.getItem('athlete_page_6_physical_exam') || '{}'),
    },
  });

  // Submit handler
  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Save current page in sessionStorage
    sessionStorage.setItem('athlete_page_6', JSON.stringify(form.data.responses.page6));
    sessionStorage.setItem('athlete_page_6_physical_exam', JSON.stringify(form.data.responses.physical_exam));

    // Send data to server
    form.post('/user/submit/athlete-medical', {
      onSuccess: () => {
        toast.success('Form submitted successfully!');
        sessionStorage.clear();
        setAlreadySubmitted(true);
      },
      onError: (errors) => {
        console.error('Submission errors:', errors);
        toast.error('Failed to submit form.');
      },
      onFinish: () => setSubmitting(false),
    });
  };

  // PDF preview
  const previewPdf = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem('athlete_page_6', JSON.stringify(form.data.responses.page6));
      sessionStorage.setItem('athlete_page_6_physical_exam', JSON.stringify(form.data.responses.physical_exam));
      const pdfBytes = await fillAthleteMedicalForm(form.data.responses, 'athlete-medical');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
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
        <h1 className="text-2xl font-semibold text-center">ATHLETE / PERFORMER FORM</h1>

        {/* Acknowledgment */}
        <div className="space-y-4 text-sm p-4">
          <p>By signing this form, I acknowledge that I have truthfully answered all the questions and provided details to the best of my knowledge.</p>

          <div>
            <label className="text-xs font-semibold">Name:</label>
            <input type="text" className={`${lineInput} mt-1`} value={printedName} readOnly />
          </div>

          <div className="flex gap-4 mt-2 items-center">
            <div className="flex-1 text-center">
              <label className="text-xs font-semibold block mb-1">Signature:</label>
              {patient.signature ? (
                <img src={patient.signature.startsWith('http') ? patient.signature : `/storage/${patient.signature}`} alt="Signature" className="h-16 mx-auto object-contain w-full border-b border-black" />
              ) : (
                <div className="h-16 border-b border-black w-full mx-auto" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold">Date:</label>
              <input type="text" className={`${lineInput} mt-1`} value={todayFormatted} readOnly />
            </div>
          </div>
        </div>

        {alreadySubmitted && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 rounded-md text-center mt-4">
            ⚠️ You have already submitted this form. Redirecting…
          </div>
        )}

        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md text-center mt-4">
          ⚠️ Please preview your response first to ensure all information is correct.
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            disabled={savingPrev || submitting}
            onClick={() => {
              setSavingPrev(true);
              sessionStorage.setItem('athlete_page_6', JSON.stringify(form.data.responses.page6));
              sessionStorage.setItem('athlete_page_6_physical_exam', JSON.stringify(form.data.responses.physical_exam));
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
