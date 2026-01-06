import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface Props {
  patient: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    signature?: string;
  };
  alreadySubmitted: boolean;
}

export default function PreenrollmentPage7({ patient, alreadySubmitted  }: Props) {

  // Redirect immediately if already submitted
  useEffect(() => {
    if (alreadySubmitted) {
      const t = setTimeout(() => {
        router.visit('/user/medical-forms/pre-enrollment-health-form', {
          replace: true,
        });
      }, 1500); // give Sonner time

      return () => clearTimeout(t);
    }
  }, [alreadySubmitted]);

  const { toast: flashToast } = usePage().props as any;

    useEffect(() => {
  if (!flashToast) return;

  switch (flashToast.type) {
      case 'error':
        toast.error(flashToast.title, { description: flashToast.message });
        break;
      case 'info':
        toast.info(flashToast.title, { description: flashToast.message });
        break;
      case 'warning':
        toast.warning(flashToast.title, { description: flashToast.message });
        break;
      default:
        toast.success(flashToast.title, { description: flashToast.message });
    }
  }, [flashToast]);


  // Add countdown state
  const [countdown, setCountdown] = useState(30);
  const [submitDisabled, setSubmitDisabled] = useState(true);

// Run countdown if not already submitted
  useEffect(() => {
    if (alreadySubmitted) return; // skip countdown

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alreadySubmitted]);

  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';

  const printedName = `${patient.first_name} ${middleInitial} ${patient.last_name}`
    .replace(/\s+/g, ' ')
    .trim();

  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const savedData = sessionStorage.getItem('preenrollment_page_7');

  const form = useForm({
    responses: {
      page1: JSON.parse(sessionStorage.getItem('preenrollment_page_1') || '{}'),
      page2: JSON.parse(sessionStorage.getItem('preenrollment_page_2') || '{}'),
      page3: JSON.parse(sessionStorage.getItem('preenrollment_page_3') || '{}'),
      page4: JSON.parse(sessionStorage.getItem('preenrollment_page_4') || '{}'),
      page5: JSON.parse(sessionStorage.getItem('preenrollment_page_5') || '{}'),
      page6: JSON.parse(sessionStorage.getItem('preenrollment_page_6') || '{}'),
    },
  });


  const [savingPrev, setSavingPrev] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false); 
  const serviceSlug = 'pre-enrollment-health-form';

  const submitPage = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      console.log('responses before post', form.data.responses);

      // Post the form state
      form.post('/user/submit/pre-enrollment-health-form', {
        onSuccess: () => {
          sessionStorage.clear(); // clear session if needed
          // no window.location.href here
        },
        onFinish: () => setSubmitting(false),
      });
    };

  // PREVIEW PDF
  const previewPdf = async () => {
    setLoading(true); // start spinner

    const allData = {
      page1: JSON.parse(sessionStorage.getItem('preenrollment_page_1') || '{}'),
      page2: JSON.parse(sessionStorage.getItem('preenrollment_page_2') || '{}'),
      page3: JSON.parse(sessionStorage.getItem('preenrollment_page_3') || '{}'),
      page4: JSON.parse(sessionStorage.getItem('preenrollment_page_4') || '{}'),
      page5: JSON.parse(sessionStorage.getItem('preenrollment_page_5') || '{}'),
      page6: JSON.parse(sessionStorage.getItem('preenrollment_page_6') || '{}'),
    };

    try {
      const pdfBytes = await fillPreEnrollmentForm(allData, 'pre-enrollment-health-form');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank'); // open PDF in new tab
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
    } finally {
      setLoading(false); // stop spinner
    }
  };


  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  return (
    <AppLayout>
      <Head title="Preenrollment – Page 7" />

      <div className="p-6 max-w-4xl mx-auto space-y-8 text-sm">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        <div className="mt-16" />

        <div className="leading-relaxed space-y-4">
          <p>
            I confirm that I have provided a truthful account of my history to the best of my
            knowledge. Furthermore, I have made a complete disclosure of all medical conditions
            that could potentially impact my performance as a student at the University.
          </p>

          <p>
            I hereby agree to inform the clinic if I develop any new medical condition after this
            pre-enrollment session, in order to keep my health records accurate and up to date.
          </p>
        </div>

        <div className="flex justify-end mt-12">
          <div className="w-80 text-center space-y-2">
            {patient.signature && (
              <img
                src={
                  patient.signature.startsWith('http')
                    ? patient.signature
                    : `/storage/${patient.signature}`
                }
                alt="Signature"
                className="h-20 mx-auto object-contain w-full"
              />
            )}

            <input
              className={`${lineInput} text-center uppercase`}
              value={`${printedName}  ${todayFormatted}`}
              readOnly
            />

            <p className="text-xs">
              Signature above printed name / Date signed
            </p>
          </div>
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md text-center mt-4">
          ⚠️ Please preview your response first to ensure all information is correct.
        </div>

        <div className="flex justify-between mt-10">
          <Button
            variant="secondary"
            disabled={savingPrev || submitting}
            onClick={() => {
              setSavingPrev(true);
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-6';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>

          <div className="flex gap-3 items-center">
            <Button variant="outline" onClick={previewPdf} disabled={loading}>
              {loading ? 'Previewing PDF…' : 'Preview PDF'}
            </Button>

            <Button
              onClick={(e) => {
                setSubmitting(true);
                submitPage(e);
              }}
              disabled={submitting || savingPrev || submitDisabled}
            >
              {submitDisabled ? `Submit (${countdown}s)` : submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
