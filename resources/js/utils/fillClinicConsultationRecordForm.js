import { PDFDocument, StandardFonts } from "pdf-lib";

export async function fillClinicConsultationRecordForm(patient, consultations, schoolYear) {
  const formUrl = "/storage/forms/clinic_consultation_record_form.pdf";
  const formBytes = await fetch(formUrl).then((res) => res.arrayBuffer());

  // Load original template
  const templatePdf = await PDFDocument.load(formBytes);
  const form = templatePdf.getForm();

  const roleName = patient.user_role?.name ?? "";

  // ----------------------
  // Fill patient info
  // ----------------------
  form.getTextField("name1").setText(`${patient.first_name} ${patient.last_name}`);
  form.getTextField("sex").setText((patient.sex ?? "").charAt(0).toUpperCase());

  const birthdate = patient.birthdate;
  if (birthdate) {
    const dateObj = new Date(birthdate);
    const formattedBirthdate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
    form.getTextField("birthdate").setText(formattedBirthdate);
  } else {
    form.getTextField("birthdate").setText("");
  }

  form.getTextField("blood_type").setText(patient.vital_sign?.blood_type ?? "");
  form.getTextField("course_office").setText(patient.course?.code ?? "");
  form.getTextField("school_year").setText(schoolYear ?? "");
  form.getTextField("contact_number1").setText(patient.contact_no ?? "");
  form.getTextField("bp").setText(patient.vital_sign?.bp ?? "");
  form.getTextField("rr").setText(patient.vital_sign?.rr ?? "");
  form.getTextField("pr").setText(patient.vital_sign?.pr ?? "");
  form.getTextField("temp").setText(patient.vital_sign?.temp ?? "");
  form.getTextField("o2_sat").setText(patient.vital_sign?.o2_sat ?? "");

  form.getTextField("name2").setText(patient.guardian_name ?? "");
  form.getTextField("contact_number2").setText(patient.guardian_contact_no ?? "");

  const homeAddress = patient.home_address
    ? `${patient.home_address.purok || ""}, ${patient.home_address.barangay?.name || ""}, ${patient.home_address.barangay?.municipality?.name || ""}, ${patient.home_address.barangay?.municipality?.province?.name || ""}`
    : "";

  const presentAddress = patient.present_address
    ? `${patient.present_address.purok || ""}, ${patient.present_address.barangay?.name || ""}, ${patient.present_address.barangay?.municipality?.name || ""}, ${patient.present_address.barangay?.municipality?.province?.name || ""}`
    : "";

  form.getTextField("home_address")?.setText(homeAddress);
  form.getTextField("present_address")?.setText(presentAddress);

  if (roleName === "Staff" || roleName === "Faculty") {
    form.getCheckBox("faculty_employee_checkbox")?.check();
    form.getCheckBox("faculty_employee_checkbox")?.defaultUpdateAppearances();
  } else {
    form.getCheckBox("student_checkbox")?.check();
    form.getCheckBox("student_checkbox")?.defaultUpdateAppearances();
  }

  // Flatten form
  form.flatten();

  // ----------------------
  // Create final PDF
  // ----------------------
  const pdfDoc = await PDFDocument.create();
  const [firstPage] = await pdfDoc.copyPages(templatePdf, [0]);
  pdfDoc.addPage(firstPage);

  // ----------------------
  // Draw consultations table
  // ----------------------
  let page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;

  let yPosition = height - 487;
  const lineHeight = 12;
  const rowPadding = 4;

  const columns = [
    { x: 37, width: 78, header: "Date & Time" },
    { x: 115, width: 78, header: "Vital Signs" },
    { x: 193, width: 140, header: "Chief Complaint" },
    { x: 333, width: 226, header: "Management" },
  ];

  // Updated wrapText to safely handle non-string input
  const wrapText = (text, maxWidth, size = fontSize) => {
    const lines = [];
    const paragraphs = String(text || "").split(/\r?\n/);

    for (const paragraph of paragraphs) {
      const words = paragraph.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    return lines;
  };

  const drawCenteredText = (text, col, y, size = fontSize) => {
    const textWidth = font.widthOfTextAtSize(String(text || ""), size);
    const xCentered = col.x + (col.width - textWidth) / 2;
    page.drawText(String(text || ""), { x: xCentered, y, font, size });
  };

  const formatDateTime = (rawDate) => {
    if (!rawDate) return "";
    const dateObj = new Date(rawDate);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = String(dateObj.getFullYear()).slice(-2);
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const records = (consultations?.data || []).filter(c => c.status === 'approved');
  
  for (const c of records) {
    const dateFontSize = 8;
    const dateLines = wrapText(formatDateTime(c.date), columns[0].width - 4, dateFontSize);

    // --- Convert vital signs object into a string ---
    const vitalsText = c.vital_signs
    ? [
        c.vital_signs.bp ? `BP: ${c.vital_signs.bp}` : null,
        c.vital_signs.rr ? `RR: ${c.vital_signs.rr}` : null,
        c.vital_signs.pr ? `PR: ${c.vital_signs.pr}` : null,
        c.vital_signs.temp ? `Temp: ${c.vital_signs.temp}°C` : null,
        c.vital_signs.o2_sat ? `O2 Sat: ${c.vital_signs.o2_sat}` : null,
        c.vital_signs.height ? `Height: ${c.vital_signs.height}` : null,
        c.vital_signs.weight ? `Weight: ${c.vital_signs.weight}` : null,
        c.vital_signs.bmi ? `BMI: ${c.vital_signs.bmi}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "-";

    const vitalsLines = wrapText(vitalsText, columns[1].width - 4);

    const chiefLines = wrapText(c.medical_complaint || "", columns[2].width - 4);
    const managementLines = wrapText(c.management_and_treatment || "", columns[3].width - 4);

    const maxLines = Math.max(dateLines.length, vitalsLines.length, chiefLines.length, managementLines.length);
    const requiredHeight = maxLines * lineHeight + rowPadding * 2;

    if (yPosition - requiredHeight < 50) {
      const [newPage] = await pdfDoc.copyPages(templatePdf, [1]);
      pdfDoc.addPage(newPage);
      page = newPage;
      yPosition = page.getHeight() - 225;
    }

    for (let i = 0; i < maxLines; i++) {
      const lineY = yPosition - i * lineHeight;
      drawCenteredText(dateLines[i] || "", columns[0], lineY, dateFontSize);
      drawCenteredText(vitalsLines[i] || "", columns[1], lineY);
      drawCenteredText(chiefLines[i] || "", columns[2], lineY);
      drawCenteredText(managementLines[i] || "", columns[3], lineY);
    }

    yPosition -= requiredHeight;
  }

  // ----------------------
  // Page numbers
  // ----------------------
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const currentPage = pdfDoc.getPage(i);
    const { width: pageWidth } = currentPage.getSize();
    const pageNumberText = `${i + 1} of ${totalPages}`;
    currentPage.drawText(pageNumberText, { x: pageWidth - 400, y: 37, size: 8, font });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer], { type: "application/pdf" });
}
