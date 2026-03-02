import { PDFDocument } from 'pdf-lib';

/**
 * Generates a pre-enrollment PDF using the template from DB (services table)
 */
export async function fillLaboratoryRequests(allPagesData: any, slug: string, patient: any) {
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  // Fetch PDF template
  const pdfBytes = await fetch(`/user/files/${slug}/template`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch PDF template');
      return res.arrayBuffer();
    });

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  console.log('Filling Laboratory Requests Form with data:', allPagesData);
  console.log('patient: ', patient);

  // ----------------------
  // Fill Page 1 fields
  // ----------------------
  form.getTextField('name').setText(allPagesData.patient_name || patient.name);
  form.getTextField('date').setText(allPagesData.date || '');

  const yearCourseOrOffice =
  allPagesData.year_course_or_office ||
  (patient?.course || patient?.office
    ? patient?.course
      ? `${patient.course?.code || '-'} ${patient.year?.level || '-'}`
      : patient?.office?.name || '-'
    : '-');

   form.getTextField('year_course_or_office').setText(yearCourseOrOffice);

  form.getTextField('remarks').setText(allPagesData.remarks || '');

    // =========================
  // CHECKBOXES
  // =========================
// =========================
// CHECKBOXES (from DB lab_types)
// =========================

const labTypes: string[] = allPagesData.lab_types || [];

const normalized = labTypes.map(t => t.toLowerCase());

// helpers
const has = (keyword: string) =>
  normalized.some(t => t.includes(keyword));

// known checkboxes
if (has('x-ray')) {
  form.getCheckBox('check_box_x_ray')?.check();
}

if (has('stool')) {
  form.getCheckBox('check_box_stool_exam')?.check();
}

if (has('urinalysis')) {
  form.getCheckBox('check_box_urinalysis')?.check();
}

if (has('complete blood') || has('cbc')) {
  form.getCheckBox('check_box_cbc')?.check();
}

if (has('drug')) {
  form.getCheckBox('check_box_drug_test')?.check();
}

if (has('hbsag')) {
  form.getCheckBox('check_box_hbsag')?.check();
}

if (has('ishihara')) {
  form.getCheckBox('check_box_ishihara_test')?.check();
}

if (has('neuro')) {
  form.getCheckBox('check_box_neuro_psychiatric')?.check();
}


const knownKeywords = [
  'x-ray',
  'stool',
  'urinalysis',
  'complete blood',
  'cbc',
  'drug',
  'hbsag',
  'ishihara',
  'neuro',
];

const others = labTypes.filter(t =>
  !knownKeywords.some(k => t.toLowerCase().includes(k))
);

if (others.length > 0) {
  form.getCheckBox('check_box_others')?.check();

  const othersText = others.join(', ');

  const field1 = form.getTextField('others');
  const field2 = form.getTextField('others2'); // your extra field

  // helper: split text respecting a max length, preferably at commas/spaces
  const splitByMaxLen = (text: string, maxLen: number) => {
    if (!maxLen || maxLen <= 0 || text.length <= maxLen) {
      return [text, ''] as const;
    }

    // try to cut at a comma before maxLen
    let cut = text.lastIndexOf(',', maxLen);
    if (cut === -1) cut = text.lastIndexOf(' ', maxLen);
    if (cut === -1) cut = maxLen;

    const first = text.slice(0, cut).trim().replace(/[, ]+$/, '');
    const rest = text.slice(cut).trim().replace(/^,/, '').trim();

    return [first, rest] as const;
  };

  try {
    // Prefer actual PDF max length if present; fallback to a safe number.
    const maxLen1 =
      (field1?.acroField?.getMaxLength?.() as number | undefined) ?? 80;

    const [part1, remaining] = splitByMaxLen(othersText, maxLen1);

    field1?.setText(part1);

    if (remaining) {
      // If others2 also has a max length, you can split again (optional).
      const maxLen2 =
        (field2?.acroField?.getMaxLength?.() as number | undefined) ?? 80;

      const [part2] = splitByMaxLen(remaining, maxLen2);
      field2?.setText(part2);

      // If you want, you can keep chaining to others3, others4, etc.
    }
  } catch (e) {
    console.warn('Others text fields not found or failed to set:', e);
  }
}




  // Flatten all fields
  // ----------------------
  form.flatten();

  // ----------------------
  // Save PDF
  // ----------------------
  return pdfDoc.save();
}
