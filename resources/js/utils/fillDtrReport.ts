import { PDFDocument } from "pdf-lib";

export async function fillDtrReport(consultations) {

  const templateBytes = await fetch("/storage/pdf/dtr-template.pdf")
    .then(res => res.arrayBuffer());

  const finalPdf = await PDFDocument.create();

  // split into groups of 18
  const chunks = [];
  for (let i = 0; i < consultations.length; i += 18) {
    chunks.push(consultations.slice(i, i + 18));
  }

  const totalPages = chunks.length;

 for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
  const chunk = chunks[pageIndex];

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];

  form.getTextField("page").setText(
    `${pageIndex + 1} of ${totalPages}`
  );


  // 🔹 fill rows
  for (let i = 0; i < 18; i++) {
    const c = chunk[i];
    if (!c) break;

    const row = i + 1;

    form.getTextField(`date${row}`).setText(formatDate(c.date));
    form.getTextField(`time${row}`).setText(c.formatted_time || "");
    form.getTextField(`name${row}`).setText(c.patient?.name || "");

    const age = c.patient?.birthdate && c.date
      ? String(calculateAgeAtDate(c.patient.birthdate, c.date))
      : "";
    form.getTextField(`age${row}`).setText(age);

    form.getTextField(`sex${row}`).setText(c.patient?.sex || "");

    const cyo = c.patient?.course
      ? `${c.patient.course.code} ${c.patient.year_level?.level || ""}`
      : c.patient?.office?.name || "";
    form.getTextField(`course_year_office${row}`).setText(cyo);

    form.getTextField(`chief_complaint${row}`)
      .setText(c.medical_complaint || "");

    form.getTextField(`management${row}`)
      .setText(c.management_and_treatment || "");

    if (c.patient?.signature) {
      await drawSignature(
        pdfDoc,
        page,
        form,
        `signature${row}`,
        c.patient.signature
      );
    }
  }

  // ✅ flatten AFTER all rows are filled
  form.flatten();

  const [copiedPage] = await finalPdf.copyPages(pdfDoc, [0]);
  finalPdf.addPage(copiedPage);
}

  const bytes = await finalPdf.save();
  return new Blob([bytes], { type: "application/pdf" });
}

/* ---------------- HELPER FUNCTIONS ---------------- */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US");
}

async function drawSignature(pdfDoc, page, form, fieldName, signaturePath) {
  const button = form.getButton(fieldName);
  const widget = button.acroField.getWidgets()[0];
  const rect = widget.getRectangle();

  const imgBytes = await fetch(`/storage/${signaturePath}`)
    .then(res => res.arrayBuffer());

  const img = await pdfDoc.embedPng(imgBytes);

  page.drawImage(img, {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });
}

function calculateAgeAtDate(birthdate, referenceDate) {
  const birth = new Date(birthdate);
  const ref = new Date(referenceDate);

  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
