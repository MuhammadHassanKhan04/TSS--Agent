/**
 * TSS ID Card Generator — Rigid fixed-height layout, never breaks.
 * Front: Header → "Identity Card" → Photo → Name → Course → Roll Number
 * Back : Header (no roll no) → Info rows → Stamp (center) → QR (bottom center)
 */
const puppeteer = require('puppeteer');
const fs2 = require('fs');

function esc(v, max) {
  let s = String(v || '—');
  if (max) s = s.substring(0, max);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function buildHtml(student, logoBase64, photoBase64) {
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" style="width:9mm;height:9mm;object-fit:contain;flex-shrink:0;">`
    : '';

  const backLogoHtml = logoBase64
    ? `<img src="${logoBase64}" style="width:6mm;height:6mm;object-fit:contain;flex-shrink:0;">`
    : '';

  const photoHtml = photoBase64
    ? `<img src="${photoBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<span style="font-size:22pt;line-height:1;">&#128100;</span>`;

  const name   = esc(student.name,   28);
  const course = esc(student.course, 25);
  const rollNo = esc(student.rollNo, 12);

  const father  = esc(student.fatherName, 30);
  const cnic    = esc(student.cnic,       20);
  const phone   = esc(student.phone,      18);
  const address = esc(student.address,    55);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; font-family: 'Outfit', sans-serif; background: #fff; }

  /* ── Page ─────────────────────────────────────── */
  .page {
    width: 210mm; height: 297mm;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }

  /* ── Row of two cards + divider ─────────────────── */
  .row {
    display: flex; align-items: flex-start; justify-content: center;
    gap: 12mm; margin-bottom: 14mm;
  }

  /* ── Card base: exact ID-card size ──────────────── */
  .card {
    width: 54mm;
    height: 85.6mm;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 6px 24px rgba(0,0,0,.20);
  }

  /* ══════════════ FRONT ══════════════ */
  .front {
    background: linear-gradient(165deg, #0a1628 0%, #1a3557 55%, #0a1628 100%);
    display: flex; flex-direction: column; align-items: center;
    position: relative; overflow: hidden;
  }
  /* dot grid */
  .front::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: 9px 9px;
  }
  /* glow */
  .front::after {
    content: '';
    position: absolute; top: -20%; left: -20%; width: 140%; height: 55%;
    background: radial-gradient(circle, rgba(14,165,233,.22) 0%, transparent 70%);
  }
  /* All front children above pseudo-elements */
  .front > * { position: relative; z-index: 2; }

  /* Header row inside front */
  .f-hdr {
    display: flex; align-items: center; gap: 2mm;
    padding: 4mm 3mm 0; width: 100%;
  }
  .f-hdr-text { display: flex; flex-direction: column; }
  .f-hdr-name { font-size: 7.5pt; font-weight: 900; color: #fff; letter-spacing: .3px; line-height: 1.1; }
  .f-hdr-sub  { font-size: 3.8pt; font-weight: 600; color: #38bdf8; text-transform: uppercase; letter-spacing: .4px; }

  .f-idlabel {
    font-size: 4.8pt; font-weight: 800; color: #f59e0b;
    letter-spacing: 2px; text-transform: uppercase;
    margin-top: 2mm;
  }

  /* Circular photo */
  .f-photo-wrap {
    width: 22mm; height: 22mm; border-radius: 50%;
    border: 1.8px solid #38bdf8;
    overflow: hidden;
    background: #1e293b;
    display: flex; align-items: center; justify-content: center;
    margin-top: 3.5mm;
    box-shadow: 0 3px 12px rgba(0,0,0,.35);
  }

  .f-name {
    font-size: 9pt; font-weight: 800; color: #fff;
    text-align: center; line-height: 1.2;
    padding: 0 3mm; margin-top: 3mm;
    width: 100%; word-break: break-word;
  }
  .f-course {
    font-size: 5.5pt; font-weight: 600; color: #38bdf8;
    background: rgba(56,189,248,.12);
    border: .4px solid rgba(56,189,248,.3);
    border-radius: 20px;
    padding: .5mm 2.5mm; margin-top: 2mm;
    max-width: 48mm;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .f-roll {
    background: #f59e0b; color: #0a1628;
    font-size: 7.5pt; font-weight: 900;
    padding: 1mm 4mm; border-radius: 20px;
    letter-spacing: 1px;
    margin-top: 3.5mm;
    box-shadow: 0 2px 8px rgba(245,158,11,.35);
  }

  /* ══════════════ BACK ══════════════ */
  .back {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* Back header */
  .b-hdr {
    flex: 0 0 auto;
    background: linear-gradient(90deg, #0a1628 0%, #1a3557 100%);
    border-bottom: 3px solid #38bdf8;
    display: flex; align-items: center;
    gap: 2mm; padding: 2.2mm 3mm;
  }
  .b-hdr-title {
    font-size: 7pt; font-weight: 800; color: #fff;
    letter-spacing: .3px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .b-hdr-badge {
    margin-left: auto; background: #f59e0b;
    color: #0a1628; font-size: 4.5pt; font-weight: 900;
    padding: .4mm 1.5mm; border-radius: 10px; letter-spacing: .5px;
    white-space: nowrap; flex-shrink: 0;
  }

  /* Info area */
  .b-info { flex: 0 0 auto; padding: 2.5mm 3mm 0; }
  .b-row {
    display: flex; align-items: flex-start;
    gap: 1.5mm; margin-bottom: 2mm;
    background: #fff; border: 1px solid #e8edf5;
    border-radius: 4px; padding: 1.5mm 2mm;
  }
  .b-icon { font-size: 5.5pt; flex-shrink: 0; margin-top: .3mm; }
  .b-text { display: flex; flex-direction: column; min-width: 0; }
  .b-lbl {
    display: block; font-size: 3.5pt; font-weight: 700;
    color: #64748b; text-transform: uppercase; letter-spacing: .5px;
    margin-bottom: .3mm;
  }
  .b-val {
    font-size: 5.5pt; font-weight: 600; color: #0f172a;
    line-height: 1.2; word-break: break-word; display: block;
  }

  .b-sep {
    border: none; border-top: 1px solid #e2e8f0;
    margin: 1.5mm 3mm;
  }

  /* Stamp — centered, double ring */
  .b-stamp-area {
    display: flex; flex-direction: column; align-items: center;
    gap: .8mm; padding: 0 3mm;
  }
  .b-stamp-outer {
    width: 14mm; height: 14mm; border-radius: 50%;
    border: 1.5px solid #cbd5e1;
    display: flex; align-items: center; justify-content: center;
    background: #fff;
  }
  .b-stamp-inner {
    width: 11mm; height: 11mm; border-radius: 50%;
    border: 1px dashed #94a3b8;
    display: flex; align-items: center; justify-content: center;
    background: #f8fafc;
  }
  .b-stamp-txt { font-size: 2.8pt; color: #94a3b8; text-align: center; line-height: 1.4; font-weight: 600; }
  .b-stamp-cap { font-size: 3.8pt; color: #64748b; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; }

  /* QR area */
  .b-spacer { flex: 1; min-height: 1mm; }
  .b-qr-area {
    display: none;
  }

  /* Back footer */
  .b-footer {
    flex: 0 0 auto;
    background: linear-gradient(90deg, #0a1628 0%, #1a3557 100%);
    color: #64748b;
    font-size: 3.5pt; text-align: center;
    padding: 1.2mm 2.5mm; line-height: 1.5; font-weight: 500;
  }


  /* ── Divider column ─────────────────────────── */
  .divider {
    display: flex; flex-direction: column; align-items: center;
    height: 85.6mm; flex-shrink: 0;
  }
  .divider-lbl {
    font-size: 7pt; font-weight: 700; color: #94a3b8; margin-bottom: 2mm;
    white-space: nowrap;
  }
  .divider-line { flex: 1; width: 0; border-left: 1px dashed #cbd5e1; }
  .divider-lbl-b { font-size: 7pt; font-weight: 700; color: #94a3b8; margin-top: 2mm; white-space: nowrap; }

  /* ── Print note ─────────────────────────────── */
  .note {
    width: 130mm; border: 1px solid #e2e8f0;
    background: #f8fafc; border-radius: 8px;
    padding: 4mm 5mm; text-align: center;
  }
  .note-title { font-size: 7.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 1.5mm; }
  .note-body  { font-size: 6.5pt; color: #475569; line-height: 1.6; }
</style>
</head>
<body>
<div class="page">
  <div class="row">

    <!-- ══ FRONT ══ -->
    <div class="card front">
      <div class="f-hdr">
        ${logoHtml}
        <div class="f-hdr-text">
          <span class="f-hdr-name">THE STUDENT SPACE</span>
          <span class="f-hdr-sub">Excellence in Education</span>
        </div>
      </div>
      <div class="f-idlabel">Identity Card</div>
      <div class="f-photo-wrap">${photoHtml}</div>
      <div class="f-name">${name}</div>
      <div class="f-course">${course}</div>
      <div class="f-roll">${rollNo}</div>
    </div>

    <!-- ══ DIVIDER ══ -->
    <div class="divider">
      <span class="divider-lbl">FRONT</span>
      <div class="divider-line"></div>
      <span class="divider-lbl-b">BACK</span>
    </div>

    <!-- ══ BACK ══ -->
    <div class="card back">

      <div class="b-hdr">
        ${backLogoHtml}
        <span class="b-hdr-title">THE STUDENT SPACE</span>
        <span class="b-hdr-badge">ID CARD</span>
      </div>

      <div class="b-info">
        <div class="b-row">
          <span class="b-icon">&#128100;</span>
          <div class="b-text">
            <span class="b-lbl">Father Name</span>
            <span class="b-val">${father}</span>
          </div>
        </div>
        <div class="b-row">
          <span class="b-icon">&#128196;</span>
          <div class="b-text">
            <span class="b-lbl">CNIC / B-Form</span>
            <span class="b-val">${cnic}</span>
          </div>
        </div>
        <div class="b-row">
          <span class="b-icon">&#128222;</span>
          <div class="b-text">
            <span class="b-lbl">Phone</span>
            <span class="b-val">${phone}</span>
          </div>
        </div>
        <div class="b-row">
          <span class="b-icon">&#128205;</span>
          <div class="b-text">
            <span class="b-lbl">Address</span>
            <span class="b-val">${address}</span>
          </div>
        </div>
      </div>

      <hr class="b-sep"/>

      <div class="b-stamp-area">
        <div class="b-stamp-outer">
          <div class="b-stamp-inner">
            <span class="b-stamp-txt">OFFICIAL<br>STAMP</span>
          </div>
        </div>
        <span class="b-stamp-cap">Stamp Here</span>
      </div>

      <div class="b-spacer"></div>

      <div class="b-footer">
        Visit the academy to get this ID Card officially attested.
      </div>

    </div>
  </div>

  <!-- Print note -->
  <div class="note">
    <div class="note-title">&#9988; Printing &amp; Cutting Instructions</div>
    <div class="note-body">
      Print on A4 paper. Cut along the dashed centre line, fold both halves together face-to-face,
      and insert into a standard portrait badge holder.
    </div>
  </div>
</div>
</body>
</html>`;
}

async function generateIdCard({ student, logoBase64, photoBase64, outPath }) {
  const html = await buildHtml(student, logoBase64, photoBase64);

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const executablePath = chromePaths.find(p => fs2.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {})
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { generateIdCard };