const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { generateIdCard } = require('../scripts/id_card_generator');

// Keep track of connection status and QR code
let connectionStatus = 'Disconnected'; // Disconnected, Connecting, QR_Ready, Connected
let qrCodeDataUri = null;
let client = null;
let wsServer = null; // To broadcast updates
const BOT_START_TIME = Math.floor(Date.now() / 1000);

// Find local Chrome executable
function getChromePath() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Users\\ALI COMPUTERS\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

// Set WebSocket Server
function setWsServer(server) {
    wsServer = server;
}

// ─── Language Detection ──────────────────────────────────────────────────────
// Detects if the user's message is Urdu (native script or Roman Urdu) or English.
// Returns: 'urdu' | 'english'
function detectLanguage(text) {
    if (!text) return 'urdu'; // default to urdu for Pakistani audience

    // Native Urdu/Arabic script characters
    const urduScriptRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    if (urduScriptRegex.test(text)) return 'urdu';

    const lower = text.toLowerCase().trim();

    // Common Roman Urdu greetings and words
    const romanUrduKeywords = [
        'assalam', 'salam', 'aoa', 'walaikum', 'adab', 'ji', 'haan', 'nahi',
        'kya', 'kaise', 'mujhe', 'mera', 'meri', 'aap', 'tum', 'hum',
        'course', 'daakhla', 'admission', 'fee', 'batao', 'bata', 'chahiye',
        'karna', 'karo', 'karein', 'hai', 'hain', 'tha', 'thi', 'ho',
        'bhai', 'bhaiya', 'sis', 'yaar', 'dost', 'apna', 'apni',
        'kitnay', 'kitni', 'kab', 'kahan', 'wahan', 'yahan',
        'koi', 'bhi', 'aur', 'lekin', 'magar', 'phir', 'ab',
        'ok', 'theek', 'thik', 'accha', 'achha', 'bilkul'
    ];

    const wordCount = lower.split(/\s+/).length;
    let urduHits = 0;
    for (const kw of romanUrduKeywords) {
        if (lower.includes(kw)) urduHits++;
        if (urduHits >= 2) return 'urdu';
    }
    // Single strong Roman Urdu hit counts too
    if (urduHits >= 1 && wordCount <= 3) return 'urdu';

    return 'english';
}

// ─── Bilingual Greeting ───────────────────────────────────────────────────────
const GREETINGS_URDU = [
    "Assalamoalaikum! 🌟 *The Student Space Institute* mein khush aamdeed! Main aap ki kya madad kar sakta hoon? 📚",
    "Aoa! *The Student Space* mein aap ka swaagat hai! Aaj main aap ki kaise madad kar sakta hoon? ✨",
    "Salam! 🎓 *The Student Space* se raabta karne ka shukriya! Aap ko kisi cheez mein help chahiye? 🚀",
    "Walaikumassalam! *The Student Space* mein aap ka dil se swaagat hai! Main kya service day sakta hoon? 🌟"
];

const GREETINGS_ENGLISH = [
    "Hello! Welcome to *The Student Space Institute*! How may I assist you today? 📚",
    "Hi there! Thanks for reaching out to *The Student Space*. How can I help you? ✨",
    "Welcome to *The Student Space*! 🎓 What would you like to know today? 🚀",
    "Greetings! We're glad to hear from you at *The Student Space*. How may I assist you? 🌟"
];

function getGreeting(lang) {
    const list = lang === 'english' ? GREETINGS_ENGLISH : GREETINGS_URDU;
    return list[Math.floor(Math.random() * list.length)];
}


// Broadcast helper
function broadcast(type, data) {
    if (wsServer) {
        const payload = JSON.stringify({ type, data });
        wsServer.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(payload);
            }
        });
    }
}

// Helper: Group courses by category dynamically
function getGroupedCourses() {
    const courses = db.getCourses();
    const aiTech = [];
    const career = [];
    const academic = [];
    const other = [];

    courses.forEach(c => {
        const nameLower = c.name.toLowerCase();
        if (
            nameLower.includes('ai') || 
            nameLower.includes('development') || 
            nameLower.includes('design') || 
            nameLower.includes('marketing') || 
            nameLower.includes('amazon') || 
            nameLower.includes('animation') ||
            nameLower.includes('youtube')
        ) {
            aiTech.push(c);
        } else if (
            nameLower.includes('freelancing') || 
            nameLower.includes('computer') || 
            nameLower.includes('office') || 
            nameLower.includes('programming') || 
            nameLower.includes('tools') ||
            nameLower.includes('fundamentals')
        ) {
            career.push(c);
        } else if (
            nameLower.includes('grade') || 
            nameLower.includes('coaching') || 
            nameLower.includes('class') || 
            nameLower.includes('school')
        ) {
            academic.push(c);
        } else {
            other.push(c);
        }
    });

    return { aiTech, career, academic, other };
}

// Helper: Get all active courses in a flat array, ordered by category
function getOrderedCourses() {
    const { aiTech, career, academic, other } = getGroupedCourses();
    return [...aiTech, ...career, ...academic, ...other];
}

// Helper: Build course prompt dynamically from live DB
function buildCoursePrompt() {
    const { aiTech, career, academic, other } = getGroupedCourses();

    let prompt = `Aap kis course mein interested hain? Neeche se course ka *Naam* ya *Number* type karein:\n`;

    let currentIndex = 1;

    if (aiTech.length > 0) {
        prompt += `\n🤖 *AI & Technology:*\n`;
        aiTech.forEach(c => {
            prompt += `  ${currentIndex}. ${c.name} (${c.duration}, ${c.fee})\n`;
            currentIndex++;
        });
    }
    if (career.length > 0) {
        prompt += `\n🚀 *Career Programs:*\n`;
        career.forEach(c => {
            prompt += `  ${currentIndex}. ${c.name} (${c.duration}, ${c.fee})\n`;
            currentIndex++;
        });
    }
    if (academic.length > 0) {
        prompt += `\n📚 *Academic Coaching:*\n`;
        academic.forEach(c => {
            prompt += `  ${currentIndex}. ${c.name} (${c.fee})\n`;
            currentIndex++;
        });
    }
    if (other.length > 0) {
        prompt += `\n📖 *Other Programs:*\n`;
        other.forEach(c => {
            prompt += `  ${currentIndex}. ${c.name} (${c.duration}, ${c.fee})\n`;
            currentIndex++;
        });
    }

    prompt += `\n👉 *Course ka Naam ya Number type karein (e.g. 1 or Generative AI):*`;
    return prompt;
}

