import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';

// Example function
export function generateClinicConsultationPDF(patient, consultations) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = doc.pipe(blobStream());

    // Header
    doc.fontSize(12).text(`Patient Name: ${patient.name}`, { continued: true });
    doc.text(`   Sex: ${patient.sex.charAt(0)}`);

    // Table or consultations
    let y = 150;
    consultations.forEach((c) => {
      doc.fontSize(10).text(`Date: ${c.date} ${c.time}`, 50, y);
      doc.text(`Vital Signs: ${c.vital_signs}`, 150, y);
      doc.text(`Chief Complaint: ${c.chief_complaint}`, 300, y);
      doc.text(`Management: ${c.management_and_treatment}`, 450, y);
      y += 50;
    });

    doc.end();

    stream.on('finish', function () {
      const blob = stream.toBlob('application/pdf');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(blob);
    });
  });
}
