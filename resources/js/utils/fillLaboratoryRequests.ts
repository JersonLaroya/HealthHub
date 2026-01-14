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
  const reasons = allPagesData?.reasons || {};

  if (reasons.chest_xray) {
    form.getCheckBox('check_box_x_ray')?.check();
  }

  if (reasons.stool_exam) {
    form.getCheckBox('check_box_stool_exam')?.check();
  }

  if (reasons.urinalysis) {
    form.getCheckBox('check_box_urinalysis')?.check();
  }

  if (reasons.cbc) {
    form.getCheckBox('check_box_cbc')?.check();
  }

  if (reasons.drug_test) {
    form.getCheckBox('check_box_drug_test')?.check();
  }

  if (reasons.hbsag) {
    form.getCheckBox('check_box_hbsag')?.check();
  }

  if (reasons.ishihara) {
    form.getCheckBox('check_box_ishihara_test')?.check();
  }

  if (reasons.neuro_psych) {
    form.getCheckBox('check_box_neuro_psychiatric')?.check();
  }

  if (reasons.others) {
    form.getCheckBox('check_box_others')?.check();

    // fill "others" text field if it exists
    if (reasons.others_text) {
      try {
        form.getTextField('others')?.setText(reasons.others_text);
      } catch (e) {
        console.warn('Others text field not found in PDF');
      }
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
