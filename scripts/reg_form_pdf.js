/**
 * reg_form_pdf.js
 * Generates a styled Student Registration Form PDF
 * matching The Student Space design, with student details auto-filled.
 * Usage (from server): require('../scripts/reg_form_pdf').generateRegFormPdf(regData, logoBase64, outPath)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateRegFormPdf({ reg, logoBase64, outPath }) {
    const data = reg || {};

    // --- Date formatting ---
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const day   = String(createdAt.getDate()).padStart(2, '0');
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const year  = createdAt.getFullYear();

    // --- DOB formatting ---
    let dobD = '', dobM = '', dobY = '';
    const dobRaw = data.dob || '';
    const dobParts = dobRaw.replace(/[\/\.]/g, '-').split('-');
    if (dobParts.length === 3) {
        if (dobParts[0].length === 4) { dobY = dobParts[0]; dobM = dobParts[1]; dobD = dobParts[2]; }
        else { dobD = dobParts[0]; dobM = dobParts[1]; dobY = dobParts[2]; }
    }
    const dobDisplay = (dobD && dobM && dobY) ? `${dobD} / ${dobM} / ${dobY}` : (dobRaw || '');

    // --- CNIC formatting ---
    const cnicRaw = (data.cnic || '').replace(/[^0-9]/g, '');
    let cnicDisplay = data.cnic || '';
    if (cnicRaw.length === 13) {
        cnicDisplay = `${cnicRaw.slice(0,5)}-${cnicRaw.slice(5,12)}-${cnicRaw.slice(12)}`;
    }

    // --- Checkbox helpers ---
    const batchLower = (data.batch || '').toLowerCase();
    const prefDays   = (data.preferredDays || '').toLowerCase();
    const genderLower = (data.gender || '').toLowerCase();

    const chk = (val) => val
        ? `<span style="color:#032b74;font-weight:900;font-size:13px;">✓</span>`
        : `<span style="color:transparent;font-size:13px;">✓</span>`;

    const chkDay = (d) => chk(prefDays.includes(d.toLowerCase()));

    // --- Logo ---
    const logoSrc = logoBase64
        ? `<img src="${logoBase64}" style="width:80px;height:80px;object-fit:contain;" />`
        : `<div style="width:80px;height:80px;border:2px solid #032b74;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#032b74;font-weight:700;text-align:center;">TSS<br>LOGO</div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #fff;
    color: #111;
    width: 794px;
    font-size: 10px;
  }
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 0;
    background: #fff;
    position: relative;
    overflow: hidden;
  }

  /* ── Header ──────────────────────────────────── */
  .header {
    background: linear-gradient(135deg, #032b74 0%, #0b4bbf 60%, #1565c0 100%);
    padding: 0;
    display: flex;
    align-items: stretch;
    min-height: 130px;
  }
  .header-logo-col {
    background: #fff;
    width: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    clip-path: polygon(0 0, 85% 0, 100% 100%, 0 100%);
  }
  .header-center {
    flex:1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 14px 20px;
    text-align: center;
  }
  .header-center .inst-name {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height:1;
  }
  .header-center .tagline {
    font-size: 11px;
    color: #f0c040;
    letter-spacing: 4px;
    font-weight: 600;
    margin: 4px 0 2px;
    text-transform: uppercase;
  }
  .header-center .sub-tagline {
    font-size: 9.5px;
    color: rgba(255,255,255,0.8);
    font-style: italic;
  }
  .header-right {
    width: 130px;
    background: #c9a227;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
    text-align: center;
  }
  .header-right .emp-text {
    font-size: 10px;
    font-weight: 900;
    color: #032b74;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.3;
  }
  .header-right .emp-icon {
    font-size: 22px;
    margin-bottom: 4px;
  }

  /* ── Form Title ───────────────────────────────── */
  .form-title-bar {
    background: #032b74;
    text-align: center;
    padding: 9px;
  }
  .form-title-bar h2 {
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* ── Form No / Date ───────────────────────────── */
  .form-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 20px;
    background: #f5f8ff;
    border-bottom: 1px solid #dde;
    font-size: 10px;
    color: #333;
  }
  .form-meta span { font-weight: 600; color: #032b74; }

  /* ── Section Header ───────────────────────────── */
  .section-header {
    background: #032b74;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 14px;
    margin: 0;
  }

  /* ── Section Body ─────────────────────────────── */
  .section-body {
    padding: 10px 16px;
    border: 1px solid #dde;
    border-top: none;
    margin-bottom: 0;
    background: #fff;
  }

  /* ── Grid Rows ────────────────────────────────── */
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap: 6px 20px; }
  .grid-4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap: 6px 14px; }

  .field-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #bbb;
    margin-bottom: 5px;
    min-height: 22px;
  }
  .field-label {
    font-size: 9px;
    color: #555;
    white-space: nowrap;
    font-weight: 500;
    min-width: 85px;
  }
  .field-value {
    font-size: 10px;
    font-weight: 600;
    color: #032b74;
    flex:1;
    padding: 0 2px;
    word-break: break-word;
  }

  /* ── Two-col section row ──────────────────────── */
  .two-col-row {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: 0 16px;
    margin-bottom: 0;
  }
  .col-divider { background: #dde; width:1px; }

  /* ── Checkboxes ───────────────────────────────── */
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 5px;
    min-height: 22px;
  }
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 9.5px;
    color: #333;
  }
  .checkbox-box {
    width: 12px;
    height: 12px;
    border: 1.5px solid #555;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    flex-shrink:0;
  }

  /* ── Terms block ──────────────────────────────── */
  .terms-sig-row {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 0;
  }
  .terms-list {
    font-size: 8.5px;
    color: #333;
    line-height: 1.7;
    padding-right: 12px;
  }
  .sig-box {
    border: 1px solid #bbb;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 8px;
    min-height: 70px;
    background: #fafafa;
  }
  .sig-label {
    font-size: 9px;
    color: #555;
    border-top: 1px solid #999;
    padding-top: 4px;
    width: 100%;
    text-align: center;
  }

  /* ── Office Use Only ──────────────────────────── */
  .office-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0 14px;
  }
  .office-field {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid #bbb;
    margin-bottom: 6px;
    min-height: 20px;
  }
  .office-label {
    font-size: 8.5px;
    color: #555;
    white-space: nowrap;
    min-width: 80px;
  }
  .office-value {
    font-size: 9px;
    font-weight: 600;
    flex:1;
  }
  .doc-checklist { font-size: 8.5px; line-height: 1.8; }
  .doc-checklist .chk-item { display:flex; align-items:center; gap:4px; }

  /* ── Footer ───────────────────────────────────── */
  .footer-icons {
    background: #f5f8ff;
    display: flex;
    justify-content: center;
    gap: 0;
    border-top: 2px solid #032b74;
  }
  .footer-icon-item {
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding: 8px 4px;
    border-right: 1px solid #dde;
    text-align:center;
  }
  .footer-icon-item:last-child { border-right: none; }
  .footer-icon-item .icon { font-size: 18px; margin-bottom: 3px; }
  .footer-icon-item .label { font-size: 8px; font-weight: 800; color: #032b74; text-transform:uppercase; letter-spacing:0.5px; }
  .footer-icon-item .sub { font-size: 7.5px; color: #555; text-transform:uppercase; }

  .footer-bar {
    background: #032b74;
    display: flex;
    align-items: stretch;
    min-height: 52px;
  }
  .footer-addr {
    flex:1;
    padding: 8px 14px;
    border-right: 1px solid rgba(255,255,255,0.15);
  }
  .footer-addr .title { font-size: 9px; font-weight: 800; color: #f0c040; text-transform:uppercase; letter-spacing:1px; }
  .footer-addr .val { font-size: 8.5px; color:rgba(255,255,255,0.85); line-height:1.5; margin-top:2px; }
  .footer-call {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding: 8px 20px;
    border-right: 1px solid rgba(255,255,255,0.15);
    text-align:center;
  }
  .footer-call .call-icon { font-size:16px; margin-bottom:2px; }
  .footer-call .call-num { font-size: 14px; font-weight: 900; color: #f0c040; letter-spacing:0.5px; }
  .footer-social {
    display:flex; align-items:center; justify-content:center;
    padding: 8px 16px; gap:10px;
  }
  .social-icon {
    width: 24px; height: 24px;
    border-radius: 50%;
    display:flex; align-items:center; justify-content:center;
    font-size: 12px;
    font-weight: 900;
    color: #fff;
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-logo-col">
      ${logoSrc}
    </div>
    <div class="header-center">
      <div style="font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;margin-bottom:2px;">The</div>
      <div class="inst-name">STUDENT SPACE</div>
      <div class="tagline">Learn &bull; Grow &bull; Succeed</div>
      <div class="sub-tagline">Building Strong Concepts for a Bright Future</div>
    </div>
    <div class="header-right">
      <div class="emp-icon">🎓</div>
      <div class="emp-text">EMPOWERING<br>YOUNG MINDS<br>FOR TOMORROW</div>
    </div>
  </div>

  <!-- FORM TITLE -->
  <div class="form-title-bar">
    <h2>&#x2605; Student Registration Form &#x2605;</h2>
  </div>

  <!-- FORM META -->
  <div class="form-meta">
    <div>Form No.: <span>${data.studentId || '________________'}</span></div>
    <div>Date: <span>${day} / ${month} / ${year}</span></div>
  </div>

  <!-- PERSONAL INFORMATION -->
  <div class="section-header">&#9632; Personal Information</div>
  <div class="section-body">
    <div class="grid-2">
      <div>
        <div class="field-row">
          <span class="field-label">Full Name:</span>
          <span class="field-value">${data.fullName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Father's Name:</span>
          <span class="field-value">${data.fatherName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">CNIC / B-Form No.:</span>
          <span class="field-value" style="letter-spacing:1px;">${cnicDisplay}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date of Birth:</span>
          <span class="field-value">${dobDisplay}</span>
        </div>
        <div class="checkbox-row">
          <span class="field-label" style="min-width:70px;">Gender:</span>
          <div class="checkbox-item">
            <div class="checkbox-box">${chk(!genderLower.includes('female') && genderLower.includes('male'))}</div> Male
          </div>
          <div class="checkbox-item">
            <div class="checkbox-box">${chk(genderLower.includes('female'))}</div> Female
          </div>
        </div>
        <div class="field-row">
          <span class="field-label">Nationality:</span>
          <span class="field-value">${data.nationality || 'Pakistani'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Religion:</span>
          <span class="field-value">${data.religion || 'Islam'}</span>
        </div>
      </div>
      <div>
        <div class="field-row">
          <span class="field-label">Phone No.:</span>
          <span class="field-value">${data.phone || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">WhatsApp No.:</span>
          <span class="field-value">${data.whatsapp || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Email Address:</span>
          <span class="field-value">${data.email || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Permanent Address:</span>
          <span class="field-value" style="white-space:normal;line-height:1.3;">${data.address || ''}</span>
        </div>
        <div class="field-row" style="margin-top:4px;">
          <span class="field-label">City:</span>
          <span class="field-value">${data.city || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Postal Code:</span>
          <span class="field-value">${data.postalCode || ''}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ACADEMIC + COURSE INFO (two columns) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:2px solid #032b74;">
    <div>
      <div class="section-header">&#9632; Academic Information</div>
      <div class="section-body" style="border-right:1px solid #dde;min-height:120px;">
        <div class="field-row">
          <span class="field-label">Qualification (Last):</span>
          <span class="field-value">${data.qualification || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Institute / School:</span>
          <span class="field-value">${data.school || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Year of Passing:</span>
          <span class="field-value">${data.passingYear || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Marks / CGPA:</span>
          <span class="field-value">${data.marks || ''}</span>
        </div>
      </div>
    </div>
    <div>
      <div class="section-header">&#9632; Course Information</div>
      <div class="section-body" style="min-height:120px;">
        <div class="field-row">
          <span class="field-label">Course Interested In:</span>
          <span class="field-value">${data.course || ''}</span>
        </div>
        <div class="checkbox-row">
          <span class="field-label" style="min-width:72px;">Batch Timing:</span>
          <div class="checkbox-item"><div class="checkbox-box">${chk(batchLower.includes('morning'))}</div> Morning</div>
          <div class="checkbox-item"><div class="checkbox-box">${chk(batchLower.includes('afternoon'))}</div> Afternoon</div>
          <div class="checkbox-item"><div class="checkbox-box">${chk(batchLower.includes('evening'))}</div> Evening</div>
          <div class="checkbox-item"><div class="checkbox-box">${chk(batchLower.includes('weekend'))}</div> Weekend</div>
        </div>
        <div class="checkbox-row">
          <span class="field-label" style="min-width:72px;">Preferred Days:</span>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('mon')}</div> Mon</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('tue')}</div> Tue</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('wed')}</div> Wed</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('thu')}</div> Thu</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('fri')}</div> Fri</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('sat')}</div> Sat</div>
          <div class="checkbox-item"><div class="checkbox-box">${chkDay('sun')}</div> Sun</div>
        </div>
        <div class="field-row">
          <span class="field-label">How did you hear about us?</span>
          <span class="field-value">${data.reference || ''}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- EMERGENCY CONTACT -->
  <div class="section-header" style="border-top:2px solid #032b74;">&#9632; Emergency Contact</div>
  <div class="section-body">
    <div class="grid-2">
      <div>
        <div class="field-row">
          <span class="field-label">Contact Person Name:</span>
          <span class="field-value">${data.emergencyName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Phone No.:</span>
          <span class="field-value">${data.emergencyPhone || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Address:</span>
          <span class="field-value">${data.emergencyAddress || ''}</span>
        </div>
      </div>
      <div>
        <div class="field-row">
          <span class="field-label">Relationship:</span>
          <span class="field-value">${data.relationship || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Alternate Phone No.:</span>
          <span class="field-value">${data.alternatePhone || ''}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- TERMS & CONDITIONS -->
  <div class="section-header" style="border-top:2px solid #032b74;">&#9632; Terms &amp; Conditions</div>
  <div class="section-body">
    <div class="terms-sig-row">
      <div class="terms-list">
        <div>&bull; &nbsp;I hereby confirm that the information provided above is true and correct.</div>
        <div>&bull; &nbsp;I have read and understood the institute rules and regulations.</div>
        <div>&bull; &nbsp;Fees once paid are non-refundable and non-transferable.</div>
        <div>&bull; &nbsp;The institute management reserves the right to change course schedule, timing or any policy.</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Student Signature</div>
      </div>
    </div>
  </div>

  <!-- OFFICE USE ONLY -->
  <div class="section-header" style="border-top:2px solid #032b74;background:#c9a227;color:#032b74;">
    &#128274; OFFICE USE ONLY
  </div>
  <div class="section-body" style="background:#fffbf0;">
    <div class="office-grid">
      <div>
        <div class="office-field">
          <span class="office-label">Registration No.:</span>
          <span class="office-value" style="color:#032b74;">${data.studentId || ''}</span>
        </div>
        <div class="office-field">
          <span class="office-label">Admission Date:</span>
          <span class="office-value">${day} / ${month} / ${year}</span>
        </div>
        <div class="office-field">
          <span class="office-label">Course Fee:</span>
          <span class="office-value"></span>
        </div>
        <div class="office-field">
          <span class="office-label">Discount:</span>
          <span class="office-value"></span>
        </div>
      </div>
      <div>
        <div class="office-field">
          <span class="office-label">Paid Amount:</span>
          <span class="office-value"></span>
        </div>
        <div class="office-field">
          <span class="office-label">Payment Method:</span>
          <span class="office-value"></span>
        </div>
        <div class="office-field">
          <span class="office-label">Balance:</span>
          <span class="office-value"></span>
        </div>
        <div class="office-field">
          <span class="office-label">Receipt No.:</span>
          <span class="office-value"></span>
        </div>
      </div>
      <div>
        <div class="doc-checklist">
          <div style="font-size:8.5px;font-weight:700;color:#032b74;margin-bottom:4px;">Documents Received:</div>
          <div class="chk-item"><div class="checkbox-box" style="border-color:#032b74;"><span style="color:transparent;font-size:11px;">✓</span></div>&nbsp;CNIC / B-Form Copy</div>
          <div class="chk-item"><div class="checkbox-box" style="border-color:#032b74;"><span style="color:transparent;font-size:11px;">✓</span></div>&nbsp;Photo</div>
          <div class="chk-item"><div class="checkbox-box" style="border-color:#032b74;"><span style="color:transparent;font-size:11px;">✓</span></div>&nbsp;Educational Certificates</div>
        </div>
        <div style="margin-top:12px;border-top:1px solid #bbb;padding-top:4px;font-size:8.5px;color:#555;">
          Admission Officer Signature:
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER ICONS -->
  <div class="footer-icons">
    <div class="footer-icon-item">
      <div class="icon">🎓</div>
      <div class="label">Quality</div>
      <div class="sub">Education</div>
    </div>
    <div class="footer-icon-item">
      <div class="icon">⚙️</div>
      <div class="label">Modern</div>
      <div class="sub">Skills</div>
    </div>
    <div class="footer-icon-item">
      <div class="icon">💡</div>
      <div class="label">Bright</div>
      <div class="sub">Future</div>
    </div>
    <div class="footer-icon-item">
      <div class="icon">💰</div>
      <div class="label">Affordable</div>
      <div class="sub">Fee Structure</div>
    </div>
  </div>

  <!-- FOOTER BAR -->
  <div class="footer-bar">
    <div class="footer-addr">
      <div class="title">📍 Address</div>
      <div class="val">W-003 Ground Floor, Haroon Royal City Phase 3,<br>Block 17, Gulistan-e-Johar, Karachi.</div>
    </div>
    <div class="footer-call">
      <div class="call-icon">📞</div>
      <div style="font-size:8px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;">Call Now</div>
      <div class="call-num">0322 1761566</div>
    </div>
    <div class="footer-social">
      <div style="font-size:8px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;margin-right:4px;">Follow Us</div>
      <div class="social-icon" style="background:#1877F2;">f</div>
      <div class="social-icon" style="background:radial-gradient(circle at 30% 30%, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);">📷</div>
      <div class="social-icon" style="background:#FF0000;">▶</div>
      <div class="social-icon" style="background:#000;">♪</div>
    </div>
  </div>

</div>
</body>
</html>`;

    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Users\\ALI COMPUTERS\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath;
    for (const cp of chromePaths) {
        if (fs.existsSync(cp)) { executablePath = cp; break; }
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
        await new Promise(r => setTimeout(r, 800));

        await page.pdf({
            path: outPath,
            width: '210mm',
            height: '297mm',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });

        return outPath;
    } finally {
        await browser.close().catch(() => {});
    }
}

module.exports = { generateRegFormPdf };
