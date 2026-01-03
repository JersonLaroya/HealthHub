import { PDFDocument } from 'pdf-lib';

/**
 * Generates a pre-enrollment PDF using the template from DB (services table)
 */
export async function fillPreEnrollmentForm(allPagesData: any, slug: string) {
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  // Fetch PDF template
  const pdfBytes = await fetch(`/user/medical-forms/${slug}/template`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch PDF template');
      return res.arrayBuffer();
    });

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  console.log('Filling Pre-Enrollment Form with data:', allPagesData);

  // ----------------------
  // Fill Page 1 fields
  // ----------------------
  form.getTextField('name').setText(allPagesData.page1.name || '');
  form.getTextField('birthdate').setText(allPagesData.page1.birthdate || '');
  form.getTextField('printed_name').setText(allPagesData.page1.printed_name || '');

  // ----------------------
  // Fix checkboxes
  // ----------------------
  const consent1 = form.getCheckBox('check_box_consent1');
  allPagesData.page1.check_box_consent1 ? consent1.check() : consent1.uncheck();

  const consent2 = form.getCheckBox('check_box_consent2');
  allPagesData.page1.check_box_consent2 ? consent2.check() : consent2.uncheck();

  // ----------------------
  // Page 7 signature above printed_name
  // ----------------------
  if (allPagesData.page7?.signature_image) {
    const sigBytes = await fetch(
      allPagesData.page7.signature_image.startsWith('http')
        ? allPagesData.page7.signature_image
        : `/storage/${allPagesData.page7.signature_image}`
    ).then(r => r.arrayBuffer());

    const pngImage = await pdfDoc.embedPng(sigBytes);

    const printedNameField = form.getTextField('printed_name');
    const widget = printedNameField.acroField.getWidgets()[0];
    const rect = widget.getRectangle(); // { x, y, width, height }

    // Since printed_name is on page 1
    const page = pdfDoc.getPages()[0];

    // Draw the signature just above the field
    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y + rect.height + 5, // slightly above the field
      width: rect.width,
      height: 50, // adjust height as needed
    });
  }



  // Fill Page 2 fields
  // ----------------------
  const civilStatus = allPagesData.page2?.civil_status?.toLowerCase() || '';

  const singleBox = form.getCheckBox('check_box_single');
  const marriedBox = form.getCheckBox('check_box_married');
  const widowedBox = form.getCheckBox('check_box_widowed');
  const separatedBox = form.getCheckBox('check_box_separated');

  // Uncheck all first
  singleBox.uncheck();
  marriedBox.uncheck();
  widowedBox.uncheck();
  separatedBox.uncheck();

  // Check the box based on civil_status
  switch (civilStatus) {
    case 'single':
      singleBox.check();
      break;
    case 'married':
      marriedBox.check();
      break;
    case 'widowed':
      widowedBox.check();
      break;
    case 'separated':
      separatedBox.check();
      break;
  }

  form.getTextField('age').setText(allPagesData.page2.age || '');
  form.getTextField('birthplace').setText(allPagesData.page2.birthplace || '');
  form.getTextField('campus').setText(allPagesData.page2.campus || '');
  form.getTextField('course_and_year').setText(allPagesData.page2.course_and_year || '');
  form.getTextField('home_address').setText(allPagesData.page2.home_address || '');
  form.getTextField('contact_no').setText(allPagesData.page2.contact_no || '');
  form.getTextField('present_address').setText(allPagesData.page2.present_address || '');
  form.getTextField('guardian').setText(allPagesData.page2.guardian || '');
  form.getTextField('landlady').setText(allPagesData.page2.landlord || '');
  form.getTextField('landlord_contact').setText(allPagesData.page2.landlord_contact || '');
  form.getTextField('landlord_address').setText(allPagesData.page2.landlord_address || '');

  const studentType = allPagesData.page2?.student_type?.toLowerCase() || '';

  const freshmanBox = form.getCheckBox('check_box_freshman');
  const postGradBox = form.getCheckBox('check_box_post_graduate');
  const transfereeBox = form.getCheckBox('check_box_transferee');
  const crossEnrolleeBox = form.getCheckBox('check_box_cross-enrollee');
  const returningBox = form.getCheckBox('check_box_returning');

  // Uncheck all first
  freshmanBox.uncheck();
  postGradBox.uncheck();
  transfereeBox.uncheck();
  crossEnrolleeBox.uncheck();
  returningBox.uncheck();

  // Check the box based on student_type
  switch (studentType) {
    case 'freshman':
      freshmanBox.check();
      break;
    case 'post_graduate':
    case 'postgraduate':
      postGradBox.check();
      break;
    case 'transferee':
      transfereeBox.check();
      break;
    case 'cross-enrollee':
    case 'crossenrollee':
      crossEnrolleeBox.check();
      break;
    case 'returning':
      returningBox.check();
      break;
  }

  
  // ----------------------
  // Page 3 fields

  const foodAllergyBox = form.getCheckBox('check_box_food_alergies');
  const foodAllergyText = form.getTextField('food_allerigies');

  foodAllergyBox.uncheck();

  if (allPagesData.page3?.food_allergies) {
    foodAllergyBox.check();
    foodAllergyText.setText(allPagesData.page3.food_allergies);
  } else {
    foodAllergyText.setText(''); // clear if not checked
  }

  const drugAllergyBox = form.getCheckBox('check_box_drug_allergies');
  const drugllergyText = form.getTextField('drug_allergies');

  drugAllergyBox.uncheck();

  if (allPagesData.page3?.drug_allergies) {
    drugAllergyBox.check();
    drugllergyText.setText(allPagesData.page3.drug_allergies);
  } else {
    drugllergyText.setText(''); // clear if not checked
  }

  form.getCheckBox('check_box_medication_yes').uncheck();
  form.getCheckBox('check_box_medication_no').uncheck();
  form.getTextField('specify_medications').setText('');

  if (allPagesData.page3?.medications_regularly === 'Yes') {
    form.getCheckBox('check_box_medication_yes').check();
    form.getTextField('specify_medications').setText(allPagesData.page3.medications_details || '');
  } else if (allPagesData.page3?.medications_regularly === 'No') {
      form.getCheckBox('check_box_medication_no').check();
  }

  allPagesData.page3?.no_known_allergies
    ? form.getCheckBox('check_box_no_allergies').check()
    : form.getCheckBox('check_box_no_allergies').uncheck();

  const diseaseKeys = Object.keys(allPagesData.page3?.diseases || {});

  diseaseKeys.forEach((disease, i) => {
    const data = allPagesData.page3.diseases[disease];
    form.getCheckBox(`check_box_p3_yes${i + 1}`).uncheck();
    form.getCheckBox(`check_box_p3_no${i + 1}`).uncheck();
    form.getTextField(`remarks${i + 1}`).setText('');

    if (data?.yes) form.getCheckBox(`check_box_p3_yes${i + 1}`).check();
    else if (data?.no) form.getCheckBox(`check_box_p3_no${i + 1}`).check();

    if (data?.remarks) form.getTextField(`remarks${i + 1}`).setText(data.remarks);
  });



  // Page 4
  allPagesData.page4?.age_have?.forEach((item: any, i: number) => {
    form.getTextField(`age_have${i + 1}`).setText(item.age || '');

    item.na
      ? form.getCheckBox(`check_box_p4_na${i + 1}`).check()
      : form.getCheckBox(`check_box_p4_na${i + 1}`).uncheck();
  });

  Object.values(allPagesData.page4?.difficulty || {}).forEach((value: any, i: number) => {
    form.getCheckBox(`no_difficulty${i + 1}`).uncheck();
    form.getCheckBox(`some_difficulty${i + 1}`).uncheck();
    form.getCheckBox(`a_lot_of_difficulty${i + 1}`).uncheck();

    if (value === 'No difficulty') {
      form.getCheckBox(`no_difficulty${i + 1}`).check();
    } else if (value === 'Some difficulty') {
      form.getCheckBox(`some_difficulty${i + 1}`).check();
    } else if (value === 'A lot of difficulty') {
      form.getCheckBox(`a_lot_of_difficulty${i + 1}`).check();
    }
  });

  Object.values(allPagesData.page4?.tiredness || {}).forEach((value: any, i: number) => {
    form.getCheckBox(`never${i + 1}`).uncheck();
    form.getCheckBox(`some_days${i + 1}`).uncheck();
    form.getCheckBox(`most_days${i + 1}`).uncheck();
    form.getCheckBox(`everyday${i + 1}`).uncheck();

    if (value === 'Never') {
      form.getCheckBox(`never${i + 1}`).check();
    } else if (value === 'Some days') {
      form.getCheckBox(`some_days${i + 1}`).check();
    } else if (value === 'Most days') {
      form.getCheckBox(`most_days${i + 1}`).check();
    } else if (value === 'Every day') {
      form.getCheckBox(`everyday${i + 1}`).check();
    }
  });

  form.getCheckBox('check_box_equipment_yes').uncheck();
  form.getCheckBox('check_box_equipment_no').uncheck();

  if (allPagesData.page4?.equipment_help === 'Yes') {
    form.getCheckBox('check_box_equipment_yes').check();
  } else if (allPagesData.page4?.equipment_help === 'No') {
    form.getCheckBox('check_box_equipment_no').check();
  }

  [
    ['cane', 'check_box_cane_yes', 'check_box_cane_no'],
    ['walker', 'check_box_walker_yes', 'check_box_walker_no'],
    ['crutches', 'check_box_crutches_yes', 'check_box_crutches_no'],
    ['wheelchair', 'check_box_wheelchair_yes', 'check_box_wheelchair_no'],
    ['artificial_limb', 'check_box_artificial_limb_yes', 'check_box_artificial_limb_no'],
    ['assistance', 'check_box_assistance_yes', 'check_box_assistance_no'],
  ].forEach(([key, yesBox, noBox]) => {
    form.getCheckBox(yesBox).uncheck();
    form.getCheckBox(noBox).uncheck();

    allPagesData.page4?.equipment_list?.[key]
      ? form.getCheckBox(yesBox).check()
      : form.getCheckBox(noBox).check();
  });

  form.getCheckBox('check_box_sign_language_yes').uncheck();
form.getCheckBox('check_box_sign_language_no').uncheck();

allPagesData.page4?.sign_language
  ? form.getCheckBox('check_box_sign_language_yes').check()
  : form.getCheckBox('check_box_sign_language_no').check();

form.getCheckBox('check_box_medication_p4_yes').uncheck();
form.getCheckBox('check_box_medication_p4_no').uncheck();

allPagesData.page4?.anxious_medication
  ? form.getCheckBox('check_box_medication_p4_yes').check()
  : form.getCheckBox('check_box_medication_p4_no').check();

form.getTextField('physical_deformities').setText(allPagesData.page4?.physical_deformities || '');


// Page 5

  // ----------------------
  // Save PDF
  // ----------------------
  return pdfDoc.save();
}