function getAdmissionFields() {
  return [
    { 
        key: 'photo', 
        label: 'Student Photo', 
        prompt: '📷 Please upload/send your Student Photo (Passport size image):',
        validate: (val, msg) => {
            return msg && msg.hasMedia;
        }
    },
    { key: 'fullName', label: 'Full Name', prompt: 'Please provide your Full Name:' },
    { key: 'fatherName', label: "Father's Name", prompt: "Please enter your Father's Name:" },
    { 
        key: 'cnic', 
        label: 'CNIC / B-Form Number', 
        prompt: 'Please enter your CNIC or B-Form number (format: XXXXX-XXXXXXX-X or 13 digits without dashes):', 
        validate: (val) => {
            const clean = val.replace(/[^0-9]/g, '');
            return clean.length === 13;
        },
        format: (val) => {
            const clean = val.replace(/[^0-9]/g, '');
            return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
        }
    },
    { 
        key: 'dob', 
        label: 'Date of Birth', 
        prompt: 'Please provide your Date of Birth (format: DD-MM-YYYY, e.g. 15-08-2002):', 
        validate: (val) => {
            const regex = /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/;
            if (!regex.test(val.trim())) return false;
            const clean = val.replace(/[-/.]/g, '-');
            const parts = clean.split('-');
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > new Date().getFullYear() - 10) return false;
            return true;
        },
        format: (val) => val.trim().replace(/[-/.]/g, '-')
    },
    { 
        key: 'gender', 
        label: 'Gender', 
        prompt: 'Please specify your Gender (Male / Female):', 
        validate: (val) => {
            const g = val.trim().toLowerCase();
            return g === 'male' || g === 'female';
        },
        format: (val) => {
            const g = val.trim().toLowerCase();
            return g.charAt(0).toUpperCase() + g.slice(1);
        }
    },
    { key: 'nationality', label: 'Nationality', prompt: 'Please enter your Nationality:' },
    { key: 'religion', label: 'Religion', prompt: 'Please enter your Religion:' },
    { key: 'phone', label: 'Phone Number', prompt: 'Please provide your active Phone Number (e.g. 03XXXXXXXXX):', validate: (val) => val.replace(/[^0-9]/g, '').length >= 10 },
    { key: 'whatsapp', label: 'WhatsApp Number', prompt: 'Please provide your active WhatsApp Number (e.g. 03XXXXXXXXX):', validate: (val) => val.replace(/[^0-9]/g, '').length >= 10 },
    { 
        key: 'email', 
        label: 'Email Address', 
        prompt: 'Please enter your Email Address:', 
        validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
        format: (val) => val.trim().toLowerCase()
    },
    { key: 'address', label: 'Permanent Address', prompt: 'Please enter your Permanent Address:' },
    { key: 'city', label: 'City', prompt: 'Please enter your City:' },
    { key: 'postalCode', label: 'Postal Code', prompt: 'Please enter your Postal Code:', validate: (val) => /^\d{5}$/.test(val.trim()) },
    { key: 'qualification', label: 'Last Qualification', prompt: 'What is your last Academic Qualification (e.g. Matric, Intermediate, Bachelors)?' },
    { key: 'school', label: 'Institute / School Name', prompt: 'What is the name of your last Institute / School / College?' },
    { key: 'passingYear', label: 'Year of Passing', prompt: 'Please enter your Year of Passing (e.g. 2024):', validate: (val) => {
        const y = parseInt(val.trim(), 10);
        return y >= 1980 && y <= new Date().getFullYear();
    }},
    { key: 'marks', label: 'Marks / CGPA', prompt: 'Please provide your obtained Marks / CGPA (e.g. 850/1100 or 3.5/4.0):' },
    { 
        key: 'course', 
        label: 'Interested Course', 
        // prompt is a function — always reads live courses from admin dashboard
        get prompt() { return buildCoursePrompt(); },
        validate: (val) => {
            const cleanVal = val.trim();
            const num = parseInt(cleanVal, 10);
            const ordered = getOrderedCourses();
            
            if (!isNaN(num) && num > 0 && num <= ordered.length) {
                return true;
            }
            
            const matched = ordered.find(c => c.name.toLowerCase().includes(cleanVal.toLowerCase()) || cleanVal.toLowerCase().includes(c.name.toLowerCase()));
            return matched !== undefined;
        },
        format: (val) => {
            const cleanVal = val.trim();
            const num = parseInt(cleanVal, 10);
            const ordered = getOrderedCourses();
            
            if (!isNaN(num) && num > 0 && num <= ordered.length) {
                return ordered[num - 1].name;
            }
            
            const matched = ordered.find(c => c.name.toLowerCase().includes(cleanVal.toLowerCase()) || cleanVal.toLowerCase().includes(c.name.toLowerCase()));
            return matched ? matched.name : cleanVal;
        }
    },
    { 
        key: 'batch', 
        label: 'Preferred Batch Timing', 
        prompt: 'Select your preferred batch timing (Morning / Afternoon / Evening / Weekend):', 
        validate: (val) => {
            const b = val.trim().toLowerCase();
            return ['morning', 'afternoon', 'evening', 'weekend'].includes(b);
        },
        format: (val) => {
            const b = val.trim().toLowerCase();
            return b.charAt(0).toUpperCase() + b.slice(1);
        }
    },

    { key: 'reference', label: 'Reference', prompt: 'How did you hear about us? (Facebook, Instagram, Friend, etc.):' },
    { key: 'emergencyName', label: 'Emergency Contact Person', prompt: 'Please enter the name of your Emergency Contact Person:' },
    { key: 'relationship', label: 'Relationship', prompt: 'What is your relationship with the emergency contact?' },
    { key: 'emergencyPhone', label: 'Emergency Contact Number', prompt: 'Please provide the Phone Number of your emergency contact:', validate: (val) => val.replace(/[^0-9]/g, '').length >= 10 },
    { 
        key: 'alternatePhone', 
        label: 'Alternate Phone Number', 
        prompt: 'Please provide an alternate phone number (Optional, type "None" to skip):',
        validate: (val) => val.trim().toLowerCase() === 'none' || val.replace(/[^0-9]/g, '').length >= 10,
        format: (val) => val.trim().toLowerCase() === 'none' ? 'None' : val.trim()
    },
    { key: 'emergencyAddress', label: 'Emergency Address', prompt: 'Please enter the Address of your emergency contact:' }
  ];
}

function getMenu(lang) {
    if (lang === 'english') {
        return `🎓 *THE STUDENT SPACE INSTITUTE*\n━━━━━━━━━━━━━━━━━━━━\nWe're here to guide you! Please choose:\n\n1️⃣ About the Institute\n2️⃣ Courses & Programs\n3️⃣ Start Admission / Enroll Now\n4️⃣ Contact Information\n5️⃣ Fee Details\n\nOr just type your question and I'll answer! 😊`;
    }
    return `🎓 *THE STUDENT SPACE INSTITUTE*\n━━━━━━━━━━━━━━━━━━━━\nHum aap ki madad ke liye haazir hain! Kripya choose karein:\n\n1️⃣ Institute ke baare mein\n2️⃣ Courses & Programs\n3️⃣ Admission Shuru Karein / Enroll\n4️⃣ Raabta (Contact) Information\n5️⃣ Fee Details\n\nYa apna sawal type karein, main jawab dunga! 😊`;
}

function getAboutMenuText() {
    return `🏛️ *About The Student Space Institute*\n━━━━━━━━━━━━━━━━━\n` +
           `Aap kis specific cheez ke baare mein jaanna chahte hain? Please choose:\n\n` +
           `1️⃣ *Introduction*\n` +
           `2️⃣ *Mission & Vision*\n` +
           `3️⃣ *Learning Methodology*\n` +
           `4️⃣ *Campus Facilities*\n` +
           `5️⃣ *Branch Address & Landmark*\n\n` +
           `👉 Number type/select karein (e.g. *1* or *2*).\n` +
           `👉 Reply *0* to return to Main Menu.`;
}

