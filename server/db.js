const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure database files exist
function initDB() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const schemas = {
        'leads.json': [],
        'registrations.json': [],
        'conversations.json': [],
        'courses.json': getDefaultCourses(),
        'fee_slips.json': [],
        'students.json': [],
        'fee_payments.json': [],
        'attendance.json': [],
        'teachers.json': [],
        'teacher_attendance.json': [],
        'settings.json': {
            botActive: true,
            greetingText: "Welcome to The Student Space Institute!",
            escalationContact: "+92 322 1761566",
            customSlipCSS: getDefaultCSS(),
            customSlipHTML: getDefaultHTML(),
            agentSystemPrompt: getDefaultSystemPrompt(),
            agentRules: getDefaultAgentRules()
        }
    };

    for (const [filename, defaultData] of Object.entries(schemas)) {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        }
    }
}

function getDefaultCourses() {
    return [
        // ===== AI & TECHNOLOGY =====
        {
            id: "course-1",
            name: "Generative AI",
            duration: "2 Months",
            fee: "15,000 PKR",
            installment: "7,500 PKR/Month",
            schedule: "Saturday & Sunday (10:00 AM - 12:00 PM)",
            days: ["Sat", "Sun"],
            timings: "Morning",
            description: "Master Generative AI tools including ChatGPT, Midjourney, DALL-E, Stable Diffusion, and prompt engineering to automate tasks and build AI-powered content pipelines.",
            careerOpportunities: "AI Content Creator, Prompt Engineer, AI Consultant, AI Tools Trainer"
        },
        {
            id: "course-2",
            name: "Agentic AI",
            duration: "3 Months",
            fee: "20,000 PKR",
            installment: "7,000 PKR/Month",
            schedule: "Saturday & Sunday (12:00 PM - 02:00 PM)",
            days: ["Sat", "Sun"],
            timings: "Afternoon",
            description: "Build autonomous AI agents using LangChain, AutoGen, CrewAI, and OpenAI APIs. Learn to design multi-agent systems, tool calling, and real-world automation pipelines.",
            careerOpportunities: "AI Agent Developer, LLM Engineer, Automation Engineer, AI Systems Architect"
        },
        {
            id: "course-3",
            name: "Web Development",
            duration: "6 Months",
            fee: "30,000 PKR",
            installment: "5,000 PKR/Month",
            schedule: "Saturday & Sunday (04:00 PM - 06:00 PM)",
            days: ["Sat", "Sun"],
            timings: "Evening",
            description: "Master HTML5, CSS3, JavaScript, React.js, Node.js, Express, and MongoDB. Build full-stack responsive web applications and deploy them to the cloud.",
            careerOpportunities: "Full Stack Developer, Frontend Engineer, Backend Developer, Web Designer"
        },
        {
            id: "course-4",
            name: "App Development",
            duration: "4 Months",
            fee: "25,000 PKR",
            installment: "6,250 PKR/Month",
            schedule: "Saturday & Sunday (01:00 PM - 03:00 PM)",
            days: ["Sat", "Sun"],
            timings: "Afternoon",
            description: "Build beautiful native iOS and Android applications using Flutter and Dart with Firebase backend integration and app store deployment.",
            careerOpportunities: "Flutter Developer, Mobile App Developer, iOS/Android Developer"
        },
        {
            id: "course-5",
            name: "Graphic Designing",
            duration: "3 Months",
            fee: "18,000 PKR",
            installment: "6,000 PKR/Month",
            schedule: "Tuesday & Thursday (06:00 PM - 07:30 PM)",
            days: ["Tue", "Thu"],
            timings: "Evening",
            description: "Learn visual hierarchy, typography, color theory, branding, and master Adobe Photoshop, Illustrator, and Figma for professional design and UI/UX.",
            careerOpportunities: "Graphic Designer, Brand Designer, UI/UX Designer, Illustrator"
        },
        {
            id: "course-6",
            name: "Digital Marketing",
            duration: "3 Months",
            fee: "15,000 PKR",
            installment: "5,000 PKR/Month",
            schedule: "Monday & Wednesday (06:00 PM - 07:30 PM)",
            days: ["Mon", "Wed"],
            timings: "Evening",
            description: "Master SEO, social media marketing, Google Ads, Facebook Ads, content marketing, email campaigns, and digital branding strategies.",
            careerOpportunities: "Digital Marketer, SEO Specialist, Social Media Manager, Content Strategist"
        },
        {
            id: "course-7",
            name: "YouTube Automation",
            duration: "2 Months",
            fee: "12,000 PKR",
            installment: "6,000 PKR/Month",
            schedule: "Saturday (02:00 PM - 04:00 PM)",
            days: ["Sat"],
            timings: "Afternoon",
            description: "Learn how to build and scale faceless YouTube channels using AI tools, automated video creation, scriptwriting, voiceover, and monetization strategies.",
            careerOpportunities: "YouTube Creator, Content Automation Expert, Digital Entrepreneur"
        },
        {
            id: "course-8",
            name: "Amazon FBA",
            duration: "2 Months",
            fee: "18,000 PKR",
            installment: "9,000 PKR/Month",
            schedule: "Sunday (10:00 AM - 01:00 PM)",
            days: ["Sun"],
            timings: "Morning",
            description: "Learn how to launch and scale a profitable Amazon FBA business: product research, sourcing, listing optimization, PPC advertising, and inventory management.",
            careerOpportunities: "Amazon Seller, E-Commerce Entrepreneur, FBA Specialist, Product Sourcing Expert"
        },
        {
            id: "course-9",
            name: "3D Animation",
            duration: "4 Months",
            fee: "22,000 PKR",
            installment: "5,500 PKR/Month",
            schedule: "Monday & Wednesday (04:00 PM - 06:00 PM)",
            days: ["Mon", "Wed"],
            timings: "Evening",
            description: "Master Blender and Maya to create stunning 3D models, characters, animations, visual effects (VFX), and cinematic renders for film and game industries.",
            careerOpportunities: "3D Artist, VFX Designer, Game Asset Creator, Motion Graphics Artist"
        },
        // ===== TECH & CAREER PROGRAMS =====
        {
            id: "course-10",
            name: "Freelancing Masterclass",
            duration: "1 Month",
            fee: "8,000 PKR",
            installment: "Full Payment",
            schedule: "Saturday (11:00 AM - 01:00 PM)",
            days: ["Sat"],
            timings: "Morning",
            description: "Launch your freelancing career on Upwork, Fiverr, and Freelancer.com. Learn profile optimization, proposal writing, client communication, and payment management.",
            careerOpportunities: "Freelancer, Remote Worker, Digital Entrepreneur"
        },
        {
            id: "course-11",
            name: "Computer Fundamentals",
            duration: "1 Month",
            fee: "5,000 PKR",
            installment: "Full Payment",
            schedule: "Monday to Friday (08:00 AM - 09:00 AM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Morning",
            description: "Learn the basics of computers including hardware, software, operating systems, internet usage, email, file management, and basic troubleshooting.",
            careerOpportunities: "Office Staff, Data Entry Operator, IT Support"
        },
        {
            id: "course-12",
            name: "Office Automation (MS Office)",
            duration: "2 Months",
            fee: "8,000 PKR",
            installment: "4,000 PKR/Month",
            schedule: "Monday to Friday (09:00 AM - 10:00 AM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Morning",
            description: "Master Microsoft Word, Excel, PowerPoint, and Outlook. Learn advanced Excel formulas, data analysis, professional document formatting, and presentation design.",
            careerOpportunities: "Office Administrator, Data Entry Specialist, Executive Assistant, Accountant"
        },
        {
            id: "course-13",
            name: "Programming for Beginners",
            duration: "2 Months",
            fee: "10,000 PKR",
            installment: "5,000 PKR/Month",
            schedule: "Saturday & Sunday (09:00 AM - 11:00 AM)",
            days: ["Sat", "Sun"],
            timings: "Morning",
            description: "Start your coding journey with Python fundamentals: variables, loops, functions, OOP, and small project building. No prior experience required.",
            careerOpportunities: "Junior Developer, Coding Bootcamp Graduate, Tech Enthusiast"
        },
        {
            id: "course-14",
            name: "AI Tools for Students",
            duration: "1 Month",
            fee: "6,000 PKR",
            installment: "Full Payment",
            schedule: "Saturday (03:00 PM - 05:00 PM)",
            days: ["Sat"],
            timings: "Afternoon",
            description: "Empower your studies with AI: use ChatGPT for research, Notion AI for notes, Grammarly for writing, and AI image tools for presentations and projects.",
            careerOpportunities: "Productive Student, Research Assistant, Academic AI User"
        },
        // ===== ACADEMIC COACHING =====
        {
            id: "course-15",
            name: "Grade 5 Coaching",
            duration: "Ongoing",
            fee: "4,000 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (02:00 PM - 03:30 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Afternoon",
            description: "Comprehensive coaching for Grade 5 students covering all core subjects: Maths, Science, English, Urdu, and Islamiyat with exam preparation and homework help.",
            careerOpportunities: "Academic Excellence, Strong Foundation, Exam Success"
        },
        {
            id: "course-16",
            name: "Grade 6 Coaching",
            duration: "Ongoing",
            fee: "4,000 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (02:00 PM - 03:30 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Afternoon",
            description: "Comprehensive coaching for Grade 6 students covering all core subjects: Maths, Science, English, Urdu, and Islamiyat with exam preparation and homework help.",
            careerOpportunities: "Academic Excellence, Strong Foundation, Exam Success"
        },
        {
            id: "course-17",
            name: "Grade 7 Coaching",
            duration: "Ongoing",
            fee: "4,500 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (03:30 PM - 05:00 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Afternoon",
            description: "Expert coaching for Grade 7 students in all key subjects including Mathematics, General Science, English, Urdu, Social Studies, and Islamiyat.",
            careerOpportunities: "Academic Excellence, Exam Readiness, Strong Conceptual Foundation"
        },
        {
            id: "course-18",
            name: "Grade 8 Coaching",
            duration: "Ongoing",
            fee: "4,500 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (03:30 PM - 05:00 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Afternoon",
            description: "Expert coaching for Grade 8 students with a strong focus on Mathematics, General Science, English, Urdu, Social Studies, and Board Exam preparation.",
            careerOpportunities: "Academic Excellence, Exam Readiness, Board Exam Prep"
        },
        {
            id: "course-19",
            name: "Grade 9 Coaching",
            duration: "Ongoing",
            fee: "5,000 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (05:00 PM - 07:00 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Evening",
            description: "Targeted coaching for Grade 9 / SSC-I students in Physics, Chemistry, Biology / Computer, Mathematics, English, and Urdu with past paper practice.",
            careerOpportunities: "Board Exam Excellence, SSC Result Improvement, Academic Foundation"
        },
        {
            id: "course-20",
            name: "Grade 10 Coaching",
            duration: "Ongoing",
            fee: "5,500 PKR/Month",
            installment: "Monthly",
            schedule: "Monday to Friday (05:00 PM - 07:00 PM)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            timings: "Evening",
            description: "Intensive Matric / SSC-II coaching for Grade 10 students with full syllabus coverage, past paper practice, mock exams, and exam stress management.",
            careerOpportunities: "Matric Board Distinction, University Entry Preparation"
        }
    ];
}

