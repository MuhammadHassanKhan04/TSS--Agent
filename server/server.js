require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { MessageMedia } = require('whatsapp-web.js');
const db = require('./db');
const whatsapp = require('./whatsapp');
const multer = require('multer');

// Photo upload setup
const photosDir = path.join(__dirname, '..', 'data', 'photos');
const stampDir  = path.join(__dirname, '..', 'data', 'stamp');
const signDir   = path.join(__dirname, '..', 'data', 'sign');
fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(stampDir,  { recursive: true });
fs.mkdirSync(signDir,   { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, photosDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'photo-' + Date.now() + ext);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Stamp upload
const stampStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, stampDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, 'stamp' + ext);
    }
});
const uploadStamp = multer({ storage: stampStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Sign upload
const signStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, signDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, 'sign' + ext);
    }
});
const uploadSign = multer({ storage: signStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ---------------------------------------------------------------------------
// Helper: Render a fee slip PNG from the db.js template using Puppeteer
// ---------------------------------------------------------------------------
async function renderFeeSlipImage(data) {
    const settings = db.getSettings();
    const css = settings.customSlipCSS || '';
    const htmlTemplate = settings.customSlipHTML || '';

    // Logo as base64 (optional)
    let logoSrc = 'data:image/png;base64,';
    const logoPaths = [
        path.join(__dirname, '..', 'client', 'public', 'tss-logo.png'),
        path.join(__dirname, '..', 'client', 'dist', 'tss-logo.png'),
        path.join(__dirname, '..', 'assets', 'tss-logo.png'),
        path.join(__dirname, '..', 'assets', 'logo.png'),
        path.join(__dirname, '..', 'client', 'public', 'logo.png')
    ];
    for (const lp of logoPaths) {
        if (fs.existsSync(lp)) {
            logoSrc = 'data:image/png;base64,' + fs.readFileSync(lp).toString('base64');
            break;
        }
    }

    // Load stamp image from settings or disk
    let stampSrc = '';
    if (settings.adminStampImage) {
        stampSrc = settings.adminStampImage; // base64 stored in settings
    } else {
        const stampExts = ['.png', '.jpg', '.jpeg', '.webp'];
        for (const ext of stampExts) {
            const sp = path.join(__dirname, '..', 'data', 'stamp', `stamp${ext}`);
            if (fs.existsSync(sp)) {
                const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
                stampSrc = `data:${mime};base64,` + fs.readFileSync(sp).toString('base64');
                break;
            }
        }
    }

    // Load admin sign image from settings or disk
    let signSrc = '';
    if (settings.adminSignImage) {
        signSrc = settings.adminSignImage;
    } else {
        const signExts = ['.png', '.jpg', '.jpeg', '.webp'];
        for (const ext of signExts) {
            const sp = path.join(__dirname, '..', 'data', 'sign', `sign${ext}`);
            if (fs.existsSync(sp)) {
                const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
                signSrc = `data:${mime};base64,` + fs.readFileSync(sp).toString('base64');
                break;
            }
        }
    }

    // Replace template placeholders
    const discountAmt = parseFloat(data.discount || 0);
    const originalFee = parseFloat(data.originalMonthlyFee || data.monthlyFee || 0);
    const effectiveFee = originalFee - discountAmt;
    const paidAmt = parseFloat(data.amountPaid || data.amount || 0);
    const balanceNum = typeof data.balance === 'number' ? data.balance : (effectiveFee - paidAmt);
    const balanceClass = balanceNum <= 0 ? 'slip-balance-paid' : 'slip-balance-due';
    const balanceDisplay = balanceNum <= 0 ? 'CLEARED' : Math.abs(balanceNum).toLocaleString();
    const remarksHtml = data.remarks
        ? `<div class="slip-remarks">${data.remarks}</div>`
        : '';

    const discountRowHtml = discountAmt > 0
        ? `<tr><td>Discount Applied</td><td style="color:#16a34a;font-weight:700;">- ${discountAmt.toLocaleString()}</td></tr>`
        : '';

    // Stamp HTML injection
    const stampHtml = stampSrc
        ? `<img src="${stampSrc}" alt="Official Stamp" style="width:130px;height:130px;object-fit:contain;display:block;position:relative;margin:-25px;" />`
        : 'OFFICIAL<br>STAMP';

    // Admin sign HTML injection
    const adminSignHtml = signSrc
        ? `<img src="${signSrc}" alt="Admin Signature" style="max-width:180px;max-height:80px;object-fit:contain;display:block;margin:0 auto 4px;" />`
        : '';

    let html = htmlTemplate
        .replace('{{logoSrc}}', logoSrc)
        .replace('{{slipNumber}}', data.slipNumber || 'SLIP-' + Date.now().toString().slice(-6))
        .replace('{{date}}', data.date || new Date().toLocaleDateString('en-PK'))
        .replace('{{time}}', data.time || new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }))
        .replace('{{studentName}}', data.studentName || '')
        .replace('{{studentId}}', data.studentId || '')
        .replace('{{fatherName}}', data.fatherName || '')
        .replace('{{course}}', data.course || '')
        .replace('{{feePeriod}}', data.feePeriod || data.month || '')
        .replace('{{monthlyFee}}', (data.monthlyFee || data.amount || 0).toLocaleString())
        .replace('{{discountRow}}', discountRowHtml)
        .replace('{{amountPaid}}', (data.amountPaid || data.amount || 0).toLocaleString())
        .replace('{{balanceClass}}', balanceClass)
        .replace('{{balance}}', balanceDisplay)
        .replace('{{paymentMethod}}', data.paymentMethod || 'Cash')
        .replace('{{remarks}}', remarksHtml)
        .replace('{{stampContent}}', stampHtml)
        .replace('{{adminSignContent}}', adminSignHtml);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; justify-content: center; align-items: flex-start; padding: 0; min-height: 100vh; }
  ${css}
