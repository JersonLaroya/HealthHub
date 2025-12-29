import { PDFDocument } from 'pdf-lib';

export async function fillPreEnrolmmentForm(pdfBytes: ArrayBuffer, imageFile?: File) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Get the button field
  const imageButton = form.getButton('image3'); // your button field name
  const widgets = imageButton.acroField.getWidgets();
  const widget = widgets[0];

  // Get the page the button is on
  const pageRef = widget.P();
  const page = pdfDoc.getPages().find(p => p.ref === pageRef);

  // Get button rectangle (coordinates)
  const rect = widget.getRectangle();
  const { x, y, width, height } = rect;

  if (imageFile) {
    const imageBytes = await imageFile.arrayBuffer();
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Unsupported image format. Please upload JPG or PNG.');
    }

    // Draw image on the exact location of the button
    page.drawImage(image, {
      x,
      y,
      width,
      height,
    });
  }

  // Remove the button field so the image is visible
  form.removeField(imageButton);

  form.flatten();
  const filledPdfBytes = await pdfDoc.save();
  return new Blob([filledPdfBytes], { type: 'application/pdf' });
}