function getCoursesCategoryMenuText() {
    return `📚 *Courses & Programs — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
           `Aap kis category ke courses dekhna chahte hain? Please choose:\n\n` +
           `1️⃣ *AI & Technology*\n` +
           `2️⃣ *Career Programs*\n` +
           `3️⃣ *Academic Coaching*\n` +
           `4️⃣ *Other Programs*\n\n` +
           `👉 Number type/select karein (e.g. *1* or *2*).\n` +
           `👉 Reply *0* to return to Main Menu.`;
}

function getFeesCategoryMenuText() {
    return `💰 *Fee Structures — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
           `Aap kis category ke courses ki fees check karna chahte hain? Please choose:\n\n` +
           `1️⃣ *AI & Technology Fees*\n` +
           `2️⃣ *Career Programs Fees*\n` +
           `3️⃣ *Academic Coaching Fees*\n` +
           `4️⃣ *Other Programs Fees*\n\n` +
           `👉 Number type/select karein (e.g. *1* or *2*).\n` +
           `👉 Reply *0* to return to Main Menu.`;
}

function getContactMenuText() {
    return `📬 *Contact Information — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
           `Aap ko kaunsi contact details chahiye? Please choose:\n\n` +
           `1️⃣ *Phone Number*\n` +
           `2️⃣ *WhatsApp Number*\n` +
           `3️⃣ *Email Address*\n` +
           `4️⃣ *Office Address & Landmark*\n` +
           `5️⃣ *Social Media Links*\n\n` +
           `👉 Number type/select karein (e.g. *1* or *2*).\n` +
           `👉 Reply *0* to return to Main Menu.`;
}

function getCoursesListText(title, list, catIdx) {
    let msg = `🤖 *${title}*\n━━━━━━━━━━━━━━━━━\n\n`;
    list.forEach((c, idx) => {
        msg += `${idx + 1}️⃣ *${c.name}*\n`;
    });
    msg += `\n👉 Option number type karein (e.g. *1* or *2*) to get course details.\n` +
           `👉 Reply *2* to go back to Courses categories.\n` +
           `👉 Reply *0* to return to Main Menu.`;
    return msg;
}

function getFeesListText(title, list, catIdx) {
    let msg = `💰 *${title}*\n━━━━━━━━━━━━━━━━━\n\n`;
    list.forEach((c, idx) => {
        msg += `${idx + 1}️⃣ *${c.name}*\n`;
    });
    msg += `\n👉 Option number type karein (e.g. *1* or *2*) to see course fees.\n` +
           `👉 Reply *5* to go back to Fee categories.\n` +
           `👉 Reply *0* to return to Main Menu.`;
    return msg;
}

function getCourseDetailText(c, catIdx) {
    return `📚 *${c.name}*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `📖 *Description:* ${c.description}\n\n` +
           `⏱️ *Duration:* ${c.duration}\n` +
           `💰 *Total Fee:* ${c.fee}\n` +
           `💳 *Installment:* ${c.installment}\n` +
           `📅 *Schedule:* ${c.schedule}\n` +
           `💼 *Career Opportunities:* ${c.careerOpportunities}\n\n` +
           `👉 Reply *2* to go back to this category's list.\n` +
           `👉 Reply *3* or *Apply* to Enroll in this course.\n` +
           `👉 Reply *0* to return to the Main Menu.`;
}

function getFeeDetailText(c, catIdx) {
    return `💰 *${c.name} — Fee Structure*\n━━━━━━━━━━━━━━━━━\n\n` +
           `💵 *Total Course Fee:* ${c.fee}\n` +
           `💳 *Monthly Installment:* ${c.installment}\n` +
           `⏱️ *Duration:* ${c.duration}\n\n` +
           `👉 Reply *5* to go back to this category's fees.\n` +
           `👉 Reply *0* to return to Main Menu.`;
}

// Call Gemini API directly (HTTP call to avoid Node dependencies)
async function getAIResponse(userMessage, chatHistory = [], activeState = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.warn("GEMINI_API_KEY is not configured. Fallback to basic answers.");
        return handleFallbackOffline(userMessage);
    }

    const courses = db.getCourses();
    const coursesText = courses.map(c => `* ${c.name}: Duration: ${c.duration}, Fee: ${c.fee} (${c.installment}), Schedule: ${c.schedule}, Opportunities: ${c.careerOpportunities}, Description: ${c.description}`).join('\n');

    const settings = db.getSettings();
    let promptBase = settings.agentSystemPrompt || '';

    if (promptBase.includes('{{coursesText}}')) {
        promptBase = promptBase.replace('{{coursesText}}', coursesText);
    } else if (promptBase.includes('{{courses}}')) {
        promptBase = promptBase.replace('{{courses}}', coursesText);
    } else {
        promptBase += `\n\nAvailable Programs:\n${coursesText}`;
    }

    if (settings.agentRules && settings.agentRules.length > 0) {
        const rulesText = settings.agentRules.map(r => `- Keyword/Intent: "${r.keyword}" -> Response: "${r.response}"`).join('\n');
        promptBase += `\n\nCustom FAQ/QA Rules to follow:\n${rulesText}`;
    }

    // Language instruction — always respond in the user's preferred language
    const langInstruction = activeState && activeState.language === 'english'
        ? `\n\nIMPORTANT: This user communicates in ENGLISH. Always respond in clear, professional English only.`
        : `\n\nIMPORTANT: Is user ka pehla message Urdu ya Roman Urdu mein tha. Hamesha Roman Urdu ya pure Urdu mein jawab dein. Agar user English mein likhay to bhi Roman Urdu mein jawab dein jab tak woh explicitly English mein jawab mangein. Pakistani style Roman Urdu use karein.`;

    const systemPrompt = `${promptBase}${langInstruction}\n\nIMPORTANT: When the user asks about a course or mentions a course name (e.g., "3D Animation", "Generative AI", etc.), you MUST explicitly show its details, especially the Schedule, Timings, and Days from the database.\n\nCurrent Time: ${new Date().toISOString()}`;

    // Structure contents
    const contents = [];
    
    // Add history
    for (const h of chatHistory.slice(-10)) {
        contents.push({
            role: h.sender === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.text }]
        });
    }
    
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
    });

    const body = {
        contents,
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 600
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await response.json();
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) {
            return json.candidates[0].content.parts[0].text.trim();
        } else {
            console.error("Gemini Error:", json);
            return handleFallbackOffline(userMessage);
        }
    } catch (err) {
        console.error("Gemini HTTP Error:", err);
        return handleFallbackOffline(userMessage);
    }
}

