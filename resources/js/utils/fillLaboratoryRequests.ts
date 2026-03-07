import { PDFDocument } from 'pdf-lib';

export async function fillLaboratoryRequests(allPagesData: any, slug: string, patient: any) {
  if (!slug) throw new Error('Service slug is required to fetch PDF template.');

  const getPrefixFromPath = () => {
    const p = window.location.pathname;
    if (p.startsWith("/admin")) return "admin";
    if (p.startsWith("/nurse")) return "nurse";
    return "user";
  };

  const prefix = getPrefixFromPath();

  const pdfBytes = await fetch(`/${prefix}/files/${slug}/template`).then(res => {
    if (!res.ok) throw new Error("Failed to fetch PDF template");
    return res.arrayBuffer();
  });

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  form.getTextField('name').setText(allPagesData.patient_name || patient.name);
  form.getTextField('date').setText(allPagesData.date || '');

  const yearCourseOrOffice =
    allPagesData.year_course_or_office ||
    (patient?.course || patient?.office
      ? patient?.course
        ? `${patient.course?.code || '-'} ${patient.year?.level || '-'}`
        : patient?.office?.name || '-'
      : '-');

  form.getTextField('year_course_or_office').setText(yearCourseOrOffice);
  form.getTextField('remarks').setText(allPagesData.remarks || '');

  const labTypes: string[] = allPagesData.lab_types || [];
  const normalized = labTypes.map((t: string) => t.toLowerCase());

  const has = (keyword: string) =>
    normalized.some((t: string) => t.includes(keyword));

  if (has('x-ray')) form.getCheckBox('check_box_x_ray')?.check();
  if (has('stool')) form.getCheckBox('check_box_stool_exam')?.check();
  if (has('urinalysis')) form.getCheckBox('check_box_urinalysis')?.check();
  if (has('complete blood') || has('cbc')) form.getCheckBox('check_box_cbc')?.check();
  if (has('drug')) form.getCheckBox('check_box_drug_test')?.check();
  if (has('hbsag')) form.getCheckBox('check_box_hbsag')?.check();
  if (has('ishihara')) form.getCheckBox('check_box_ishihara_test')?.check();
  if (has('neuro')) form.getCheckBox('check_box_neuro_psychiatric')?.check();

  const knownKeywords = [
    'x-ray',
    'stool',
    'urinalysis',
    'complete blood',
    'cbc',
    'drug',
    'hbsag',
    'ishihara',
    'neuro',
  ];

  const others = labTypes.filter((t: string) =>
    !knownKeywords.some(k => t.toLowerCase().includes(k))
  );

  if (others.length > 0) {
    form.getCheckBox('check_box_others')?.check();

    const othersText = others.join(', ');
    const field1 = form.getTextField('others');
    const field2 = form.getTextField('others2');

    const splitByMaxLen = (text: string, maxLen: number) => {
      if (!maxLen || maxLen <= 0 || text.length <= maxLen) {
        return [text, ''] as const;
      }

      let cut = text.lastIndexOf(',', maxLen);
      if (cut === -1) cut = text.lastIndexOf(' ', maxLen);
      if (cut === -1) cut = maxLen;

      const first = text.slice(0, cut).trim().replace(/[, ]+$/, '');
      const rest = text.slice(cut).trim().replace(/^,/, '').trim();

      return [first, rest] as const;
    };

    try {
      const maxLen1 =
        (field1?.acroField?.getMaxLength?.() as number | undefined) ?? 80;

      const [part1, remaining] = splitByMaxLen(othersText, maxLen1);
      field1?.setText(part1);

      if (remaining) {
        const maxLen2 =
          (field2?.acroField?.getMaxLength?.() as number | undefined) ?? 80;

        const [part2] = splitByMaxLen(remaining, maxLen2);
        field2?.setText(part2);
      }
    } catch (e) {
      console.warn('Others text fields not found or failed to set:', e);
    }
  }

  // =========================
  // DRAW SIGNATURE IMAGE ON BUTTON FIELD
  // =========================
  const signature = allPagesData.signature || null;

  if (signature?.signature_image) {
    try {
      const signatureField = form.getButton('signature');

      const widgets = signatureField.acroField.getWidgets();
      const widget = widgets[0];

      if (widget) {
        const rect = widget.getRectangle();

        // PDF-lib page index is based on widget page ref order
        const pageRef = widget.P();
        const pages = pdfDoc.getPages();
        const page = pages.find(p => p.ref === pageRef) || pages[0];

        // Convert storage path to full URL if needed
        let imageUrl = signature.signature_image;

        if (imageUrl.startsWith('/storage/')) {
          imageUrl = imageUrl;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `/storage/${imageUrl.replace(/^storage\//, '').replace(/^\/+/, '')}`;
        }

        const imageBytes = await fetch(imageUrl).then(res => {
          if (!res.ok) throw new Error('Failed to fetch signature image');
          return res.arrayBuffer();
        });

        let embeddedImage;

        const lower = imageUrl.toLowerCase();
        if (lower.endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        const imgDims = embeddedImage.scale(1);

        const fieldWidth = rect.width;
        const fieldHeight = rect.height;

        const scale = Math.min(
          fieldWidth / imgDims.width,
          fieldHeight / imgDims.height
        );

        const drawWidth = imgDims.width * scale;
        const drawHeight = imgDims.height * scale;

        const x = rect.x + (fieldWidth - drawWidth) / 2;
        const y = rect.y + (fieldHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });
      }
    } catch (err) {
      console.warn('Failed to draw signature image:', err);
    }
  }

  // flatten after drawing
  form.flatten();

  return pdfDoc.save();
}