import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function AthletePage1() {
  const [continuing, setContinuing] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setContinuing(true);

    sessionStorage.setItem(
      'athlete_page_1',
      JSON.stringify({
        duhs_name: sessionStorage.getItem('duhs_name') || '',
        duhs_signature: sessionStorage.getItem('duhs_signature') || '',
      })
    );

    window.location.href = '/user/fill-forms/athlete-medical/page-2';
  };

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 1" />

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-center">
          ATHLETE / PERFORMER MEDICAL DATA SHEET
        </h1>

        <form onSubmit={submitPage} className="space-y-8 text-sm leading-relaxed">
          {/* LETTER */}
          <div className="space-y-4 text-justify">
            <p>Dear Athlete / Performer:</p>

            <p>
              Please ensure that you complete the enclosed medical history,
              assumption of risk, and pre-participation athletic health
              screening forms thoroughly. These forms must be returned to the
              University Clinic before your scheduled pre-participation health
              screening. It is crucial to fill out all the questions accurately
              and avoid leaving any blank.
            </p>

            <p>
              Failure to properly complete these forms could result in the loss
              of your eligibility to compete. If you have recently undergone
              surgery and this competition is your first since then, we will
              need a written release from your surgeon. Additionally, we
              generally do not permit pregnant women to participate for safety
              reasons.
            </p>

            <p>We appreciate your cooperation in this matter.</p>
          </div>

          {/* NEXT BUTTON */}
          <div className="flex justify-end">
            <Button type="submit" disabled={continuing}>
              {continuing ? 'Continuing…' : 'Next'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