// Local offline fallback parser if Gemini is unconfigured or errors
function handleFallbackOffline(msg) {
    const text = msg.toLowerCase();
    const courses = db.getCourses();
    
    if (text.includes("about") || text.includes("intro") || text.includes("mission") || text.includes("vision")) {
        return "The Student Space Institute is a modern training academy providing market-driven skill training. Our mission is to build strong concepts for a bright future. We offer state-of-the-art computer labs, high-speed Wi-Fi, air-conditioned classes, and hands-on project-based learning. How can I guide you further?";
    }
    
    if (text.includes("course") || text.includes("program") || text.includes("class") || text.includes("coaching")) {
        return `📚 *Available Programs*\n` + courses.map(c => `- ${c.name}`).join('\n') + `\n\nWhich course would you like to know more about?`;
    }
    
    if (text.includes("fee") || text.includes("cost")) {
        return `We offer several courses with affordable installment plans. Which course are you interested in?`;
    }
    
    if (text.includes("contact") || text.includes("phone") || text.includes("email") || text.includes("address")) {
        return `Which contact information would you like?\n\n1️⃣ Phone Number\n2️⃣ WhatsApp Number\n3️⃣ Email Address\n4️⃣ Office Address\n5️⃣ Social Media Links`;
    }
    
    if (text.includes("location") || text.includes("where") || text.includes("address")) {
        return `📍 *Institute Location*:\nW-003 Ground Floor, Haroon Royal City Phase 3, Block 17, Gulistan-e-Johar, Karachi.\n\n*Landmark*: Near Federal Urdu University.\n*Google Maps*: https://maps.google.com/?q=The+Student+Space+Gulistan-e-Johar+Karachi`;
    }
    
    return `Welcome to *The Student Space Institute*! How can I assist you today? You can choose from our options:\n\n` + getMenu();
}

// Intent mapper to store analytic categories
function parseIntent(text) {
    const t = text.toLowerCase();
    if (t.includes("admission") || t.includes("apply") || t.includes("register") || t.includes("enroll")) return "Admission";
    if (t.includes("fee") || t.includes("price") || t.includes("cost")) return "Fees";
    if (t.includes("course") || t.includes("class") || t.includes("program") || t.includes("learn")) return "Courses";
    if (t.includes("location") || t.includes("where") || t.includes("map") || t.includes("address")) return "Location";
    if (t.includes("contact") || t.includes("phone") || t.includes("email")) return "Contact";
    if (t.includes("human") || t.includes("support") || t.includes("talk to")) return "Human Support";
    return "General Info";
}