</style>
</head>
<body>
${html}
</body>
</html>`;

    // Find Chrome
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
        await page.setViewport({ width: 720, height: 900, deviceScaleFactor: 2 });
        await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 600));

        // Screenshot of just the slip element
        const slipElement = await page.$('.slip-root');
        let imgBuffer;
        if (slipElement) {
            imgBuffer = await slipElement.screenshot({ type: 'png' });
        } else {
            imgBuffer = await page.screenshot({ type: 'png', fullPage: false });
        }

        // Save to temp file
        const outDir = path.join(__dirname, '..', 'data', 'fee-slips');
        fs.mkdirSync(outDir, { recursive: true });
        const slipNum = data.slipNumber || 'SLIP-' + Date.now().toString().slice(-6);
        const outPath = path.join(outDir, `${slipNum}.png`);
        fs.writeFileSync(outPath, imgBuffer);

        return outPath;
    } finally {
        await browser.close().catch(() => {});
    }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets from generated registrations
app.use('/data', express.static(path.join(__dirname, '..', 'data')));


// API Routes
// 1. WhatsApp status & management
app.get('/api/whatsapp/status', (req, res) => {
    res.json(whatsapp.getStatus());
});

app.post('/api/whatsapp/restart', (req, res) => {
    try {
        const client = whatsapp.getClient();
        if (client) {
            client.destroy().catch(err => console.log("Error destroying client:", err));
        }
        whatsapp.init();
        res.json({ success: true, message: "Re-initializing WhatsApp Web client..." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        await whatsapp.disconnect();
        res.json({ success: true, message: "WhatsApp logged out and disconnected successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Student Registrations
app.get('/api/registrations', (req, res) => {
    res.json(db.getRegistrations());
});

app.get('/api/registrations/:studentId', (req, res) => {
    const regs = db.getRegistrations();
    const reg = regs.find(r => r.studentId === req.params.studentId);
    if (reg) {
        res.json(reg);
    } else {
        res.status(404).json({ error: "Registration not found" });
    }
});

app.delete('/api/registrations/:studentId', (req, res) => {
    const success = db.deleteRegistration(req.params.studentId);
    res.json({ success });
});

// 3. Leads
app.get('/api/leads', (req, res) => {
    res.json(db.getLeads());
});

app.post('/api/leads', (req, res) => {
    const lead = db.addLead(req.body);
    res.json(lead);
});

app.put('/api/leads/:id', (req, res) => {
    const lead = db.updateLead(req.params.id, req.body);
    if (lead) {
        res.json(lead);
    } else {
        res.status(404).json({ error: "Lead not found" });
    }
});

app.delete('/api/leads/:id', (req, res) => {
    const success = db.deleteLead(req.params.id);
    res.json({ success });
});

// 4. Conversations
app.get('/api/conversations', (req, res) => {
    res.json(db.getConversations());
});

app.get('/api/conversations/:phone', (req, res) => {
    const conv = db.getConversation(req.params.phone);
    if (conv) {
        res.json(conv);
    } else {
        res.status(404).json({ error: "Conversation not found" });
    }
});

app.delete('/api/conversations/:phone', (req, res) => {
    const success = db.deleteConversation(req.params.phone);
    res.json({ success });
});

app.post('/api/conversations/:phone/message', async (req, res) => {
    const { text } = req.body;
    const phone = req.params.phone;
    
    try {
        const client = whatsapp.getClient();
        if (!client || whatsapp.getStatus().status !== 'Connected') {
            return res.status(400).json({ error: "WhatsApp is not connected." });
        }

        // Save assistant message in DB
        db.saveMessage(phone, null, { sender: 'assistant', text });
        
        // Send via WhatsApp
        await client.sendMessage(phone, text);
        
        // Broadcast
        const conv = db.getConversation(phone);
        const name = conv ? conv.name : phone;
        
        if (wsServerInstance) {
            const payload = JSON.stringify({
                type: 'message',
                data: { phone, name, message: { sender: 'assistant', text, timestamp: new Date().toISOString() } }
            });
            wsServerInstance.clients.forEach(c => {
                if (c.readyState === 1) c.send(payload);
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Courses
app.get('/api/courses', (req, res) => {
    res.json(db.getCourses());
});

app.post('/api/courses', (req, res) => {
    const course = db.saveCourse(req.body);
    res.json(course);
});

app.delete('/api/courses/:id', (req, res) => {
    const success = db.deleteCourse(req.params.id);
    res.json({ success });
});

// 6. Settings
app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
});

app.post('/api/settings', (req, res) => {
    const settings = db.saveSettings(req.body);
    res.json(settings);
});

// 7. Fee Slips
app.get('/api/fee-slips', (req, res) => {
    res.json(db.getFeeSlips().reverse());
});

app.post('/api/fee-slips', (req, res) => {
    const slip = db.addFeeSlip(req.body);
    res.json(slip);
});

app.delete('/api/fee-slips/:id', (req, res) => {
    const success = db.deleteFeeSlip(req.params.id);
    res.json({ success });
});

// 8. Analytics
app.get('/api/analytics', (req, res) => {
    res.json(db.getAnalytics());
});

// 9. Admin Clear All
app.post('/api/admin/clear-all', (req, res) => {
    try {
        db.clearAllData();
        res.json({ success: true, message: "All data cleared successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 10. Students (Fee Management SaaS)
app.get('/api/students', (req, res) => {
    res.json(db.getStudents());
});

app.post('/api/students', (req, res) => {
    try {
        const student = db.addStudent(req.body);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/students/:id', (req, res) => {
    const student = db.updateStudent(req.params.id, req.body);
    if (student) res.json(student);
    else res.status(404).json({ error: 'Student not found' });
});

app.delete('/api/students/:id', (req, res) => {
    db.deleteStudent(req.params.id);
    res.json({ success: true });
});

// 11. Fee Payments
app.get('/api/fee-payments', (req, res) => {
    res.json(db.getFeePayments());
});

app.get('/api/fee-payments/student/:studentId', (req, res) => {
    res.json(db.getFeePaymentsByStudent(req.params.studentId));
});

app.get('/api/fee-payments/analytics', (req, res) => {
    res.json(db.getFeeAnalytics());
});

app.post('/api/fee-payments', (req, res) => {
    try {
        const payment = db.addFeePayment(req.body);
        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/fee-payments/:id', (req, res) => {
    const payment = db.updateFeePayment(req.params.id, req.body);
    if (payment) res.json(payment);
    else res.status(404).json({ error: 'Fee payment not found' });
});

app.delete('/api/fee-payments/:id', (req, res) => {
    db.deleteFeePayment(req.params.id);
    res.json({ success: true });
});

// 12. WhatsApp Agent Info
app.get('/api/whatsapp/agent-info', (req, res) => {
    const status = whatsapp.getStatus();
    const client = whatsapp.getClient();
    let phone = null;
    if (client && status.status === 'Connected') {
        try { phone = client.info ? client.info.wid.user : null; } catch (e) {}
    }
    res.json({
        sessionName: 'TSS-Admin-Agent',
        phone,
        status: status.status,
        lastActive: new Date().toISOString()
    });
});

// Helper to resolve phone numbers to JID/LID using database matching
function resolveTargetJid(target) {
    if (!target) return null;
    target = String(target).trim();
    if (target.includes('@')) return target;

    // Remove all non-digits to match numbers
    const digits = target.replace(/\D/g, '');
    if (!digits) return null;

    try {
        const conversations = db.getConversations();
        for (const conv of conversations) {
            if (!conv.phone) continue;
            const convPhoneDigits = conv.phone.replace(/\D/g, '');
            if (convPhoneDigits && (convPhoneDigits.endsWith(digits) || digits.endsWith(convPhoneDigits))) {
                return conv.phone;
            }
        }
    } catch (e) {
        console.error('Error looking up JID from conversations:', e.message);
    }

    // Fallback: format raw number to Pakistani international code
    let clean = digits;
    if (clean.startsWith('03')) {
        clean = '92' + clean.slice(1);
    } else if (clean.length === 10 && clean.startsWith('3')) {
        clean = '92' + clean;
    }
    return `${clean}@c.us`;
}

// 13. Send Fee Reminder via WhatsApp
app.post('/api/whatsapp/send-reminder', async (req, res) => {
    const { studentName, phone, parentPhone, amount, month } = req.body;
    const client = whatsapp.getClient();
    if (!client || whatsapp.getStatus().status !== 'Connected') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected.' });
    }
    const target = parentPhone || phone;
    if (!target) return res.status(400).json({ success: false, error: 'No phone number provided.' });
    const formatted = resolveTargetJid(target);
    if (!formatted) return res.status(400).json({ success: false, error: 'Could not resolve a valid phone number.' });
    
    const message = `Assalam-o-Alaikum 🌙\nDear Parent,\n\nYour child *${studentName}*'s monthly fee of *Rs ${amount}* for *${month}* is currently pending.\n\nPlease submit it at your earliest convenience.\n\nThank you 🙏\n*The Student Space — Admin*`;
    try {
        await client.sendMessage(formatted, message);
        res.json({ success: true, sentTo: formatted, timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 14. Send Fee Slip via WhatsApp (with auto-generated image)
app.post('/api/whatsapp/send-fee-slip', async (req, res) => {
    const { studentName, studentId, fatherName, course, phone, parentPhone, amount, monthlyFee, month, paidDate, notes } = req.body;
    const client = whatsapp.getClient();
    if (!client || whatsapp.getStatus().status !== 'Connected') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected.' });
    }
    const target = parentPhone || phone;
    if (!target) return res.status(400).json({ success: false, error: 'No phone number provided.' });
    const formatted = resolveTargetJid(target);
    if (!formatted) return res.status(400).json({ success: false, error: 'Could not resolve a valid phone number.' });
    
    const dateStr = paidDate ? new Date(paidDate).toLocaleDateString('en-PK') : new Date().toLocaleDateString('en-PK');
    const timeStr = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const slipNumber = 'SLIP-' + Date.now().toString().slice(-6);

    // Caption text
    const caption = `✅ *Fee Receipt — The Student Space*\n\n🎓 Student: *${studentName}*\n📅 Month: *${month}*\n💰 Amount Paid: *Rs ${amount}*\n📆 Date: *${dateStr}*\n\nStatus: ✅ *PAID*\n\nThank you for your payment! 🙏\n_The Student Space Institute_`;

    try {
        // Generate fee slip image
        const slipData = {
            slipNumber,
            date: dateStr,
            time: timeStr,
            studentName: studentName || '',
            studentId: studentId || '',
            fatherName: fatherName || '',
            course: course || '',
            feePeriod: month || '',
            monthlyFee: parseFloat(monthlyFee || amount || 0),
            amountPaid: parseFloat(amount || 0),
            balance: parseFloat(monthlyFee || amount || 0) - parseFloat(amount || 0),
            discount: parseFloat(req.body.discount || 0),
            originalMonthlyFee: parseFloat(req.body.originalMonthlyFee || monthlyFee || amount || 0),
            paymentMethod: req.body.paymentMethod || 'Cash',
            remarks: notes || ''
        };

        let imgPath = null;
        try {
            imgPath = await renderFeeSlipImage(slipData);
        } catch (imgErr) {
            console.error('Fee slip image generation failed:', imgErr.message);
        }

        if (imgPath && fs.existsSync(imgPath)) {
            // Send as image with caption
            const media = MessageMedia.fromFilePath(imgPath);
            await client.sendMessage(formatted, media, { caption });
        } else {
            // Fallback: send text only
            await client.sendMessage(formatted, caption);
        }

        res.json({ success: true, sentTo: formatted, slipNumber, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('send-fee-slip error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 15. Send ID Card via WhatsApp PDF
app.post('/api/whatsapp/send-id-card', async (req, res) => {
    const { studentId, phone } = req.body;
    const client = whatsapp.getClient();
    if (!client || whatsapp.getStatus().status !== 'Connected') {
        return res.status(400).json({ success: false, error: 'WhatsApp is not connected.' });
    }
    
    // Find the student
    const students = db.getStudents();
    const student = students.find(s => s.id === studentId || s.rollNo === studentId);
    if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const target = phone || student.whatsapp || student.phone;
    const formatted = resolveTargetJid(target);
    if (!formatted) {
        return res.status(400).json({ success: false, error: 'No valid phone number found.' });
    }

    const idCardPath = path.join(__dirname, '..', 'data', 'id_cards', `${student.rollNo}_id_card.pdf`);
    
    if (!fs.existsSync(idCardPath)) {
        try {
            const { generateIdCard } = require('../scripts/id_card_generator');
            const idCardDir = path.dirname(idCardPath);
            if (!fs.existsSync(idCardDir)) fs.mkdirSync(idCardDir, { recursive: true });

            let photoBase64 = null;
            if (student.photo) {
                const photoPath = path.join(__dirname, '..', student.photo.replace(/^\//, ''));
                if (fs.existsSync(photoPath)) {
                    const ext = path.extname(photoPath).replace('.', '') || 'jpeg';
                    photoBase64 = `data:image/${ext};base64,` + fs.readFileSync(photoPath).toString('base64');
                }
            }

            await generateIdCard({
                student,
                logoBase64: null,
                photoBase64,
                outPath: idCardPath
            });

            db.updateStudent(student.id, {
                idCardPdf: `/data/id_cards/${student.rollNo}_id_card.pdf`
            });
        } catch (idErr) {
            console.error('ID Card generation failed:', idErr.message);
            return res.status(500).json({ success: false, error: `ID Card generation failed: ${idErr.message}` });
        }
    }

    if (!fs.existsSync(idCardPath)) {
        return res.status(500).json({ success: false, error: 'ID Card PDF could not be generated.' });
    }

    try {
        const media = MessageMedia.fromFilePath(idCardPath);
        await client.sendMessage(formatted, media, { caption: `🪪 *Official Student ID Card — The Student Space*\n\nStudent: *${student.name}*\nRoll No: *${student.rollNo}*\nCourse: *${student.course}*` });
        res.json({ success: true, sentTo: formatted });
    } catch (err) {
        console.error('Failed to send ID Card via WhatsApp:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Upload Photo
app.post('/api/upload/photo', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/data/photos/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
});

// Upload Stamp (Official Stamp Image for Fee Slip)
app.post('/api/upload/stamp', uploadStamp.single('stamp'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Save as base64 in settings so it persists
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    const base64 = `data:${mime};base64,` + fs.readFileSync(filePath).toString('base64');
    const settings = db.getSettings();
    settings.adminStampImage = base64;
    db.saveSettings(settings);
    res.json({ success: true, url: `/data/stamp/${req.file.filename}` });
});

// Upload Admin Signature
app.post('/api/upload/sign', uploadSign.single('sign'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    const base64 = `data:${mime};base64,` + fs.readFileSync(filePath).toString('base64');
    const settings = db.getSettings();
    settings.adminSignImage = base64;
    db.saveSettings(settings);
    res.json({ success: true, url: `/data/sign/${req.file.filename}` });
});

// Remove Stamp
app.delete('/api/upload/stamp', (req, res) => {
    const settings = db.getSettings();
    settings.adminStampImage = '';
    db.saveSettings(settings);
    // Also delete file(s) on disk
    ['png','jpg','jpeg','webp'].forEach(ext => {
        const p = path.join(__dirname, '..', 'data', 'stamp', `stamp.${ext}`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    res.json({ success: true });
});

// Remove Admin Sign
app.delete('/api/upload/sign', (req, res) => {
    const settings = db.getSettings();
    settings.adminSignImage = '';
    db.saveSettings(settings);
    ['png','jpg','jpeg','webp'].forEach(ext => {
        const p = path.join(__dirname, '..', 'data', 'sign', `sign.${ext}`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    res.json({ success: true });
});

// Attendance Scan
app.post('/api/attendance/scan', (req, res) => {
    const { rollNo } = req.body;
    if (!rollNo) return res.status(400).json({ error: 'rollNo required' });
    const result = db.scanAttendance(rollNo.trim());
    res.json(result);
});
app.get('/api/attendance', (req, res) => { res.json(db.getAttendance()); });
app.delete('/api/attendance/:id', (req, res) => {
    db.deleteAttendance(req.params.id);
    res.json({ success: true });
});

// ── Teachers API ─────────────────────────────────────────────────────────────
app.get('/api/teachers', (req, res) => res.json(db.getTeachers()));
app.post('/api/teachers', (req, res) => {
    try { res.json(db.addTeacher(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/teachers/:id', (req, res) => {
    const t = db.updateTeacher(req.params.id, req.body);
    if (t) res.json(t);
    else res.status(404).json({ error: 'Teacher not found' });
});
app.delete('/api/teachers/:id', (req, res) => {
    db.deleteTeacher(req.params.id);
    res.json({ success: true });
});

// ── Teacher Attendance API ────────────────────────────────────────────────────
app.get('/api/teacher-attendance', (req, res) => res.json(db.getTeacherAttendance()));
app.post('/api/teacher-attendance', (req, res) => {
    try { res.json(db.markTeacherAttendance(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/teacher-attendance/:id', (req, res) => {
    db.deleteTeacherAttendance(req.params.id);
    res.json({ success: true });
});

// ── CSV Export Endpoints ──────────────────────────────────────────────────────
app.get('/api/export/students', (req, res) => {
    const students = db.getStudents();
    const headers = ['ID','Roll No','Name','Father Name','CNIC','Phone','WhatsApp','Email','Course','Monthly Fee','Status','Join Date'];
    const rows = students.map(s =>
        [s.id,s.rollNo,s.name,s.fatherName,s.cnic,s.phone,s.whatsapp,s.email,s.course,s.monthlyFee,s.status,s.createdAt?s.createdAt.split('T')[0]:'']
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
});

app.get('/api/export/teachers', (req, res) => {
    const teachers = db.getTeachers();
    const headers = ['ID','Name','Father Name','CNIC','Phone','Email','Subject','Courses','Schedule','Salary','Status','Join Date'];
    const rows = teachers.map(t =>
        [t.id,t.name,t.fatherName,t.cnic,t.phone,t.email,t.subject,Array.isArray(t.courses)?t.courses.join(';'):t.courses,t.schedule,t.salary,t.status,t.joinDate]
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="teachers.csv"');
    res.send(csv);
});

app.get('/api/export/student-attendance', (req, res) => {
    const attendance = db.getAttendance();
    const headers = ['ID','Roll No','Student Name','Course','Date','Time','Fee Paid','Month'];
    const rows = attendance.map(a =>
        [a.id,a.rollNo,a.studentName,a.course,a.date,a.time?new Date(a.time).toLocaleTimeString('en-PK'):'',a.feePaid?'Yes':'No',a.month]
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student_attendance.csv"');
    res.send(csv);
});

app.get('/api/export/teacher-attendance', (req, res) => {
    const attendance = db.getTeacherAttendance();
    const headers = ['ID','Teacher ID','Teacher Name','Subject','Date','Status','Notes'];
    const rows = attendance.map(a =>
        [a.id,a.teacherId,a.teacherName,a.subject,a.date,a.status,a.notes]
        .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="teacher_attendance.csv"');
    res.send(csv);
});

app.get('/api/export/fee-payments', (req, res) => {
    const payments = db.getFeePayments();
    const students = db.getStudents();
    const headers = ['Payment ID','Student ID','Student Name','Month','Amount','Status','Paid Date','Notes'];
    const rows = payments.map(p => {
        const st = students.find(s => s.id === p.studentId);
        return [p.id,p.studentId,st?st.name:'Unknown',p.month,p.amount,p.status,p.paidDate?p.paidDate.split('T')[0]:'',p.notes]
            .map(v => `"${String(v||'').replace(/"/g,'""')}"`)
            .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fee_payments.csv"');
    res.send(csv);
});

// Registration Form PDF
app.get('/api/registrations/:studentId/form-pdf', async (req, res) => {
    try {
        const { studentId } = req.params;
        const regs = db.getRegistrations();
        const reg = regs.find(r => r.studentId === studentId);
        if (!reg) return res.status(404).json({ error: 'Registration not found' });

        const { generateRegFormPdf } = require('../scripts/reg_form_pdf');

        const logoPath = [
            path.join(__dirname, '..', 'client', 'dist', 'tss-logo.png'),
            path.join(__dirname, '..', 'client', 'public', 'tss-logo.png')
        ].find(p => fs.existsSync(p)) || '';

        let logoBase64 = null;
        if (logoPath) {
            logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
        }

        const outDir = path.join(__dirname, '..', 'data', 'reg-forms');
        fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, `RegForm_${studentId}.pdf`);

        await generateRegFormPdf({ reg, logoBase64, outPath });

        res.download(outPath, `RegForm_${studentId}.pdf`);
    } catch (err) {
        console.error('Registration form PDF error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ID Card Generation
app.get('/api/id-card/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check students first, then registrations
        const students = db.getStudents();
        const regs = db.getRegistrations();
        const settings = db.getSettings();
        let student = students.find(s => s.id === id || s.rollNo === id);
        if (!student) {
            const reg = regs.find(r => r.studentId === id || r.rollNo === id);
            if (reg) {
                student = {
                    rollNo: reg.rollNo || reg.studentId,
                    name: reg.fullName,
                    fatherName: reg.fatherName,
                    cnic: reg.cnic,
                    phone: reg.phone,
                    address: reg.address,
                    course: reg.course,
                    photo: reg.photo || ''
                };
            }
        }
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const { generateIdCard } = require('../scripts/id_card_generator');
        const logoPath = [
            path.join(__dirname, '..', 'client', 'dist', 'tss-logo.png'),
            path.join(__dirname, '..', 'client', 'public', 'tss-logo.png')
        ].find(p => fs.existsSync(p)) || '';
        
        let photoBase64 = '';
        if (student.photo) {
            const photoPath = student.photo.startsWith('/data/')
                ? path.join(__dirname, '..', student.photo.slice(1).replace(/\//g, path.sep))
                : student.photo;
            if (fs.existsSync(photoPath)) {
                photoBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(photoPath).toString('base64');
            }
        }

        let logoBase64 = '';
        if (logoPath) logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

        const idCardHtml = settings.customIdCardFrontHTML || '';
        const idCardBackHtml = settings.customIdCardBackHTML || '';
        const idCardCss = settings.customIdCardCSS || '';

        const outDir = path.join(__dirname, '..', 'data', 'id-cards');
        fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, `${student.rollNo || id}.pdf`);

        await generateIdCard({ student, logoBase64, photoBase64, idCardHtml, idCardBackHtml, idCardCss, outPath });

        res.download(outPath, `ID_Card_${student.rollNo || id}.pdf`);
    } catch (err) {
        console.error('ID card generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend client in production
const CLIENT_BUILD_DIR = path.join(__dirname, '..', 'client', 'dist');
const CLIENT_INDEX = path.join(CLIENT_BUILD_DIR, 'index.html');

// Auto-build client if dist doesn't exist (fresh install on new machine)
if (!fs.existsSync(CLIENT_INDEX)) {
    console.log('⚙️  client/dist not found — building React frontend...');
    try {
        const { execSync } = require('child_process');
        const clientDir = path.join(__dirname, '..', 'client');
        execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
        execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
        console.log('✅ Frontend built successfully!');
    } catch (buildErr) {
        console.error('❌ Frontend build failed:', buildErr.message);
    }
}

app.use(express.static(CLIENT_BUILD_DIR));

app.get(/.*/, (req, res, next) => {
    // If API, let Express handle it or 404
    if (req.path.startsWith('/api')) {
        return next();
    }
    // Serve React index.html
    res.sendFile(CLIENT_INDEX);
});

// Setup WebSockets
let wsServerInstance = null;

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    console.log("WebSocket client connected to server.");
    // Immediately send current status
    ws.send(JSON.stringify({ type: 'status', data: whatsapp.getStatus() }));
});

// Link WebSocket server to WhatsApp module
whatsapp.setWsServer(wss);
wsServerInstance = wss;

// Initialize WhatsApp Client on server bootup
whatsapp.init();

// Boot Express Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Express Backend Server running on port ${PORT}`);
});