// Read helper
function readTable(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading database file: ${filename}`, err);
        return [];
    }
}

// Write helper (Sync for atomic safety)
function writeTable(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error(`Error writing database file: ${filename}`, err);
    }
}

// Database Actions
const db = {
    init: initDB,

    // Leads
    getLeads: () => readTable('leads.json'),
    addLead: (lead) => {
        const leads = readTable('leads.json');
        const newLead = {
            id: 'lead-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: lead.name || '',
            phone: lead.phone || '',
            course: lead.course || '',
            status: lead.status || 'New', // New, Contacted, Converted, Junk
            createdAt: lead.createdAt || new Date().toISOString()
        };
        leads.push(newLead);
        writeTable('leads.json', leads);
        return newLead;
    },
    updateLead: (id, updates) => {
        const leads = readTable('leads.json');
        const idx = leads.findIndex(l => l.id === id);
        if (idx !== -1) {
            leads[idx] = { ...leads[idx], ...updates };
            writeTable('leads.json', leads);
            return leads[idx];
        }
        return null;
    },
    deleteLead: (id) => {
        const leads = readTable('leads.json');
        const filtered = leads.filter(l => l.id !== id);
        writeTable('leads.json', filtered);
        return true;
    },

    // Registrations
    getRegistrations: () => readTable('registrations.json'),
    addRegistration: (reg) => {
        const regs = readTable('registrations.json');
        
        // Use the students table to ensure consistent Roll Number sequence
        const students = readTable('students.json');
        const lastRoll = students.reduce((max, st) => {
            if (st.rollNo && st.rollNo.startsWith('TSS-')) {
                const num = parseInt(st.rollNo.split('-')[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        // Also check if any registration has a higher roll number (just in case they haven't been moved to students yet)
        const lastRegRoll = regs.reduce((max, r) => {
            if (r.rollNo && r.rollNo.startsWith('TSS-')) {
                const num = parseInt(r.rollNo.split('-')[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        
        const finalMax = Math.max(lastRoll, lastRegRoll);
        const rollNo = reg.rollNo || 'TSS-' + String(finalMax + 1).padStart(3, '0');

        const newReg = {
            studentId: reg.studentId || rollNo,
            rollNo: rollNo,
            photo: reg.photo || '',
            fullName: reg.fullName || '',
            fatherName: reg.fatherName || '',
            cnic: reg.cnic || '',
            dob: reg.dob || '',
            gender: reg.gender || '',
            nationality: reg.nationality || '',
            religion: reg.religion || '',
            phone: reg.phone || '',
            whatsapp: reg.whatsapp || '',
            email: reg.email || '',
            address: reg.address || '',
            city: reg.city || '',
            postalCode: reg.postalCode || '',
            qualification: reg.qualification || '',
            school: reg.school || '',
            passingYear: reg.passingYear || '',
            marks: reg.marks || '',
            course: reg.course || '',
            batch: reg.batch || '',
            preferredDays: reg.preferredDays || '',
            reference: reg.reference || '',
            emergencyName: reg.emergencyName || '',
            relationship: reg.relationship || '',
            emergencyPhone: reg.emergencyPhone || '',
            alternatePhone: reg.alternatePhone || '',
            emergencyAddress: reg.emergencyAddress || '',
            generatedPdf: reg.generatedPdf || '',
            generatedImage: reg.generatedImage || '',
            createdAt: reg.createdAt || new Date().toISOString()
        };
        regs.push(newReg);
        writeTable('registrations.json', regs);

        // SYNC: Create matching entry in students.json if it doesn't exist
        const studentsList = readTable('students.json');
        const phoneClean = (newReg.phone || '').replace(/[^0-9]/g, '');
        let studentExists = studentsList.find(s => s.rollNo === newReg.rollNo || (phoneClean && s.phone === phoneClean));
        if (!studentExists) {
            const newStudent = {
                id: 'STU-' + Date.now(),
                rollNo: newReg.rollNo,
                photo: newReg.photo || '',
                name: newReg.fullName,
                fatherName: newReg.fatherName,
                cnic: newReg.cnic,
                dob: newReg.dob,
                gender: newReg.gender,
                nationality: newReg.nationality || 'Pakistani',
                religion: newReg.religion || 'Islam',
                phone: phoneClean,
                whatsapp: (newReg.whatsapp || newReg.phone || '').replace(/[^0-9]/g, ''),
                email: newReg.email,
                parentPhone: '',
                address: newReg.address,
                city: newReg.city,
                postalCode: newReg.postalCode,
                qualification: newReg.qualification,
                school: newReg.school,
                passingYear: newReg.passingYear,
                marks: newReg.marks,
                course: newReg.course,
                batch: newReg.batch,
                preferredDays: newReg.preferredDays,
                reference: newReg.reference,
                emergencyName: newReg.emergencyName,
                relationship: newReg.relationship,
                emergencyPhone: newReg.emergencyPhone,
                alternatePhone: newReg.alternatePhone,
                emergencyAddress: newReg.emergencyAddress,
                monthlyFee: 0,
                status: 'active',
                createdAt: newReg.createdAt
            };
            studentsList.push(newStudent);
            writeTable('students.json', studentsList);
        }

        return newReg;
    },
    updateRegistration: (studentId, updates) => {
        const regs = readTable('registrations.json');
        const idx = regs.findIndex(r => r.studentId === studentId);
        if (idx !== -1) {
            regs[idx] = { ...regs[idx], ...updates };
            writeTable('registrations.json', regs);
            return regs[idx];
        }
        return null;
    },
    deleteRegistration: (studentId) => {
        const regs = readTable('registrations.json');
        const reg = regs.find(r => r.studentId === studentId);
        const filtered = regs.filter(r => r.studentId !== studentId);
        writeTable('registrations.json', filtered);

        if (reg) {
            // SYNC: Delete from students.json
            const studentsList = readTable('students.json');
            const filteredStus = studentsList.filter(s => s.rollNo !== reg.rollNo && s.id !== reg.rollNo);
            writeTable('students.json', filteredStus);
        }

        if (reg && reg.phone) {
            const convs = readTable('conversations.json');
            const phoneClean = reg.phone.replace(/[^0-9]/g, '');
            const idx = convs.findIndex(c => {
                const cClean = c.phone.replace(/[^0-9]/g, '');
                return cClean === phoneClean || cClean.includes(phoneClean) || phoneClean.includes(cClean);
            });
            if (idx !== -1) {
                convs[idx].registrationStatus = 'Idle';
                writeTable('conversations.json', convs);
            }
        }
        return true;
    },

    // Conversations & Message History
    getConversations: () => readTable('conversations.json'),
    getConversation: (phone) => {
        const convs = readTable('conversations.json');
        return convs.find(c => c.phone === phone);
    },
    deleteConversation: (phone) => {
        const convs = readTable('conversations.json');
        const filtered = convs.filter(c => c.phone !== phone);
        writeTable('conversations.json', filtered);
        return true;
    },
    saveMessage: (phone, name, msg) => {
        const convs = readTable('conversations.json');
        let conv = convs.find(c => c.phone === phone);
        const timestamp = new Date().toISOString();

        const formattedMsg = {
            id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            sender: msg.sender || 'student', // 'student' or 'assistant'
            text: msg.text || '',
            timestamp
        };

        if (!conv) {
            conv = {
                phone,
                name: name || phone,
                messages: [formattedMsg],
                intent: msg.intent || 'None',
                registrationStatus: 'Idle', // Idle, Active, Completed
                activeStep: -1,
                collectedData: {},
                lastMessageTime: timestamp,
                totalMessages: 1
            };
            convs.push(conv);
        } else {
            conv.messages.push(formattedMsg);
            // Cap history to last 50 messages to prevent database swelling
            if (conv.messages.length > 50) conv.messages.shift();
            conv.name = name || conv.name;
            if (msg.intent) conv.intent = msg.intent;
            conv.lastMessageTime = timestamp;
            conv.totalMessages = (conv.totalMessages || 0) + 1;
        }

        writeTable('conversations.json', convs);
        return conv;
    },
    updateConversationStatus: (phone, updates) => {
        const convs = readTable('conversations.json');
        const idx = convs.findIndex(c => c.phone === phone);
        if (idx !== -1) {
            convs[idx] = { ...convs[idx], ...updates };
            writeTable('conversations.json', convs);
            return convs[idx];
        }
        return null;
    },

    // Courses
    getCourses: () => readTable('courses.json'),
    saveCourse: (course) => {
        const courses = readTable('courses.json');
        const idx = courses.findIndex(c => c.id === course.id);
        if (idx !== -1) {
            courses[idx] = { ...courses[idx], ...course };
        } else {
            course.id = 'course-' + Date.now();
            courses.push(course);
        }
        writeTable('courses.json', courses);
        return course;
    },
    deleteCourse: (id) => {
        const courses = readTable('courses.json');
        const filtered = courses.filter(c => c.id !== id);
        writeTable('courses.json', filtered);
        return true;
    },

    // Fee Slips
    getFeeSlips: () => readTable('fee_slips.json'),
    addFeeSlip: (slip) => {
        const slips = readTable('fee_slips.json');
        const slipNumber = 'SLIP-' + Date.now().toString().slice(-6);
        const newSlip = {
            ...slip,
            id: 'fs-' + Date.now(),
            slipNumber,
            generatedAt: new Date().toISOString()
        };
        slips.push(newSlip);
        writeTable('fee_slips.json', slips);
        return newSlip;
    },
    deleteFeeSlip: (id) => {
        const slips = readTable('fee_slips.json');
        const filtered = slips.filter(s => s.id !== id);
        writeTable('fee_slips.json', filtered);
        return true;
    },

    // Settings
    getSettings: () => {
        const settings = readTable('settings.json');
        if (!settings.customSlipCSS) {
            settings.customSlipCSS = getDefaultCSS();
        }
        if (!settings.customSlipHTML) {
            settings.customSlipHTML = getDefaultHTML();
        }
        if (settings.customSlipHTML) {
            let updated = false;
            if (settings.customSlipHTML.includes('<div class="slip-stamp">OFFICIAL<br>STAMP</div>')) {
                settings.customSlipHTML = settings.customSlipHTML.replace(
                    '<div class="slip-stamp">OFFICIAL<br>STAMP</div>',
                    '<div class="slip-stamp">{{stampContent}}</div>'
                );
                updated = true;
            }
            const oldAdminSign = '<div class="slip-sign"><div class="slip-sign-line"></div><div class="slip-sign-label">Admin Signature</div></div>';
            if (settings.customSlipHTML.includes(oldAdminSign)) {
                settings.customSlipHTML = settings.customSlipHTML.replace(
                    oldAdminSign,
                    '<div class="slip-sign">{{adminSignContent}}<div class="slip-sign-line"></div><div class="slip-sign-label">Admin Signature</div></div>'
                );
                updated = true;
            }
            if (updated) {
                writeTable('settings.json', settings);
            }
        }
        if (!settings.agentSystemPrompt) {
            settings.agentSystemPrompt = getDefaultSystemPrompt();
        }
        if (!settings.agentRules) {
            settings.agentRules = getDefaultAgentRules();
        }
        return settings;
    },
    saveSettings: (settings) => {
        writeTable('settings.json', settings);
        return settings;
    },

    // Analytics
    getAnalytics: () => {
        const convs = readTable('conversations.json');
        const regs = readTable('registrations.json');
        const leads = readTable('leads.json');

        // Most asked questions based on message content intents (mock logic or parsed intent aggregation)
        const intentCounts = {};
        convs.forEach(c => {
            if (c.intent && c.intent !== 'None') {
                intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1;
            }
        });
        const sortedIntents = Object.entries(intentCounts)
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);

        // Daily/monthly leads calculation
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneMonthMs = 30 * oneDayMs;

        const dailyLeads = leads.filter(l => (now - new Date(l.createdAt)) < oneDayMs).length;
        const monthlyLeads = leads.filter(l => (now - new Date(l.createdAt)) < oneMonthMs).length;

        // Pending admissions (registration state is active or completed but not approved in admin)
        // Let's assume registrations with pending field or all registrations are completed
        const totalAdmissions = regs.length;
        const pendingAdmissions = convs.filter(c => c.registrationStatus === 'Active').length;

        return {
            totalConversations: convs.length,
            totalAdmissions,
            pendingAdmissions,
            activeUsers: convs.filter(c => (now - new Date(c.lastMessageTime)) < (7 * oneDayMs)).length,
            dailyLeads,
            monthlyLeads,
            mostAskedQuestions: sortedIntents.slice(0, 5)
        };
    },

    // Students
    getStudents: () => readTable('students.json'),
    addStudent: (s) => {
        const students = readTable('students.json');
        
        // Auto-generate Roll Number based on max existing Roll Number
        const lastRoll = students.reduce((max, st) => {
            if (st.rollNo && st.rollNo.startsWith('TSS-')) {
                const num = parseInt(st.rollNo.split('-')[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        
        const regs = readTable('registrations.json');
        const lastRegRoll = regs.reduce((max, r) => {
            if (r.rollNo && r.rollNo.startsWith('TSS-')) {
                const num = parseInt(r.rollNo.split('-')[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        
        const finalMax = Math.max(lastRoll, lastRegRoll);
        const rollNo = s.rollNo || 'TSS-' + String(finalMax + 1).padStart(3, '0');

        const newStudent = {
            id: s.id || 'STU-' + Date.now(),
            rollNo: rollNo,
            photo: s.photo || '',
            // Personal Info
            name: s.name || s.fullName || '',
            fatherName: s.fatherName || '',
            cnic: s.cnic || '',
            dob: s.dob || '',
            gender: s.gender || '',
            nationality: s.nationality || 'Pakistani',
            religion: s.religion || 'Islam',
            // Contact
            phone: (s.phone || '').replace(/[^0-9]/g, ''),
            whatsapp: (s.whatsapp || s.phone || '').replace(/[^0-9]/g, ''),
            email: s.email || '',
            parentPhone: (s.parentPhone || '').replace(/[^0-9]/g, ''),
            // Address
            address: s.address || '',
            city: s.city || '',
            postalCode: s.postalCode || '',
            // Academic
            qualification: s.qualification || '',
            school: s.school || '',
            passingYear: s.passingYear || '',
            marks: s.marks || '',
            // Course
            course: s.course || '',
            batch: s.batch || '',
            preferredDays: s.preferredDays || '',
            reference: s.reference || '',
            monthlyFee: parseFloat(s.monthlyFee) || 0,
            originalMonthlyFee: parseFloat(s.originalMonthlyFee || s.monthlyFee) || 0,
            discount: parseFloat(s.discount) || 0,
            status: s.status || 'active',
            // Emergency Contact
            emergencyName: s.emergencyName || '',
            relationship: s.relationship || '',
            emergencyPhone: (s.emergencyPhone || '').replace(/[^0-9]/g, ''),
            alternatePhone: s.alternatePhone || '',
            emergencyAddress: s.emergencyAddress || '',
            createdAt: new Date().toISOString()
        };
        students.push(newStudent);
        writeTable('students.json', students);

        // SYNC: Create matching entry in registrations.json if it doesn't exist
        const regsList = readTable('registrations.json');
        let regExists = regsList.find(r => r.rollNo === newStudent.rollNo || (newStudent.phone && r.phone === newStudent.phone));
        if (!regExists) {
            const newReg = {
                studentId: newStudent.rollNo,
                rollNo: newStudent.rollNo,
                photo: newStudent.photo || '',
                fullName: newStudent.name,
                fatherName: newStudent.fatherName,
                cnic: newStudent.cnic,
                dob: newStudent.dob,
                gender: newStudent.gender,
                nationality: newStudent.nationality,
                religion: newStudent.religion,
                phone: newStudent.phone,
                whatsapp: newStudent.whatsapp,
                email: newStudent.email,
                address: newStudent.address,
                city: newStudent.city,
                postalCode: newStudent.postalCode,
                qualification: newStudent.qualification,
                school: newStudent.school,
                passingYear: newStudent.passingYear,
                marks: newStudent.marks,
                course: newStudent.course,
                batch: newStudent.batch,
                preferredDays: newStudent.preferredDays,
                reference: newStudent.reference,
                emergencyName: newStudent.emergencyName,
                relationship: newStudent.relationship,
                emergencyPhone: newStudent.emergencyPhone,
                alternatePhone: newStudent.alternatePhone,
                emergencyAddress: newStudent.emergencyAddress,
                generatedPdf: '',
                generatedImage: '',
                createdAt: newStudent.createdAt
            };
            regsList.push(newReg);
            writeTable('registrations.json', regsList);
        }

        return newStudent;
    },
    updateStudent: (id, updates) => {
        const students = readTable('students.json');
        const idx = students.findIndex(s => s.id === id);
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...updates };
            if (updates.phone) students[idx].phone = updates.phone.replace(/[^0-9]/g, '');
            if (updates.parentPhone) students[idx].parentPhone = updates.parentPhone.replace(/[^0-9]/g, '');
            writeTable('students.json', students);

            // SYNC: Update registrations.json
            const regsList = readTable('registrations.json');
            const rIdx = regsList.findIndex(r => r.rollNo === students[idx].rollNo || r.studentId === students[idx].rollNo);
            if (rIdx !== -1) {
                regsList[rIdx] = {
                    ...regsList[rIdx],
                    photo: students[idx].photo || regsList[rIdx].photo,
                    fullName: students[idx].name || regsList[rIdx].fullName,
                    fatherName: students[idx].fatherName || regsList[rIdx].fatherName,
                    cnic: students[idx].cnic || regsList[rIdx].cnic,
                    dob: students[idx].dob || regsList[rIdx].dob,
                    gender: students[idx].gender || regsList[rIdx].gender,
                    nationality: students[idx].nationality || regsList[rIdx].nationality,
                    religion: students[idx].religion || regsList[rIdx].religion,
                    phone: students[idx].phone || regsList[rIdx].phone,
                    whatsapp: students[idx].whatsapp || regsList[rIdx].whatsapp,
                    email: students[idx].email || regsList[rIdx].email,
                    address: students[idx].address || regsList[rIdx].address,
                    city: students[idx].city || regsList[rIdx].city,
                    postalCode: students[idx].postalCode || regsList[rIdx].postalCode,
                    qualification: students[idx].qualification || regsList[rIdx].qualification,
                    school: students[idx].school || regsList[rIdx].school,
                    passingYear: students[idx].passingYear || regsList[rIdx].passingYear,
                    marks: students[idx].marks || regsList[rIdx].marks,
                    course: students[idx].course || regsList[rIdx].course,
                    batch: students[idx].batch || regsList[rIdx].batch,
                    preferredDays: students[idx].preferredDays || regsList[rIdx].preferredDays,
                    reference: students[idx].reference || regsList[rIdx].reference,
                    emergencyName: students[idx].emergencyName || regsList[rIdx].emergencyName,
                    relationship: students[idx].relationship || regsList[rIdx].relationship,
                    emergencyPhone: students[idx].emergencyPhone || regsList[rIdx].emergencyPhone,
                    alternatePhone: students[idx].alternatePhone || regsList[rIdx].alternatePhone,
                    emergencyAddress: students[idx].emergencyAddress || regsList[rIdx].emergencyAddress,
                };
                writeTable('registrations.json', regsList);
            }

            return students[idx];
        }
        return null;
    },
    deleteStudent: (id) => {
        const students = readTable('students.json');
        const student = students.find(s => s.id === id);
        writeTable('students.json', students.filter(s => s.id !== id));

        if (student) {
            // SYNC: Delete from registrations.json
            const regsList = readTable('registrations.json');
            const filteredRegs = regsList.filter(r => r.rollNo !== student.rollNo && r.studentId !== student.rollNo);
            writeTable('registrations.json', filteredRegs);
        }
        return true;
    },

    // Fee Payments
    getFeePayments: () => readTable('fee_payments.json'),
    getFeePaymentsByStudent: (studentId) => {
        return readTable('fee_payments.json').filter(p => p.studentId === studentId);
    },
    addFeePayment: (p) => {
        const payments = readTable('fee_payments.json');
        const newPayment = {
            id: 'FEE-' + Date.now(),
            studentId: p.studentId || '',
            month: p.month || '',
            amount: parseFloat(p.amount) || 0,
            status: p.status || 'unpaid',   // paid | unpaid | partial
            paidDate: p.paidDate || null,
            notes: p.notes || '',
            createdAt: new Date().toISOString()
        };
        payments.push(newPayment);
        writeTable('fee_payments.json', payments);
        return newPayment;
    },
    updateFeePayment: (id, updates) => {
        const payments = readTable('fee_payments.json');
        const idx = payments.findIndex(p => p.id === id);
        if (idx !== -1) {
            payments[idx] = { ...payments[idx], ...updates };
            if (updates.status === 'paid' && !payments[idx].paidDate) {
                payments[idx].paidDate = new Date().toISOString();
            }
            writeTable('fee_payments.json', payments);
            return payments[idx];
        }
        return null;
    },
    deleteFeePayment: (id) => {
        const payments = readTable('fee_payments.json');
        writeTable('fee_payments.json', payments.filter(p => p.id !== id));
        return true;
    },
    getFeeAnalytics: () => {
        const payments = readTable('fee_payments.json');
        const now = new Date();
        const thisMonth = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
        const paid = payments.filter(p => p.status === 'paid');
        const unpaid = payments.filter(p => p.status === 'unpaid');
        const partial = payments.filter(p => p.status === 'partial');
        const thisMonthPaid = paid.filter(p => p.month === thisMonth);
        // Monthly revenue for last 6 months
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
            const total = payments
                .filter(p => p.month === `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}` && p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);
            monthlyRevenue.push({ label, total });
        }
        return {
            totalCollected: paid.reduce((s, p) => s + p.amount, 0),
            totalPending: unpaid.reduce((s, p) => s + p.amount, 0),
            totalPartial: partial.reduce((s, p) => s + p.amount, 0),
            thisMonthCollected: thisMonthPaid.reduce((s, p) => s + p.amount, 0),
            monthlyRevenue
        };
    },

    clearAllData: () => {
        writeTable('leads.json', []);
        writeTable('registrations.json', []);
        writeTable('conversations.json', []);
        writeTable('fee_slips.json', []);
        writeTable('students.json', []);
        writeTable('fee_payments.json', []);
        writeTable('attendance.json', []);
        return true;
    },

    // Attendance
    getAttendance: () => readTable('attendance.json'),
    getAttendanceByStudent: (rollNo) => readTable('attendance.json').filter(a => a.rollNo === rollNo),
    scanAttendance: (rollNo) => {
        // Find student by rollNo
        const students = readTable('students.json');
        const regs = readTable('registrations.json');
        let student = students.find(s => s.rollNo === rollNo);
        if (!student) {
            const reg = regs.find(r => r.rollNo === rollNo || r.studentId === rollNo);
            if (reg) {
                student = {
                    id: reg.studentId,
                    rollNo: reg.rollNo || reg.studentId,
                    name: reg.fullName,
                    fatherName: reg.fatherName,
                    course: reg.course
                };
            }
        }
        if (!student) return { success: false, error: 'Student not found', rollNo };

        // Check current month fee
        const now = new Date();
        const thisMonth = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
        const payments = readTable('fee_payments.json');
        const monthPayment = payments.find(p =>
            (p.studentId === student.id || p.studentId === rollNo) &&
            p.month === thisMonth
        );
        const feePaid = monthPayment && monthPayment.status === 'paid';
        const feePending = !monthPayment || monthPayment.status !== 'paid';

        // Log attendance
        const attendance = readTable('attendance.json');
        const today = now.toISOString().split('T')[0];
        // Check duplicate attendance for same day
        const alreadyMarked = attendance.find(a => a.rollNo === rollNo && a.date === today);

        if (!alreadyMarked) {
            const record = {
                id: 'ATT-' + Date.now(),
                rollNo: student.rollNo || rollNo,
                studentId: student.id,
                studentName: student.name || student.fullName,
                course: student.course,
                date: today,
                time: now.toISOString(),
                feePaid: feePaid,
                month: thisMonth
            };
            attendance.push(record);
            writeTable('attendance.json', attendance);
        }

        return {
            success: true,
            alreadyMarked: !!alreadyMarked,
            student: {
                rollNo: student.rollNo || rollNo,
                name: student.name || student.fullName,
                fatherName: student.fatherName,
                course: student.course
            },
            feePending,
            month: thisMonth
        };
    },
    deleteAttendance: (id) => {
        const att = readTable('attendance.json');
        writeTable('attendance.json', att.filter(a => a.id !== id));
        return true;
    },

    // ── Teachers ──────────────────────────────────────────────────────────────
    getTeachers: () => readTable('teachers.json'),
    addTeacher: (t) => {
        const teachers = readTable('teachers.json');
        const newTeacher = {
            id: 'TCH-' + Date.now(),
            name: t.name || '',
            fatherName: t.fatherName || '',
            cnic: t.cnic || '',
            phone: t.phone || '',
            email: t.email || '',
            address: t.address || '',
            qualification: t.qualification || '',
            subject: t.subject || '',
            courses: t.courses || [],
            schedule: t.schedule || '',
            salary: parseFloat(t.salary) || 0,
            joinDate: t.joinDate || new Date().toISOString().split('T')[0],
            status: t.status || 'active',
            photo: t.photo || '',
            notes: t.notes || '',
            createdAt: new Date().toISOString()
        };
        teachers.push(newTeacher);
        writeTable('teachers.json', teachers);
        return newTeacher;
    },
    updateTeacher: (id, updates) => {
        const teachers = readTable('teachers.json');
        const idx = teachers.findIndex(t => t.id === id);
        if (idx !== -1) {
            teachers[idx] = { ...teachers[idx], ...updates };
            writeTable('teachers.json', teachers);
            return teachers[idx];
        }
        return null;
    },
    deleteTeacher: (id) => {
        const teachers = readTable('teachers.json');
        writeTable('teachers.json', teachers.filter(t => t.id !== id));
        return true;
    },

    // ── Teacher Attendance ────────────────────────────────────────────────────
    getTeacherAttendance: () => readTable('teacher_attendance.json'),
    markTeacherAttendance: (a) => {
        const attendance = readTable('teacher_attendance.json');
        const teachers = readTable('teachers.json');
        const teacher = teachers.find(t => t.id === a.teacherId);
        const today = new Date().toISOString().split('T')[0];
        const date = a.date || today;

        // Update if already marked for this date
        const existingIdx = attendance.findIndex(x => x.teacherId === a.teacherId && x.date === date);
        if (existingIdx !== -1) {
            attendance[existingIdx] = {
                ...attendance[existingIdx],
                status: a.status || attendance[existingIdx].status,
                notes: a.notes !== undefined ? a.notes : attendance[existingIdx].notes
            };
            writeTable('teacher_attendance.json', attendance);
            return attendance[existingIdx];
        }

        const record = {
            id: 'TATT-' + Date.now(),
            teacherId: a.teacherId || '',
            teacherName: teacher ? teacher.name : (a.teacherName || ''),
            subject: teacher ? teacher.subject : '',
            date: date,
            status: a.status || 'present',   // present | absent | leave
            notes: a.notes || '',
            createdAt: new Date().toISOString()
        };
        attendance.push(record);
        writeTable('teacher_attendance.json', attendance);
        return record;
    },
    deleteTeacherAttendance: (id) => {
        const att = readTable('teacher_attendance.json');
        writeTable('teacher_attendance.json', att.filter(a => a.id !== id));
        return true;
    }
};

db.init();

function getDefaultCSS() {
    return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.slip-root {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: #ffffff;
  color: #1e293b;
  width: 680px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.20);
  border: 1px solid #e2e8f0;
}
.slip-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 60%, #1e3a5f 100%);
  color: #fff;
  padding: 24px 30px 20px;
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
}
.slip-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #38bdf8, #7dd3fc, #38bdf8);
}
.slip-logo {
  width: 105px;
  height: 105px;
  object-fit: contain;
  background: rgba(255,255,255,0.97);
  border-radius: 12px;
  padding: 6px;
  border: 2px solid rgba(255,255,255,0.5);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.slip-institute { flex: 1; }
.slip-institute h2 {
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: 1.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.slip-institute p {
  font-size: 0.72rem;
  margin: 3px 0 0;
  opacity: 0.88;
  line-height: 1.5;
}
.slip-badge {
  background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.35);
  border-radius: 8px;
  padding: 6px 14px;
  text-align: center;
  flex-shrink: 0;
}
.slip-badge-label { font-size: 0.6rem; font-weight: 700; opacity: 0.85; letter-spacing: 2px; text-transform: uppercase; }
.slip-badge-value { font-size: 1rem; font-weight: 800; display: block; margin-top: 1px; }
.slip-title-bar {
  background: #0c4a6e;
  color: #7dd3fc;
  text-align: center;
  padding: 9px;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-transform: uppercase;
}
.slip-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
  background: #f0f9ff;
  font-size: 0.78rem;
  color: #0369a1;
  font-weight: 600;
  border-bottom: 2px solid #bae6fd;
  gap: 12px;
}
.slip-meta-item { display: flex; flex-direction: column; align-items: center; }
.slip-meta-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
.slip-meta-value { font-size: 0.82rem; font-weight: 800; color: #0c4a6e; }
.slip-body { padding: 20px 30px 10px; }
.slip-section { margin-bottom: 16px; }
.slip-section-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: #0ea5e9;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e0f2fe;
  display: flex;
  align-items: center;
  gap: 6px;
}
.slip-section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 14px;
  background: #0ea5e9;
  border-radius: 2px;
  flex-shrink: 0;
}
.slip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 20px;
}
.slip-field { display: flex; flex-direction: column; gap: 1px; }
.slip-field-label {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.slip-field-value {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 600;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}
.slip-fee-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 6px;
  font-size: 0.86rem;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0f2fe;
}
.slip-fee-table th {
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  padding: 10px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
}
.slip-fee-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f9ff;
  background: #fff;
}
.slip-fee-table tr:nth-child(even) td { background: #f8fbff; }
.slip-fee-table tr.slip-total-row td {
  background: #eff6ff;
  font-weight: 800;
  color: #0c4a6e;
  border-top: 2px solid #bae6fd;
  font-size: 0.92rem;
}
.slip-balance-paid { color: #16a34a; font-weight: 800; }
.slip-balance-due { color: #dc2626; font-weight: 800; }
.slip-paid-stamp {
  display: inline-block;
  border: 3px solid #16a34a;
  color: #16a34a;
  border-radius: 8px;
  padding: 3px 14px;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  transform: rotate(-2deg);
  opacity: 0.85;
  margin-top: 4px;
}
.slip-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px 30px 20px;
  border-top: 2px solid #e0f2fe;
  margin-top: 10px;
  background: #fafcff;
}
.slip-sign { text-align: center; }
.slip-sign-line {
  width: 130px;
  border-top: 1.5px dashed #94a3b8;
  margin: 0 auto 5px;
}
.slip-sign-label { font-size: 0.7rem; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
.slip-stamp {
  width: 80px;
  height: 80px;
  border: 2.5px dashed #0ea5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  color: #0ea5e9;
  text-align: center;
  font-weight: 800;
  letter-spacing: 1px;
  background: transparent;
  text-transform: uppercase;
  overflow: visible;
}
.slip-bottom {
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: #7dd3fc;
  text-align: center;
  padding: 10px;
  font-size: 0.72rem;
  letter-spacing: 1.5px;
  font-weight: 600;
}`;
}