// Start WhatsApp Client
function initWhatsApp() {
    connectionStatus = 'Connecting';
    qrCodeDataUri = null;
    broadcast('status', { status: connectionStatus, qr: qrCodeDataUri });

    const chromePath = getChromePath();
    console.log("Found Chrome path:", chromePath);

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            executablePath: chromePath || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--disable-gpu',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ]
        }
    });

    client.on('qr', async (qr) => {
        connectionStatus = 'QR_Ready';
        try {
            qrCodeDataUri = await qrcode.toDataURL(qr);
            broadcast('status', { status: connectionStatus, qr: qrCodeDataUri });
            console.log("WhatsApp QR Code ready. Broadcasted to clients.");
        } catch (err) {
            console.error("Failed to generate QR data URI", err);
        }
    });

    client.on('ready', () => {
        connectionStatus = 'Connected';
        qrCodeDataUri = null;
        broadcast('status', { status: connectionStatus, qr: qrCodeDataUri });
        console.log("WhatsApp Web Client is ready and connected.");
    });

    client.on('auth_failure', (msg) => {
        connectionStatus = 'Disconnected';
        console.error("WhatsApp auth failure:", msg);
        broadcast('status', { status: connectionStatus, qr: null });
    });

    client.on('disconnected', (reason) => {
        connectionStatus = 'Disconnected';
        console.warn("WhatsApp client disconnected:", reason);
        broadcast('status', { status: connectionStatus, qr: null });
        // Attempt reconnection after 5 seconds
        setTimeout(() => initWhatsApp(), 5000);
    });

    client.on('message', async (message) => {
        try {
            // Ignore messages that were sent before the bot started
            if (message.timestamp < BOT_START_TIME) {
                console.log(`Ignoring old message from ${message.from}`);
                return;
            }

            const phone = message.from;
            const text = message.body;
            const name = message._data.notifyName || phone;

            console.log(`Received message from ${phone} (${name}): ${text}`);

            // Skip messages from groups
            if (phone.includes('@g.us')) return;

            const intent = parseIntent(text);

            // Fetch conversation history and status
            let conv = db.getConversation(phone);
            const chatHistory = conv ? conv.messages : [];
            const regStatus = conv ? conv.registrationStatus : 'Idle';
            const activeStep = conv ? conv.activeStep : -1;
            const collectedData = conv ? conv.collectedData : {};

            // ── Detect & persist language on FIRST message ──────────────
            let userLang = conv ? (conv.language || null) : null;
            if (!userLang) {
                userLang = detectLanguage(text);
                db.updateConversationStatus(phone, { language: userLang });
                console.log(`Detected language for ${phone}: ${userLang}`);
            }

            // Save user message in DB
            db.saveMessage(phone, name, { sender: 'student', text, intent });
            broadcast('message', { phone, name, message: { sender: 'student', text, timestamp: new Date().toISOString() } });

            // Core state machine
            let replyText = "";
            let triggerFormGen = false;

            // 1. Check if user is currently inside the step-by-step admission collection workflow
            const FIELDS = getAdmissionFields(); // always fresh from DB
            if (regStatus === 'Active' && activeStep >= 0 && activeStep < FIELDS.length) {
                const currentField = FIELDS[activeStep];
                let isValid = true;
                
                // Validate if field has a custom validator
                if (currentField.validate) {
                    isValid = currentField.validate(text, message);
                } else {
                    isValid = text.trim().length > 0;
                }

                if (isValid) {
                    // Save field
                    let formattedValue = currentField.format ? currentField.format(text, message) : text.trim();
                    
                    if (currentField.key === 'photo') {
                        try {
                            const media = await message.downloadMedia();
                            if (media && media.mimetype.startsWith('image/')) {
                                const ext = media.mimetype.split('/')[1]?.split(';')[0] || 'jpeg';
                                const filename = `photo_${Date.now()}.${ext}`;
                                const photosDir = path.join(__dirname, '..', 'data', 'photos');
                                if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
                                const photoPath = path.join(photosDir, filename);
                                fs.writeFileSync(photoPath, media.data, 'base64');
                                formattedValue = `/data/photos/${filename}`;
                            } else {
                                isValid = false;
                            }
                        } catch (mediaErr) {
                            console.error("Failed to download media:", mediaErr);
                            isValid = false;
                        }
                    }

                    if (isValid) {
                        collectedData[currentField.key] = formattedValue;
                    
                    const nextStep = activeStep + 1;
                    
                    if (nextStep < FIELDS.length) {
                        // Move to next field
                        db.updateConversationStatus(phone, {
                            activeStep: nextStep,
                            collectedData
                        });
                        
                        let courseDetails = '';
                        if (currentField.key === 'course') {
                            const coursesList = db.getCourses();
                            const matched = coursesList.find(c => c.name.toLowerCase() === formattedValue.toLowerCase());
                            if (matched) {
                                const daysOnly = (matched.schedule || '').replace(/\(.*?\)/g, '').trim();
                                courseDetails = `📅 *${matched.name}* Details:\n⏱️ *Duration:* ${matched.duration}\n📅 *Days:* ${daysOnly}\n\n`;
                            }
                        }
                        
                        replyText = `✅ Saved ${currentField.label}.\n\n${courseDetails}👉 ${FIELDS[nextStep].prompt}`;
                    } else {
                        // All fields collected!
                        db.updateConversationStatus(phone, {
                            registrationStatus: 'Completed',
                            activeStep: -1,
                            collectedData
                        });
                        replyText = `🎉 Thank you! We have collected all your details and are now generating your Official TSS Student Registration Form. Please wait a moment...`;
                        triggerFormGen = true;
                    }
                    }
                } else {
                    // Invalid, ask again politely
                    replyText = `❌ Invalid input for *${currentField.label}*.\n\n👉 ${currentField.prompt}`;
                }

            } else {
                // Not in active collection mode. Handle intents or natural queries.
                
                const lowerText = text.trim().toLowerCase();

                // ── Helper: set context and return menu string ──────────────
                const setCtx = (ctx) => db.updateConversationStatus(phone, { menuContext: ctx });
                const menuCtx = conv ? (conv.menuContext || 'main') : 'main';

                // ── 0 / reset keywords → always go to main menu ─────────────
                if (lowerText === '0' || ['menu', 'help', 'hi', 'hello', 'start', 'salam', 'السلام', 'assalam', 'hey'].some(w => lowerText.includes(w))) {
                    setCtx('main');
                    const greeting = getGreeting(userLang);
                    replyText = `${greeting}\n\n${getMenu(userLang)}`;

                // ── Context-aware bare number input ─────────────────────────
                } else if (/^\d+$/.test(lowerText)) {
                    const num = parseInt(lowerText, 10);

                    /* ── ABOUT context ── */
                    if (menuCtx === 'about') {
                        if (num === 1) {
                            setCtx('about');
                            replyText = `🏛️ *Introduction — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `The Student Space is a premier skill training academy offering professional hands-on coaching in IT, AI, design, marketing & academic programs.\n\n` +
                                        `👉 Reply *1* for About options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 2) {
                            setCtx('about');
                            replyText = `🎯 *Mission & Vision — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `*Mission:* Empowering young minds for tomorrow by building strong, market-ready conceptual foundations.\n\n` +
                                        `*Vision:* Learn • Grow • Succeed — bridging the skill gap between education and industry.\n\n` +
                                        `👉 Reply *1* for About options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 3) {
                            setCtx('about');
                            replyText = `📖 *Learning Methodology*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `• Project-based learning with live hands-on practice.\n` +
                                        `• Individual mentorship and personalized guidance.\n` +
                                        `• Active weekly assessments to track progress.\n` +
                                        `• Professional portfolio building.\n` +
                                        `• Lifetime career support & internship opportunities.\n\n` +
                                        `👉 Reply *1* for About options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 4) {
                            setCtx('about');
                            replyText = `💻 *Campus Facilities — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `• State-of-the-art computer lab with modern systems.\n` +
                                        `• High-speed Wi-Fi internet access.\n` +
                                        `• Fully air-conditioned classrooms.\n` +
                                        `• Student discussion lounge.\n` +
                                        `• Online recorded backup sessions of all classes.\n\n` +
                                        `👉 Reply *1* for About options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 5) {
                            setCtx('about');
                            replyText = `📍 *Branch Location & Address*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `*Office Address:* W-003, Ground Floor, Haroon Royal City Phase 3, Block 17, Gulistan-e-Johar, Karachi.\n\n` +
                                        `*Landmark:* Near Federal Urdu University / Continental Bakery.\n\n` +
                                        `🗺️ *Google Maps:* https://maps.google.com/?q=The+Student+Space+Gulistan-e-Johar+Karachi\n\n` +
                                        `👉 Reply *1* for About options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else {
                            replyText = `❓ Please choose a valid option (1–5) or reply *0* for Main Menu.`;
                        }

                    /* ── COURSES category menu context ── */
                    } else if (menuCtx === 'courses') {
                        const { aiTech, career, academic, other } = getGroupedCourses();
                        let list = null, ctxKey = '', title = '', icon = '';
                        if (num === 1) { list = aiTech; ctxKey = 'courses-ai'; title = 'AI & Technology Courses'; icon = '🤖'; }
                        else if (num === 2) { list = career; ctxKey = 'courses-career'; title = 'Career Programs'; icon = '🚀'; }
                        else if (num === 3) { list = academic; ctxKey = 'courses-academic'; title = 'Academic Coaching Programs'; icon = '📚'; }
                        else if (num === 4) { list = other; ctxKey = 'courses-other'; title = 'Other Programs'; icon = '📖'; }

                        if (list) {
                            setCtx(ctxKey);
                            let msg = `${icon} *${title}*\n━━━━━━━━━━━━━━━━━\n\n`;
                            list.forEach((c, idx) => { msg += `${idx + 1}️⃣ *${c.name}*\n`; });
                            msg += `\n👉 Number type karein course details ke liye.\n` +
                                   `👉 Reply *back* for Courses categories.\n` +
                                   `👉 Reply *0* to return to Main Menu.`;
                            replyText = msg;
                        } else {
                            replyText = `❓ Please choose a valid option (1–4) or reply *0* for Main Menu.`;
                        }

                    /* ── COURSES item detail context ── */
                    } else if (['courses-ai', 'courses-career', 'courses-academic', 'courses-other'].includes(menuCtx)) {
                        const { aiTech, career, academic, other } = getGroupedCourses();
                        let list = [];
                        let catLabel = '';
                        if (menuCtx === 'courses-ai') { list = aiTech; catLabel = 'AI & Technology'; }
                        else if (menuCtx === 'courses-career') { list = career; catLabel = 'Career Programs'; }
                        else if (menuCtx === 'courses-academic') { list = academic; catLabel = 'Academic Coaching'; }
                        else if (menuCtx === 'courses-other') { list = other; catLabel = 'Other Programs'; }

                        const idx = num - 1;
                        if (idx >= 0 && idx < list.length) {
                            const c = list[idx];
                            // Strip clock time from schedule — only show days/dates
                            const schedDaysOnly = (c.schedule || '').replace(/\(.*?\)/g, '').trim();
                            // Auto-start enrollment with course pre-filled
                            db.updateConversationStatus(phone, {
                                registrationStatus: 'Active',
                                activeStep: 1, // skip photo step, start from fullName (step 1) — photo step is step 0
                                collectedData: { course: c.name },
                                menuContext: 'main'
                            });
                            const ENROLL_FIELDS = getAdmissionFields();
                            replyText = `📚 *${c.name}*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                        `📖 *Description:* ${c.description}\n\n` +
                                        `⏱️ *Duration:* ${c.duration}\n` +
                                        `💰 *Total Fee:* ${c.fee}\n` +
                                        `💳 *Monthly Installment:* ${c.installment}\n` +
                                        `📅 *Days:* ${schedDaysOnly}\n` +
                                        `💼 *Career Opportunities:* ${c.careerOpportunities}\n\n` +
                                        `✅ *Aap ka course select ho gaya!*\n\n` +
                                        `📝 Ab registration shuru karte hain...\n\n` +
                                        `👉 ${ENROLL_FIELDS[0].prompt}`;
                        } else {
                            replyText = `❓ Please choose a valid option (1–${list.length}) or reply *0* for Main Menu.`;
                        }

                    /* ── CONTACT context ── */
                    } else if (menuCtx === 'contact') {
                        if (num === 1) {
                            setCtx('contact');
                            replyText = `📞 *Phone Number — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `Aap humein is number par call kar sakte hain:\n` +
                                        `👉 *0322 1761566*\n\n` +
                                        `👉 Reply *4* for other Contact options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 2) {
                            setCtx('contact');
                            replyText = `💬 *WhatsApp — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `Aap is official WhatsApp chat par message kar sakte hain:\n` +
                                        `👉 *0322 1761566*\n\n` +
                                        `👉 Reply *4* for other Contact options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 3) {
                            setCtx('contact');
                            replyText = `✉️ *Email Address — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `Aap humein email send kar sakte hain:\n` +
                                        `👉 *info@thestudentspace.com*\n\n` +
                                        `👉 Reply *4* for other Contact options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 4) {
                            setCtx('contact');
                            replyText = `📍 *Office Address — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `*Address:* W-003, Ground Floor, Haroon Royal City Phase 3, Block 17, Gulistan-e-Johar, Karachi.\n\n` +
                                        `*Landmark:* Near Federal Urdu University / Continental Bakery.\n` +
                                        `🗺️ *Google Maps:* https://maps.google.com/?q=The+Student+Space+Gulistan-e-Johar+Karachi\n\n` +
                                        `👉 Reply *4* for other Contact options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 5) {
                            setCtx('contact');
                            replyText = `🌐 *Social Media Links — The Student Space*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `Humare social channels follow/visit karein:\n` +
                                        `• *Facebook:* https://facebook.com/thestudentspace\n` +
                                        `• *Instagram:* https://instagram.com/thestudentspace\n` +
                                        `• *LinkedIn:* https://linkedin.com/company/thestudentspace\n\n` +
                                        `👉 Reply *4* for other Contact options.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else {
                            replyText = `❓ Please choose a valid option (1–5) or reply *0* for Main Menu.`;
                        }

                    /* ── FEES category menu context ── */
                    } else if (menuCtx === 'fees') {
                        const { aiTech, career, academic, other } = getGroupedCourses();
                        let list = null, ctxKey = '', title = '', icon = '';
                        if (num === 1) { list = aiTech; ctxKey = 'fees-ai'; title = 'AI & Technology — Fee Structure'; icon = '💰'; }
                        else if (num === 2) { list = career; ctxKey = 'fees-career'; title = 'Career Programs — Fee Structure'; icon = '🚀'; }
                        else if (num === 3) { list = academic; ctxKey = 'fees-academic'; title = 'Academic Coaching — Fee Structure'; icon = '📚'; }
                        else if (num === 4) { list = other; ctxKey = 'fees-other'; title = 'Other Programs — Fee Structure'; icon = '📖'; }

                        if (list) {
                            setCtx(ctxKey);
                            let msg = `${icon} *${title}*\n━━━━━━━━━━━━━━━━━\n\n`;
                            list.forEach((c, idx) => { msg += `${idx + 1}️⃣ *${c.name}*\n`; });
                            msg += `\n👉 Number type karein us course ki fee dekhne ke liye.\n` +
                                   `👉 Reply *back* for Fee categories.\n` +
                                   `👉 Reply *0* to return to Main Menu.`;
                            replyText = msg;
                        } else {
                            replyText = `❓ Please choose a valid option (1–4) or reply *0* for Main Menu.`;
                        }

                    /* ── FEES item detail context ── */
                    } else if (['fees-ai', 'fees-career', 'fees-academic', 'fees-other'].includes(menuCtx)) {
                        const { aiTech, career, academic, other } = getGroupedCourses();
                        let list = [];
                        let catLabel = '';
                        if (menuCtx === 'fees-ai') { list = aiTech; catLabel = 'AI & Technology'; }
                        else if (menuCtx === 'fees-career') { list = career; catLabel = 'Career Programs'; }
                        else if (menuCtx === 'fees-academic') { list = academic; catLabel = 'Academic Coaching'; }
                        else if (menuCtx === 'fees-other') { list = other; catLabel = 'Other Programs'; }

                        const idx = num - 1;
                        if (idx >= 0 && idx < list.length) {
                            const c = list[idx];
                            setCtx(menuCtx);
                            replyText = `💰 *${c.name} — Fee Structure*\n━━━━━━━━━━━━━━━━━\n\n` +
                                        `💵 *Total Course Fee:* ${c.fee}\n` +
                                        `💳 *Monthly Installment:* ${c.installment}\n` +
                                        `⏱️ *Duration:* ${c.duration}\n\n` +
                                        `👉 Reply *back* to ${catLabel} fee list.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else {
                            replyText = `❓ Please choose a valid option (1–${list.length}) or reply *0* for Main Menu.`;
                        }

                    /* ── MAIN MENU bare number ── */
                    } else {
                        // Main menu number selection
                        if (num === 1) {
                            setCtx('about');
                            replyText = `🏛️ *About The Student Space Institute*\n━━━━━━━━━━━━━━━━━\n` +
                                        `Aap kis specific cheez ke baare mein jaanna chahte hain?\n\n` +
                                        `1️⃣ *Introduction*\n` +
                                        `2️⃣ *Mission & Vision*\n` +
                                        `3️⃣ *Learning Methodology*\n` +
                                        `4️⃣ *Campus Facilities*\n` +
                                        `5️⃣ *Branch Address & Landmark*\n\n` +
                                        `👉 Number type karein.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 2) {
                            setCtx('courses');
                            replyText = `📚 *Courses & Programs — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                        `Aap kis category ke courses dekhna chahte hain?\n\n` +
                                        `1️⃣ *AI & Technology*\n` +
                                        `2️⃣ *Career Programs*\n` +
                                        `3️⃣ *Academic Coaching*\n` +
                                        `4️⃣ *Other Programs*\n\n` +
                                        `👉 Number type karein.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 3) {
                            setCtx('main');
                            db.updateConversationStatus(phone, {
                                registrationStatus: 'Active',
                                activeStep: 0,
                                collectedData: {},
                                menuContext: 'main'
                            });
                            replyText = `📝 *TSS Admission Registration Process*\n\nMain aap ko step-by-step registration form fill karwaunga. Har sawaal ka jawab dhyan se dein.\n\n👉 ${getAdmissionFields()[0].prompt}`;
                        } else if (num === 4) {
                            setCtx('contact');
                            replyText = `📬 *Contact Information — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                        `Aap ko kaunsi contact details chahiye?\n\n` +
                                        `1️⃣ *Phone Number*\n` +
                                        `2️⃣ *WhatsApp Number*\n` +
                                        `3️⃣ *Email Address*\n` +
                                        `4️⃣ *Office Address & Landmark*\n` +
                                        `5️⃣ *Social Media Links*\n\n` +
                                        `👉 Number type karein.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else if (num === 5) {
                            setCtx('fees');
                            replyText = `💰 *Fee Structures — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                        `Aap kis category ke courses ki fees check karna chahte hain?\n\n` +
                                        `1️⃣ *AI & Technology Fees*\n` +
                                        `2️⃣ *Career Programs Fees*\n` +
                                        `3️⃣ *Academic Coaching Fees*\n` +
                                        `4️⃣ *Other Programs Fees*\n\n` +
                                        `👉 Number type karein.\n` +
                                        `👉 Reply *0* to return to Main Menu.`;
                        } else {
                            // AI fallback for unknown numbers
                            replyText = await getAIResponse(text, chatHistory, conv);
                        }
                    }

                // ── "back" keyword → go up one level ────────────────────────
                } else if (lowerText === 'back') {
                    if (menuCtx === 'about') {
                        setCtx('main');
                        replyText = getMenu();
                    } else if (menuCtx === 'courses') {
                        setCtx('main');
                        replyText = getMenu();
                    } else if (['courses-ai', 'courses-career', 'courses-academic', 'courses-other'].includes(menuCtx)) {
                        setCtx('courses');
                        replyText = `📚 *Courses & Programs — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                    `Aap kis category ke courses dekhna chahte hain?\n\n` +
                                    `1️⃣ *AI & Technology*\n` +
                                    `2️⃣ *Career Programs*\n` +
                                    `3️⃣ *Academic Coaching*\n` +
                                    `4️⃣ *Other Programs*\n\n` +
                                    `👉 Number type karein.\n` +
                                    `👉 Reply *0* to return to Main Menu.`;
                    } else if (menuCtx === 'contact') {
                        setCtx('main');
                        replyText = getMenu();
                    } else if (menuCtx === 'fees') {
                        setCtx('main');
                        replyText = getMenu();
                    } else if (['fees-ai', 'fees-career', 'fees-academic', 'fees-other'].includes(menuCtx)) {
                        setCtx('fees');
                        replyText = `💰 *Fee Structures — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                    `Aap kis category ke courses ki fees check karna chahte hain?\n\n` +
                                    `1️⃣ *AI & Technology Fees*\n` +
                                    `2️⃣ *Career Programs Fees*\n` +
                                    `3️⃣ *Academic Coaching Fees*\n` +
                                    `4️⃣ *Other Programs Fees*\n\n` +
                                    `👉 Number type karein.\n` +
                                    `👉 Reply *0* to return to Main Menu.`;
                    } else {
                        setCtx('main');
                        replyText = getMenu();
                    }

                // ── enroll shortcut ─────────────────────────────────────────
                } else if (lowerText === 'enroll' || lowerText === 'apply' || lowerText === 'i want admission' || lowerText === 'register me' || lowerText === 'enroll me' || lowerText === 'apply now' || lowerText === 'admission') {
                    setCtx('main');
                    db.updateConversationStatus(phone, {
                        registrationStatus: 'Active',
                        activeStep: 0,
                        collectedData: {},
                        menuContext: 'main'
                    });
                    replyText = `📝 *TSS Admission Registration Process*\n\nMain aap ko step-by-step registration form fill karwaunga. Har sawaal ka jawab dhyan se dein.\n\n👉 ${getAdmissionFields()[0].prompt}`;

                // ── keyword-based navigation (words instead of numbers) ─────
                } else if (lowerText === 'about' || lowerText === 'about us' || lowerText === 'institute') {
                    setCtx('about');
                    replyText = `🏛️ *About The Student Space Institute*\n━━━━━━━━━━━━━━━━━\n` +
                                `Aap kis specific cheez ke baare mein jaanna chahte hain?\n\n` +
                                `1️⃣ *Introduction*\n` +
                                `2️⃣ *Mission & Vision*\n` +
                                `3️⃣ *Learning Methodology*\n` +
                                `4️⃣ *Campus Facilities*\n` +
                                `5️⃣ *Branch Address & Landmark*\n\n` +
                                `👉 Number type karein.\n` +
                                `👉 Reply *0* to return to Main Menu.`;
                } else if (lowerText === 'courses' || lowerText === 'programs' || lowerText === 'course' || lowerText === 'program') {
                    setCtx('courses');
                    replyText = `📚 *Courses & Programs — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                `Aap kis category ke courses dekhna chahte hain?\n\n` +
                                `1️⃣ *AI & Technology*\n` +
                                `2️⃣ *Career Programs*\n` +
                                `3️⃣ *Academic Coaching*\n` +
                                `4️⃣ *Other Programs*\n\n` +
                                `👉 Number type karein.\n` +
                                `👉 Reply *0* to return to Main Menu.`;
                } else if (lowerText === 'contact' || lowerText === 'phone' || lowerText === 'email') {
                    setCtx('contact');
                    replyText = `📬 *Contact Information — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                `Aap ko kaunsi contact details chahiye?\n\n` +
                                `1️⃣ *Phone Number*\n` +
                                `2️⃣ *WhatsApp Number*\n` +
                                `3️⃣ *Email Address*\n` +
                                `4️⃣ *Office Address & Landmark*\n` +
                                `5️⃣ *Social Media Links*\n\n` +
                                `👉 Number type karein.\n` +
                                `👉 Reply *0* to return to Main Menu.`;
                } else if (lowerText === 'fee' || lowerText === 'fees' || lowerText === 'charges') {
                    setCtx('fees');
                    replyText = `💰 *Fee Structures — The Student Space*\n━━━━━━━━━━━━━━━━━\n` +
                                `Aap kis category ke courses ki fees check karna chahte hain?\n\n` +
                                `1️⃣ *AI & Technology Fees*\n` +
                                `2️⃣ *Career Programs Fees*\n` +
                                `3️⃣ *Academic Coaching Fees*\n` +
                                `4️⃣ *Other Programs Fees*\n\n` +
                                `👉 Number type karein.\n` +
                                `👉 Reply *0* to return to Main Menu.`;

                // ── Lead escalation capture ─────────────────────────────────
                } else if (conv && conv.registrationStatus === 'Lead_Escalation') {
                    db.addLead({
                        name,
                        phone: text,
                        course: 'General Query',
                        status: 'New'
                    });
                    db.updateConversationStatus(phone, {
                        registrationStatus: 'Idle',
                        menuContext: 'main'
                    });
                    replyText = `✅ Thank you! We have saved your request. An admission representative will contact you very shortly on *${text}*. 📞`;

                // ── AI Fallback ─────────────────────────────────────────────
                } else {
                    const settings = db.getSettings();
                    let matchedRule = null;
                    if (settings.agentRules && Array.isArray(settings.agentRules)) {
                        const lowerInput = text.toLowerCase().trim();
                        for (const rule of settings.agentRules) {
                            if (rule.keyword && lowerInput.includes(rule.keyword.toLowerCase().trim())) {
                                matchedRule = rule.response;
                                break;
                            }
                        }
                    }

                    if (matchedRule) {
                        replyText = matchedRule;
                    } else {
                        replyText = await getAIResponse(text, chatHistory, conv);
                    }
                }
            }

            // Save and send reply
            if (replyText) {
                db.saveMessage(phone, name, { sender: 'assistant', text: replyText });
                broadcast('message', { phone, name: 'assistant', message: { sender: 'assistant', text: replyText, timestamp: new Date().toISOString() } });
                await client.sendMessage(phone, replyText);
            }

            // Trigger registration generation
            if (triggerFormGen) {
                await executeRegistrationFormGeneration(phone, name, collectedData);
            }

        } catch (err) {
            console.error("Error processing message:", err);
        }
    });

    client.initialize();
}

