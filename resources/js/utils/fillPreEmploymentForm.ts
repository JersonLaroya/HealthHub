import { PDFDocument } from 'pdf-lib';

/**
 * Generates a pre-enrollment PDF using the template from DB (services table)
 */
export async function fillPreEmploymentForm(allPagesData: any, slug: string) {
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  // Fetch PDF template
  const pdfBytes = await fetch(`/user/files/${slug}/template`)
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

  form.getTextField('fullname').setText(allPagesData.page2.name || '');
  form.getTextField('age').setText(allPagesData.page2.age || '');
  form.getTextField('birthplace').setText(allPagesData.page2.birthplace || '');
  form.getTextField('home_address').setText(allPagesData.page2.home_address || '');
  form.getTextField('contact_no').setText(allPagesData.page2.contact_no || '');

    allPagesData.page2?.allergies_checkbox
        ? form.getCheckBox('check_box_allergies').check()
        : form.getCheckBox('check_box_allergies').uncheck();

    form.getTextField('allergies')?.setText(allPagesData.page2?.allergies || '');
        
  allPagesData.page2?.no_known_allergies
    ? form.getCheckBox('check_box_no_allergies').check()
    : form.getCheckBox('check_box_no_allergies').uncheck();

    if (allPagesData.page2?.medications_regularly === 'Yes') {
        form.getCheckBox('check_box_medications_regularly_yes').check();
        form.getTextField('medications_regularly').setText(allPagesData.page2.medications_details || '');
    } else if (allPagesData.page3?.medications_regularly === 'No') {
        form.getCheckBox('check_box_medications_regularly_no').check();
    }

   const diseaseKeys = Object.keys(allPagesData.page2?.diseases || {});

  diseaseKeys.forEach((disease, i) => {
    const data = allPagesData.page2.diseases[disease];
    form.getCheckBox(`check_box_diseases_yes${i + 1}`).uncheck();
    form.getCheckBox(`check_box_diseases_no${i + 1}`).uncheck();
    form.getTextField(`diseases_remark${i + 1}`).setText('');

    if (data?.yes) form.getCheckBox(`check_box_diseases_yes${i + 1}`).check();
    else if (data?.no) form.getCheckBox(`check_box_diseases_no${i + 1}`).check();

    if (data?.remarks) form.getTextField(`diseases_remark${i + 1}`).setText(data.remarks);
  });




   ///////////////// Page 3

  allPagesData.page3?.age_have?.forEach((item: any, i: number) => {
    form.getTextField(`age_have${i + 1}`).setText(item.age || '');

    item.na
      ? form.getCheckBox(`age_have_na${i + 1}`).check()
      : form.getCheckBox(`age_have_na${i + 1}`).uncheck();
  });

  allPagesData.page3?.immunization?.forEach((value: string, index: number) => {
    const fieldName = `immunization_date_given${index + 1}`;

    try {
      form.getTextField(fieldName).setText(value || '');
    } catch {
      console.warn(`Missing PDF field: ${fieldName}`);
    }
  });

  form.getTextField('age_onset')?.setText(
    allPagesData.page4?.femaleHealth?.menstruationAge || ''
  );

  form.getTextField('menstruation_duration')?.setText(
    allPagesData.page4?.femaleHealth?.menstruationDuration || ''
  );

  form.getTextField('last_menstrual_period')?.setText(
    allPagesData.page4?.femaleHealth?.lastMenstrualPeriod || ''
  );

  form.getTextField('breasts_trouble')?.setText(
    allPagesData.page4?.femaleHealth?.breastDetails || ''
  );
  
//   // Uncheck both first
  form.getCheckBox('check_box_regular')?.uncheck();
  form.getCheckBox('check_box_irregular')?.uncheck();

//   // Check based on value
  const reg = allPagesData.page4?.femaleHealth?.menstruationRegularity;
  if (reg === 'Regular') form.getCheckBox('check_box_regular')?.check();
  else if (reg === 'Irregular') form.getCheckBox('check_box_irregular')?.check();

//   // Uncheck all first
  form.getCheckBox('check_box_light')?.uncheck();
  form.getCheckBox('check_box_moderate')?.uncheck();
  form.getCheckBox('check_box_heavy')?.uncheck();

//   // Check the one that matches
  const flow = allPagesData.page4?.femaleHealth?.menstruationFlow;
  console.log("Flow: ", flow);
  if (flow === 'Light') form.getCheckBox('check_box_light')?.check();
  else if (flow === 'Moderate') form.getCheckBox('check_box_moderate')?.check();
  else if (flow === 'Heavy') form.getCheckBox('check_box_heavy')?.check();

//   // Uncheck both first
  form.getCheckBox('check_box_dysmenorrhea_yes')?.uncheck();
  form.getCheckBox('check_box_dysmenorrhea_no')?.uncheck();

//   // Check based on value
  const dys = allPagesData.page4?.femaleHealth?.dysmenorrhea;
  if (dys === 'Yes') form.getCheckBox('check_box_dysmenorrhea_yes')?.check();
  else if (dys === 'No') form.getCheckBox('check_box_dysmenorrhea_no')?.check();

//   // Uncheck both first
  form.getCheckBox('check_box_breasts_trouble_yes')?.uncheck();
  form.getCheckBox('check_box_breasts_trouble_no')?.uncheck();

//   // Check based on value
  const breast = allPagesData.page4?.femaleHealth?.breastTrouble;
  if (breast === 'Yes') form.getCheckBox('check_box_breasts_trouble_yes')?.check();
  else if (breast === 'No') form.getCheckBox('check_box_breasts_trouble_no')?.check();

  const mother = allPagesData.page4?.family.mother || {};
  // Check alive/deceased
  if (mother.age_alive) {
    form.getTextField('mother_age')?.setText(mother.age_alive);
  } else {
    form.getTextField('mother_age_death')?.setText(mother.age_death || '');
    form.getTextField('mother_cause_death')?.setText(mother.cause_death || '');
  }

//   // Diseases & Medications
  form.getTextField('mother_diseases')?.setText(mother.diseases || '');
  form.getTextField('mother_maintenance')?.setText(mother.medications || '');

   const father = allPagesData.page4?.family.father || {};

//   // Check alive/deceased
  if (father.age_alive) {
    form.getTextField('father_age')?.setText(father.age_alive);
  } else {
    form.getTextField('father_age_death')?.setText(father.age_death || '');
    form.getTextField('father_cause_death')?.setText(father.cause_death || '');
  }

//   // Diseases & Medications
  form.getTextField('father_diseases')?.setText(father.diseases || '');
  form.getTextField('father_maintenance')?.setText(father.medications || '');


   const spouse = allPagesData.page4?.family.spouse || {};

//   // Alive / Deceased
  if (spouse.age_alive) {
    form.getTextField('spouse_age')?.setText(spouse.age_alive);
  } else {
    form.getTextField('spouse_age_death')?.setText(spouse.age_death || '');
    form.getTextField('spouse_cause_death')?.setText(spouse.cause_death || '');
  }

// Uncheck all health condition boxes first
form.getCheckBox('check_box_excellent')?.uncheck();
form.getCheckBox('check_box_good')?.uncheck();
form.getCheckBox('check_box_fair')?.uncheck();
form.getCheckBox('check_box_poor')?.uncheck();

// Check the appropriate box based on generalHealth
switch ((allPagesData.page4?.generalHealth || '').toLowerCase()) {
    case 'Excellent':
        form.getCheckBox('check_box_excellent')?.check();
        break;
    case 'Good':
        form.getCheckBox('check_box_good')?.check();
        break;
    case 'Fair':
        form.getCheckBox('check_box_fair')?.check();
        break;
    case 'Poor':
        form.getCheckBox('check_box_poor')?.check();
        break;
}

//   // Diseases & Medications
  form.getTextField('spouse_diseases')?.setText(spouse.diseases || '');
  form.getTextField('spouse_maintenance')?.setText(spouse.medications || '');

//   // CHILDREN
  form.getTextField('children­_number')?.setText(allPagesData.page4?.family.children.number || '');
  form.getTextField('children_health_problems')?.setText(allPagesData.page4?.family.children.healthProblems || '');

   allPagesData.page4?.family.hereditary?.forEach((item: any, i: number) => {
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


  // Page 5

  // Social History
  
  const social = allPagesData.page5?.socialHistory || {};

  // 1. Alcohol use
  const alcoholYes = form.getCheckBox('check_box_alcohol_yes');
  const alcoholNo = form.getCheckBox('check_box_alcohol_no');
  if (social.alcoholConsumption === 'Yes') {
    alcoholYes?.check();
    alcoholNo?.uncheck();
    form.getTextField('consume_alcohol')?.setText(social.alcoholConsumptionDetails || '');
  } else if (social.alcoholConsumption === 'No') {
    alcoholYes?.uncheck();
    alcoholNo?.check();
    form.getTextField('consume_alcohol')?.setText('');
  } else {
    alcoholYes?.uncheck();
    alcoholNo?.uncheck();
    form.getTextField('consume_alcohol')?.setText('');
  }

  // 2. Reduce alcohol
  const reduceYes = form.getCheckBox('check_box_reduce_alcohol_yes');
  const reduceNo = form.getCheckBox('check_box_reduce_alcohol_no');
  if (social.alcoholReduce === 'Yes') {
    reduceYes?.check();
    reduceNo?.uncheck();
    form.getTextField('reduce_alcohol')?.setText(social.alcoholReduceDetails || '');
  } else if (social.alcoholReduce === 'No') {
    reduceYes?.uncheck();
    reduceNo?.check();
    form.getTextField('reduce_alcohol')?.setText('');
  } else {
    reduceYes?.uncheck();
    reduceNo?.uncheck();
    form.getTextField('reduce_alcohol')?.setText('');
  }

  // 3. Smoking
  const smokeYes = form.getCheckBox('check_box_smoke_yes');
  const smokeNo = form.getCheckBox('check_box_smoke_no');
  if (social.smoke === 'Yes') {
    smokeYes?.check();
    smokeNo?.uncheck();
    form.getTextField('smoke')?.setText(social.smokeDetails || '');
  } else if (social.smoke === 'No') {
    smokeYes?.uncheck();
    smokeNo?.check();
    form.getTextField('smoke')?.setText('');
  } else {
    smokeYes?.uncheck();
    smokeNo?.uncheck();
    form.getTextField('smoke')?.setText('');
  }

  // 4. Vape / smokeless tobacco
  const smokelessYes = form.getCheckBox('check_box_smokeless_yes');
  const smokelessNo = form.getCheckBox('check_box_smokeless_no');
  if (social.tobaccoVape === 'Yes') {
    smokelessYes?.check();
    smokelessNo?.uncheck();
    form.getTextField('smokeless')?.setText(social.tobaccoVapeDetails || '');
  } else if (social.tobaccoVape === 'No') {
    smokelessYes?.uncheck();
    smokelessNo?.check();
    form.getTextField('smokeless')?.setText('');
  } else {
    smokelessYes?.uncheck();
    smokelessNo?.uncheck();
    form.getTextField('smokeless')?.setText('');
  }

  // 5. Other medical conditions
  const medicalYes = form.getCheckBox('check_box_other_conditions_yes');
  const medicalNo = form.getCheckBox('check_box_other_conditions_no');
  if (social.otherConditions === 'Yes') {
    medicalYes?.check();
    medicalNo?.uncheck();
    form.getTextField('other_medical_conditions')?.setText(social.otherConditionsDetails || '');
  } else if (social.otherConditions === 'No') {
    medicalYes?.uncheck();
    medicalNo?.check();
    form.getTextField('other_medical_conditions')?.setText('');
  } else {
    medicalYes?.uncheck();
    medicalNo?.uncheck();
    form.getTextField('other_medical_conditions')?.setText('');
  }

  if (allPagesData.page1?.signature_image) {
    const sigBytes = await fetch(
        allPagesData.page1.signature_image.startsWith('http')
        ? allPagesData.page1.signature_image
        : `/storage/${allPagesData.page1.signature_image}`
    ).then(r => r.arrayBuffer());

    const pngImage = await pdfDoc.embedPng(sigBytes);

    const sigButton = form.getButton('signature_image2');
    if (sigButton) {
        const widget = sigButton.acroField.getWidgets()[0];
        const rect = widget.getRectangle();

        // Page 8 = index 7
        const page = pdfDoc.getPages()[7];

        page.drawImage(pngImage, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        });
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
