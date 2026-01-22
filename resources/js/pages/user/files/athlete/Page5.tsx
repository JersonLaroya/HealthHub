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
    contact_no?: string;
    home_address?: string;
    present_address?: string;
    student_id?: string;
  };
}

export default function AthletePage5({ patient }: Props) {
  const lineInput =
    'w-full bg-transparent border-0 border-b border-black focus:outline-none focus:ring-0';

  const page2Data = sessionStorage.getItem('athlete_page_2');
  const parsedPage2 = page2Data ? JSON.parse(page2Data) : {};
  const activity = parsedPage2.activity || '';
  const sport_event = parsedPage2.sport_event || '';
  const student_id = parsedPage2.student_id || '';

  // Helper functions
  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  function calculateAge(birthdate?: string) {
    if (!birthdate) return '';
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  }

  const fullName = `${patient.first_name || ''} ${patient.middle_name ? patient.middle_name.charAt(0) + '. ' : ''}${patient.last_name || ''}`.trim();

  const familyHistoryQuestions = [
    'Sudden death or heart problems under the age of 50',
    'High blood pressure',
    'Diabetes',
  ];

    const personalHistoryItems = [
    { label: "Fainting or dizziness during or after exercise" },
    { label: "Respiratory problems (pneumonia, bronchitis, sinus problems)" },
    { label: "Chest discomfort during exercise" },
    { label: "Asthma or wheezing (if yes, provide which medication)" },
    { label: "Seizures, convulsions, epilepsy" },
    { label: "ADD or ADHD" },
    { label: "Heart disease (rheumatic fever, murmur)" },
    { label: "Anorexia / Bulimia / Eating disorder" },
    { label: "Chronic skin disease (eczema, psoriasis)" },
    { label: "Hepatitis, jaundice, kidney, bladder disease" },
    { label: "Abdominal issues, digestive tract disease (ulcer, colitis), hernia" },
    { label: "Frequent or severe headache (migraine)" },
    { label: "High blood pressure / cholesterol" },
    { label: "Depression / anxiety" },
    { label: "Speech, hearing, or vision problems" },
    { label: "Sexually transmitted disease or HIV" },
    { label: "Cancer (skin, thyroid, etc.)" },
    { label: "Thrombophlebitis or blood clots" },
    { label: "Thyroid, endocrine disturbance, or diabetes" },
    { label: "Other medical illnesses" },
    ];

    const illnessItems = [
    'Any acute illness (cough, colds, COVID, flu)',
    'Appendicitis',
    'Any blood disorder (anemia, etc.)',
    'Urinary tract infection',
    'Any heat related illness',
    ];
    
    const allergyItems = [
    'Insects',
    'Food',
    'Medicine',
    'Environmental (Dust, pollen, etc.)',
    ];

    const miscellaneousItems = [
    "Are you currently under the care of a physician? If yes, please provide an explanation.",
    "Are you taking any medications? If yes, please state the name of the medication and the reason for taking it.",
    "Do you have any missing or nonfunctioning organs? If yes, please specify.",
    "Have you received immunizations for COVID or tetanus? If yes, please indicate the date.",
    "Do you wear contact lenses, eyeglasses, or any dentures? If yes, please specify.",
    "Do you have any undisclosed medical illnesses or injuries?",
    ];

    const orthopedicItems = [
    "Face/ Head injury",
    "Neck injury",
    "Pinched nerves",
    "Back-Chest-rib injuries",
    "Shoulder injury (dislocation, separation, fracture)",
    "Elbow injuries",
    "Wrist-hand-finger injuries",
    "Hip-groin or pelvis injuries",
    "Quadriceps, hamstrings (rupture or strain)",
    "Knee injury (surgery, sprain, fracture)",
    "Lower leg injury (surgery, sprain, fracture)",
    "Ankle injury (surgery, sprain, fracture)",
    "Foot injury (surgery, sprain, fracture)",
    "Back pain",
    "Chronic muscle/tendon/ligament strains",
    "History of bone scans, MRIs, CT scans or x-ray",
    "Any braces or support",
    "Any other orthopedic injuries NOT mentioned",
    ];


  const form = useForm({
    full_name: fullName,
    student_id: student_id || patient.student_id || '',
    home_address: patient.home_address || '',
    present_address: patient.present_address || '',
    contact_no: patient.contact_no || '',
    birthdate: formatDate(patient.birthdate),
    age: calculateAge(patient.birthdate),
    sex: patient.sex || '',
    civil_status: '',
    sport_event: sport_event,

     // Medical History
    medical_history: {
        yes: false,
        no: false,
        remarks: '',
    },

    // Family History (array-like object)
    family_history: familyHistoryQuestions.reduce((acc, q) => {
        acc[q] = { yes: false, no: false, remarks: '' };
        return acc;
    }, {} as Record<string, { yes: boolean; no: boolean; remarks: string }>),

    personal_history: personalHistoryItems.map((item) => ({
        question: item.label,
        yes: false,
        no: false,
        remarks: '',
    })),

    head_injuries: {
        loss_of_consciousness: { yes: false, no: false },
        head_injury: { yes: false, no: false },
    },

    illness_history: illnessItems.map((q) => ({
        question: q,
        yes: false,
        no: false,
        remarks: '',
    })),

    allergy_history: allergyItems.map((q) => ({
        question: q,
        yes: false,
        no: false,
        remarks: '',
    })),

    hospitalization: {
        pastTwoYearsInjury: { yes: false, no: false, remarks: '' },
        pastTwoYearsMedical: { yes: false, no: false, remarks: '' },
        surgery: { yes: false, no: false, remarks: '' },
    },

    miscellaneous: miscellaneousItems.map(() => ({ yes: false, no: false, details: '' })),

    female_history: {
        irregular_periods: { yes: false, no: false },
        period_frequency: '',
        other_gynecological_issues: { yes: false, no: false, details: '' },
    },

    orthopedic_history: orthopedicItems.map((q) => ({
        question: q,
        yes: false,
        no: false,
        remarks: '', 
    })),

    social_history: {
        alcohol: { yes: false, no: false, remarks: '' },
        reduce_alcohol: { yes: false, no: false },
        smoke: { yes: false, no: false, remarks: '' },
        tobacco_or_vape: { yes: false, no: false, remarks: '' },
        other_conditions: { yes: false, no: false, remarks: '' },
    },

  });

  useEffect(() => {
  console.clear();
  console.log("FORM DATA (live):", form.data);

  console.log("VALIDATION STATES:", {
    medicalValid,
    familyValid,
    personalValid,
    headValid,
    illnessValid,
    allergyValid,
    hospitalizationValid,
    miscValid,
    orthoValid,
    socialValid,
    femaleValid,
    civilStatusValid,
    pageValid,
  });
}, [form.data]);



  /* =======================
   VALIDATION
======================= */

// A. Medical history
const medicalAnswered =
  form.data.medical_history.yes || form.data.medical_history.no;

const medicalValid =
  medicalAnswered &&
  (!form.data.medical_history.yes ||
    form.data.medical_history.remarks.trim() !== '');

// B. Family history
const familyErrors = familyHistoryQuestions.map((q) => {
  const item = form.data.family_history[q];
  return {
    answered: item.yes || item.no,
    remarks: item.yes && !item.remarks.trim(),
  };
});

const familyValid = familyErrors.every(
  (f) => f.answered && !f.remarks
);

// C. Personal history
const personalErrors = form.data.personal_history.map((item) => ({
  answered: item.yes || item.no,
  remarks: item.yes && !item.remarks.trim(),
}));

const personalValid = personalErrors.every(
  (p) => p.answered && !p.remarks
);

// E. Illness
const illnessErrors = form.data.illness_history.map((item) => ({
  answered: item.yes || item.no,
  remarks: item.yes && !item.remarks.trim(),
}));

const illnessValid = illnessErrors.every(
  (i) => i.answered && !i.remarks
);

// F. Allergies
const allergyErrors = form.data.allergy_history.map((item) => ({
  answered: item.yes || item.no,
  remarks: item.yes && !item.remarks.trim(),
}));

const allergyValid = allergyErrors.every(
  (a) => a.answered && !a.remarks
);

// G. Hospitalization
const hosp = form.data.hospitalization;

const hospitalizationValid =
  (hosp.pastTwoYearsInjury.yes || hosp.pastTwoYearsInjury.no) &&
  (!hosp.pastTwoYearsInjury.yes || hosp.pastTwoYearsInjury.remarks.trim()) &&

  (hosp.pastTwoYearsMedical.yes || hosp.pastTwoYearsMedical.no) &&
  (!hosp.pastTwoYearsMedical.yes || hosp.pastTwoYearsMedical.remarks.trim()) &&

  (hosp.surgery.yes || hosp.surgery.no) &&
  (!hosp.surgery.yes || hosp.surgery.remarks.trim());

// H. Miscellaneous
const miscErrors = form.data.miscellaneous.map((item) => ({
  answered: item.yes || item.no,
  details: item.yes && !item.details.trim(),
}));

const miscValid = miscErrors.every(
  (m) => m.answered && !m.details
);

// J. Orthopedic
const orthoErrors = form.data.orthopedic_history.map((item) => ({
  answered: item.yes || item.no,
  remarks: item.yes && !item.remarks.trim(),
}));

const orthoValid = orthoErrors.every(
  (o) => o.answered && !o.remarks
);

// K. Social history
const social = form.data.social_history;

const socialValid =
  (social.alcohol.yes || social.alcohol.no) &&
  (!social.alcohol.yes || social.alcohol.remarks.trim()) &&

  (social.reduce_alcohol.yes || social.reduce_alcohol.no) &&

  (social.smoke.yes || social.smoke.no) &&
  (!social.smoke.yes || social.smoke.remarks.trim()) &&

  (social.tobacco_or_vape.yes || social.tobacco_or_vape.no) &&
  (!social.tobacco_or_vape.yes || social.tobacco_or_vape.remarks.trim()) &&

  (social.other_conditions.yes || social.other_conditions.no) &&
  (!social.other_conditions.yes || social.other_conditions.remarks.trim());

const female = form.data.female_history;

const femaleValid =
  form.data.sex !== 'Female' ||

  (
    (female.irregular_periods.yes || female.irregular_periods.no) &&
    female.period_frequency.trim() !== '' &&
    (female.other_gynecological_issues.yes || female.other_gynecological_issues.no) &&
    (!female.other_gynecological_issues.yes || female.other_gynecological_issues.details.trim() !== '')
  );

const civilStatusValid = form.data.civil_status.trim() !== '';

  // D. Head injuries
const head = form.data.head_injuries;

const headValid =
  (head.loss_of_consciousness.yes || head.loss_of_consciousness.no) &&
  (head.head_injury.yes || head.head_injury.no);


// FINAL PAGE VALID
const pageValid =
  medicalValid &&
  familyValid &&
  personalValid &&
  headValid &&  
  illnessValid &&
  allergyValid &&
  hospitalizationValid &&
  miscValid &&
  orthoValid &&
  socialValid &&
  femaleValid &&
  civilStatusValid;


  const [savingNext, setSavingNext] = useState(false);
  const [savingPrev, setSavingPrev] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('athlete_page_5');
    if (saved) {
        const parsed = JSON.parse(saved);

        form.setData({
        ...form.data,            // keep defaults
        ...parsed,               // overwrite saved fields
        personal_history: parsed.personal_history ?? form.data.personal_history,
        });
    }
    }, []);


  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pageValid) return;

    setSavingNext(true);
    sessionStorage.setItem('athlete_page_5', JSON.stringify(form.data));
    window.location.href = '/user/fill-forms/athlete-medical/page-6';
  };

  return (
    <AppLayout>
      <Head title="Athlete / Performer – Page 5" />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          ATHLETE / PERFORMER MEDICAL DATA SHEET
        </h1>
        <h2 className="text-lg font-semibold text-center mt-2">
          NEW ATHLETE/PERFORMER HEALTH HISTORY FORM
        </h2>

        <p className="text-sm mt-4 whitespace-pre-wrap">
          The University Health Services of Bohol Island State University will solely utilize the information
          provided in this medical form to assess whether your participation in <strong>{activity}</strong> poses any
          health risks or threats to yourself or others. Rest assured that this information will be kept strictly <strong>CONFIDENTIAL</strong> at all times.
        </p>

        {/* Name & Student ID row */}
        <div className="flex gap-4 mt-4">
          <div className="w-3/4">
            Name: <input
              type="text"
              className={lineInput}
              value={form.data.full_name}
              readOnly
            />
          </div>
          <div className="w-1/4">
            Student ID: <input
              type="text"
              className={lineInput}
              value={form.data.student_id}
              readOnly
            />
          </div>
        </div>

        {/* Addresses */}
        <div>
          Address: <input
            type="text"
            className={lineInput}
            value={form.data.home_address}
            readOnly
          />
        </div>
        <div>
          Address while in school: <input
            type="text"
            className={lineInput}
            value={form.data.present_address}
            readOnly
          />
        </div>

        {/* Contact, Birthdate, Age */}
        <div className="flex gap-4 mt-2">
          <div className="w-1/3">
            Contact No.: <input type="text" className={lineInput} value={form.data.contact_no} readOnly />
          </div>
          <div className="w-1/3">
            Date of Birth: <input type="text" className={lineInput} value={form.data.birthdate} readOnly />
          </div>
          <div className="w-1/3">
            Age: <input type="text" className={lineInput} value={form.data.age} readOnly />
          </div>
        </div>

        {/* Sex, Civil Status & Sports */}
        <div className="flex flex-wrap gap-6 mt-2">

        {/* Sex */}
        <div className="flex min-w-[150px] items-center gap-2">
            <span>Sex:</span>
            <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.data.sex === 'Male'} readOnly />
            Male
            </label>
            <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={form.data.sex === 'Female'} readOnly />
            Female
            </label>
        </div>

        {/* Civil Status (REQUIRED) */}
        <div className="flex flex-col min-w-[180px]">
            <span>
            Civil Status <span className="text-red-600">*</span>
            </span>
            <input
            type="text"
            value={form.data.civil_status}
            onChange={(e) => form.setData('civil_status', e.target.value)}
            className={`${lineInput} ${
                !civilStatusValid ? 'border-red-600' : ''
            }`}
            placeholder="Single / Married / Widowed / etc."
            />
        </div>

        {/* Sports */}
        <div className="flex-1 min-w-[200px]">
            <span>Sports:</span>
            <input
            type="text"
            className={`${lineInput} w-full`}
            value={form.data.sport_event}
            readOnly
            />
        </div>

        </div>

        {/* Horizontal line */}
        <hr className="border-t-4 border-black mt-16 mb-6" />

        <p className="font-semibold">Please answer <strong>ALL</strong> of the following questions below. Give details to <strong>ALL “YES” answers</strong>.</p>

        {/* A. Medical History */}
        <div className="mt-4">
            <p className="font-semibold">A. MEDICAL HISTORY</p>
            <p className="mt-1">
                Have you ever been prohibited or restricted by a doctor from participating in sports or competitions for any reason? If your answer is yes, please provide an explanation. <span className="text-red-600">*</span>
            </p>

            <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={form.data.medical_history.yes}
                    onChange={(e) =>
                        form.setData('medical_history', {
                        yes: e.target.checked,
                        no: e.target.checked ? false : form.data.medical_history.no,
                        remarks: e.target.checked ? form.data.medical_history.remarks : '',
                        })
                    }
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={form.data.medical_history.no}
                    onChange={(e) =>
                        form.setData('medical_history', {
                        yes: e.target.checked ? false : form.data.medical_history.yes,
                        no: e.target.checked,
                        remarks: e.target.checked ? '' : form.data.medical_history.remarks,
                        })
                    }
                />
                No
                </label>

                {/* SHOW ONLY IF YES */}
                {form.data.medical_history.yes && (
                    <input
                    type="text"
                    className={`${lineInput} flex-1 ${
                        form.data.medical_history.yes &&
                        !form.data.medical_history.remarks.trim()
                        ? 'border-red-600'
                        : ''
                    }`}
                    placeholder="Explanation if YES"
                    value={form.data.medical_history.remarks}
                    onChange={(e) =>
                        form.setData('medical_history.remarks', e.target.value)
                    }
                    />
                )}
            </div>
        </div>


        {/* B. Family History */}
        <div className="mt-6">
            <p className="font-semibold">B. FAMILY HISTORY</p>
            <p className="mt-1">Do any of your family members have any of the following?</p>

            {familyHistoryQuestions.map((q, index) => (
                <div
                key={q}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2"
                >
                {/* Question (left) */}
                <div className="md:w-1/2">
                    <span>{q}? Who? <span className="text-red-600">*</span></span>
                </div>

                {/* YES / NO checkboxes (center) */}
                <div className="flex gap-4 md:w-1/4 mt-1 md:mt-0">
                    <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={form.data.family_history[q].yes}
                        onChange={(e) =>
                        form.setData(`family_history.${q}`, {
                            yes: e.target.checked,
                            no: e.target.checked ? false : form.data.family_history[q].no,
                            remarks: e.target.checked ? form.data.family_history[q].remarks : '',
                        })
                        }
                    />
                    Yes
                    </label>

                    <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={form.data.family_history[q].no}
                        onChange={(e) =>
                        form.setData(`family_history.${q}`, {
                            yes: e.target.checked ? false : form.data.family_history[q].yes,
                            no: e.target.checked,
                            remarks: e.target.checked ? '' : form.data.family_history[q].remarks,
                        })
                        }
                    />
                    No
                    </label>
                </div>

                {/* Input (right) only if YES */}
                {form.data.family_history[q].yes && (
                    <div className="w-full md:w-1/4 mt-1 md:mt-0">
                    <input
                        type="text"
                        className={`${lineInput} w-full ${
                            familyErrors[index].remarks ? 'border-red-600' : ''
                        }`}
                        placeholder="Who?"
                        value={form.data.family_history[q].remarks}
                        onChange={(e) =>
                        form.setData(`family_history.${q}.remarks`, e.target.value)
                        }
                    />
                    </div>
                )}
                </div>
            ))}
            </div>

        {/* C. Personal History */}
        <div className="mt-8">
        <p className="font-semibold">C. PERSONAL HISTORY</p>
        <p className="mt-1">Do YOU have a history of the following?</p>

        {form.data.personal_history?.map((item, index) => (
            <div
            key={index}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-4" // increased spacing from mt-2 -> mt-4
            >
            {/* Question (left) */}
            <div className="md:w-1/2">
                <span>{item.question} <span className="text-red-600">*</span></span>
            </div>

            {/* YES / NO checkboxes (center) */}
            <div className="flex gap-4 md:w-1/4 mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.yes}
                    onChange={(e) =>
                    form.setData(`personal_history.${index}`, {
                        ...item,
                        yes: e.target.checked,
                        no: e.target.checked ? false : item.no,
                        remarks: e.target.checked ? item.remarks : '',
                    })
                    }
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.no}
                    onChange={(e) =>
                    form.setData(`personal_history.${index}`, {
                        ...item,
                        yes: e.target.checked ? false : item.yes,
                        no: e.target.checked,
                        remarks: e.target.checked ? '' : item.remarks,
                    })
                    }
                />
                No
                </label>
            </div>

            {/* Remarks (right) - only if YES */}
            {item.yes && (
                <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} w-full ${
                        personalErrors[index].remarks ? 'border-red-600' : ''
                    }`}
                    placeholder="Remarks"
                    value={item.remarks}
                    onChange={(e) =>
                    form.setData(`personal_history.${index}.remarks`, e.target.value)
                    }
                />
                </div>
            )}
            </div>
        ))}
        </div>

        {/* D. Head Injuries */}
        <div className="mt-8">
        <p className="font-semibold">D. HEAD INJURIES</p>

        {/* Loss of consciousness */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Have you ever experienced a loss of consciousness? <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.head_injuries.loss_of_consciousness.yes}
                onChange={(e) =>
                    form.setData('head_injuries.loss_of_consciousness', {
                    yes: e.target.checked,
                    no: e.target.checked
                        ? false
                        : form.data.head_injuries.loss_of_consciousness.no,
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.head_injuries.loss_of_consciousness.no}
                onChange={(e) =>
                    form.setData('head_injuries.loss_of_consciousness', {
                    yes: e.target.checked
                        ? false
                        : form.data.head_injuries.loss_of_consciousness.yes,
                    no: e.target.checked,
                    })
                }
                />
                No
            </label>
            </div>
        </div>

        {/* Head injury */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-4">
            <div className="md:w-1/2">
            Have you ever sustained any type of head injury? <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.head_injuries.head_injury.yes}
                onChange={(e) =>
                    form.setData('head_injuries.head_injury', {
                    yes: e.target.checked,
                    no: e.target.checked
                        ? false
                        : form.data.head_injuries.head_injury.no,
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.head_injuries.head_injury.no}
                onChange={(e) =>
                    form.setData('head_injuries.head_injury', {
                    yes: e.target.checked
                        ? false
                        : form.data.head_injuries.head_injury.yes,
                    no: e.target.checked,
                    })
                }
                />
                No
            </label>
            </div>
        </div>
        </div>

        {/* E. Illness */}
        <div className="mt-8">
        <p className="font-semibold">E. ILLNESS</p>
        <p className="mt-1">In the past year, have you had any of the following?</p>

        {form.data.illness_history?.map((item, index) => (
            <div
            key={index}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2"
            >
            {/* Question (top on mobile) */}
            <div className="md:w-1/2">
                {item.question} <span className="text-red-600">*</span>
            </div>

            {/* YES / NO (center) */}
            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.yes}
                    onChange={(e) =>
                    form.setData(`illness_history.${index}`, {
                        ...item,
                        yes: e.target.checked,
                        no: e.target.checked ? false : item.no,
                        remarks: e.target.checked ? item.remarks : '',
                    })
                    }
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.no}
                    onChange={(e) =>
                    form.setData(`illness_history.${index}`, {
                        ...item,
                        yes: e.target.checked ? false : item.yes,
                        no: e.target.checked,
                        remarks: e.target.checked ? '' : item.remarks,
                    })
                    }
                />
                No
                </label>
            </div>

            {/* Remarks (only show if YES) */}
            {item.yes && (
                <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} ${
                        illnessErrors[index].remarks ? 'border-red-600' : ''
                    }`}
                    placeholder="Remarks"
                    value={item.remarks}
                    onChange={(e) =>
                    form.setData(`illness_history.${index}.remarks`, e.target.value)
                    }
                />
                </div>
            )}
            </div>
        ))}
        </div>

        {/* F. Allergies */}
        <div className="mt-8">
        <p className="font-semibold">F. ALLERGIES</p>
        <p className="mt-1">Are you allergic to any of the following?</p>

        {form.data.allergy_history?.map((item, index) => (
            <div
            key={index}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2"
            >
            {/* Question (top on mobile) */}
            <div className="md:w-1/2">
                {item.question} <span className="text-red-600">*</span>
            </div>

            {/* YES / NO (center) */}
            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.yes}
                    onChange={(e) =>
                    form.setData(`allergy_history.${index}`, {
                        ...item,
                        yes: e.target.checked,
                        no: e.target.checked ? false : item.no,
                        remarks: e.target.checked ? item.remarks : '',
                    })
                    }
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.no}
                    onChange={(e) =>
                    form.setData(`allergy_history.${index}`, {
                        ...item,
                        yes: e.target.checked ? false : item.yes,
                        no: e.target.checked,
                        remarks: e.target.checked ? '' : item.remarks,
                    })
                    }
                />
                No
                </label>
            </div>

            {/* Remarks (only show if YES) */}
            {item.yes && (
                <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} ${
                        allergyErrors[index].remarks ? 'border-red-600' : ''
                    }`}
                    placeholder="Remarks"
                    value={item.remarks}
                    onChange={(e) =>
                    form.setData(`allergy_history.${index}.remarks`, e.target.value)
                    }
                />
                </div>
            )}
            </div>
        ))}
        </div>

        {/* G. HOSPITALIZATION */}
        <div className="mt-8">
        <p className="font-semibold">G. HOSPITALIZATION</p>

        {/* Past Two Years - Injury */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <span className="md:w-1/2">
            A. For an injury? If yes, please specify <span className="text-red-600">*</span>
            </span>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.pastTwoYearsInjury.yes}
                onChange={(e) =>
                form.setData('hospitalization.pastTwoYearsInjury', {
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.hospitalization.pastTwoYearsInjury.no,
                    remarks: e.target.checked
                    ? form.data.hospitalization.pastTwoYearsInjury.remarks
                    : '',
                })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.pastTwoYearsInjury.no}
                onChange={(e) =>
                form.setData('hospitalization.pastTwoYearsInjury', {
                    yes: e.target.checked ? false : form.data.hospitalization.pastTwoYearsInjury.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.hospitalization.pastTwoYearsInjury.remarks,
                })
                }
                />
                No
            </label>
            </div>

            {form.data.hospitalization.pastTwoYearsInjury.yes && (
            <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.hospitalization.pastTwoYearsInjury.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Specify"
                value={form.data.hospitalization.pastTwoYearsInjury.remarks}
                onChange={(e) =>
                    form.setData('hospitalization.pastTwoYearsInjury.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>

        {/* Past Two Years - Medical Condition */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <span className="md:w-1/2">
            B. For a medical condition? If yes, please specify <span className="text-red-600">*</span>
            </span>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.pastTwoYearsMedical.yes}
                onChange={(e) =>
                form.setData('hospitalization.pastTwoYearsMedical', {
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.hospitalization.pastTwoYearsMedical.no,
                    remarks: e.target.checked
                    ? form.data.hospitalization.pastTwoYearsMedical.remarks
                    : '',
                })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.pastTwoYearsMedical.no}
                onChange={(e) =>
                form.setData('hospitalization.pastTwoYearsMedical', {
                    yes: e.target.checked ? false : form.data.hospitalization.pastTwoYearsMedical.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.hospitalization.pastTwoYearsMedical.remarks,
                })
                }
                />
                No
            </label>
            </div>

            {form.data.hospitalization.pastTwoYearsMedical.yes && (
            <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.hospitalization.pastTwoYearsMedical.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Specify"
                value={form.data.hospitalization.pastTwoYearsMedical.remarks}
                onChange={(e) =>
                    form.setData('hospitalization.pastTwoYearsMedical.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>

        {/* Surgery */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <span className="md:w-1/2">
            Have you ever undergone surgery for any medical illness or injury? If yes, please explain. <span className="text-red-600">*</span>
            </span>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.surgery.yes}
                onChange={(e) =>
                form.setData('hospitalization.surgery', {
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.hospitalization.surgery.no,
                    remarks: e.target.checked
                    ? form.data.hospitalization.surgery.remarks
                    : '',
                })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.hospitalization.surgery.no}
                onChange={(e) =>
                form.setData('hospitalization.surgery', {
                    yes: e.target.checked ? false : form.data.hospitalization.surgery.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.hospitalization.surgery.remarks,
                })
                }
                />
                No
            </label>
            </div>

            {form.data.hospitalization.surgery.yes && (
            <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.hospitalization.surgery.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Explain"
                value={form.data.hospitalization.surgery.remarks}
                onChange={(e) =>
                    form.setData('hospitalization.surgery.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>
        </div>

        {/* H. MISCELLANEOUS */}
        <div className="mt-8">
        <p className="font-semibold">H. MISCELLANEOUS</p>

        {miscellaneousItems.map((question, index) => (
            <div
            key={index}
            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2"
            >
            {/* Question */}
            <div className="md:w-1/2">{question} <span className="text-red-600">*</span></div>

            {/* YES / NO */}
            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={form.data.miscellaneous?.[index]?.yes || false}
                    onChange={(e) => {
                    const prev = form.data.miscellaneous || [];
                    const newItem = {
                    yes: e.target.checked,
                    no: e.target.checked ? false : prev[index]?.no || false,
                    details: e.target.checked ? prev[index]?.details || '' : '',
                    };
                    prev[index] = newItem;
                    form.setData('miscellaneous', [...prev]);
                    }}
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={form.data.miscellaneous?.[index]?.no || false}
                    onChange={(e) => {
                    const prev = form.data.miscellaneous || [];
                    const newItem = {
                    yes: e.target.checked ? false : prev[index]?.yes || false,
                    no: e.target.checked,
                    details: e.target.checked ? '' : prev[index]?.details || '',
                    };
                    prev[index] = newItem;
                    form.setData('miscellaneous', [...prev]);
                    }}
                />
                No
                </label>
            </div>

            {/* Details / Explanation (only if YES) */}
            {form.data.miscellaneous?.[index]?.yes && (
                <div className="w-full md:w-1/4 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} ${
                    miscErrors[index].details ? 'border-red-600' : ''
                    }`}
                    placeholder="Details / Explanation"
                    value={form.data.miscellaneous?.[index]?.details || ''}
                    onChange={(e) => {
                    const prev = form.data.miscellaneous || [];
                    prev[index] = {
                        ...prev[index],
                        details: e.target.value,
                    };
                    form.setData('miscellaneous', [...prev]);
                    }}
                />
                </div>
            )}
            </div>
        ))}
        </div>

        {/* I. FOR FEMALES */}
        <div className="mt-8">
        <p className="font-semibold">I. FOR FEMALES</p>

        {form.data.sex === 'Female' ? (
            <>
            {/* Irregular / Heavy periods */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
                <div className="md:w-1/2">
                Do you experience irregular or heavy menstrual periods? <span className="text-red-600">*</span>
                </div>

                <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                    <input
                    type="checkbox"
                    checked={form.data.female_history.irregular_periods.yes}
                    onChange={(e) =>
                        form.setData('female_history.irregular_periods', {
                        yes: e.target.checked,
                        no: e.target.checked ? false : form.data.female_history.irregular_periods.no,
                        })
                    }
                    />
                    Yes
                </label>

                <label className="flex items-center gap-1">
                    <input
                    type="checkbox"
                    checked={form.data.female_history.irregular_periods.no}
                    onChange={(e) =>
                        form.setData('female_history.irregular_periods', {
                        yes: e.target.checked ? false : form.data.female_history.irregular_periods.yes,
                        no: e.target.checked,
                        })
                    }
                    />
                    No
                </label>
                </div>
            </div>

            {/* Period frequency */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
                <div className="md:w-1/2">
                How frequently do you typically have your period in a year? (Indicate if regular or irregular) <span className="text-red-600">*</span>
                </div>
                <div className="md:w-1/2 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} ${
                    form.data.sex === 'Female' && !form.data.female_history.period_frequency.trim()
                        ? 'border-red-600'
                        : ''
                    }`}
                    value={form.data.female_history.period_frequency}
                    onChange={(e) =>
                    form.setData('female_history.period_frequency', e.target.value)
                    }
                />
                </div>
            </div>

            {/* Other gynecological issues */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
                <div className="md:w-1/2">
                Do you have any other gynecological issues? If yes, please specify. <span className="text-red-600">*</span>
                </div>

                <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                    <input
                    type="checkbox"
                    checked={form.data.female_history.other_gynecological_issues.yes}
                    onChange={(e) =>
                        form.setData('female_history.other_gynecological_issues', {
                        ...form.data.female_history.other_gynecological_issues,
                        yes: e.target.checked,
                        no: e.target.checked
                            ? false
                            : form.data.female_history.other_gynecological_issues.no,
                        })
                    }
                    />
                    Yes
                </label>

                <label className="flex items-center gap-1">
                    <input
                    type="checkbox"
                    checked={form.data.female_history.other_gynecological_issues.no}
                    onChange={(e) =>
                        form.setData('female_history.other_gynecological_issues', {
                        ...form.data.female_history.other_gynecological_issues,
                        yes: e.target.checked ? false : form.data.female_history.other_gynecological_issues.yes,
                        no: e.target.checked,
                        })
                    }
                    />
                    No
                </label>
                </div>

                {/* Show input only if YES */}
                {form.data.female_history.other_gynecological_issues.yes && (
                <div className="md:w-1/4 mt-1 md:mt-0">
                    <input
                    type="text"
                    className={lineInput}
                    placeholder="Specify"
                    value={form.data.female_history.other_gynecological_issues.details}
                    onChange={(e) =>
                        form.setData('female_history.other_gynecological_issues.details', e.target.value)
                    }
                    />
                </div>
                )}
            </div>
            </>
        ) : (
            <p className="mt-2 text-gray-600 italic">
            Section I. For Females – Not applicable for male athletes.
            </p>
        )}
        </div>

        {/* J. ORTHOPEDIC HISTORY */}
        <div className="mt-8">
        <p className="font-semibold">J. ORTHOPEDIC HISTORY</p>
        <p className="mt-1">Have you ever had any of the following? (Please give YEAR and TYPE of injury)</p>

        {form.data.orthopedic_history?.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            {/* Question (top on mobile) */}
            <div className="md:w-1/2">{item.question} <span className="text-red-600">*</span></div>

            {/* YES / NO (center) */}
            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.yes}
                    onChange={(e) =>
                    form.setData(`orthopedic_history.${index}`, {
                        ...item,
                        yes: e.target.checked,
                        no: e.target.checked ? false : item.no,
                        remarks: e.target.checked ? item.remarks : '',
                    })
                    }
                />
                Yes
                </label>

                <label className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={item.no}
                    onChange={(e) =>
                    form.setData(`orthopedic_history.${index}`, {
                        ...item,
                        yes: e.target.checked ? false : item.yes,
                        no: e.target.checked,
                        remarks: e.target.checked ? '' : item.remarks,
                    })
                    }
                />
                No
                </label>
            </div>

            {/* Remarks (only if YES) */}
            {item.yes && (
                <div className="md:w-1/4 mt-1 md:mt-0">
                <input
                    type="text"
                    className={`${lineInput} ${
                    orthoErrors[index].remarks ? 'border-red-600' : ''
                    }`}
                    placeholder="Remarks"
                    value={item.remarks}
                    onChange={(e) =>
                    form.setData(`orthopedic_history.${index}.remarks`, e.target.value)
                    }
                />
                </div>
            )}
            </div>
        ))}
        </div>
        
        {/* K. SOCIAL HISTORY  */}
        <div className="mt-8">
        <p className="font-semibold">K. SOCIAL HISTORY</p>
        <p className="mt-1">Please answer the following questions HONESTLY. For medical purposes only.</p>

        {/* Alcohol */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Do you consume alcohol? If so, please specify the frequency and quantity. <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.alcohol.yes}
                onChange={(e) =>
                    form.setData('social_history.alcohol', {
                    ...form.data.social_history.alcohol,
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.social_history.alcohol.no,
                    remarks: e.target.checked
                        ? form.data.social_history.alcohol.remarks
                        : '',
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.alcohol.no}
                onChange={(e) =>
                form.setData('social_history.alcohol', {
                    ...form.data.social_history.alcohol,
                    yes: e.target.checked ? false : form.data.social_history.alcohol.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.social_history.alcohol.remarks
                })
                }
                />
                No
            </label>
            </div>

            {/* Remarks (only if YES) */}
            {form.data.social_history.alcohol.yes && (
            <div className="md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.social_history.alcohol.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Frequency / Quantity"
                value={form.data.social_history.alcohol.remarks}
                onChange={(e) =>
                    form.setData('social_history.alcohol.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>

        {/* Reduce alcohol */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Do you feel the need or desire to reduce your alcohol consumption? <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.reduce_alcohol.yes}
                onChange={(e) =>
                    form.setData('social_history.reduce_alcohol', {
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.social_history.reduce_alcohol.no,
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.reduce_alcohol.no}
                onChange={(e) =>
                    form.setData('social_history.reduce_alcohol', {
                    yes: e.target.checked ? false : form.data.social_history.reduce_alcohol.yes,
                    no: e.target.checked,
                    })
                }
                />
                No
            </label>
            </div>
        </div>

        {/* Smoke */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Do you smoke? If yes, please indicate the frequency and amount. <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.smoke.yes}
                onChange={(e) =>
                    form.setData('social_history.smoke', {
                    ...form.data.social_history.smoke,
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.social_history.smoke.no,
                    remarks: e.target.checked
                        ? form.data.social_history.smoke.remarks
                        : '',
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.smoke.no}
                onChange={(e) =>
                    form.setData('social_history.smoke', {
                    ...form.data.social_history.smoke,
                    yes: e.target.checked ? false : form.data.social_history.smoke.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.social_history.smoke.remarks
                    })
                }
                />
                No
            </label>
            </div>

            {form.data.social_history.smoke.yes && (
            <div className="md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.social_history.smoke.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Frequency / Amount"
                value={form.data.social_history.smoke.remarks}
                onChange={(e) =>
                    form.setData('social_history.smoke.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>

        {/* Tobacco / Vape */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Have you used smokeless tobacco or vape within the past year? If so, are you aware of the potential risks and dangers associated with its use? <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.tobacco_or_vape.yes}
                onChange={(e) =>
                    form.setData('social_history.tobacco_or_vape', {
                    ...form.data.social_history.tobacco_or_vape,
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.social_history.tobacco_or_vape.no,
                    remarks: e.target.checked
                        ? form.data.social_history.tobacco_or_vape.remarks
                        : '',
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.tobacco_or_vape.no}
                onChange={(e) =>
                    form.setData('social_history.tobacco_or_vape', {
                    ...form.data.social_history.tobacco_or_vape,
                    yes: e.target.checked ? false : form.data.social_history.tobacco_or_vape.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.social_history.tobacco_or_vape.remarks
                    })
                }
                />
                No
            </label>
            </div>

            {form.data.social_history.tobacco_or_vape.yes && (
            <div className="md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.social_history.tobacco_or_vape.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Explain / Specify"
                value={form.data.social_history.tobacco_or_vape.remarks}
                onChange={(e) =>
                    form.setData('social_history.tobacco_or_vape.remarks', e.target.value)
                }
                />
            </div>
            )}
        </div>

        {/* Other medical conditions */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <div className="md:w-1/2">
            Are there any other medical conditions, illnesses, or relevant information that should be reported to the clinic? <span className="text-red-600">*</span>
            </div>

            <div className="flex gap-4 md:w-1/4 justify-start md:justify-center mt-1 md:mt-0">
            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.other_conditions.yes}
                onChange={(e) =>
                    form.setData('social_history.other_conditions', {
                    ...form.data.social_history.other_conditions,
                    yes: e.target.checked,
                    no: e.target.checked ? false : form.data.social_history.other_conditions.no,
                    remarks: e.target.checked
                        ? form.data.social_history.other_conditions.remarks
                        : '',
                    })
                }
                />
                Yes
            </label>

            <label className="flex items-center gap-1">
                <input
                type="checkbox"
                checked={form.data.social_history.other_conditions.no}
                onChange={(e) =>
                    form.setData('social_history.other_conditions', {
                    ...form.data.social_history.other_conditions,
                    yes: e.target.checked ? false : form.data.social_history.other_conditions.yes,
                    no: e.target.checked,
                    remarks: e.target.checked ? '' : form.data.social_history.other_conditions.remarks
                    })
                }
                />
                No
            </label>
            </div>

            {form.data.social_history.other_conditions.yes && (
            <div className="md:w-1/4 mt-1 md:mt-0">
                <input
                type="text"
                className={`${lineInput} ${
                !form.data.social_history.other_conditions.remarks.trim()
                    ? 'border-red-600'
                    : ''
                }`}
                placeholder="Specify / Explain"
                value={form.data.social_history.other_conditions.remarks}
                onChange={(e) =>
                    form.setData('social_history.other_conditions.remarks', e.target.value)
                }
                />
            </div>
            )}
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
              sessionStorage.setItem('athlete_page_5', JSON.stringify(form.data));
              window.location.href = '/user/fill-forms/athlete-medical/page-4';
            }}
          >
            {savingPrev ? 'Going back…' : 'Previous'}
          </Button>
          <Button type="submit" onClick={submitPage} disabled={savingNext || savingPrev || !pageValid}>
            {savingNext ? 'Continuing…' : 'Next'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