// Perform script execution for registration
async function executeRegistrationFormGeneration(phone, name, collectedData) {
    try {
        const studentId = 'TSS-' + Date.now().toString().slice(-4);
        collectedData.studentId = studentId;
        collectedData.createdAt = new Date().toISOString();
        
        // Write to temp JSON file
        const tempJsonPath = path.join(__dirname, '..', 'data', `temp_${studentId}.json`);
        fs.writeFileSync(tempJsonPath, JSON.stringify(collectedData, null, 2), 'utf-8');
        
        const outputDir = path.join(__dirname, '..', 'data', 'registrations');
        const scriptPath = path.join(__dirname, '..', 'scripts', 'form_generator.js');
        
        console.log(`Running Node.js form generator for student ${studentId}...`);
        
        exec(`node "${scriptPath}" "${tempJsonPath}" "${outputDir}"`, async (err, stdout, stderr) => {
            // Clean up temp file
            if (fs.existsSync(tempJsonPath)) {
                fs.unlinkSync(tempJsonPath);
            }
            
            if (err) {
                console.error("Python Exec Error:", err);
                console.error("Python Stderr:", stderr);
                const errMsg = `⚠️ We encountered an issue compiling your official form, but don't worry! Your details are safely registered in our database under Student ID *${studentId}*. Our admission team will contact you to send your physical copy.`;
                db.saveMessage(phone, name, { sender: 'assistant', text: errMsg });
                await client.sendMessage(phone, errMsg);
                return;
            }
            
            try {
                // Find json output in stdout
                const lines = stdout.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);
                
                if (result.success) {
                    // Update database registration details
                    const registrationRecord = db.addRegistration({
                        ...collectedData,
                        generatedImage: `/data/registrations/${result.png}`,
                        generatedPdf: `/data/registrations/${result.pdf}`
                    });
                    
                    // Add lead too
                    db.addLead({
                        name: collectedData.fullName,
                        phone: collectedData.phone,
                        course: collectedData.course,
                        status: 'Converted'
                    });

                    // Form generated and stored internally — do NOT send file to student
                    // Only send confirmation message with branch visit instruction
                    const confirmMsg = `✅ *Registration Successful!*\n\n` +
                        `🎓 *Student ID:* ${studentId}\n` +
                        `👤 *Name:* ${collectedData.fullName}\n` +
                        `📚 *Course:* ${collectedData.course}\n` +
                        `⏰ *Batch:* ${collectedData.batch}\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n` +
                        `📋 *Aap ka Registration Form aur ID Card tayyar ho gaya hai!*\n\n` +
                        `👉 Apna *Registration Form* aur *ID Card* hasil karne ke liye\n` +
                        `*The Student Space* ki branch par tashreef layein:\n\n` +
                        `📍 *W-003, Ground Floor, Haroon Royal City,*\n` +
                        `*Phase 3, Block 17, Gulistan-e-Johar, Karachi*\n\n` +
                        `🏛️ Wahan se apna Form aur ID Card le kar,\n` +
                        `us par *Official Stamp / Attestation* lagwayein.\n\n` +
                        `📞 *Contact:* 0322 1761566\n\n` +
                        `✨ *Jald hi Admission confirm karne ke liye aap se rabta kiya jayega!*\n\n` +
                        `*Welcome to The Student Space Family! 🎉*`;

                    db.saveMessage(phone, name, { sender: 'assistant', text: confirmMsg });
                    await client.sendMessage(phone, confirmMsg);

                    broadcast('registration', registrationRecord);
                    console.log(`Successfully completed registration for ${studentId}. Form stored internally.`);

                    // Auto-generate ID Card PDF for this student
                    try {
                        const students = db.getStudents();
                        const studentRecord = students.find(s => s.rollNo === registrationRecord.rollNo);
                        if (studentRecord) {
                            const idCardDir = path.join(__dirname, '..', 'data', 'id_cards');
                            if (!fs.existsSync(idCardDir)) fs.mkdirSync(idCardDir, { recursive: true });
                            const idCardPath = path.join(idCardDir, `${studentRecord.rollNo}_id_card.pdf`);

                            // Build photoBase64 if photo exists
                            let photoBase64 = null;
                            if (studentRecord.photo) {
                                const photoPath = path.join(__dirname, '..', studentRecord.photo.replace(/^\//, ''));
                                if (fs.existsSync(photoPath)) {
                                    const ext = path.extname(photoPath).replace('.', '') || 'jpeg';
                                    photoBase64 = `data:image/${ext};base64,` + fs.readFileSync(photoPath).toString('base64');
                                }
                            }

                            await generateIdCard({
                                student: studentRecord,
                                logoBase64: null,
                                photoBase64,
                                outPath: idCardPath
                            });

                            // Update student record with id card path
                            db.updateStudent(studentRecord.id, {
                                idCardPdf: `/data/id_cards/${studentRecord.rollNo}_id_card.pdf`
                            });

                            // ID card saved silently for admin dashboard — student must visit branch to collect
                            console.log(`ID Card generated for ${studentRecord.rollNo} at ${idCardPath}`);
                        }
                    } catch (idErr) {
                        console.error('ID Card auto-generation failed:', idErr.message);
                    }
                } else {
                    throw new Error(result.error || "Form generation script returned failure.");
                }
            } catch (parseErr) {
                console.error("Failed to parse form generator results:", parseErr, stdout);
                const errMsg = `⚠️ Your registration details have been saved under Student ID *${studentId}*, but we had a problem sending the document copy. Our team will contact you shortly to deliver it.`;
                await client.sendMessage(phone, errMsg);
            }
        });
    } catch (err) {
        console.error("Admission generation failure:", err);
    }
}

async function disconnectWhatsApp() {
    if (client) {
        try {
            await client.logout().catch(() => {});
            await client.destroy().catch(() => {});
        } catch (e) {
            console.error("Error destroying WhatsApp client:", e);
        }
    }
    // Delete .wwebjs_auth directory
    const authDir = path.join(__dirname, '..', '.wwebjs_auth');
    if (fs.existsSync(authDir)) {
        try {
            fs.rmSync(authDir, { recursive: true, force: true });
        } catch (e) {
            console.error("Error deleting auth directory:", e);
        }
    }
    connectionStatus = 'Disconnected';
    qrCodeDataUri = null;
    client = null;
    broadcast('status', { status: connectionStatus, qr: qrCodeDataUri });
}

// Actions
module.exports = {
    init: initWhatsApp,
    getClient: () => client,
    getStatus: () => ({ status: connectionStatus, qr: qrCodeDataUri }),
    setWsServer,
    disconnect: disconnectWhatsApp
};
