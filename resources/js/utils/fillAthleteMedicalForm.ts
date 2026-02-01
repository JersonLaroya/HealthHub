import { PDFDocument } from 'pdf-lib';

/**
 * Generates a pre-enrollment PDF using the template from DB (services table)
 */
export async function fillAthleteMedicalForm(allPagesData: any, slug: string) {
    
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  // Fetch PDF template
  const pdfBytes = await fetch(`/user/files/${slug}/template`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch PDF template');
      return res.arrayBuffer();
    });

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  console.log('Filling Athlete Form with data:', allPagesData);

// ----------------------
// Page 1 (DUHS / Head Nurse)
// ----------------------

const p1 = allPagesData.page1 || {};

// Head nurse printed name
form.getTextField('head_nurse_printed_name')?.setText(
  p1.duhs_name || ''
);

// DUHS Signature
if (p1.duhs_signature) {
  const sigBytes = await fetch(
    p1.duhs_signature.startsWith('http')
      ? p1.duhs_signature
      : `/storage/${p1.duhs_signature}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('duhs_signature');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Change page index if Page 1 is not index 0
    const page = pdfDoc.getPages()[0];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}


// ----------------------
// Page 2
// ----------------------

const p2 = allPagesData.page2 || {};

form.getTextField('sport_event')?.setText(p2.sport_event || '');
form.getTextField('name')?.setText(p2.name || '');
form.getTextField('student_id')?.setText(p2.student_id || '');
form.getTextField('activity_participated_and_year')?.setText(p2.activity_participated || '');
form.getTextField('organized_by')?.setText(p2.organized_by || '');
form.getTextField('activity_name')?.setText(p2.activity || '');
form.getTextField('hereby_release')?.setText(p2.hereby_release || '');
form.getTextField('date_filled')?.setText(p2.date || '');

form.getTextField('printed_name')?.setText(
  p2?.printed_name || ''
);

// Signature
if (allPagesData.page2?.signature_image) {
  const sigBytes = await fetch(
    allPagesData.page2.signature_image.startsWith('http')
      ? allPagesData.page2.signature_image
      : `/storage/${allPagesData.page2.signature_image}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('signature_image1');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Page 6 → index 5 (adjust if needed)
    const page = pdfDoc.getPages()[1];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}


// ----------------------
// Page 3
// ----------------------
form.getTextField('birthdate')?.setText(
  allPagesData.page3?.birthdate || ''
);

form.getTextField('home_address')?.setText(
  allPagesData.page3?.home_address || ''
);

form.getTextField('present_address')?.setText(
  allPagesData.page3?.school_address || ''
);

form.getTextField('contact_no')?.setText(
  allPagesData.page3?.contact_no || ''
);

// Signature
if (allPagesData.page2?.signature_image) {
  const sigBytes = await fetch(
    allPagesData.page2.signature_image.startsWith('http')
      ? allPagesData.page2.signature_image
      : `/storage/${allPagesData.page2.signature_image}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('signature_image2');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Page 6 → index 5 (adjust if needed)
    const page = pdfDoc.getPages()[3];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}

// ----------------------
// Page 4
// ----------------------

// Signature
if (allPagesData.page2?.signature_image) {
  const sigBytes = await fetch(
    allPagesData.page2.signature_image.startsWith('http')
      ? allPagesData.page2.signature_image
      : `/storage/${allPagesData.page2.signature_image}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('signature_image3');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Page 6 → index 5 (adjust if needed)
    const page = pdfDoc.getPages()[3];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}

// Signature
if (allPagesData.page2?.signature_image) {
  const sigBytes = await fetch(
    allPagesData.page2.signature_image.startsWith('http')
      ? allPagesData.page2.signature_image
      : `/storage/${allPagesData.page2.signature_image}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('signature_image4');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Page 6 → index 5 (adjust if needed)
    const page = pdfDoc.getPages()[3];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}


// ----------------------
// Page 5
// ----------------------

form.getTextField('age')?.setText(
  allPagesData.page5?.age || ''
);

if (allPagesData.page5?.sex === 'Male') {
  form.getCheckBox('check_box_sex_male')?.check();
}
else {
  form.getCheckBox('check_box_sex_female')?.check();
}

const mh = allPagesData.page5?.medical_history;

if (mh?.yes === true) {
  form.getCheckBox('check_box_medical_history_yes')?.check();
}

if (mh?.no === true) {
  form.getCheckBox('check_box_medical_history_no')?.check();
}

form.getTextField('medical_history')?.setText(
  mh?.remarks || ''
);

const family = allPagesData.page5?.family_history;

// Sudden death / heart problems
family?.['Sudden death or heart problems under the age of 50']?.yes
  ? form.getCheckBox('check_box_sudden_death_yes')?.check()
  : form.getCheckBox('check_box_sudden_death_no')?.check();

form.getTextField('sudden_death_who')?.setText(
  family?.['Sudden death or heart problems under the age of 50']?.remarks || ''
);

// High blood pressure
family?.['High blood pressure']?.yes
  ? form.getCheckBox('check_box_high_blood_yes')?.check()
  : form.getCheckBox('check_box_high_blood_no')?.check();

form.getTextField('high_blood_who')?.setText(
  family?.['High blood pressure']?.remarks || ''
);

// Diabetes
family?.['Diabetes']?.yes
  ? form.getCheckBox('check_box_diabetes_yes')?.check()
  : form.getCheckBox('check_box_diabetes_no')?.check();

form.getTextField('diabetes_who')?.setText(
  family?.['Diabetes']?.remarks || ''
);

const personalHistory = allPagesData.page5?.personal_history || [];

personalHistory.forEach((item: any, i: number) => {
  const index = i + 1;

  // Yes/No checkboxes
  const yesBox = form.getCheckBox(`check_box_personal_history_yes${index}`);
  const noBox = form.getCheckBox(`check_box_personal_history_no${index}`);

  if (item.yes) yesBox?.check(); else yesBox?.uncheck();
  if (item.no) noBox?.check(); else noBox?.uncheck();

  // Remarks text field
  form.getTextField(`personal_history_remark${index}`)?.setText(item.remarks || '');
});


const headInjuries = allPagesData.page5?.head_injuries;

// Loss of consciousness
if (headInjuries?.loss_of_consciousness?.yes) {
  form.getCheckBox('check_box_loss_consciousness_yes')?.check();
  form.getCheckBox('check_box_loss_consciousness_no')?.uncheck();
} else {
  form.getCheckBox('check_box_loss_consciousness_yes')?.uncheck();
  form.getCheckBox('check_box_loss_consciousness_no')?.check();
}

// Any head injury
if (headInjuries?.head_injury?.yes) {
  form.getCheckBox('check_box_any_head_injury_yes')?.check();
  form.getCheckBox('check_box_any_head_injury_no')?.uncheck();
} else {
  form.getCheckBox('check_box_any_head_injury_yes')?.uncheck();
  form.getCheckBox('check_box_any_head_injury_no')?.check();
}


// Illness History
const illnessHistory = allPagesData.page5?.illness_history || [];

illnessHistory.forEach((item: any, i: number) => {
  const index = i + 1;
  const yesBox = form.getCheckBox(`check_box_illness_yes${index}`);
  const noBox = form.getCheckBox(`check_box_illness_no${index}`);

  item.yes ? yesBox?.check() : yesBox?.uncheck();
  item.no  ? noBox?.check()  : noBox?.uncheck();

  form.getTextField(`illness_remark${index}`)?.setText(item.remarks || '');
});

// Allergies History
const allergyHistory = allPagesData.page5?.allergy_history || [];

allergyHistory.forEach((item: any, i: number) => {
  const index = i + 1;
  const yesBox = form.getCheckBox(`check_box_allergy_yes${index}`);
  const noBox = form.getCheckBox(`check_box_allergy_no${index}`);

  item.yes ? yesBox?.check() : yesBox?.uncheck();
  item.no  ? noBox?.check()  : noBox?.uncheck();

  form.getTextField(`allergy_remark${index}`)?.setText(item.remarks || '');
});

const hospitalization = allPagesData.page5?.hospitalization;

// Past two years injury
if (hospitalization?.pastTwoYearsInjury?.yes) {
  form.getCheckBox('check_box_injury_yes')?.check();
  form.getCheckBox('check_box_injury_no')?.uncheck();
} else {
  form.getCheckBox('check_box_injury_yes')?.uncheck();
  form.getCheckBox('check_box_injury_no')?.check();
}

form.getTextField('injury')?.setText(hospitalization?.pastTwoYearsInjury?.remarks || '');

// Past two years medical condition
if (hospitalization?.pastTwoYearsMedical?.yes) {
  form.getCheckBox('check_box_medical_condition_yes')?.check();
  form.getCheckBox('check_box_medical_condition_no')?.uncheck();
} else {
  form.getCheckBox('check_box_medical_condition_yes')?.uncheck();
  form.getCheckBox('check_box_medical_condition_no')?.check();
}

form.getTextField('medical_condition')?.setText(hospitalization?.pastTwoYearsMedical?.remarks || '');

// Surgery
if (hospitalization?.surgery?.yes) {
  form.getCheckBox('check_box_surgery_yes')?.check();
  form.getCheckBox('check_box_surgery_no')?.uncheck();
} else {
  form.getCheckBox('check_box_surgery_yes')?.uncheck();
  form.getCheckBox('check_box_surgery_no')?.check();
}

form.getTextField('surgery')?.setText(hospitalization?.surgery?.remarks || '');

// Miscellaneous
const miscellaneous = allPagesData.page5?.miscellaneous || [];

miscellaneous.forEach((item: any, i: number) => {
  const index = i + 1;

  // Yes/No checkboxes
  if (item.yes) {
    form.getCheckBox(`check_box_miscellaneous_yes${index}`)?.check();
    form.getCheckBox(`check_box_miscellaneous_no${index}`)?.uncheck();
  } else {
    form.getCheckBox(`check_box_miscellaneous_yes${index}`)?.uncheck();
    form.getCheckBox(`check_box_miscellaneous_no${index}`)?.check();
  }

  // Details text field
  form.getTextField(`miscellaneous${index}`)?.setText(item.details || '');
});


// Female History
const femaleHistory = allPagesData.page5?.female_history || {};

// Irregular periods
if (femaleHistory.irregular_periods?.yes) {
  form.getCheckBox('check_box_irregular_menstrual_yes')?.check();
  form.getCheckBox('check_box_irregular_menstrual_no')?.uncheck();
} else {
  form.getCheckBox('check_box_irregular_menstrual_yes')?.uncheck();
  form.getCheckBox('check_box_irregular_menstrual_no')?.check();
}

// Period frequency
form.getTextField('period_frequency')?.setText(femaleHistory.period_frequency || '');

// Other gynecological issues
if (femaleHistory.other_gynecological_issues?.yes) {
  form.getCheckBox('check_box_gynecological_issues_yes')?.check();
  form.getCheckBox('check_box_gynecological_issues_no')?.uncheck();
} else {
  form.getCheckBox('check_box_gynecological_issues_yes')?.uncheck();
  form.getCheckBox('check_box_gynecological_issues_no')?.check();
}

// Gynecological issues details
form.getTextField('gynecological_issues')?.setText(
  femaleHistory.other_gynecological_issues?.details || ''
);


// Orthopedic History
const orthopedicHistory = allPagesData.page5?.orthopedic_history || [];

orthopedicHistory.forEach((item: any, i: number) => {
  const index = i + 1;

  // Yes/No checkboxes
  const yesBox = form.getCheckBox(`check_box_orthopedic_history_yes${index}`);
  const noBox = form.getCheckBox(`check_box_orthopedic_history_no${index}`);

  if (item.yes) yesBox?.check(); else yesBox?.uncheck();
  if (item.no) noBox?.check(); else noBox?.uncheck();

  // Remarks text field
  form.getTextField(`orthopedic_remark${index}`)?.setText(item.remarks || '');
});


// Social History
const social = allPagesData.page5?.social_history;

// Consume alcohol
if (social?.alcohol?.yes) {
  form.getCheckBox('check_box_consume_alcohol_yes')?.check();
  form.getCheckBox('check_box_consume_alcohol_no')?.uncheck();
} else {
  form.getCheckBox('check_box_consume_alcohol_yes')?.uncheck();
  form.getCheckBox('check_box_consume_alcohol_no')?.check();
}
form.getTextField('consume_alcohol')?.setText(social?.alcohol?.remarks || '');

// Reduce alcohol
if (social?.reduce_alcohol?.yes) {
  form.getCheckBox('check_box_reduce_alcohol­_yes')?.check();
  form.getCheckBox('check_box_reduce_alcohol­_no')?.uncheck();
} else {
  form.getCheckBox('check_box_reduce_alcohol­_yes')?.uncheck();
  form.getCheckBox('check_box_reduce_alcohol­_no')?.check();
}

// Smoke
if (social?.smoke?.yes) {
  form.getCheckBox('check_box_smoke_yes')?.check();
  form.getCheckBox('check_box_smoke_no')?.uncheck();
} else {
  form.getCheckBox('check_box_smoke_yes')?.uncheck();
  form.getCheckBox('check_box_smoke_no')?.check();
}
form.getTextField('smoke_frequency_amount')?.setText(social?.smoke?.remarks || '');

// Smokeless tobacco / vape
if (social?.tobacco_or_vape?.yes) {
  form.getCheckBox('check_box_smokeless_tobacco_yes')?.check();
  form.getCheckBox('check_box_smokeless_tobacco_no')?.uncheck();
} else {
  form.getCheckBox('check_box_smokeless_tobacco_yes')?.uncheck();
  form.getCheckBox('check_box_smokeless_tobacco_no')?.check();
}
form.getTextField('smokeless_tobacco_vape')?.setText(social?.tobacco_or_vape?.remarks || '');

// Other medical conditions
if (social?.other_conditions?.yes) {
  form.getCheckBox('check_box_other_medical_conditions_yes')?.check();
  form.getCheckBox('check_box_other_medical_conditions_no')?.uncheck();
} else {
  form.getCheckBox('check_box_other_medical_conditions_yes')?.uncheck();
  form.getCheckBox('check_box_other_medical_conditions_no')?.check();
}
form.getTextField('other_medical_conditions')?.setText(social?.other_conditions?.remarks || '');


// ----------------------
// Page 11
// ----------------------

// Signature
if (allPagesData.page2?.signature_image) {
  const sigBytes = await fetch(
    allPagesData.page2.signature_image.startsWith('http')
      ? allPagesData.page2.signature_image
      : `/storage/${allPagesData.page2.signature_image}`
  ).then(r => r.arrayBuffer());

  const pngImage = await pdfDoc.embedPng(sigBytes);

  const sigButton = form.getButton('signature_image5');
  if (sigButton) {
    const widget = sigButton.acroField.getWidgets()[0];
    const rect = widget.getRectangle();

    // Page 11 in the pdf
    const page = pdfDoc.getPages()[10];

    page.drawImage(pngImage, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }
}

form.getTextField('civil_status')?.setText(allPagesData.page5.civil_status || '');
form.getTextField('sex')?.setText(allPagesData.page5.sex || '');

/////////////
//  TO BE FILLED OUT BY PHYSICIAN
////////////
const vitalSigns = allPagesData.vitalSigns || {};
const anthropometry = allPagesData.anthropometry || {};

form.getTextField('bp')?.setText(vitalSigns.bp || '');
form.getTextField('pr')?.setText(vitalSigns.pr || '');
form.getTextField('rr')?.setText(vitalSigns.rr || '');
form.getTextField('temp')?.setText(vitalSigns.temp || '');
form.getTextField('02_sat')?.setText(vitalSigns.o2sat || '');

form.getTextField('height')?.setText(anthropometry.height || '');
form.getTextField('weight')?.setText(anthropometry.weight || '');
form.getTextField('bmi')?.setText(anthropometry.bmi || '');


  const generalHealth = allPagesData.generalHealth || '';

  form.getCheckBox('health_appearance_excellent')?.uncheck();
  form.getCheckBox('health_appearance_good')?.uncheck();
  form.getCheckBox('health_appearance_fair')?.uncheck();
  form.getCheckBox('health_appearance_poor')?.uncheck();

  switch (generalHealth.toLowerCase()) {
    case 'excellent':
      form.getCheckBox('health_appearance_excellent')?.check();
      break;
    case 'good':
      form.getCheckBox('health_appearance_good')?.check();
      break;
    case 'fair':
      form.getCheckBox('health_appearance_fair')?.check();
      break;
    case 'poor':
      form.getCheckBox('health_appearance_poor')?.check();
      break;
    default:
      // none checked if value is missing/unknown
      break;
  }

  // ----------------------
  // Organ Systems Checkboxes & Findings
  // ----------------------
  const organSystems = allPagesData.organ_systems || {};

  const mapping: Record<string, { normal: string; abnormal: string; findings: string }> = {
    skin: { normal: 'check_box_normal_skin', abnormal: 'check_box_abnormal_skin', findings: 'abnormal_findings_skin' },
    head_scalp: { normal: 'check_box_normal_head', abnormal: 'check_box_abnormal_head', findings: 'abnormal_findings_head' },
    eyes: { normal: 'check_box_normal_eyes', abnormal: 'check_box_abnormal_eyes', findings: 'abnormal_findings_eyes' },
    ears: { normal: 'check_box_normal_ears', abnormal: 'check_box_abnormal_ears', findings: 'abnormal_findings_ears' },
    nose: { normal: 'check_box_normal_nose', abnormal: 'check_box_abnormal_nose', findings: 'abnormal_findings_nose' },
    mouth_oropharynx: { normal: 'check_box_normal_mouth', abnormal: 'check_box_abnormal_mouth', findings: 'abnormal_findings_mouth' },
    neck: { normal: 'check_box_normal_neck', abnormal: 'check_box_abnormal_neck', findings: 'abnormal_findings_neck' },
    heart: { normal: 'check_box_normal_heart', abnormal: 'check_box_abnormal_heart', findings: 'abnormal_findings_heart' },
    lungs: { normal: 'check_box_normal_lungs', abnormal: 'check_box_abnormal_lungs', findings: 'abnormal_findings_lungs' },
    back_spine: { normal: 'check_box_normal_back', abnormal: 'check_box_abnormal_back', findings: 'abnormal_findings_back' },
    abdomen: { normal: 'check_box_normal_abdomen', abnormal: 'check_box_abnormal_abdomen', findings: 'abnormal_findings_abdomen' },
    extremities: { normal: 'check_box_normal_extremities', abnormal: 'check_box_abnormal_extremities', findings: 'abnormal_findings_extremities' },
    genito_urinary: { normal: 'check_box_normal_genito_urinary', abnormal: 'check_box_abnormal_genito_urinary', findings: 'abnormal_findings_genito_urinary' },
    neurologic: { normal: 'check_box_normal_neurologic', abnormal: 'check_box_abnormal_neurologic', findings: 'abnormal_findings_neurologic' },
  };

  for (const [key, fields] of Object.entries(mapping)) {
    const system = organSystems[key];
    if (!system) continue;

    // Uncheck both first
    form.getCheckBox(fields.normal)?.uncheck();
    form.getCheckBox(fields.abnormal)?.uncheck();

    if (system.status?.toLowerCase() === 'normal') {
      form.getCheckBox(fields.normal)?.check();
    } else if (system.status?.toLowerCase() === 'abnormal') {
      form.getCheckBox(fields.abnormal)?.check();
    }

    form.getTextField(fields.findings)?.setText(system.findings || '');
  }

  function splitTextByLength(text: string, maxLength: number) {
    if (!text) return { part1: '', part2: '' };

    if (text.length <= maxLength) {
      return { part1: text, part2: '' };
    }

    return {
      part1: text.substring(0, maxLength),
      part2: text.substring(maxLength),
    };
  }

  const assessmentText = allPagesData.assessment || '';

  // adjust this number based on your PDF field size
  const { part1, part2 } = splitTextByLength(assessmentText, 100);

  form.getTextField('assessment1')?.setText(part1);
  form.getTextField('assessment2')?.setText(part2);
  
  const recommendationText = allPagesData.recommendation || '';

  // adjust limit based on your PDF field size
  const recSplit = splitTextByLength(recommendationText, 300);

  form.getTextField('recommendations1')?.setText(recSplit.part1);
  form.getTextField('recommendations2')?.setText(recSplit.part2);

  const clearance = allPagesData.clearance || {};

  // No Participation
  if (clearance.no) {
    form.getCheckBox('check_box_no_participation')?.check();
  } else {
    form.getCheckBox('check_box_no_participation')?.uncheck();
  }

  // Limited Participation
  if (clearance.limited) {
    form.getCheckBox('check_box_limited_participation')?.check();
    form.getTextField('limited_participation')?.setText(clearance.limited_detail || '');
  } else {
    form.getCheckBox('check_box_limited_participation')?.uncheck();
    form.getTextField('limited_participation')?.setText('');
  }

  // Cleared After Evaluation
  if (clearance.evaluation) {
    form.getCheckBox('check_box_cleared_evaluation')?.check();
    form.getTextField('cleared_after_evaluation')?.setText(clearance.evaluation_detail || '');
  } else {
    form.getCheckBox('check_box_cleared_evaluation')?.uncheck();
    form.getTextField('cleared_after_evaluation')?.setText('');
  }

  // Full Clearance
  if (clearance.full) {
    form.getCheckBox('check_box_full_clearance')?.check();
  } else {
    form.getCheckBox('check_box_full_clearance')?.uncheck();
  }

  const examiner = allPagesData.examiner || {};

  form.getTextField('examined_by')?.setText(examiner.name);
  form.getTextField('prc_license_no')?.setText(examiner.prc);
  form.getTextField('date_examined')?.setText(examiner.date);


  // Flatten all fields
  // ----------------------
  form.flatten();

  // ----------------------
  // Save PDF
  // ----------------------
  return pdfDoc.save();
}
