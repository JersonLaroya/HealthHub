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

    // PAGE NUMBER
    const currentPage = pageIndex + 1;
    form.getTextField("page").setText(
      `${currentPage} of ${totalPages}`
    );

    for (let i = 0; i < 18; i++) {
      const c = chunk[i];
      if (!c) break;

      const row = i + 1;

      form.getTextField(`date${row}`).setText(formatDate(c.date));
      form.getTextField(`time${row}`).setText(c.formatted_time || "");
      form.getTextField(`name${row}`).setText(c.user?.name || "");

      const age = c.user?.birthdate
        ? String(new Date().getFullYear() - new Date(c.user.birthdate).getFullYear())
        : "";
      form.getTextField(`age${row}`).setText(age);

      form.getTextField(`sex${row}`).setText(c.user?.sex || "");

      const cyo = c.user?.course
        ? `${c.user.course.code} ${c.user.year_level?.level || ""}`
        : c.user?.office?.name || "";
      form.getTextField(`course_year_office${row}`).setText(cyo);

      form.getTextField(`chief_complaint${row}`).setText(c.medical_complaint || "");
      form.getTextField(`management${row}`).setText(c.management_and_treatment || "");

      if (c.user?.signature) {
        await drawSignature(pdfDoc, page, form, `signature${row}`, c.user.signature);
      }
    }

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
