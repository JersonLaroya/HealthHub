import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { useState } from 'react';

interface Props {
  patient: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    signature?: string;
  };
}

export default function PreenrollmentPage7({ patient }: Props) {
  const [loading, setLoading] = useState(false); // <-- spinner state

  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';

  const printedName = `${patient.first_name} ${middleInitial} ${patient.last_name}`
    .replace(/\s+/g, ' ')
    .trim();

  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const savedData = sessionStorage.getItem('preenrollment_page_7');

  const form = useForm(
    savedData
      ? JSON.parse(savedData)
      : {
          printed_name: `${printedName}  ${todayFormatted}`,
          signature_image: patient.signature || null,
        }
  );

  const savePageData = () => {
    sessionStorage.setItem('preenrollment_page_7', JSON.stringify(form.data));
  };

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    savePageData();
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/complete';
  };

  // PREVIEW PDF
  const previewPdf = async () => {
    savePageData();
    setLoading(true); // start spinner

    const allData = {
      page1: JSON.parse(sessionStorage.getItem('preenrollment_page_1') || '{}'),
      page2: JSON.parse(sessionStorage.getItem('preenrollment_page_2') || '{}'),
      page3: JSON.parse(sessionStorage.getItem('preenrollment_page_3') || '{}'),
      page4: JSON.parse(sessionStorage.getItem('preenrollment_page_4') || '{}'),
      page5: JSON.parse(sessionStorage.getItem('preenrollment_page_5') || '{}'),
      page6: JSON.parse(sessionStorage.getItem('preenrollment_page_6') || '{}'),
      page7: JSON.parse(sessionStorage.getItem('preenrollment_page_7') || '{}'),
    };

    try {
      const pdfBytes = await fillPreEnrollmentForm(allData, 'pre-enrollment-health-form');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');
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
              value={form.data.printed_name}
              readOnly
            />

            <p className="text-xs">
              Signature above printed name / Date signed
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-10">
          <Button
            variant="secondary"
            onClick={() => {
              savePageData();
              window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-6';
            }}
          >
            Previous
          </Button>

          <div className="flex gap-3 items-center">
            <Button variant="outline" onClick={previewPdf} disabled={loading}>
              {loading ? 'Generating PDF...' : 'Preview PDF'}
            </Button>

            {loading && (
              <div className="ml-2 animate-spin border-2 border-t-2 border-gray-500 rounded-full w-5 h-5"></div>
            )}

            <Button onClick={submitPage} disabled={loading}>
              Finish
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