function getDefaultHTML() {
    return `<div class="slip-root">
  <div class="slip-header">
    <img class="slip-logo" src="{{logoSrc}}" alt="TSS Logo" />
    <div class="slip-institute">
      <h2>THE STUDENT SPACE</h2>
      <p>W-003, Ground Floor, Haroon Royal City, Phase 3, Block 17</p>
      <p>Gulistan-e-Johar, Karachi &nbsp;|&nbsp; &#128222; 0322-1761566</p>
      <p>&#9993; info@thestudentspace.com</p>
    </div>
    <div class="slip-badge">
      <div class="slip-badge-label">Slip No</div>
      <span class="slip-badge-value">{{slipNumber}}</span>
    </div>
  </div>
  <div class="slip-title-bar">&#10003; &nbsp; Fee Receipt &nbsp; &#10003;</div>
  <div class="slip-meta">
    <div class="slip-meta-item">
      <span class="slip-meta-label">Date</span>
      <span class="slip-meta-value">{{date}}</span>
    </div>
    <div class="slip-meta-item">
      <span class="slip-meta-label">Time</span>
      <span class="slip-meta-value">{{time}}</span>
    </div>
    <div class="slip-meta-item">
      <span class="slip-meta-label">Fee Period</span>
      <span class="slip-meta-value">{{feePeriod}}</span>
    </div>
    <div class="slip-meta-item">
      <div class="slip-paid-stamp">PAID</div>
    </div>
  </div>
  <div class="slip-body">
    <div class="slip-section">
      <div class="slip-section-title">Student Information</div>
      <div class="slip-grid">
        <div class="slip-field">
          <span class="slip-field-label">Student Name</span>
          <span class="slip-field-value">{{studentName}}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Student ID</span>
          <span class="slip-field-value">{{studentId}}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Father Name</span>
          <span class="slip-field-value">{{fatherName}}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Course Enrolled</span>
          <span class="slip-field-value">{{course}}</span>
        </div>
      </div>
    </div>
    <div class="slip-section">
      <div class="slip-section-title">Fee Breakdown</div>
      <table class="slip-fee-table">
        <tr><th>Description</th><th>Amount (PKR)</th></tr>
        <tr><td>Monthly Fee</td><td>{{monthlyFee}}</td></tr>
        {{discountRow}}
        <tr><td>Amount Paid</td><td class="slip-balance-paid">{{amountPaid}}</td></tr>
        <tr class="slip-total-row"><td><strong>Remaining Balance</strong></td><td class="{{balanceClass}}">{{balance}}</td></tr>
      </table>
    </div>
    <div class="slip-section">
      <div class="slip-section-title">Payment Details</div>
      <div class="slip-grid">
        <div class="slip-field">
          <span class="slip-field-label">Payment Method</span>
          <span class="slip-field-value">{{paymentMethod}}</span>
        </div>
        <div class="slip-field">
          <span class="slip-field-label">Status</span>
          <span class="slip-field-value slip-balance-paid">&#10003; Paid</span>
        </div>
      </div>
      {{remarks}}
    </div>
  </div>
  <div class="slip-footer">
    <div class="slip-stamp">{{stampContent}}</div>
    <div class="slip-sign">{{adminSignContent}}<div class="slip-sign-line"></div><div class="slip-sign-label">Admin Signature</div></div>
  </div>
  <div class="slip-bottom">Thank you for choosing The Student Space &mdash; Learn &bull; Grow &bull; Succeed</div>
</div>`;
}

