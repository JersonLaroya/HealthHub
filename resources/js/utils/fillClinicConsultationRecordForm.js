import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function fillClinicConsultationRecordForm(patient, consultations) {
  const formUrl = "/storage/forms/clinic_consultation_record_form.pdf";
  const formBytes = await fetch(formUrl).then((res) => res.arrayBuffer());

  // Load original template
  const templatePdf = await PDFDocument.load(formBytes);
  const form = templatePdf.getForm();

  console.log(patient);

  // Fill patient info on the template itself
  form.getTextField("name1").setText(`${patient.user.user_info.first_name} ${patient.user.user_info.last_name}`);
  form.getTextField("sex").setText((patient.user.user_info.sex ?? "").charAt(0).toUpperCase());
  
  const birthdate = patient.user.user_info.birthdate;
  if (birthdate) {
    const dateObj = new Date(birthdate);
    const formattedBirthdate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
    form.getTextField("birthdate").setText(formattedBirthdate);
  } else {
    form.getTextField("birthdate").setText("");
  }

  form.getTextField("blood_type").setText(patient.blood_type ?? "");
  form.getTextField("course_office").setText(patient.user.course?.code ?? "");
  form.getTextField("school_year").setText(patient.year_level?.name ?? "");
  form.getTextField("contact_number1").setText(patient.user.user_info.contact_no ?? "");
  form.getTextField("bp").setText(patient.bp ?? "");
  form.getTextField("rr").setText(patient.rr ?? "");
  form.getTextField("pr").setText(patient.pr ?? "");
  form.getTextField("temp").setText(patient.temp ?? "");
  form.getTextField("o2_sat").setText(patient.o2_sat ?? "");

  form.getTextField("name2").setText(patient.user.user_info.guardian.name ?? "");
  form.getTextField("contact_number2").setText(patient.user.user_info.guardian.contact_no ?? "");

  const address = patient.user.user_info.home_address
    ? `${patient.user.user_info.home_address.purok}, ${patient.user.user_info.home_address.barangay}, ${patient.user.user_info.home_address.town}, ${patient.user.user_info.home_address.province}`
    : "";

  form.getTextField("home_address")?.setText(address);
  form.getTextField("present_address")?.setText(address);
  form.getTextField("school_year")?.setText(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  if (patient.user.user_role.name.includes("Student")) {
    form.getCheckBox("student_checkbox")?.check();
    form.getCheckBox("student_checkbox")?.defaultUpdateAppearances();
  } else {
    form.getCheckBox("faculty_employee_checkbox")?.check();
    form.getCheckBox("faculty_employee_checkbox")?.defaultUpdateAppearances();
  }

  // Flatten form on the template
  form.flatten();

  // Create final PDF and copy only page 1 from template
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

  const wrapText = (text, maxWidth, size = fontSize) => {
    const lines = [];
    const paragraphs = (text || "").split(/\r?\n/);

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
    const textWidth = font.widthOfTextAtSize(text, size);
    const xCentered = col.x + (col.width - textWidth) / 2;
    page.drawText(text, {
      x: xCentered,
      y,
      font,
      size,
    });
  };

  const drawHeader = (targetPage) => {
    const headerY = targetPage.getHeight() - 60;
    columns.forEach((col) => {
      const textWidth = font.widthOfTextAtSize(col.header, fontSize);
      const xCentered = col.x + (col.width - textWidth) / 2;
      targetPage.drawText(col.header, {
        x: xCentered,
        y: headerY,
        font,
        size: fontSize,
      });
    });
    return headerY - lineHeight - rowPadding;
  };

  const formatDateTime = (rawDate) => {
    if (!rawDate) return "";

    const dateObj = new Date(rawDate);
    
    // Format date as DD-MM-YY
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = String(dateObj.getFullYear()).slice(-2);

    // Format time as h:mm AM/PM
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const records = consultations?.data || [];

  for (const c of records) {
    // Use smaller font for Date & Time column
    const dateFontSize = 8;
    const dateLineHeight = dateFontSize + 2; // proportional line height

    const dateLines = wrapText(formatDateTime(c.date), columns[0].width - 4, dateFontSize);
    const vitalsLines = wrapText(c.vital_signs || "", columns[1].width - 4);
    const chiefLines = wrapText(c.chief_complaint || "", columns[2].width - 4);
    const managementLines = wrapText(c.management_and_treatment || "", columns[3].width - 4);

    const maxLines = Math.max(
      dateLines.length,
      vitalsLines.length,
      chiefLines.length,
      managementLines.length
    );

    const requiredHeight = maxLines * lineHeight + rowPadding * 2;

    if (yPosition - requiredHeight < 50) {
      const [newPage] = await pdfDoc.copyPages(templatePdf, [1]); // only use page 2 layout
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
  // Add page numbers after table drawing
  // ----------------------
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const currentPage = pdfDoc.getPage(i);
    const { width: pageWidth } = currentPage.getSize();

    const pageNumberText = `${i + 1} of ${totalPages}`;
    currentPage.drawText(pageNumberText, {
      x: pageWidth - 400, // adjust X if needed to match your "first_page" and "next_page" fields
      y: 37,             // adjust Y if needed to match the template
      size: 8,
      font,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer], { type: "application/pdf" });
}
