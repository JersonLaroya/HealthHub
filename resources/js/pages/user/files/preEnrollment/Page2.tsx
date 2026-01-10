import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useState } from 'react';

interface Props {
  patient: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    birthdate?: string; // YYYY-MM-DD
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

export default function PreenrollmentPage2({ patient }: Props) {
  const middleInitial = patient.middle_name
    ? `${patient.middle_name.charAt(0).toUpperCase()}.`
    : '';

  const fullName = `${patient.last_name}, ${patient.first_name} ${middleInitial}`.trim();

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
        const month = d.getMonth() + 1; // months are 0-indexed
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    }
    console.log('Patient:', patient);

  const form = useForm({
    name: fullName,
    civil_status: '',
    birth_date: patient.birthdate ? formatDate(patient.birthdate) : '',
    age: patient.birthdate ? calculateAge(patient.birthdate) : '',
    birthplace: '',
    campus: 'Candijay Campus',
    course_and_year: `${patient.course || ''} ${patient.year || ''}`.trim(),
    student_type: '',
    home_address: patient.home_address || '',
    contact_no: patient.contact_no || '',
    present_address: patient.present_address || '',
    guardian: patient.guardian_name || '',
    landlord: '',
    landlord_contact: '',
    landlord_address: '',
    picture_2x2: null as string | null,
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('preenrollment_page_2');
    if (saved) {
      form.setData(JSON.parse(saved));
    }
  }, []);


      // inside your component
    useEffect(() => {
      console.log('Live Form Data:', form.data);
    }, [form.data]);

  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNext(true); // show "Continuing…"
    sessionStorage.setItem('preenrollment_page_2', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-3';
  };


  return (
    <AppLayout>
      <Head title="Preenrollment – Page 2" />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          PRE-ENROLLMENT HEALTH FORM
        </h1>

        {/* INTRO TEXT */}
        <p className="text-sm text-justify">
          In order to finalize your admission to Bohol Island State University
          (BISU), it is mandatory to undergo a comprehensive medical history and
          physical examination. The completion of this rests solely, and is the
          responsibility of the STUDENT and not of the physician. Kindly fill
          out this form legibly using BLACK ink. Your submitted form will be kept
          confidential and will be included in your enrollment medical records.
          Please ensure that your medical history and physical examination are
          completed and on file prior to your registration.
        </p>

        {/* REQUIREMENT + 2x2 */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 items-start">
          <div className="text-sm space-y-2 flex-1">
            <p className="font-semibold">
              You are REQUIRED to fill-out this form if you are a/an:
            </p>
            <ol className="list-decimal ml-5">
              <li>Newly admitted undergraduate or post-graduate student of BISU</li>
              <li>Transfer student from another school or university</li>
              <li>
                Returning student from Leave of Absence (LOA) or Absence Without
                Leave (AWOL)
              </li>
            </ol>
          </div>

          <div className="w-40 text-center flex-shrink-0">
            <div className="border h-40 flex items-center justify-center text-xs overflow-hidden">
              {form.data.picture_2x2 ? (
                <img
                  src={form.data.picture_2x2}
                  alt="2x2 Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full overflow-hidden rounded-md">
                  {/* Fake scenery background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-sky-300 to-lime-200" />

                  {/* Soft hills */}
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/40 to-transparent rounded-t-full blur-sm" />

                  {/* Sky glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl" />

                  {/* Dark overlay for contrast */}
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Label */}
                  <span className="relative z-10 flex items-center justify-center w-full h-full text-sm font-semibold text-white tracking-wide">
                    2×2 Picture
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="mt-2 text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                  form.setData('picture_2x2', reader.result);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        <form onSubmit={submitPage} className="space-y-6">
          {/* NAME */}
          <div>
            <span className="font-semibold">Name:</span>{' '}
            <input className={lineInput} value={form.data.name} readOnly />
          </div>

          {/* CIVIL STATUS */}
          <div className="flex flex-wrap gap-4 text-sm items-center">
            <span className="font-semibold">Civil Status:</span>
            {['Single', 'Married', 'Widowed', 'Legally separated'].map((v) => (
              <label key={v} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="civil_status"
                  checked={form.data.civil_status === v}
                  onChange={() => form.setData('civil_status', v)}
                />
                {v}
              </label>
            ))}
          </div>

          {/* DOB, AGE, BIRTHPLACE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              Date of Birth:
              <input className={lineInput} value={form.data.birth_date} readOnly />
            </div>
            <div>
              Age:
              <input
                className={lineInput}
                value={form.data.age}
                onChange={(e) => form.setData('age', e.target.value)}
              />
            </div>
            <div>
              Birthplace:
              <input
                className={lineInput}
                value={form.data.birthplace}
                onChange={(e) => form.setData('birthplace', e.target.value)}
              />
            </div>
          </div>

          {/* CAMPUS / COURSE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              Campus:
              <input
                className={lineInput}
                value={form.data.campus}
                onChange={(e) => form.setData('campus', e.target.value)}
              />
            </div>
            <div>
              Course & Year:
              <input
                className={lineInput}
                value={form.data.course_and_year}
                readOnly
              />
            </div>
          </div>

          {/* STUDENT TYPE (radio) */}
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="font-semibold">Student Type:</span>
            {[
              { key: 'freshman', label: 'Freshman' },
              { key: 'postgraduate', label: 'Post-graduate' },
              { key: 'transferee', label: 'Transferee' },
              { key: 'cross_enrollee', label: 'Cross-enrollee' },
              { key: 'returning', label: 'Returning from LOA/AWOL' },
            ].map((option) => (
              <label key={option.key} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="student_type"
                  checked={form.data.student_type === option.key}
                  onChange={() => form.setData('student_type', option.key)}
                />
                {option.label}
              </label>
            ))}
          </div>

          {/* HOME ADDRESS / CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              Home Address:
              <input
                className={lineInput}
                value={form.data.home_address}
                onChange={(e) => form.setData('home_address', e.target.value)}
              />
            </div>
            <div>
              Contact No:
              <input
                className={lineInput}
                value={form.data.contact_no}
                onChange={(e) => form.setData('contact_no', e.target.value)}
              />
            </div>
          </div>

          {/* SCHOOL ADDRESS / PARENT / LANDLORD */}
          <div className="space-y-2 text-sm">
            <div>
              Address while in school:
              <input
                className={lineInput}
                value={form.data.present_address}
                onChange={(e) => form.setData('present_address', e.target.value)}
              />
            </div>
            <div>
              Name of Parent/Guardian:
              <input
                className={lineInput}
                value={form.data.guardian}
                onChange={(e) => form.setData('guardian', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                Landlord/Landlady:
                <input
                  className={lineInput}
                  value={form.data.landlord}
                  onChange={(e) => form.setData('landlord', e.target.value)}
                />
              </div>
              <div>
                Contact No:
                <input
                  className={lineInput}
                  value={form.data.landlord_contact}
                  onChange={(e) =>
                    form.setData('landlord_contact', e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              Address:
              <input
                className={lineInput}
                value={form.data.landlord_address}
                onChange={(e) =>
                  form.setData('landlord_address', e.target.value)
                }
              />
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="secondary"
              disabled={savingPrev || savingNext} // disable if either is saving
              onClick={() => {
                setSavingPrev(true); // show "Going back…"
                sessionStorage.setItem('preenrollment_page_2', JSON.stringify(form.data));
                window.location.href = '/user/fill-forms/pre-enrollment-health-form/page-1';
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
