import { PDFDocument } from 'pdf-lib';

/**
 * Generates a pre-enrollment PDF using the template from DB (services table)
 */
export async function fillPreEnrollmentForm(
  allPagesData: any,
  slug: string,
  prefix: string
) {
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  // Fetch PDF template
  const pdfBytes = await fetch(`/${prefix}/files/${slug}/template`)
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
  // Page 1 signature using button position
  // ----------------------
  if (allPagesData.page1?.signature_image) {
    const sigBytes = await fetch(
      allPagesData.page1.signature_image.startsWith('http')
        ? allPagesData.page1.signature_image
        : `/storage/${allPagesData.page1.signature_image}`
    ).then(r => r.arrayBuffer());

    const pngImage = await pdfDoc.embedPng(sigBytes);

    const sigButton = form.getButton('signature_image1');
    if (sigButton) {
      const widget = sigButton.acroField.getWidgets()[0];
      const rect = widget.getRectangle();
      const page = pdfDoc.getPages()[0];

      page.drawImage(pngImage, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }
  }




  /////////////////////// Fill Page 2 fields
  // ----------------------
  const civilStatus = allPagesData.page2?.civil_status?.toLowerCase() || '';

  const singleBox = form.getCheckBox('check_box_single');
  const marriedBox = form.getCheckBox('check_box_married');
  const widowedBox = form.getCheckBox('check_box_widowed');
  const separatedBox = form.getCheckBox('check_box_separated');

  if (allPagesData.page2?.picture_2x2) {
    const dataUrl = allPagesData.page2.picture_2x2;

    // Strip base64 header
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Detect image type
    const image = dataUrl.startsWith('data:image/png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    const pictureField = form.getButton('picture_2x2');
    const widget = pictureField.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    const page = pdfDoc.getPages()[1]; // Page 2

    page.drawImage(image, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }

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
  ////////////////////// Page 3 fields

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




  ///////////////// Page 4

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




  /////////////////// Page 5

  allPagesData.page5?.immunization?.forEach((value: string, index: number) => {
    const fieldName = `immunization_record${index + 1}`;

    try {
      form.getTextField(fieldName).setText(value || '');
    } catch {
      console.warn(`Missing PDF field: ${fieldName}`);
    }
  });

  form.getTextField('menstruation_age')?.setText(
    allPagesData.page5?.femaleHealth?.menstruationAge || ''
  );

  form.getTextField('menstruation_duration')?.setText(
    allPagesData.page5?.femaleHealth?.menstruationDuration || ''
  );

  form.getTextField('last_period')?.setText(
    allPagesData.page5?.femaleHealth?.lastMenstrualPeriod || ''
  );

  form.getTextField('breasts_trouble_details')?.setText(
    allPagesData.page5?.femaleHealth?.breastDetails || ''
  );

  form.getTextField('have_children')?.setText(
    allPagesData.page5?.femaleHealth?.haveChildren ? 'Yes' : 'No'
  );

  form.getTextField('how_many_children')?.setText(
    allPagesData.page5?.femaleHealth?.numberOfChildren || ''
  );
  
  // Uncheck both first
  form.getCheckBox('check_box_regular')?.uncheck();
  form.getCheckBox('check_box_irregular')?.uncheck();

  // Check based on value
  const reg = allPagesData.page5?.femaleHealth?.menstruationRegularity;
  if (reg === 'Regular') form.getCheckBox('check_box_regular')?.check();
  else if (reg === 'Irregular') form.getCheckBox('check_box_irregular')?.check();

  // Uncheck all first
  form.getCheckBox('check_box_light')?.uncheck();
  form.getCheckBox('check_box_moderate')?.uncheck();
  form.getCheckBox('check_box_heavy')?.uncheck();

  // Check the one that matches
  const flow = allPagesData.page5?.femaleHealth?.menstruationFlow;
  if (flow === 'Light') form.getCheckBox('check_box_light')?.check();
  else if (flow === 'Moderate') form.getCheckBox('check_box_moderate')?.check();
  else if (flow === 'Heavy') form.getCheckBox('check_box_heavy')?.check();

  // Uncheck both first
  form.getCheckBox('check_box_dysmenorrhea_yes')?.uncheck();
  form.getCheckBox('check_box_dysmenorrhea_no')?.uncheck();

  // Check based on value
  const dys = allPagesData.page5?.femaleHealth?.dysmenorrhea;
  if (dys === 'Yes') form.getCheckBox('check_box_dysmenorrhea_yes')?.check();
  else if (dys === 'No') form.getCheckBox('check_box_dysmenorrhea_no')?.check();

  // Uncheck both first
  form.getCheckBox('breasts_trouble_yes')?.uncheck();
  form.getCheckBox('breasts_trouble_no')?.uncheck();

  // Check based on value
  const breast = allPagesData.page5?.femaleHealth?.breastTrouble;
  if (breast === 'Yes') form.getCheckBox('breasts_trouble_yes')?.check();
  else if (breast === 'No') form.getCheckBox('breasts_trouble_no')?.check();

  // Uncheck both first
  form.getCheckBox('check_box_pregnant_yes')?.uncheck();
  form.getCheckBox('check_box_pregnant_no')?.uncheck();

  // Check based on value
  const pregnant = allPagesData.page5?.femaleHealth?.pregnantNow;
  if (pregnant === 'Yes') form.getCheckBox('check_box_pregnant_yes')?.check();
  else if (pregnant === 'No') form.getCheckBox('check_box_pregnant_no')?.check();




  ///////////////// Page 6

  const mother = allPagesData.page6?.family.mother || {};
  // Check alive/deceased
  if (mother.age_alive) {
    form.getCheckBox('check_box_mother_alive_yes')?.check();
    form.getCheckBox('check_box_mother_alive_no')?.uncheck();
    form.getTextField('mother_age')?.setText(mother.age_alive);
  } else {
    form.getCheckBox('check_box_mother_alive_yes')?.uncheck();
    form.getCheckBox('check_box_mother_alive_no')?.check();
    form.getTextField('mothe_age_time_of_death')?.setText(mother.age_death || '');
    form.getTextField('mother_cause_of_death')?.setText(mother.cause_death || '');
  }

  // Diseases & Medications
  form.getTextField('mother_diseases')?.setText(mother.diseases || '');
  form.getTextField('mother_medications')?.setText(mother.medications || '');

  const father = allPagesData.page6?.family.father || {};

  // Check alive/deceased
  if (father.age_alive) {
    form.getCheckBox('check_box_father_alive_yes')?.check();
    form.getCheckBox('check_box_father_alive_no')?.uncheck();
    form.getTextField('father_age')?.setText(father.age_alive);
  } else {
    form.getCheckBox('check_box_father_alive_yes')?.uncheck();
    form.getCheckBox('check_box_father_alive_no')?.check();
    form.getTextField('father_age_time_of_death')?.setText(father.age_death || '');
    form.getTextField('father_cause_of_death')?.setText(father.cause_death || '');
  }

  // Diseases & Medications
  form.getTextField('father_diseases')?.setText(father.diseases || '');
  form.getTextField('father_medications')?.setText(father.medications || '');

  form.getTextField('how_many_siblings')?.setText(allPagesData.page6?.family.siblings_count || '');
  form.getTextField('siblings_illnesses')?.setText(allPagesData.page6?.family.siblings_illnesses || '');

  const spouse = allPagesData.page6?.family.spouse || {};

  // Alive / Deceased
  if (spouse.age_alive) {
    form.getCheckBox('check_box_spouse_alive_yes')?.check();
    form.getCheckBox('check_box_spouse_alive_no')?.uncheck();
    form.getTextField('spouse_age')?.setText(spouse.age_alive);
  } else {
    form.getCheckBox('check_box_spouse_alive_yes')?.uncheck();
    form.getCheckBox('check_box_spouse_alive_no')?.check();
    form.getTextField('spouse_age_time_of_death')?.setText(spouse.age_death || '');
    form.getTextField('spouse_cause_of_death')?.setText(spouse.cause_death || '');
  }

  // Diseases & Medications
  form.getTextField('spouse_diseases')?.setText(spouse.diseases || '');
  form.getTextField('spouse_medications')?.setText(spouse.medications || '');

  // ----------------------
  // CHILDREN
  // ----------------------
  form.getTextField('number_of_children')?.setText(allPagesData.page6?.family.children_count || '');
  form.getTextField('health_problems')?.setText(allPagesData.page6?.family.children_health_problems || '');

  allPagesData.page6?.family.hereditary?.forEach((item: any, i: number) => {
  // Check YES/NO box
  const yesBox = form.getCheckBox(`check_box_hereditary_yes${i + 1}`);
  const noBox = form.getCheckBox(`check_box_hereditary_no${i + 1}`);

  if (yesBox && noBox) {
    if (item.answer === 'Yes') {
      yesBox.check();
      noBox.uncheck();
    } else if (item.answer === 'No') {
      yesBox.uncheck();
      noBox.check();
    } else {
      yesBox.uncheck();
      noBox.uncheck();
    }
  }

  // Fill relation
  const relationField = form.getTextField(`hereditary_relation${i + 1}`);
    if (relationField) {
      relationField.setText(item.relation || '');
    }
  });

  // Social History
  
  const social = allPagesData.page6?.social_history || {};

  // 1. Alcohol use
  const alcoholYes = form.getCheckBox('check_box_consume_alcohol_yes');
  const alcoholNo = form.getCheckBox('check_box_consume_alcohol_no');
  if (social.alcohol_use?.answer === 'Yes') {
    alcoholYes?.check();
    alcoholNo?.uncheck();
    form.getTextField('alcohol_frequency')?.setText(social.alcohol_use.details || '');
  } else if (social.alcohol_use?.answer === 'No') {
    alcoholYes?.uncheck();
    alcoholNo?.check();
    form.getTextField('alcohol_frequency')?.setText('');
  } else {
    alcoholYes?.uncheck();
    alcoholNo?.uncheck();
    form.getTextField('alcohol_frequency')?.setText('');
  }

  // 2. Reduce alcohol
  const reduceYes = form.getCheckBox('check_box_reduce_alcohol_yes');
  const reduceNo = form.getCheckBox('check_box_reduce_alcohol_no');
  if (social.reduce_alcohol?.answer === 'Yes') {
    reduceYes?.check();
    reduceNo?.uncheck();
    form.getTextField('reduce_alcohol_consumption')?.setText(social.reduce_alcohol.details || '');
  } else if (social.reduce_alcohol?.answer === 'No') {
    reduceYes?.uncheck();
    reduceNo?.check();
    form.getTextField('reduce_alcohol_consumption')?.setText('');
  } else {
    reduceYes?.uncheck();
    reduceNo?.uncheck();
    form.getTextField('reduce_alcohol_consumption')?.setText('');
  }

  // 3. Smoking
  const smokeYes = form.getCheckBox('check_box_smoke_yes');
  const smokeNo = form.getCheckBox('check_box_smoke_no');
  if (social.smoking?.answer === 'Yes') {
    smokeYes?.check();
    smokeNo?.uncheck();
    form.getTextField('smoke_frequency')?.setText(social.smoking.details || '');
  } else if (social.smoking?.answer === 'No') {
    smokeYes?.uncheck();
    smokeNo?.check();
    form.getTextField('smoke_frequency')?.setText('');
  } else {
    smokeYes?.uncheck();
    smokeNo?.uncheck();
    form.getTextField('smoke_frequency')?.setText('');
  }

  // 4. Vape / smokeless tobacco
  const smokelessYes = form.getCheckBox('check_box_smokeless_yes');
  const smokelessNo = form.getCheckBox('check_box_smokeless_no');
  if (social.vape_tobacco?.answer === 'Yes') {
    smokelessYes?.check();
    smokelessNo?.uncheck();
    form.getTextField('used_smokeless_tobacco')?.setText(social.vape_tobacco.details || '');
  } else if (social.vape_tobacco?.answer === 'No') {
    smokelessYes?.uncheck();
    smokelessNo?.check();
    form.getTextField('used_smokeless_tobacco')?.setText('');
  } else {
    smokelessYes?.uncheck();
    smokelessNo?.uncheck();
    form.getTextField('used_smokeless_tobacco')?.setText('');
  }

  // 5. Other medical conditions
  const medicalYes = form.getCheckBox('check_box_medical_conditions_yes');
  const medicalNo = form.getCheckBox('check_box_medical_conditions_no');
  if (social.other_conditions?.answer === 'Yes') {
    medicalYes?.check();
    medicalNo?.uncheck();
    form.getTextField('medical_conditions')?.setText(social.other_conditions.details || '');
  } else if (social.other_conditions?.answer === 'No') {
    medicalYes?.uncheck();
    medicalNo?.check();
    form.getTextField('medical_conditions')?.setText('');
  } else {
    medicalYes?.uncheck();
    medicalNo?.uncheck();
    form.getTextField('medical_conditions')?.setText('');
  }


  // ----------------------
  // Page 7
  // ----------------------
  if (allPagesData.page1?.signature_image) {
    const sigBytes = await fetch(
      allPagesData.page1.signature_image.startsWith('http')
        ? allPagesData.page1.signature_image
        : `/storage/${allPagesData.page1.signature_image}`
    ).then(r => r.arrayBuffer());

    const pngImage = await pdfDoc.embedPng(sigBytes);

    const sigButton = form.getButton('signature_image2'); // same field in PDF
    if (sigButton) {
      const widget = sigButton.acroField.getWidgets()[0];
      const rect = widget.getRectangle();
      const page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

      page.drawImage(pngImage, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  ////////////////////////////////
  //  TO BE FILLED-OUT BY CLINIC PERSONNEL ONLY. 
  ////////////////////////////////
  form.getTextField('clinic_personnel_cbc')?.setText(allPagesData.cbc || '');
  form.getTextField('clinic_personnel_urinalysis')?.setText(allPagesData.urinalysis || '');
  form.getTextField('clinic_personnel_chest_x_ray')?.setText(allPagesData.chest_xray || '');
  form.getTextField('clinic_personnel_stool_exam')?.setText(allPagesData.stool_exam || '');
  form.getTextField('clinic_personnel_hbsag')?.setText(allPagesData.hbsag || '');
  form.getTextField('clinic_personnel_neuropsychiatric')?.setText(allPagesData.neuropsychiatric_exam || '');
  form.getTextField('clinic_personnel_drug_test')?.setText(allPagesData.drug_test || '');
  form.getTextField('clinic_personnel_ishihara')?.setText(allPagesData.ishihara_test || '');
  form.getTextField('clinic_personnel_remarks')?.setText(allPagesData.remarks || '');

  // Flatten all fields
  // ----------------------
  form.flatten();

  // ----------------------
  // Save PDF
  // ----------------------
  return pdfDoc.save();
}
