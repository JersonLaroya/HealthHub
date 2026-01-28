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

  try {
    form.getTextField('others')?.setText(others.join(', '));
  } catch {
    console.warn('Others text field not found in PDF');
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
