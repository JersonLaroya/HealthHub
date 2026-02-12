import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { fillPreEmploymentForm } from "@/utils/fillPreEmploymentForm";
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface Props {
  patient: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    birthdate?: string;
    signature?: string;
  };
  alreadySubmitted: boolean;
}

export default function PreemploymentPage5({ patient, alreadySubmitted }: Props) {
  // Redirect immediately if already submitted
  useEffect(() => {
    if (alreadySubmitted) {
      const t = setTimeout(() => {
        router.visit('/user/files/pre-employment-health-form', {
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

  const [signatureLoaded, setSignatureLoaded] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  useEffect(() => {
    if (patient.signature) {
      setSignatureLoaded(false);
      setSignatureError(false);
    }
  }, [patient.signature]);


  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';

  const printedName = `${patient.first_name} ${middleInitial} ${patient.last_name}`.replace(/\s+/g, ' ').trim();

  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const savedPage5 = JSON.parse(
    sessionStorage.getItem('preemployment_page_5') || '{}'
  );
    const form = useForm({
    responses: {
        page1: JSON.parse(sessionStorage.getItem('preemployment_page_1') || '{}'),
        page2: JSON.parse(sessionStorage.getItem('preemployment_page_2') || '{}'),
        page3: JSON.parse(sessionStorage.getItem('preemployment_page_3') || '{}'),
        page4: JSON.parse(sessionStorage.getItem('preemployment_page_4') || '{}'),
        page5: {
        socialHistory: {
            alcoholConsumption: '',
            alcoholConsumptionDetails: '',
            alcoholReduce: '',
            alcoholReduceDetails: '',
            smoke: '',
            smokeDetails: '',
            tobaccoVape: '',
            tobaccoVapeDetails: '',
            otherConditions: '',
            otherConditionsDetails: '',
            ...savedPage5.socialHistory,
        },
        },
    },
    });

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const yesNoOptions = ['Yes', 'No'];
  const lineInput = 'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0 text-sm';

  // Preview PDF
  const previewPdf = async () => {
    setLoadingPreview(true);
    const allData = {
      page1: JSON.parse(sessionStorage.getItem('preemployment_page_1') || '{}'),
      page2: JSON.parse(sessionStorage.getItem('preemployment_page_2') || '{}'),
      page3: JSON.parse(sessionStorage.getItem('preemployment_page_3') || '{}'),
      page4: JSON.parse(sessionStorage.getItem('preemployment_page_4') || '{}'),
      page5: form.data.responses.page5,
    };

    try {
      const pdfBytes = await fillPreEmploymentForm(
        allData,
        'pre-employment-health-form',
        'user'
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Submit form
    const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Save last page only
    sessionStorage.setItem(
        'preemployment_page_5',
        JSON.stringify(form.data.responses.page5)
    );

    console.log('responses before post', form.data.responses);

    form.post('/user/submit/pre-employment-health-form', {
        onSuccess: () => {
        sessionStorage.clear();
        // Redirect using router from @inertiajs/react
        // router.visit('/user/medical-forms/pre-employment-health-form', {
        //     replace: true,
        //     preserveState: false,
        // });
        },
        onFinish: () => setSubmitting(false),
    });
    };

    // Returns true if all required questions are answered
const isFormComplete = () => {
  const sh = form.data.responses.page5.socialHistory;

  return (
    sh.alcoholConsumption &&
    (sh.alcoholConsumption === 'No' || sh.alcoholConsumptionDetails) &&
    sh.alcoholReduce &&
    (sh.alcoholReduce === 'No' || sh.alcoholReduceDetails) &&
    sh.smoke &&
    (sh.smoke === 'No' || sh.smokeDetails) &&
    sh.tobaccoVape &&
    (sh.tobaccoVape === 'No' || sh.tobaccoVapeDetails) &&
    sh.otherConditions &&
    (sh.otherConditions === 'No' || sh.otherConditionsDetails)
  );
};


  return (
    <AppLayout>
      <Head title="Pre-employment – Page 5" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">SOCIAL HISTORY</h1>
        <p className="text-sm text-center">
          Please answer the following questions HONESTLY. For medical purposes only.
        </p>

        <form onSubmit={submitPage} className="space-y-6">
          {/* Question 1 */}
          <div className="space-y-2 text-sm">
            <label>1. Do you consume alcohol? If so, please specify the frequency and quantity. <span className="text-red-600">*</span></label>
            <div className="flex gap-4 mt-1">
                {yesNoOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1">
                    <input
                    type="radio"
                    checked={form.data.responses.page5.socialHistory.alcoholConsumption === opt}
                    onChange={() => {
                        form.setData('responses.page5.socialHistory.alcoholConsumption', opt);
                        if (opt === 'No') {
                            form.setData('responses.page5.socialHistory.alcoholConsumptionDetails', '');
                        }
                    }}
                    />
                    {opt}
                </label>
                ))}
            </div>

            {form.data.responses.page5.socialHistory.alcoholConsumption === 'Yes' && (
              <input
                className={
                  lineInput +
                  (!form.data.responses.page5.socialHistory.alcoholConsumptionDetails
                    ? ' border-red-600'
                    : '') +
                  ' mt-1'
                }
                placeholder="Frequency / quantity"
                value={form.data.responses.page5.socialHistory.alcoholConsumptionDetails}
                onChange={e =>
                  form.setData(
                    'responses.page5.socialHistory.alcoholConsumptionDetails',
                    e.target.value
                  )
                }
              />
            )}
            </div>

          {/* Question 2 */}
            <div className="space-y-2 text-sm">
            <label>2. Do you feel the need or desire to reduce your alcohol consumption? <span className="text-red-600">*</span></label>
            <div className="flex gap-4 mt-1">
                {yesNoOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1">
                    <input
                    type="radio"
                    checked={form.data.responses.page5.socialHistory.alcoholReduce === opt}
                    onChange={() =>
                        form.setData('responses.page5.socialHistory.alcoholReduce', opt)
                    }
                    />
                    {opt}
                </label>
                ))}
            </div>

            {form.data.responses.page5.socialHistory.alcoholReduce === 'Yes' && (
              <input
                className={
                  lineInput +
                  (!form.data.responses.page5.socialHistory.alcoholReduceDetails
                    ? ' border-red-600'
                    : '') +
                  ' mt-1'
                }
                value={form.data.responses.page5.socialHistory.alcoholReduceDetails}
                onChange={e =>
                  form.setData(
                    'responses.page5.socialHistory.alcoholReduceDetails',
                    e.target.value
                  )
                }
              />
            )}
            </div>

          {/* Question 3 */}
            <div className="space-y-2 text-sm">
            <label>3. Do you smoke? If yes, please indicate the frequency and amount. <span className="text-red-600">*</span></label>
            <div className="flex gap-4 mt-1">
                {yesNoOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1">
                    <input
                    type="radio"
                    checked={form.data.responses.page5.socialHistory.smoke === opt}
                    onChange={() =>
                        form.setData('responses.page5.socialHistory.smoke', opt)
                    }
                    />
                    {opt}
                </label>
                ))}
            </div>

            {form.data.responses.page5.socialHistory.smoke === 'Yes' && (
              <input
                className={
                  lineInput +
                  (!form.data.responses.page5.socialHistory.smokeDetails
                    ? ' border-red-600'
                    : '') +
                  ' mt-1'
                }
                placeholder="Frequency / amount"
                value={form.data.responses.page5.socialHistory.smokeDetails}
                onChange={e =>
                  form.setData(
                    'responses.page5.socialHistory.smokeDetails',
                    e.target.value
                  )
                }
              />
            )}
            </div>

          {/* Question 4 */}
            <div className="space-y-2 text-sm">
            <label>
                4. Have you used smokeless tobacco or vape within the past year? If so, are you aware of
                the potential risks and dangers associated with its use? <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-4 mt-1">
                {yesNoOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1">
                    <input
                    type="radio"
                    checked={form.data.responses.page5.socialHistory.tobaccoVape === opt}
                    onChange={() =>
                        form.setData('responses.page5.socialHistory.tobaccoVape', opt)
                    }
                    />
                    {opt}
                </label>
                ))}
            </div>

            {form.data.responses.page5.socialHistory.tobaccoVape === 'Yes' && (
              <input
                className={
                  lineInput +
                  (!form.data.responses.page5.socialHistory.tobaccoVapeDetails
                    ? ' border-red-600'
                    : '') +
                  ' mt-1'
                }
                value={form.data.responses.page5.socialHistory.tobaccoVapeDetails}
                onChange={e =>
                  form.setData(
                    'responses.page5.socialHistory.tobaccoVapeDetails',
                    e.target.value
                  )
                }
              />
            )}
            </div>

          {/* Question 5 */}
            <div className="space-y-2 text-sm">
            <label>
                5. Are there any other medical conditions, illnesses, or relevant information that should be reported to the clinic? <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-4 mt-1">
                {yesNoOptions.map(opt => (
                <label key={opt} className="flex items-center gap-1">
                    <input
                    type="radio"
                    checked={form.data.responses.page5.socialHistory.otherConditions === opt}
                    onChange={() =>
                        form.setData('responses.page5.socialHistory.otherConditions', opt)
                    }
                    />
                    {opt}
                </label>
                ))}
            </div>

            {form.data.responses.page5.socialHistory.otherConditions === 'Yes' && (
              <input
                className={
                  lineInput +
                  (!form.data.responses.page5.socialHistory.otherConditionsDetails
                    ? ' border-red-600'
                    : '') +
                  ' mt-1'
                }
                value={form.data.responses.page5.socialHistory.otherConditionsDetails}
                onChange={e =>
                  form.setData(
                    'responses.page5.socialHistory.otherConditionsDetails',
                    e.target.value
                  )
                }
              />
            )}
            </div>

          {/* Declaration */}
          <p className="text-sm mt-4">
            By signing this form, I acknowledge that I have truthfully answered all the questions and provided details to the best of my knowledge.
          </p>

          {/* Signature */}
          <div className="flex justify-end mt-6">
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
                  onLoad={() => setSignatureLoaded(true)}
                  onError={() => setSignatureError(true)}
                />
              )}

                <input
                className={lineInput + ' text-center uppercase'}
                value={printedName + '  ' + todayFormatted} // just display, not part of form.data
                readOnly
                />
                <p className="text-xs">
                Signature over Printed Name / Date signed
                </p>
            </div>
            </div>

          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md text-center mt-4">
            ⚠️ Please preview your response first to ensure all information is correct.
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="secondary"
              disabled={savingPrev || submitting}
              onClick={() => {
                setSavingPrev(true);
                sessionStorage.setItem(
                'preemployment_page_5',
                JSON.stringify(form.data.responses.page5)
                );
                router.visit('/user/fill-forms/pre-employment-health-form/page-4', {
                  preserveState: false,
                });
              }}
            >
              {savingPrev ? 'Going back…' : 'Previous'}
            </Button>

            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                onClick={previewPdf}
                disabled={loadingPreview || !isFormComplete() || !signatureLoaded}
              >
                {loadingPreview ? 'Previewing PDF…' : 'Preview PDF'}
              </Button>

              <Button
                type="submit"
                disabled={submitting || savingPrev || !isFormComplete() || !signatureLoaded}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