function getDefaultSystemPrompt() {
    return `You are a professional human admission officer, counselor, receptionist, and student support representative for "The Student Space Institute".
Personality: Always respond in a friendly, professional, and human-like manner. Never sound robotic. Use conversational English.
Keep responses short and engaging unless detailed information is requested. Guide users politely.

Knowledge Base:
- Intro: The Student Space Institute is a premier training academy providing market-driven skill training in IT, design, and marketing.
- Mission: Empowering young minds for tomorrow by building strong concepts for a bright future.
- Vision: Learn, Grow, Succeed. To be a leading educational hub that bridges the skill gap.
- Methodology: Hands-on project-based learning, individual mentorship, active weekly assessments, and industry-standard portfolio building.
- Facilities: State-of-the-art computer lab, high-speed Wi-Fi, air-conditioned classes, student discussion lounge, and online backup recordings.
- Support: Lifetime career support, internship opportunities for top graduates, resume building, and freelancing training.
- Address: W-003 Ground Floor, Haroon Royal City Phase 3, Block 17, Gulistan-e-Johar, Karachi.
- Phone & WhatsApp: 0322 1761566.
- Email: info@thestudentspace.com.
- Landmark: Near Federal Urdu University / Continental Bakery.
- Google Maps: https://maps.google.com/?q=The+Student+Space+Gulistan-e-Johar+Karachi

Available Programs:
{{coursesText}}

Rules:
1. If the user asks for contact details, NEVER reveal all contact details at once. Instead ask:
"Which contact information would you like?
1️⃣ Phone Number
2️⃣ WhatsApp Number
3️⃣ Email Address
4️⃣ Office Address
5️⃣ Social Media Links"
Then provide only the selected one when they reply.
2. If the user asks about fees: Show available programs first and ask: "Which course are you interested in?" to provide specific fee details.
3. If they ask about unrelated topics (e.g., weather, cooking, general knowledge): Respond: "I specialize in assisting with The Student Space Institute services. Please ask me anything related to admissions, courses, coaching programs, fees, or institute information."
4. If they ask for human support or "Talk to Admission Team": Ask for their name and contact number so we can connect them.`;
}

function getDefaultAgentRules() {
    return [
        { id: "rule-1", keyword: "admission date", response: "Admissions are currently open for all summer batches! Classes start on July 10th." },
        { id: "rule-2", keyword: "scholarship", response: "We offer up to 50% merit-based scholarships. Please visit the campus for a short test/interview." }
    ];
}

module.exports = db;
