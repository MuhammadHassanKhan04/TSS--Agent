import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  QrCode,
  Users,
  MessageSquare,
  BookOpen,
  Settings as SettingsIcon,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Phone,
  Calendar,
  DollarSign,
  Receipt,
  Printer,
  FileText,
  Edit3,
  Eye,
  LogOut,
  UserCheck,
  Bot,
  Wallet,
  CheckCheck,
  BellRing,
  TrendingUp,
  XCircle,
  Edit,
  BadgeCheck,
  X,
  CreditCard,
  ScanLine,
  Image,
  GraduationCap,
  ClipboardList,
  Upload,
  FileDown,
  Lock,
  Shield
} from 'lucide-react';


import { Html5QrcodeScanner } from 'html5-qrcode';


// Backend URL: set VITE_API_URL in Vercel env vars to point to your Railway backend
// e.g. VITE_API_URL=https://tss-agent.up.railway.app
const API_BASE = import.meta.env.VITE_API_URL || (window.location.port && window.location.port !== '5000' ? `http://${window.location.hostname}:5000` : '');
const WS_BASE = import.meta.env.VITE_WS_URL || (window.location.port && window.location.port !== '5000' ? `ws://${window.location.hostname}:5000` : `ws://${window.location.host}`);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleResponse, setNewRuleResponse] = useState('');

  // ── Admin Auth ──
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const ADMIN_PASSWORD = 'TSS001';
  
  // WhatsApp States
  const [wsStatus, setWsStatus] = useState({ status: 'Disconnected', qr: null });
  const [isRestarting, setIsRestarting] = useState(false);
  
  // Data States
  const [analytics, setAnalytics] = useState({
    totalConversations: 0,
    totalAdmissions: 0,
    pendingAdmissions: 0,
    activeUsers: 0,
    dailyLeads: 0,
    monthlyLeads: 0,
    mostAskedQuestions: []
  });
  const [leads, setLeads] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState({
    botActive: true,
    greetingText: '',
    escalationContact: '',
    customSlipCSS: '',
    customSlipHTML: '',
    agentSystemPrompt: '',
    agentRules: []
  });

  // Selected details states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeChatPhone, setActiveChatPhone] = useState(null);
  const [chatSearch, setChatSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [editCourse, setEditCourse] = useState(null);
  const [isNewCourse, setIsNewCourse] = useState(false);

  // Fee Slip States
  const [feeSlips, setFeeSlips] = useState([]);
  const [showCustomCSS, setShowCustomCSS] = useState(false);
  const [slipView, setSlipView] = useState('form'); // 'form' | 'history'
  const [feeSlipForm, setFeeSlipForm] = useState({
    studentName: '',
    studentId: '',
    fatherName: '',
    course: '',
    feePeriod: '',
    totalFee: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    remarks: '',
    isOneShot: false
  });
  const [customSlipCSS, setCustomSlipCSS] = useState(`
.slip-root { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; width: 680px; margin: 0 auto; border: 2px solid #0ea5e9; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.18); }
.slip-header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #fff; padding: 20px 28px; display: flex; align-items: center; gap: 18px; }
.slip-logo { width: 105px; height: 105px; object-fit: contain; background: rgba(255,255,255,0.95); border-radius: 10px; padding: 4px; border: 2px solid rgba(255,255,255,0.6); flex-shrink: 0; }
.slip-institute { flex: 1; }
.slip-institute h2 { font-size: 1.3rem; font-weight: 800; margin: 0; letter-spacing: 1px; }
.slip-institute p { font-size: 0.78rem; margin: 2px 0 0; opacity: 0.9; }
.slip-title-bar { background: #0c4a6e; color: #bae6fd; text-align: center; padding: 8px; font-size: 1rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
.slip-meta { display: flex; justify-content: space-between; padding: 10px 28px; background: #f0f9ff; font-size: 0.82rem; color: #0c4a6e; font-weight: 600; border-bottom: 1px solid #bae6fd; }
.slip-body { padding: 18px 28px; }
.slip-section { margin-bottom: 14px; }
.slip-section-title { font-size: 0.72rem; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0f2fe; }
.slip-row { display: flex; margin-bottom: 6px; font-size: 0.88rem; }
.slip-label { width: 160px; color: #475569; font-weight: 600; flex-shrink: 0; }
.slip-value { color: #1a1a2e; font-weight: 500; }
.slip-fee-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 0.88rem; }
.slip-fee-table th { background: #0ea5e9; color: #fff; padding: 8px 12px; text-align: left; font-weight: 700; }
.slip-fee-table td { padding: 8px 12px; border-bottom: 1px solid #e0f2fe; }
.slip-fee-table tr:last-child td { background: #f0f9ff; font-weight: 700; color: #0c4a6e; }
.slip-balance-paid { color: #16a34a; font-weight: 800; }
.slip-balance-due { color: #dc2626; font-weight: 800; }
.slip-remarks { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 0.85rem; color: #334155; margin-top: 6px; min-height: 36px; }
.slip-footer { display: flex; justify-content: space-between; padding: 18px 28px 20px; border-top: 1px solid #e0f2fe; margin-top: 8px; }
.slip-sign { text-align: center; }
.slip-sign-line { width: 140px; border-top: 1.5px solid #94a3b8; margin: 0 auto 4px; }
.slip-sign-label { font-size: 0.75rem; color: #64748b; font-weight: 600; }
.slip-stamp { width: 80px; height: 80px; border: 2px dashed #0ea5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #0ea5e9; text-align: center; font-weight: 700; overflow: visible; background: transparent; }
.slip-bottom { background: #0c4a6e; color: #7dd3fc; text-align: center; padding: 7px; font-size: 0.72rem; letter-spacing: 1px; }
`);

  const [htmlEditorTab, setHtmlEditorTab] = useState('css'); // 'css' | 'html'
  const [customSlipHTML, setCustomSlipHTML] = useState(`<div class="slip-root">
  <div class="slip-header">
    <img class="slip-logo" src="{{logoSrc}}" alt="TSS Logo" />
    <div class="slip-institute">
      <h2>THE STUDENT SPACE</h2>
      <p>W-003, Ground Floor, Haroon Royal City, Phase 3, Block 17, Gulistan-e-Johar, Karachi</p>
      <p>&#128222; 0322-1761566 &nbsp;|&nbsp; &#9993; info@thestudentspace.com</p>
    </div>
  </div>
  <div class="slip-title-bar">Fee Receipt</div>
  <div class="slip-meta">
    <span>Slip No: <strong>{{slipNumber}}</strong></span>
    <span>Date: <strong>{{date}}</strong></span>
    <span>Time: <strong>{{time}}</strong></span>
  </div>
  <div class="slip-body">
    <div class="slip-section">
      <div class="slip-section-title">Student Information</div>
      <div class="slip-row"><span class="slip-label">Student Name</span><span class="slip-value">{{studentName}}</span></div>
      <div class="slip-row"><span class="slip-label">Student ID</span><span class="slip-value">{{studentId}}</span></div>
      <div class="slip-row"><span class="slip-label">Father Name</span><span class="slip-value">{{fatherName}}</span></div>
      <div class="slip-row"><span class="slip-label">Course Enrolled</span><span class="slip-value">{{course}}</span></div>
      <div class="slip-row"><span class="slip-label">Fee Period</span><span class="slip-value">{{feePeriod}}</span></div>
    </div>
    <div class="slip-section">
      <div class="slip-section-title">Fee Breakdown</div>
      <table class="slip-fee-table">
        <tr><th>Description</th><th>Amount (PKR)</th></tr>
        <tr><td>Monthly Fee</td><td>{{monthlyFee}}</td></tr>
        {{discountRow}}
        <tr><td>Amount Paid</td><td class="slip-balance-paid">{{amountPaid}}</td></tr>
        <tr><td><strong>Remaining Balance</strong></td><td class="{{balanceClass}}">{{balance}}</td></tr>
      </table>
    </div>
    <div class="slip-section">
      <div class="slip-section-title">Payment Details</div>
      <div class="slip-row"><span class="slip-label">Payment Method</span><span class="slip-value">{{paymentMethod}}</span></div>
      {{remarks}}
    </div>
  </div>
  <div class="slip-footer">
    <div class="slip-stamp">{{stampContent}}</div>
    <div class="slip-sign">{{adminSignContent}}<div class="slip-sign-line"></div><div class="slip-sign-label">Admin Signature</div></div>
  </div>
  <div class="slip-bottom">Thank you for choosing The Student Space &mdash; Learn &bull; Grow &bull; Succeed</div>
</div>`);


  // Chat scroll ref
  const chatEndRef = useRef(null);

  // ── NEW: Students & Fee Management State ──
  const [students, setStudents] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [feeAnalytics, setFeeAnalytics] = useState({ totalCollected: 0, totalPending: 0, totalPartial: 0, thisMonthCollected: 0, monthlyRevenue: [] });
  const [agentInfo, setAgentInfo] = useState({ sessionName: 'TSS-Admin-Agent', phone: null, status: 'Disconnected', lastActive: null });
  const [studentSearch, setStudentSearch] = useState('');
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }
  const toastTimeout = useRef(null);

  // Student modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    fatherName: '',
    cnic: '',
    dob: '',
    gender: '',
    nationality: 'Pakistani',
    religion: 'Islam',
    phone: '',
    whatsapp: '',
    email: '',
    parentPhone: '',
    address: '',
    city: '',
    postalCode: '',
    qualification: '',
    school: '',
    passingYear: '',
    marks: '',
    course: '',
    batch: '',
    preferredDays: '',
    reference: '',
    emergencyName: '',
    relationship: '',
    emergencyPhone: '',
    alternatePhone: '',
    emergencyAddress: '',
    monthlyFee: '',
    status: 'active',
    photo: '',
    discount: ''
  });

  // Fee modal state
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeForm, setFeeForm] = useState({ studentId: '', month: '', amount: '', status: 'unpaid', notes: '' });
  const [feeStudentFilter, setFeeStudentFilter] = useState('all');

  // Attendance state
  const [attendance, setAttendance] = useState([]);
  const [attendanceScan, setAttendanceScan] = useState('');
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const scanInputRef = useRef(null);

  // ── Teacher State ──
  const [teachers, setTeachers] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherAttendanceDate, setTeacherAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceTab, setAttendanceTab] = useState('students'); // 'students' | 'teachers'
  const [teacherForm, setTeacherForm] = useState({
    name: '', fatherName: '', cnic: '', phone: '', email: '',
    address: '', qualification: '', subject: '', courses: '',
    schedule: '', salary: '', joinDate: new Date().toISOString().split('T')[0],
    status: 'active', notes: ''
  });

  // Load Initial Data
  useEffect(() => {
    fetchData();
    
    // Connect WebSocket
    const ws = new WebSocket(WS_BASE);
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'status') {
        setWsStatus(data);
      } else if (type === 'message') {
        // Update live conversation message list
        setConversations(prev => {
          const idx = prev.findIndex(c => c.phone === data.phone);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx].messages.push(data.message);
            if (updated[idx].messages.length > 50) updated[idx].messages.shift();
            updated[idx].lastMessageTime = data.message.timestamp;
            updated[idx].totalMessages = (updated[idx].totalMessages || 0) + 1;
            return updated;
          } else {
            return [...prev, {
              phone: data.phone,
              name: data.name,
              messages: [data.message],
              intent: 'General Info',
              registrationStatus: 'Idle',
              lastMessageTime: data.message.timestamp
            }];
          }
        });
        
        // Refresh analytics & leads if message triggers intent
        fetchAnalytics();
      } else if (type === 'registration') {
        setRegistrations(prev => [data, ...prev]);
        fetchAnalytics();
      }
    };

    return () => ws.close();
  }, []);

  // Scroll active chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatPhone, conversations]);



  const fetchData = async () => {
    try {
      await Promise.all([
        fetch(`${API_BASE}/api/analytics`).then(res => res.json()).then(data => setAnalytics(data)),
        fetch(`${API_BASE}/api/leads`).then(res => res.json()).then(data => setLeads(data.reverse())),
        fetch(`${API_BASE}/api/registrations`).then(res => res.json()).then(data => setRegistrations(data.reverse())),
        fetch(`${API_BASE}/api/conversations`).then(res => res.json()).then(data => setConversations(data.sort((a,b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)))),
        fetch(`${API_BASE}/api/courses`).then(res => res.json()).then(data => setCourses(data)),
        fetch(`${API_BASE}/api/settings`).then(res => res.json()).then(data => {
          setSettings(data);
          if (data.customSlipCSS) setCustomSlipCSS(data.customSlipCSS);
          if (data.customSlipHTML) setCustomSlipHTML(data.customSlipHTML);
        }),
        fetch(`${API_BASE}/api/fee-slips`).then(res => res.json()).then(data => setFeeSlips(data)),
        fetch(`${API_BASE}/api/students`).then(res => res.json()).then(data => setStudents(data)),
        fetch(`${API_BASE}/api/fee-payments`).then(res => res.json()).then(data => setFeePayments(data)),
        fetch(`${API_BASE}/api/fee-payments/analytics`).then(res => res.json()).then(data => setFeeAnalytics(data)),
        fetch(`${API_BASE}/api/whatsapp/agent-info`).then(res => res.json()).then(data => setAgentInfo(data)).catch(() => {}),
        fetch(`${API_BASE}/api/attendance`).then(res => res.json()).then(data => setAttendance(data.sort((a,b) => new Date(b.time) - new Date(a.time)))).catch(() => {}),
        fetch(`${API_BASE}/api/teachers`).then(res => res.json()).then(data => setTeachers(data)).catch(() => {}),
        fetch(`${API_BASE}/api/teacher-attendance`).then(res => res.json()).then(data => setTeacherAttendance(data.sort((a,b) => new Date(b.date) - new Date(a.date)))).catch(() => {}),
      ]);
    } catch (e) {
      console.error("Error fetching initial data", e);
    } finally {
      setTimeout(() => {
        setAppLoading(false);
      }, 1500);
    }
  };

  const fetchAnalytics = () => {
    fetch(`${API_BASE}/api/analytics`)
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.log(err));
  };

  const fetchLeads = () => {
    fetch(`${API_BASE}/api/leads`)
      .then(res => res.json())
      .then(data => setLeads(data.reverse()))
      .catch(err => console.log(err));
  };

  const fetchAttendance = () => {
    fetch(`${API_BASE}/api/attendance`)
      .then(res => res.json())
      .then(data => setAttendance(data.sort((a,b) => new Date(b.time) - new Date(a.time))))
      .catch(() => {});
  };

  const uploadPhoto = async (file) => {
    if (!file) return null;
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API_BASE}/api/upload/photo`, { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) { console.error(e); }
    finally { setPhotoUploading(false); }
    return null;
  };

  const scanBarcode = async (rollNo) => {
    if (!rollNo.trim()) return;
    setAttendanceLoading(true);
    setAttendanceResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: rollNo.trim() })
      });
      const data = await res.json();
      setAttendanceResult(data);
      fetchAttendance();
    } catch (e) {
      setAttendanceResult({ success: false, error: 'Network error' });
    } finally {
      setAttendanceLoading(false);
      setAttendanceScan('');
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  };

  const downloadIdCard = (id) => {
    window.open(`${API_BASE}/api/id-card/${id}`, '_blank');
  };

  const fetchRegistrations = () => {
    fetch(`${API_BASE}/api/registrations`)
      .then(res => res.json())
      .then(data => setRegistrations(data.reverse()))
      .catch(err => console.log(err));
  };

  const fetchConversations = () => {
    fetch(`${API_BASE}/api/conversations`)
      .then(res => res.json())
      .then(data => setConversations(data.sort((a,b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))))
      .catch(err => console.log(err));
  };

  const fetchCourses = () => {
    fetch(`${API_BASE}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.log(err));
  };

  const fetchSettings = () => {
    fetch(`${API_BASE}/api/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.customSlipCSS) setCustomSlipCSS(data.customSlipCSS);
        if (data.customSlipHTML) setCustomSlipHTML(data.customSlipHTML);
      })
      .catch(err => console.log(err));
  };

  const fetchFeeSlips = () => {
    fetch(`${API_BASE}/api/fee-slips`)
      .then(res => res.json())
      .then(data => setFeeSlips(data))
      .catch(err => console.log(err));
  };

  const fetchStudents = () => {
    fetch(`${API_BASE}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.log(err));
  };

  const fetchFeePayments = () => {
    fetch(`${API_BASE}/api/fee-payments`)
      .then(res => res.json())
      .then(data => setFeePayments(data))
      .catch(err => console.log(err));
  };

  const fetchFeeAnalytics = () => {
    fetch(`${API_BASE}/api/fee-payments/analytics`)
      .then(res => res.json())
      .then(data => setFeeAnalytics(data))
      .catch(err => console.log(err));
  };

  const fetchAgentInfo = () => {
    fetch(`${API_BASE}/api/whatsapp/agent-info`)
      .then(res => res.json())
      .then(data => setAgentInfo(data))
      .catch(err => console.log(err));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  // ── CSV Export helpers ──
  const exportCSV = (endpoint) => window.open(`${API_BASE}/api/export/${endpoint}`, '_blank');

  // ── Teacher CRUD ──
  const fetchTeachers = () => fetch(`${API_BASE}/api/teachers`).then(r=>r.json()).then(setTeachers).catch(()=>{});
  const fetchTeacherAttendance = () => fetch(`${API_BASE}/api/teacher-attendance`).then(r=>r.json()).then(d=>setTeacherAttendance(d.sort((a,b)=>new Date(b.date)-new Date(a.date)))).catch(()=>{});

  const openAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({ name:'',fatherName:'',cnic:'',phone:'',email:'',address:'',qualification:'',subject:'',courses:'',schedule:'',salary:'',joinDate:new Date().toISOString().split('T')[0],status:'active',notes:'' });
    setShowTeacherModal(true);
  };
  const openEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherForm({ name:t.name||'',fatherName:t.fatherName||'',cnic:t.cnic||'',phone:t.phone||'',email:t.email||'',address:t.address||'',qualification:t.qualification||'',subject:t.subject||'',courses:Array.isArray(t.courses)?t.courses.join(', '):t.courses||'',schedule:t.schedule||'',salary:t.salary||'',joinDate:t.joinDate||'',status:t.status||'active',notes:t.notes||'' });
    setShowTeacherModal(true);
  };
  const saveTeacher = async () => {
    if (!teacherForm.name.trim() || !teacherForm.phone.trim()) { showToast('Name and phone are required.','error'); return; }
    try {
      const payload = { ...teacherForm, courses: teacherForm.courses ? teacherForm.courses.split(',').map(c=>c.trim()).filter(Boolean) : [] };
      const method = editingTeacher ? 'PUT' : 'POST';
      const url = editingTeacher ? `${API_BASE}/api/teachers/${editingTeacher.id}` : `${API_BASE}/api/teachers`;
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (res.ok) { fetchTeachers(); setShowTeacherModal(false); showToast(editingTeacher?'✅ Teacher updated!':'✅ Teacher added!'); }
      else showToast('Failed to save teacher.','error');
    } catch { showToast('Error saving teacher.','error'); }
  };
  const deleteTeacherData = async (id) => {
    if (!confirm('Delete this teacher?')) return;
    try { await fetch(`${API_BASE}/api/teachers/${id}`,{method:'DELETE'}); fetchTeachers(); showToast('🗑️ Teacher deleted.'); }
    catch { showToast('Error deleting teacher.','error'); }
  };
  const markTeacherAttendance = async (teacherId, date, status, notes='') => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher-attendance`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teacherId,date,status,notes})});
      if (res.ok) { fetchTeacherAttendance(); showToast(`✅ Marked ${status}`); }
      else showToast('Failed to mark attendance.','error');
    } catch { showToast('Error marking attendance.','error'); }
  };
  const deleteTeacherAttendanceRecord = async (id) => {
    try { await fetch(`${API_BASE}/api/teacher-attendance/${id}`,{method:'DELETE'}); fetchTeacherAttendance(); showToast('🗑️ Record deleted.'); }
    catch { showToast('Error.','error'); }
  };

  // Actions
  const restartWhatsApp = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/restart`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert("Error restarting client.");
    } finally {
      setIsRestarting(false);
    }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchLeads();
      fetchAnalytics();
    } catch (e) {
      console.log(e);
    }
  };

  const sendDirectMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChatPhone) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${activeChatPhone}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText })
      });
      if (res.ok) {
        setReplyText('');
        // Refresh local chat view
        fetchConversations();
      } else {
        alert("WhatsApp client not connected or failed to send.");
      }
    } catch (e) {
      alert("Failed to send message.");
    }
  };

  const saveCourseData = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCourse)
      });
      fetchCourses();
      setEditCourse(null);
      setIsNewCourse(false);
    } catch (e) {
      alert("Error saving course.");
    }
  };

  const deleteCourseData = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await fetch(`${API_BASE}/api/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch (e) {
      alert("Error deleting course.");
    }
  };

  const deleteRegistrationData = async (studentId) => {
    if (!confirm(`Are you sure you want to delete registration ${studentId}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/registrations/${studentId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRegistrations();
        fetchConversations();
        fetchFeeSlips();
        fetchAnalytics();
        if (selectedStudent && selectedStudent.studentId === studentId) {
          setSelectedStudent(null);
        }
      } else {
        alert("Error deleting registration.");
      }
    } catch (e) {
      alert("Error deleting registration.");
    }
  };

  const deleteLeadData = async (id) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
        fetchAnalytics();
      } else {
        alert("Error deleting lead.");
      }
    } catch (e) {
      alert("Error deleting lead.");
    }
  };

  const deleteConversation = async (e, phone) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${phone}`, { method: 'DELETE' });
      if (res.ok) {
        fetchConversations();
        fetchAnalytics();
        if (activeChatPhone === phone) {
          setActiveChatPhone(null);
        }
      } else {
        alert("Error deleting chat.");
      }
    } catch (err) {
      alert("Error deleting chat.");
    }
  };

  const saveSettingsData = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const updated = {
        ...settings,
        customSlipCSS,
        customSlipHTML
      };
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        alert("Settings saved successfully.");
      } else {
        alert("Error saving settings.");
      }
    } catch (e) {
      alert("Error saving settings.");
    }
  };

  const saveSlipStyle = async () => {
    try {
      const updated = {
        ...settings,
        customSlipCSS,
        customSlipHTML
      };
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        alert("Slip style template saved successfully.");
      } else {
        alert("Error saving slip style template.");
      }
    } catch (e) {
      alert("Error saving slip style template.");
    }
  };

  const addAgentRule = () => {
    if (!newRuleKeyword.trim() || !newRuleResponse.trim()) {
      alert("Please enter both keyword/intent and its response.");
      return;
    }
    const newRule = {
      id: 'rule-' + Date.now(),
      keyword: newRuleKeyword.trim(),
      response: newRuleResponse.trim()
    };
    setSettings(prev => ({
      ...prev,
      agentRules: [...(prev.agentRules || []), newRule]
    }));
    setNewRuleKeyword('');
    setNewRuleResponse('');
  };

  const removeAgentRule = (id) => {
    setSettings(prev => ({
      ...prev,
      agentRules: (prev.agentRules || []).filter(r => r.id !== id)
    }));
  };

  const clearAllData = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete all student registrations, leads, conversations, and fee slips! This action cannot be undone. Are you sure you want to proceed?")) return;
    if (!confirm("Confirm one more time: Are you absolutely sure you want to wipe the entire database?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/clear-all`, { method: 'POST' });
      if (res.ok) {
        alert("All student registrations, leads, chats, and fee slips have been cleared successfully!");
        fetchData();
      } else {
        alert("Failed to clear database data.");
      }
    } catch (err) {
      alert("Error occurred while clearing database data.");
    }
  };

  // ── Student CRUD Actions ──
  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      name: '',
      fatherName: '',
      cnic: '',
      dob: '',
      gender: '',
      nationality: 'Pakistani',
      religion: 'Islam',
      phone: '',
      whatsapp: '',
      email: '',
      parentPhone: '',
      address: '',
      city: '',
      postalCode: '',
      qualification: '',
      school: '',
      passingYear: '',
      marks: '',
      course: '',
      batch: '',
      preferredDays: '',
      reference: '',
      emergencyName: '',
      relationship: '',
      emergencyPhone: '',
      alternatePhone: '',
      emergencyAddress: '',
      monthlyFee: '',
      status: 'active'
    });
    setShowStudentModal(true);
  };

  const openEditStudent = (s) => {
    setEditingStudent(s);
    setStudentForm({
      name: s.name || '',
      fatherName: s.fatherName || '',
      cnic: s.cnic || '',
      dob: s.dob || '',
      gender: s.gender || '',
      nationality: s.nationality || 'Pakistani',
      religion: s.religion || 'Islam',
      phone: s.phone || '',
      whatsapp: s.whatsapp || '',
      email: s.email || '',
      parentPhone: s.parentPhone || '',
      address: s.address || '',
      city: s.city || '',
      postalCode: s.postalCode || '',
      qualification: s.qualification || '',
      school: s.school || '',
      passingYear: s.passingYear || '',
      marks: s.marks || '',
      course: s.course || '',
      batch: s.batch || '',
      preferredDays: s.preferredDays || '',
      reference: s.reference || '',
      emergencyName: s.emergencyName || '',
      relationship: s.relationship || '',
      emergencyPhone: s.emergencyPhone || '',
      alternatePhone: s.alternatePhone || '',
      emergencyAddress: s.emergencyAddress || '',
      monthlyFee: s.monthlyFee || '',
      discount: s.discount || '',
      status: s.status || 'active'
    });
    setShowStudentModal(true);
  };

  const saveStudent = async () => {
    if (!studentForm.name.trim() || !studentForm.phone.trim()) { showToast('Name and phone are required.', 'error'); return; }
    try {
      const method = editingStudent ? 'PUT' : 'POST';
      const url = editingStudent ? `${API_BASE}/api/students/${editingStudent.id}` : `${API_BASE}/api/students`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentForm) });
      if (res.ok) {
        fetchStudents();
        setShowStudentModal(false);
        showToast(editingStudent ? '✅ Student updated!' : '✅ Student added!');
      } else { showToast('Failed to save student.', 'error'); }
    } catch { showToast('Error saving student.', 'error'); }
  };

  const deleteStudentData = async (id) => {
    if (!confirm('Delete this student? Their fee records will remain.')) return;
    try {
      await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE' });
      fetchStudents();
      showToast('🗑️ Student deleted.');
    } catch { showToast('Error deleting student.', 'error'); }
  };

  // ── Fee Payment Actions ──
  const openAddFee = (studentId = '') => {
    setEditingFee(null);
    const now = new Date();
    const monthStr = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    setFeeForm({ studentId, month: monthStr, amount: '', status: 'unpaid', notes: '' });
    setShowFeeModal(true);
  };

  const openEditFee = (fee) => {
    setEditingFee(fee);
    setFeeForm({ studentId: fee.studentId, month: fee.month, amount: fee.amount, status: fee.status, notes: fee.notes || '' });
    setShowFeeModal(true);
  };

  const saveFeePayment = async () => {
    if (!feeForm.studentId || !feeForm.month || !feeForm.amount) { showToast('Student, month, and amount are required.', 'error'); return; }
    try {
      const method = editingFee ? 'PUT' : 'POST';
      const url = editingFee ? `${API_BASE}/api/fee-payments/${editingFee.id}` : `${API_BASE}/api/fee-payments`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feeForm) });
      if (res.ok) {
        fetchFeePayments(); fetchFeeAnalytics();
        setShowFeeModal(false);
        showToast(editingFee ? '✅ Fee record updated!' : '✅ Fee record added!');
      } else { showToast('Failed to save fee record.', 'error'); }
    } catch { showToast('Error saving fee record.', 'error'); }
  };

  const quickUpdateFeeStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/fee-payments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { fetchFeePayments(); fetchFeeAnalytics(); showToast(`✅ Marked as ${status}`); }
      else showToast('Failed to update status.', 'error');
    } catch { showToast('Error updating fee.', 'error'); }
  };

  const deleteFeePaymentData = async (id) => {
    if (!confirm('Delete this fee record?')) return;
    try {
      await fetch(`${API_BASE}/api/fee-payments/${id}`, { method: 'DELETE' });
      fetchFeePayments(); fetchFeeAnalytics();
      showToast('🗑️ Fee record deleted.');
    } catch { showToast('Error deleting fee record.', 'error'); }
  };

  // ── WhatsApp Actions ──
  const sendFeeReminder = async (student, fee) => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: student.name, phone: student.phone, parentPhone: student.parentPhone, amount: fee ? fee.amount : student.monthlyFee, month: fee ? fee.month : new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) })
      });
      const data = await res.json();
      if (data.success) showToast('📲 Reminder sent via WhatsApp!');
      else showToast(`❌ ${data.error || 'Send failed'}`, 'error');
    } catch { showToast('❌ WhatsApp not connected.', 'error'); }
  };

  const sendFeeSlipWA = async (student, fee) => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/send-fee-slip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          studentId: student.rollNo || student.id,
          fatherName: student.fatherName || '',
          course: student.course,
          phone: student.phone,
          parentPhone: student.parentPhone,
          amount: fee.amount,
          monthlyFee: student.monthlyFee,
          originalMonthlyFee: student.originalMonthlyFee || student.monthlyFee,
          discount: student.discount || 0,
          balance: Math.max(0, (student.monthlyFee || 0) - (fee.amount || 0)),
          paymentMethod: fee.paymentMethod || 'Cash',
          month: fee.month,
          paidDate: fee.paidDate,
          notes: fee.notes || ''
        })
      });
      const data = await res.json();
      if (data.success) showToast('📄 Fee slip image sent via WhatsApp!');
      else showToast(`❌ ${data.error || 'Send failed'}`, 'error');
    } catch { showToast('❌ WhatsApp not connected.', 'error'); }
  };

  const sendIdCardWA = async (student) => {
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/send-id-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });
      const data = await res.json();
      if (data.success) showToast('🪪 ID Card sent via WhatsApp!');
      else showToast(`❌ ${data.error || 'Send failed'}`, 'error');
    } catch { showToast('❌ WhatsApp not connected.', 'error'); }
  };

  const disconnectWhatsApp = async () => {
    if (!confirm("Are you sure you want to disconnect and log out of WhatsApp? This will clear the session cache.")) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/disconnect`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || "Disconnected successfully.");
    } catch (e) {
      alert("Error disconnecting WhatsApp.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCourseChange = (courseName, oneShotActive = feeSlipForm.isOneShot) => {
    const sel = courses.find(c => c.name === courseName);
    let updatedFee = feeSlipForm.totalFee;
    let updatedPeriod = feeSlipForm.feePeriod;
    let updatedPaid = feeSlipForm.amountPaid;

    if (sel) {
      if (oneShotActive) {
        const fullFeeStr = sel.fee || '0';
        const fullFee = parseFloat(fullFeeStr.replace(/[^0-9]/g, '')) || 0;
        const discounted = Math.round(fullFee * 0.75); // 25% discount
        updatedFee = discounted.toString();
        updatedPaid = discounted.toString();
        updatedPeriod = "Full Course Fee (One-Shot)";
      } else {
        const instStr = sel.installment || '0';
        updatedFee = instStr.replace(/[^0-9]/g, '');
        updatedPaid = '';
        updatedPeriod = '';
      }
    } else if (courseName === 'custom') {
      updatedFee = '';
      updatedPaid = '';
      updatedPeriod = '';
    }

    setFeeSlipForm(p => ({
      ...p,
      course: courseName,
      totalFee: updatedFee,
      amountPaid: updatedPaid,
      feePeriod: updatedPeriod,
      isOneShot: oneShotActive
    }));
  };

  const handleOneShotToggle = (checked) => {
    const sel = courses.find(c => c.name === feeSlipForm.course);
    let updatedFee = feeSlipForm.totalFee;
    let updatedPaid = feeSlipForm.amountPaid;
    let updatedPeriod = feeSlipForm.feePeriod;

    if (checked) {
      if (sel) {
        const fullFeeStr = sel.fee || '0';
        const fullFee = parseFloat(fullFeeStr.replace(/[^0-9]/g, '')) || 0;
        const discounted = Math.round(fullFee * 0.75); // 25% discount
        updatedFee = discounted.toString();
        updatedPaid = discounted.toString();
        updatedPeriod = "Full Course Fee (One-Shot)";
      } else {
        const currentFee = parseFloat(feeSlipForm.totalFee) || 0;
        const discounted = Math.round(currentFee * 0.75);
        updatedFee = discounted.toString();
        updatedPaid = discounted.toString();
        updatedPeriod = "Full Course Fee (One-Shot)";
      }
    } else {
      if (sel) {
        const instStr = sel.installment || '0';
        updatedFee = instStr.replace(/[^0-9]/g, '');
        updatedPaid = '';
        updatedPeriod = '';
      } else {
        updatedPaid = '';
        updatedPeriod = '';
      }
    }

    setFeeSlipForm(p => ({
      ...p,
      isOneShot: checked,
      totalFee: updatedFee,
      amountPaid: updatedPaid,
      feePeriod: updatedPeriod
    }));
  };

  // ── Fee Slip Actions ─────────────────────────────────────────────────
  const saveFeeSlip = async () => {
    const { studentName, course, totalFee, amountPaid, feePeriod } = feeSlipForm;
    if (!studentName || !course || !totalFee || !amountPaid || !feePeriod) {
      alert('Please fill all required fields: Student Name, Course, Fee Period, Total Fee, Amount Paid.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/fee-slips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeSlipForm)
      });
      const saved = await res.json();
      setFeeSlips(prev => [saved, ...prev]);
      return saved;
    } catch (e) {
      alert('Error saving fee slip.');
      return null;
    }
  };

  const deleteFeeSlipRecord = async (id) => {
    if (!confirm('Delete this fee slip record?')) return;
    try {
      await fetch(`${API_BASE}/api/fee-slips/${id}`, { method: 'DELETE' });
      setFeeSlips(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert('Error deleting fee slip.');
    }
  };

  const buildSlipDoc = (slipData, slipNum, logoSrc) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const total    = parseFloat((slipData.totalFee || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    const discount = parseFloat((slipData.discount  || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    const paid2    = parseFloat((slipData.amountPaid || '0').toString().replace(/[^0-9.]/g, '')) || 0;
    const effectiveFee = total - discount; // fee after discount
    const bal2     = effectiveFee - paid2;
    const vars = {
      logoSrc: logoSrc || '',
      slipNumber: slipNum || 'SLIP-PREVIEW',
      date: dateStr, time: timeStr,
      studentName: slipData.studentName || '—',
      studentId:   slipData.studentId   || '—',
      fatherName:  slipData.fatherName  || '—',
      course:      slipData.course      || '—',
      feePeriod:   slipData.feePeriod   || '—',
      monthlyFee:  slipData.totalFee    || '0',
      amountPaid:  slipData.amountPaid  || '0',
      balanceClass: bal2 <= 0 ? 'slip-balance-paid' : 'slip-balance-due',
      balance:      bal2 <= 0 ? 'CLEARED' : bal2.toLocaleString(),
      paymentMethod: slipData.paymentMethod || 'Cash',
      discountRow: slipData.discount > 0
        ? `<tr><td>Discount Applied</td><td style="color:#16a34a;font-weight:700;">- Rs ${Number(slipData.discount).toLocaleString()}</td></tr>`
        : '',
      stampContent: settings.adminStampImage
        ? `<img src="${settings.adminStampImage}" alt="Official Stamp" style="width:130px;height:130px;object-fit:contain;display:block;position:relative;margin:-25px;" />`
        : 'OFFICIAL<br>STAMP',
      adminSignContent: settings.adminSignImage
        ? `<img src="${settings.adminSignImage}" alt="Admin Signature" style="max-width:180px;max-height:80px;object-fit:contain;display:block;margin:0 auto 4px;" />`
        : '',
      remarks: slipData.remarks
        ? `<div class="slip-section-title" style="margin-top:10px;">Remarks</div><div class="slip-remarks">${slipData.remarks}</div>`
        : '',
    };
    let body = customSlipHTML;
    if (slipData.isOneShot) {
      body = body.split('Monthly Fee').join('Full Course Fee (25% Discount)');
      body = body.split('monthlyFee').join('Full Course Fee (25% Discount)');
    }
    Object.entries(vars).forEach(([k, v]) => { body = body.split(`{{${k}}}`).join(v); });
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fee Slip</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f1f5f9; display: flex; justify-content: center; min-height: 100vh; padding: 24px; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
    ${customSlipCSS}
    @media print { body { background:#fff; padding:0; } .no-print { display:none !important; } }
  </style>
</head>
<body>
  <div style="width:100%">
    <div class="no-print" style="text-align:center;margin-bottom:20px;">
      <button onclick="window.print()" style="background:#0ea5e9;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;margin-right:12px;">🖨️ Print Slip</button>
      <button onclick="window.close()" style="background:#64748b;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:1rem;cursor:pointer;">✕ Close</button>
    </div>
    ${body}
  </div>
</body>
</html>`;
  };

  const printFeeSlip = (slipData) => {
    const slipNum = slipData.slipNumber || ('SLIP-' + Date.now().toString().slice(-6));
    const html = buildSlipDoc(slipData, slipNum, `${window.location.origin}/tss-logo.png`);
    const win = window.open('', '_blank', 'width=820,height=920');
    win.document.write(html);
    win.document.close();
  };

  // Get active chat detail object
  const activeChat = conversations.find(c => c.phone === activeChatPhone);

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:'#08090c', fontFamily:"'Segoe UI',Roboto,sans-serif" }}>
        <style>{`
          @keyframes float-up { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
          .login-card { animation: float-up 0.5s ease forwards; }
          .login-shake { animation: shake 0.4s ease !important; }
        `}</style>
        <div className="login-card" style={{ width:420, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:48, backdropFilter:'blur(20px)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:72, height:72, borderRadius:18, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(14,165,233,0.4)' }}>
              <Shield size={36} color="#fff" />
            </div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:1 }}>TSS Admin Portal</h1>
            <p style={{ color:'#64748b', fontSize:'0.85rem', margin:0 }}>The Student Space — Secure Access</p>
          </div>

          {/* Form */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ position:'relative' }}>
              <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
              <input
                id="admin-password-input"
                type="password"
                placeholder="Enter Admin Password"
                value={loginPass}
                onChange={e => { setLoginPass(e.target.value); setLoginError(false); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (loginPass === ADMIN_PASSWORD) { setIsAuthenticated(true); setLoginPass(''); }
                    else { setLoginError(true); setLoginPass(''); }
                  }
                }}
                style={{
                  width:'100%', padding:'13px 14px 13px 42px', borderRadius:10,
                  background: loginError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                  border: loginError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  color:'#fff', fontSize:'1rem', outline:'none', boxSizing:'border-box',
                  transition:'all 0.2s'
                }}
              />
            </div>

            {loginError && (
              <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'#f87171', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:8 }}>
                <XCircle size={14} /> Incorrect password. Please try again.
              </div>
            )}

            <button
              id="admin-login-btn"
              onClick={() => {
                if (loginPass === ADMIN_PASSWORD) { setIsAuthenticated(true); setLoginPass(''); }
                else { setLoginError(true); setLoginPass(''); }
              }}
              style={{ padding:'13px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', fontSize:'1rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 16px rgba(14,165,233,0.4)', transition:'opacity 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >
              <Shield size={18} /> Access Admin Panel
            </button>
          </div>

          <p style={{ textAlign:'center', marginTop:24, color:'#334155', fontSize:'0.78rem' }}>
            🔒 Authorized personnel only — TSS Management
          </p>
        </div>
      </div>
    );
 }

  if (appLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#08090c',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: '#fff',
        gap: '24px'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '120px',
          height: '120px'
        }}>
          {/* Glowing outer ring animation */}
          <div style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--color-primary, #0ea5e9)',
            borderBottomColor: 'var(--color-primary, #0ea5e9)',
            animation: 'spin-loader 1.5s linear infinite'
          }}></div>
          {/* Logo center */}
          <div style={{
            background: '#ffffff',
            width: '70px',
            height: '70px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(14, 165, 233, 0.4)',
            zIndex: 2,
            overflow: 'hidden'
          }}>
            <img src="/tss-logo.png" alt="TSS Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '2px', color: '#fff', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
            THE STUDENT SPACE
          </h1>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', letterSpacing: '1px' }}>
            Initializing Admission Portal...
          </span>
        </div>
        <style>{`
          @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#08090c' }}>
      
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '260px', margin: '16px', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: '16px', height: 'calc(100vh - 32px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', paddingLeft: '8px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--color-primary), #0284c7)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#040814', fontSize: '1.25rem' }}>T</div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.5px' }}>TSS Panel</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI ADMISSION OFFICER</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {[
            { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
            { id: 'students', name: 'Students', icon: UserCheck },
            { id: 'teachers', name: 'Teachers', icon: GraduationCap },
            { id: 'fees', name: 'Fee Management', icon: Wallet },
            { id: 'agents', name: 'WhatsApp Agents', icon: Bot },
            { id: 'whatsapp', name: 'WhatsApp Connection', icon: QrCode },
            { id: 'admissions', name: 'Admissions', icon: Users },
            { id: 'chat', name: 'Live Chat', icon: MessageSquare },
            { id: 'courses', name: 'Courses', icon: BookOpen },
            { id: 'fee-slip', name: 'Fee Slip Generator', icon: Receipt },
            { id: 'attendance', name: 'Attendance', icon: ScanLine },
            { id: 'settings', name: 'Settings', icon: SettingsIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '10px',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  background: active ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 500,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '0.95rem' }}>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Status Footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-muted)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: wsStatus.status === 'Connected' ? 'var(--color-success)' : wsStatus.status === 'QR_Ready' ? 'var(--color-accent)' : 'var(--color-error)' }} className={wsStatus.status === 'Connected' ? 'pulse-glow' : ''}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bot: {wsStatus.status}</span>
          </div>
          <button onClick={restartWhatsApp} disabled={isRestarting} style={{ padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} className="btn-secondary">
            <RefreshCw size={12} className={isRestarting ? 'spin-anim' : ''} /> {isRestarting ? "Restarting..." : "Restart Session"}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main style={{ flex: 1, padding: '24px 32px 32px 16px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Header bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{activeTab === 'chat' ? 'Live Chat Support' : activeTab === 'fee-slip' ? 'Fee Slip Generator' : activeTab}</h1>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {activeTab === 'dashboard' && 'Real-time overview of registrations, leads, and bot metrics.'}
              {activeTab === 'students' && 'Manage student roster, phone numbers, and fee assignments.'}
              {activeTab === 'teachers' && 'Manage teaching staff, subjects, schedules, and salaries.'}
              {activeTab === 'fees' && 'Track monthly payments, mark as paid, and send reminders.'}
              {activeTab === 'agents' && 'Monitor connected WhatsApp agents and session status.'}
              {activeTab === 'whatsapp' && 'Link the assistant to your official WhatsApp number.'}
              {activeTab === 'admissions' && 'View completed registrations, verify data, and download forms.'}
              {activeTab === 'chat' && 'Jump in to reply to messages manually when needed.'}
              {activeTab === 'courses' && 'Manage courses, pricing tiers, schedules, and duration.'}
              {activeTab === 'fee-slip' && 'Generate, customize and print fee receipts for students.'}
              {activeTab === 'settings' && 'Configure bot automatic responses and emergency contacts.'}
              {activeTab === 'attendance' && 'Scan student ID card barcodes to mark attendance and track fee status.'}
            </span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setIsAuthenticated(false); }} className="btn-secondary" style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:6, color:'#ef4444', borderColor:'rgba(239,68,68,0.3)' }}><LogOut size={14} /> Logout</button>
            <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /> Refresh</button>
          </div>
        </header>

        {/* Tab Switcher Body */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* 1. Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards */}
              <div className="dashboard-grid">
                {[
                  { title: 'Total Conversations', value: analytics.totalConversations, icon: MessageSquare, color: 'var(--color-primary)' },
                  { title: 'Total Admissions', value: analytics.totalAdmissions, icon: Users, color: 'var(--color-success)' },
                  { title: 'Pending Admissions', value: analytics.pendingAdmissions, icon: Clock, color: 'var(--color-accent)' },
                  { title: 'Active Users (7 Days)', value: analytics.activeUsers, icon: Users, color: '#a855f7' }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ backgroundColor: `rgba(255,255,255,0.03)`, border: `1px solid var(--border-muted)`, color: stat.color, padding: '16px', borderRadius: '12px' }}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.title}</span>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{stat.value}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fee Management Stat Cards - Row 2 */}
              <div className="dashboard-grid" style={{ marginTop: '16px' }}>
                {[
                  { title: 'Active Students', value: students.filter(s => s.status === 'active').length, icon: UserCheck, color: '#06b6d4' },
                  { title: 'Collected (This Month)', value: `Rs ${feeAnalytics.thisMonthCollected.toLocaleString()}`, icon: TrendingUp, color: 'var(--color-success)' },
                  { title: 'Total Pending', value: `Rs ${feeAnalytics.totalPending.toLocaleString()}`, icon: AlertCircle, color: '#f59e0b' },
                  { title: 'Agent Status', value: agentInfo.status === 'Connected' ? 'Online' : 'Offline', icon: Bot, color: agentInfo.status === 'Connected' ? 'var(--color-success)' : '#ef4444' }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={`fee-${i}`} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-muted)', color: stat.color, padding: '16px', borderRadius: '12px' }}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.title}</span>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{stat.value}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts & Lead stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flex: 1, minHeight: '350px' }}>
                
                {/* SVG Analytical Chart */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Daily Lead Registrations</h3>
                  <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
                    {/* SVG Line chart representing mock lead growth */}
                    <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                      
                      {/* Chart Path */}
                      <path
                        d="M 10 170 Q 90 140 170 120 T 330 90 T 490 30"
                        fill="none"
                        stroke="url(#chartGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Area Fill */}
                      <path
                        d="M 10 170 Q 90 140 170 120 T 330 90 T 490 30 L 490 190 L 10 190 Z"
                        fill="url(#areaGradient)"
                        opacity="0.2"
                      />
                      
                      {/* Definitions */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="100%" stopColor="var(--color-accent)" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '12px', borderTop: '1px solid var(--border-muted)', paddingTop: '12px' }}>
                    <span>Total Leads: {analytics.dailyLeads} (Today)</span>
                    <span>Monthly Growth: {analytics.monthlyLeads} (Leads)</span>
                  </div>
                </div>

                {/* Most Asked Queries & Recent leads */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Most asked intents */}
                  <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Top Inquired Intents</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analytics.mostAskedQuestions.length > 0 ? (
                        analytics.mostAskedQuestions.map((intent, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{intent}</span>
                            <span className="badge badge-connected" style={{ fontSize: '0.7rem' }}>Rank #{idx + 1}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data collected yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Leads Summary */}
                  <div className="glass-panel" style={{ padding: '20px', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Recent Leads</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {leads.slice(0, 5).map((lead, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{lead.name}</span>
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({lead.course})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: lead.status === 'Converted' ? 'var(--color-success)' : 'var(--color-accent)', fontWeight: 500 }}>{lead.status}</span>
                            <button onClick={() => deleteLeadData(lead.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} title="Delete Lead">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="Search students by name, phone or course..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button onClick={() => exportCSV('students')} className="btn-secondary" style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem' }}>
                      <FileDown size={14} /> Export CSV
                    </button>
                    <button onClick={openAddStudent} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                      <Plus size={16} /> Add Student Manual
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                        {['Photo', 'Roll No', 'ID', 'Name', 'Phone', 'Parent Phone', 'Course/Class', 'Monthly Fee', 'Status', 'Actions'].map((h, i) => (
                          <th key={i} style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                            <Users size={44} style={{ opacity: 0.25, marginBottom: '12px' }} />
                            <p style={{ fontWeight: 600 }}>No students registered yet.</p>
                          </td>
                        </tr>
                      ) : (
                        students
                          .filter(s => {
                            const name = s.name || '';
                            const phone = s.phone || '';
                            const parentPhone = s.parentPhone || '';
                            const course = s.course || '';
                            const search = studentSearch.toLowerCase();
                            return name.toLowerCase().includes(search) ||
                                   phone.includes(search) ||
                                   parentPhone.includes(search) ||
                                   course.toLowerCase().includes(search);
                          })
                          .map(student => (
                            <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <td style={{ padding: '12px' }}>
                                {student.photo ? <img src={`${API_BASE}${student.photo}`} alt="photo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-muted)' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Pic</div>}
                               </td>
                              <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>{student.rollNo || '—'}</td>
                              <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{student.id}</td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{student.name}</td>
                              <td style={{ padding: '12px' }}>
                                <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                                  <Phone size={12} style={{ color: 'var(--color-success)' }} /> {student.phone}
                                </a>
                              </td>
                              <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                                {student.parentPhone ? (
                                  <a href={`https://wa.me/${student.parentPhone}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                                    <Phone size={12} /> {student.parentPhone}
                                  </a>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '12px', fontWeight: 500 }}>{student.course}</td>
                              <td style={{ padding: '12px', fontWeight: 700 }}>Rs {Number(student.monthlyFee).toLocaleString()}</td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge badge-${student.status === 'active' ? 'connected' : 'disconnected'}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => openEditStudent(student)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} title="Edit Student">
                                    <Edit size={12} /> Edit
                                  </button>
                                  <button onClick={() => openAddFee(student.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--color-primary)', border: '1px solid rgba(56, 189, 248, 0.2)' }} title="Add Fee">
                                    <Plus size={12} /> Add Fee
                                  </button>
                                  <button onClick={() => { setFeeStudentFilter(student.id); setActiveTab('fees'); }} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} title="View Payment History">
                                    <Eye size={12} /> Payments
                                  </button>
                                  <button onClick={() => sendFeeReminder(student, null)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--color-accent)', border: '1px solid rgba(245, 158, 11, 0.2)' }} title="Send Fee Reminder">
                                    <Send size={12} /> Remind
                                  </button>
                                  <button onClick={() => downloadIdCard(student.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }} title="Download ID Card">
                                    <CreditCard size={12} /> ID Card
                                  </button>
                                  <button onClick={() => sendIdCardWA(student)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }} title="Send ID Card via WhatsApp">
                                    <Send size={12} /> Send ID Card
                                  </button>
                                  <button onClick={() => deleteStudentData(student.id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} title="Delete Student">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Add/Edit Modal */}
              {showStudentModal && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                  <div className="glass-panel" style={{ width: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '0px', overflow: 'hidden' }}>
                    
                    {/* Header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {editingStudent ? 'Edit Student Details' : 'Add New Student Manual'}
                      </h3>
                      <button type="button" onClick={() => setShowStudentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: '1' }}>&times;</button>
                    </div>

                    {/* Scrollable Body */}
                    <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Photo Upload Section */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-muted)' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-primary)', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {studentForm.photo
                            ? <img src={`${API_BASE}${studentForm.photo}`} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Image size={24} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Student Photo</label>
                          <input type="file" accept="image/*" id="student-photo-upload" style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const url = await uploadPhoto(file);
                                if (url) setStudentForm(f => ({ ...f, photo: url }));
                              }
                            }}
                          />
                          <label htmlFor="student-photo-upload" className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {photoUploading ? '⏳ Uploading...' : <><Image size={12} /> Upload Photo</>}
                          </label>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>JPG/PNG, max 5MB. Photo appears on ID Card.</p>
                        </div>
                      </div>

                      {/* Section 1: Personal & Contact Information */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px', marginBottom: '14px', fontWeight: 600 }}>1. Personal & Contact Info</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name *</label>
                            <input type="text" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} className="glass-input" placeholder="e.g. Ali Hassan" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Father's Name</label>
                            <input type="text" value={studentForm.fatherName} onChange={e => setStudentForm({ ...studentForm, fatherName: e.target.value })} className="glass-input" placeholder="e.g. Khan Muhammad" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CNIC / B-Form Number</label>
                            <input type="text" value={studentForm.cnic} onChange={e => setStudentForm({ ...studentForm, cnic: e.target.value })} className="glass-input" placeholder="e.g. 12345-6789012-3" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date of Birth</label>
                            <input type="text" value={studentForm.dob} onChange={e => setStudentForm({ ...studentForm, dob: e.target.value })} className="glass-input" placeholder="DD-MM-YYYY" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Gender</label>
                            <select value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                              <option value="">-- Select Gender --</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nationality</label>
                            <input type="text" value={studentForm.nationality} onChange={e => setStudentForm({ ...studentForm, nationality: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Religion</label>
                            <input type="text" value={studentForm.religion} onChange={e => setStudentForm({ ...studentForm, religion: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number *</label>
                            <input type="text" required value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} className="glass-input" placeholder="e.g. 923001234567" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>WhatsApp Number</label>
                            <input type="text" value={studentForm.whatsapp} onChange={e => setStudentForm({ ...studentForm, whatsapp: e.target.value })} className="glass-input" placeholder="e.g. 923001234567" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Alternate Phone Number</label>
                            <input type="text" value={studentForm.alternatePhone} onChange={e => setStudentForm({ ...studentForm, alternatePhone: e.target.value })} className="glass-input" placeholder="e.g. 923007654321" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Parent WhatsApp / Phone</label>
                            <input type="text" value={studentForm.parentPhone} onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })} className="glass-input" placeholder="e.g. 923009876543" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                            <input type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} className="glass-input" placeholder="e.g. student@gmail.com" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Address & Emergency Contacts */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px', marginBottom: '14px', fontWeight: 600 }}>2. Address & Emergency Contacts</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Permanent Address</label>
                            <input type="text" value={studentForm.address} onChange={e => setStudentForm({ ...studentForm, address: e.target.value })} className="glass-input" placeholder="House/Street Info" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>City</label>
                            <input type="text" value={studentForm.city} onChange={e => setStudentForm({ ...studentForm, city: e.target.value })} className="glass-input" placeholder="e.g. Karachi" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Postal Code</label>
                            <input type="text" value={studentForm.postalCode} onChange={e => setStudentForm({ ...studentForm, postalCode: e.target.value })} className="glass-input" placeholder="e.g. 75500" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Contact Name</label>
                            <input type="text" value={studentForm.emergencyName} onChange={e => setStudentForm({ ...studentForm, emergencyName: e.target.value })} className="glass-input" placeholder="e.g. Muhammad Khan" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Relationship</label>
                            <input type="text" value={studentForm.relationship} onChange={e => setStudentForm({ ...studentForm, relationship: e.target.value })} className="glass-input" placeholder="e.g. Father" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Phone</label>
                            <input type="text" value={studentForm.emergencyPhone} onChange={e => setStudentForm({ ...studentForm, emergencyPhone: e.target.value })} className="glass-input" placeholder="e.g. 923001234567" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Address</label>
                            <input type="text" value={studentForm.emergencyAddress} onChange={e => setStudentForm({ ...studentForm, emergencyAddress: e.target.value })} className="glass-input" placeholder="Address of emergency contact" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Academic & Course Enrollment */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px', marginBottom: '14px', fontWeight: 600 }}>3. Academic & Course Enrollment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Last Qualification</label>
                            <input type="text" value={studentForm.qualification} onChange={e => setStudentForm({ ...studentForm, qualification: e.target.value })} className="glass-input" placeholder="e.g. Matric / Intermediate" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Institute / School Name</label>
                            <input type="text" value={studentForm.school} onChange={e => setStudentForm({ ...studentForm, school: e.target.value })} className="glass-input" placeholder="e.g. Army Public School" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Year of Passing</label>
                            <input type="text" value={studentForm.passingYear} onChange={e => setStudentForm({ ...studentForm, passingYear: e.target.value })} className="glass-input" placeholder="e.g. 2024" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Obtained Marks / CGPA</label>
                            <input type="text" value={studentForm.marks} onChange={e => setStudentForm({ ...studentForm, marks: e.target.value })} className="glass-input" placeholder="e.g. 850/1100" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Course / Class *</label>
                            <select className="glass-input" value={studentForm.course} onChange={e => {
                              const selCourse = courses.find(c => c.name === e.target.value);
                              const monthlyFeeVal = selCourse ? parseFloat(selCourse.installment.replace(/[^0-9]/g, '')) || '' : '';
                              setStudentForm({ ...studentForm, course: e.target.value, monthlyFee: monthlyFeeVal, originalMonthlyFee: monthlyFeeVal, discount: '' });
                            }} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                              <option value="">-- Select Course --</option>
                              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              <option value="Custom Course">Custom Course</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Fee (Rs) *</label>
                            <input type="number" required value={studentForm.monthlyFee} onChange={e => {
                              const paid = parseFloat(e.target.value) || 0;
                              const selCourse = courses.find(c => c.name === studentForm.course);
                              const original = selCourse ? parseFloat(selCourse.installment.replace(/[^0-9]/g, '')) || 0 : 0;
                              const disc = original > 0 && paid < original ? (original - paid) : 0;
                              setStudentForm({ ...studentForm, monthlyFee: e.target.value, discount: disc > 0 ? disc : '', originalMonthlyFee: original || e.target.value });
                            }} className="glass-input" placeholder="e.g. 5000" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              Discount (Rs)
                              {studentForm.discount > 0 && <span style={{ color: '#4ade80', marginLeft: 6, fontSize: '0.75rem' }}>✓ Auto-calculated</span>}
                            </label>
                            <input type="number" value={studentForm.discount} onChange={e => setStudentForm({ ...studentForm, discount: e.target.value })} className="glass-input" placeholder="0 = No Discount" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Preferred Batch Timing</label>
                            <select value={studentForm.batch} onChange={e => setStudentForm({ ...studentForm, batch: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                              <option value="">-- Select Batch Timing --</option>
                              <option value="Morning">Morning</option>
                              <option value="Afternoon">Afternoon</option>
                              <option value="Evening">Evening</option>
                              <option value="Weekend">Weekend</option>
                            </select>
                          </div>
                        </div>


                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Preferred Days</label>
                            <input type="text" value={studentForm.preferredDays} onChange={e => setStudentForm({ ...studentForm, preferredDays: e.target.value })} className="glass-input" placeholder="e.g. Mon & Wed, Sat & Sun" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Reference / Source</label>
                            <input type="text" value={studentForm.reference} onChange={e => setStudentForm({ ...studentForm, reference: e.target.value })} className="glass-input" placeholder="e.g. Facebook / Friend" style={{ padding: '8px 12px', fontSize: '0.9rem' }} />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</label>
                            <select className="glass-input" value={studentForm.status} onChange={e => setStudentForm({ ...studentForm, status: e.target.value })} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button type="button" onClick={() => setShowStudentModal(false)} className="btn-secondary">Cancel</button>
                      <button type="button" onClick={saveStudent} className="btn-primary">Save Student</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stats Summary Card Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Fee Collected</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>Rs {Number(feeAnalytics.totalCollected).toLocaleString()}</h3>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Unpaid / Pending</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>Rs {Number(feeAnalytics.totalPending).toLocaleString()}</h3>
                </div>
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Partial Collected</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>Rs {Number(feeAnalytics.totalPartial).toLocaleString()}</h3>
                </div>
              </div>

              {/* Filters & Actions Header */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                    {/* Student Filter */}
                    <select className="glass-input" value={feeStudentFilter} onChange={e => setFeeStudentFilter(e.target.value)} style={{ minWidth: '180px' }}>
                      <option value="all">All Students</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>

                    {/* Status Filter */}
                    <select className="glass-input" value={feeStatusFilter} onChange={e => setFeeStatusFilter(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                    </select>

                    {/* Search student name within fee payments */}
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Search student name..."
                      value={feeSearch}
                      onChange={e => setFeeSearch(e.target.value)}
                      style={{ minWidth: '200px' }}
                    />
                  </div>
                  
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => exportCSV('fee-payments')} className="btn-secondary" style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem' }}>
                      <FileDown size={14} /> Export CSV
                    </button>
                    <button onClick={() => openAddFee('')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                      <Plus size={16} /> Record Fee Payment
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                        {['Student Name', 'Month', 'Amount', 'Status', 'Paid Date', 'Notes', 'Actions'].map((h, i) => (
                          <th key={i} style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {feePayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                            <Wallet size={44} style={{ opacity: 0.25, marginBottom: '12px' }} />
                            <p style={{ fontWeight: 600 }}>No fee records found.</p>
                          </td>
                        </tr>
                      ) : (
                        feePayments
                          .filter(f => {
                            if (feeStudentFilter !== 'all' && f.studentId !== feeStudentFilter) return false;
                            if (feeStatusFilter !== 'all' && f.status !== feeStatusFilter) return false;
                            const student = students.find(s => s.id === f.studentId);
                            const nameMatch = student ? student.name.toLowerCase().includes(feeSearch.toLowerCase()) : false;
                            if (feeSearch && !nameMatch) return false;
                            return true;
                          })
                          .map(fee => {
                            const student = students.find(s => s.id === fee.studentId);
                            const studentName = student ? student.name : 'Unknown Student';
                            return (
                              <tr key={fee.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                <td style={{ padding: '12px', fontWeight: 600 }}>
                                  <div>
                                    <span>{studentName}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{fee.studentId}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontWeight: 500 }}>{fee.month}</td>
                                <td style={{ padding: '12px', fontWeight: 700 }}>Rs {Number(fee.amount).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>
                                  <span className={`badge badge-${fee.status === 'paid' ? 'connected' : fee.status === 'unpaid' ? 'disconnected' : 'connecting'}`}>
                                    {fee.status.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                  {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {fee.notes || '-'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button onClick={() => openEditFee(fee)} className="btn-secondary" style={{ padding: '5px 8px', fontSize: '0.75rem' }}>
                                      Edit
                                    </button>
                                    
                                    {fee.status !== 'paid' && (
                                      <button onClick={() => quickUpdateFeeStatus(fee.id, 'paid')} className="btn-secondary" style={{ padding: '5px 8px', fontSize: '0.75rem', color: 'var(--color-success)', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                                        Mark Paid
                                      </button>
                                    )}
                                    {fee.status !== 'unpaid' && (
                                      <button onClick={() => quickUpdateFeeStatus(fee.id, 'unpaid')} className="btn-secondary" style={{ padding: '5px 8px', fontSize: '0.75rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        Mark Unpaid
                                      </button>
                                    )}

                                    {student && fee.status !== 'paid' && (
                                      <button onClick={() => sendFeeReminder(student, fee)} className="btn-secondary" style={{ padding: '5px 8px', fontSize: '0.75rem', color: 'var(--color-accent)', border: '1px solid rgba(245, 158, 11, 0.2)' }} title="Send WhatsApp Reminder">
                                        <Send size={11} /> Remind
                                      </button>
                                    )}

                                    {student && fee.status === 'paid' && (
                                      <button onClick={() => sendFeeSlipWA(student, fee)} className="btn-secondary" style={{ padding: '5px 8px', fontSize: '0.75rem', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }} title="Send WhatsApp Fee Slip">
                                        <Receipt size={11} /> Send Slip
                                      </button>
                                    )}

                                    <button onClick={() => deleteFeePaymentData(fee.id)} className="btn-secondary" style={{ padding: '5px 6px', fontSize: '0.75rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Fee Add/Edit Modal — Enhanced with Paid/Pending Breakdown */}
          {showFeeModal && (() => {
            const feeModalStudent = feeForm.studentId ? students.find(s => s.id === feeForm.studentId) : null;
            const monthlyFeeTotal = feeModalStudent ? Number(feeModalStudent.monthlyFee) || 0 : 0;
            const alreadyPaidThisMonth = feePayments
              .filter(p => p.studentId === feeForm.studentId && p.month === feeForm.month && (editingFee ? p.id !== editingFee.id : true) && p.status === 'paid')
              .reduce((sum, p) => sum + Number(p.amount), 0);
            const partialPaidThisMonth = feePayments
              .filter(p => p.studentId === feeForm.studentId && p.month === feeForm.month && (editingFee ? p.id !== editingFee.id : true) && p.status === 'partial')
              .reduce((sum, p) => sum + Number(p.amount), 0);
            const totalPreviouslyPaid = alreadyPaidThisMonth + partialPaidThisMonth;
            const currentAmt = Number(feeForm.amount) || 0;
            const totalAfterThis = totalPreviouslyPaid + (feeForm.status !== 'unpaid' ? currentAmt : 0);
            const pendingBalance = monthlyFeeTotal > 0 ? Math.max(0, monthlyFeeTotal - totalAfterThis) : null;
            const isFullyPaid = monthlyFeeTotal > 0 && totalAfterThis >= monthlyFeeTotal;

            return (
              <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                <div className="glass-panel" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      {editingFee ? 'Edit Fee Payment Record' : 'Record Fee Payment'}
                    </h3>
                    <button onClick={() => setShowFeeModal(false)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1.4rem' }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Student *</label>
                    <select className="glass-input" disabled={!!editingFee} value={feeForm.studentId} onChange={e => {
                      const student = students.find(s => s.id === e.target.value);
                      const feeAmt = student ? student.monthlyFee : '';
                      setFeeForm({ ...feeForm, studentId: e.target.value, amount: feeAmt });
                    }}>
                      <option value="">-- Select Student --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.course} ({s.id})</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Billing Month *</label>
                      <input type="text" required value={feeForm.month} onChange={e => setFeeForm({ ...feeForm, month: e.target.value })} className="glass-input" placeholder="e.g. July 2026" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount Paying Now (Rs) *</label>
                      <input type="number" required value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} className="glass-input" placeholder="e.g. 5000" />
                    </div>
                  </div>

                  {/* Fee Breakdown Panel */}
                  {feeModalStudent && monthlyFeeTotal > 0 && (
                    <div style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                      <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--color-primary)', margin:0, textTransform:'uppercase', letterSpacing:1 }}>📊 Fee Breakdown — {feeForm.month || 'This Month'}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                        <div style={{ textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 6px' }}>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', margin:'0 0 4px', fontWeight:600 }}>Monthly Fee</p>
                          <p style={{ fontSize:'1.1rem', fontWeight:800, color:'#fff', margin:0 }}>Rs {monthlyFeeTotal.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign:'center', background:'rgba(22,163,74,0.08)', borderRadius:8, padding:'10px 6px', border:'1px solid rgba(22,163,74,0.2)' }}>
                          <p style={{ fontSize:'0.72rem', color:'#86efac', margin:'0 0 4px', fontWeight:600 }}>Already Paid</p>
                          <p style={{ fontSize:'1.1rem', fontWeight:800, color:'#4ade80', margin:0 }}>Rs {totalPreviouslyPaid.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign:'center', background: pendingBalance === 0 ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', borderRadius:8, padding:'10px 6px', border: pendingBalance === 0 ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                          <p style={{ fontSize:'0.72rem', color: pendingBalance === 0 ? '#86efac' : '#fca5a5', margin:'0 0 4px', fontWeight:600 }}>Remaining</p>
                          <p style={{ fontSize:'1.1rem', fontWeight:800, color: pendingBalance === 0 ? '#4ade80' : '#f87171', margin:0 }}>
                            {isFullyPaid ? '✅ CLEARED' : `Rs ${pendingBalance !== null ? pendingBalance.toLocaleString() : '—'}`}
                          </p>
                        </div>
                      </div>
                      {currentAmt > 0 && feeForm.status !== 'unpaid' && (
                        <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', margin:0, textAlign:'center' }}>
                          After this payment: <strong style={{ color: isFullyPaid ? '#4ade80' : '#f59e0b' }}>
                            {isFullyPaid ? 'Fee fully cleared ✅' : `Rs ${pendingBalance?.toLocaleString()} still pending`}
                          </strong>
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Payment Status</label>
                    <select className="glass-input" value={feeForm.status} onChange={e => setFeeForm({ ...feeForm, status: e.target.value })}>
                      <option value="unpaid">Unpaid / Pending</option>
                      <option value="paid">Paid ✅</option>
                      <option value="partial">Partial Payment</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notes (Optional)</label>
                    <textarea rows={2} value={feeForm.notes} onChange={e => setFeeForm({ ...feeForm, notes: e.target.value })} className="glass-input" style={{ resize: 'none' }} placeholder="e.g. Paid via Bank Transfer" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                    <button type="button" onClick={() => setShowFeeModal(false)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={saveFeePayment} className="btn-primary">💾 Save Fee Record</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Teachers Tab ── */}
          {activeTab === 'teachers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input type="text" className="glass-input" placeholder="Search teachers by name, subject or phone..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => exportCSV('teachers')} className="btn-secondary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                      <FileDown size={14} /> Export CSV
                    </button>
                    <button onClick={openAddTeacher} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
                      <Plus size={16} /> Add Teacher
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                        {['ID','Name','Subject','Courses','Phone','Schedule','Salary','Status','Actions'].map((h, i) => (
                          <th key={i} style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.length === 0 ? (
                        <tr><td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                          <GraduationCap size={44} style={{ opacity: 0.25, marginBottom: 12 }} />
                          <p style={{ fontWeight: 600 }}>No teachers added yet.</p>
                        </td></tr>
                      ) : teachers
                        .filter(t => {
                          const q = teacherSearch.toLowerCase();
                          return (t.name||'').toLowerCase().includes(q) || (t.subject||'').toLowerCase().includes(q) || (t.phone||'').includes(q);
                        })
                        .map(teacher => (
                          <tr key={teacher.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8rem' }}>{teacher.id}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>
                              <div>{teacher.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{teacher.qualification}</div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 500 }}>{teacher.subject || '—'}</td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {Array.isArray(teacher.courses) ? teacher.courses.join(', ') : teacher.courses || '—'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <a href={`https://wa.me/${teacher.phone}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} style={{ color: 'var(--color-success)' }} /> {teacher.phone}
                              </a>
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{teacher.schedule || '—'}</td>
                            <td style={{ padding: '12px', fontWeight: 700 }}>Rs {Number(teacher.salary).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={`badge badge-${teacher.status === 'active' ? 'connected' : 'disconnected'}`}>{teacher.status}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => openEditTeacher(teacher)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}><Edit size={12} /> Edit</button>
                                <button onClick={() => deleteTeacherData(teacher.id)} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teacher Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                {[
                  { label: 'Total Teachers', value: teachers.length, color: '#0ea5e9' },
                  { label: 'Active', value: teachers.filter(t => t.status === 'active').length, color: '#22c55e' },
                  { label: 'Inactive', value: teachers.filter(t => t.status !== 'active').length, color: '#ef4444' },
                  { label: 'Total Salary/Mo', value: `Rs ${teachers.filter(t=>t.status==='active').reduce((s,t)=>s+Number(t.salary||0),0).toLocaleString()}`, color: '#f59e0b' }
                ].map((s,i) => (
                  <div key={i} className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</h3>
                  </div>
                ))}
              </div>

              {/* Teacher Attendance Section */}
              <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClipboardList size={18} style={{ color: 'var(--color-primary)' }} /> Teacher Attendance
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="date" value={teacherAttendanceDate} onChange={e => setTeacherAttendanceDate(e.target.value)} className="glass-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                    <button onClick={() => exportCSV('teacher-attendance')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileDown size={13} /> Export CSV
                    </button>
                  </div>
                </div>

                {teachers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Add teachers first to mark attendance.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                          {['Teacher','Subject','Today Status','Mark Attendance','Notes'].map((h,i)=>(
                            <th key={i} style={{ padding:'10px 12px', textAlign:'left', color:'var(--text-secondary)', fontWeight:600, fontSize:'0.8rem', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.filter(t=>t.status==='active').map(teacher => {
                          const todayRec = teacherAttendance.find(a => a.teacherId === teacher.id && a.date === teacherAttendanceDate);
                          const statusColor = { present:'#22c55e', absent:'#ef4444', leave:'#f59e0b' };
                          return (
                            <tr key={teacher.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{teacher.name}</td>
                              <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{teacher.subject || '—'}</td>
                              <td style={{ padding: '12px' }}>
                                {todayRec ? (
                                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: `${statusColor[todayRec.status]}22`, color: statusColor[todayRec.status], border: `1px solid ${statusColor[todayRec.status]}44` }}>
                                    {todayRec.status.toUpperCase()}
                                  </span>
                                ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not marked</span>}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => markTeacherAttendance(teacher.id, teacherAttendanceDate, 'present')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.3)', background: todayRec?.status==='present' ? 'rgba(34,197,94,0.2)' : 'transparent', color: '#4ade80', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✓ Present</button>
                                  <button onClick={() => markTeacherAttendance(teacher.id, teacherAttendanceDate, 'absent')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: todayRec?.status==='absent' ? 'rgba(239,68,68,0.2)' : 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✗ Absent</button>
                                  <button onClick={() => markTeacherAttendance(teacher.id, teacherAttendanceDate, 'leave')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: todayRec?.status==='leave' ? 'rgba(245,158,11,0.2)' : 'transparent', color: '#fbbf24', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>🌙 Leave</button>
                                  {todayRec && <button onClick={() => deleteTeacherAttendanceRecord(todayRec.id)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={11} /></button>}
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{todayRec?.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Attendance History */}
                {teacherAttendance.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>Recent Attendance History</h4>
                    <div style={{ overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                          {['Teacher','Date','Status','Notes',''].map((h,i)=>(<th key={i} style={{ padding:'8px 10px', textAlign:'left', color:'var(--text-secondary)', fontWeight:600, fontSize:'0.75rem' }}>{h}</th>))}
                        </tr></thead>
                        <tbody>
                          {teacherAttendance.slice(0,30).map(rec => {
                            const statusColor = { present:'#22c55e', absent:'#ef4444', leave:'#f59e0b' };
                            return (
                              <tr key={rec.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding:'8px 10px', fontWeight:600 }}>{rec.teacherName}</td>
                                <td style={{ padding:'8px 10px', color:'var(--text-secondary)' }}>{rec.date}</td>
                                <td style={{ padding:'8px 10px' }}><span style={{ color: statusColor[rec.status], fontWeight:700 }}>{rec.status?.toUpperCase()}</span></td>
                                <td style={{ padding:'8px 10px', color:'var(--text-secondary)' }}>{rec.notes||'—'}</td>
                                <td style={{ padding:'8px 10px' }}><button onClick={()=>deleteTeacherAttendanceRecord(rec.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={11}/></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Teacher Add/Edit Modal */}
              {showTeacherModal && (
                <div style={{ position:'fixed', top:0, right:0, bottom:0, left:0, backgroundColor:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:110 }}>
                  <div className="glass-panel" style={{ width:700, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border-muted)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <h3 style={{ fontSize:'1.2rem', fontWeight:700 }}>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                      <button onClick={() => setShowTeacherModal(false)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', fontSize:'1.5rem' }}>&times;</button>
                    </div>
                    <div style={{ padding:24, overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:18 }}>
                      {/* Personal Info */}
                      <div>
                        <h4 style={{ fontSize:'0.9rem', color:'var(--color-primary)', borderBottom:'1px solid var(--border-muted)', paddingBottom:6, marginBottom:12, fontWeight:600 }}>Personal Information</h4>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                          {[
                            { key:'name', label:'Full Name *', placeholder:'e.g. Ahmad Khan' },
                            { key:'fatherName', label:"Father's Name", placeholder:'e.g. Khalid Khan' },
                            { key:'cnic', label:'CNIC', placeholder:'42101-1234567-8' },
                            { key:'phone', label:'Phone *', placeholder:'e.g. 03001234567' },
                            { key:'email', label:'Email', placeholder:'teacher@gmail.com' },
                            { key:'address', label:'Address', placeholder:'City, Area' },
                          ].map(f => (
                            <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>{f.label}</label>
                              <input className="glass-input" placeholder={f.placeholder} value={teacherForm[f.key]} onChange={e => setTeacherForm({...teacherForm,[f.key]:e.target.value})} style={{ padding:'8px 10px', fontSize:'0.88rem' }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Academic Info */}
                      <div>
                        <h4 style={{ fontSize:'0.9rem', color:'var(--color-primary)', borderBottom:'1px solid var(--border-muted)', paddingBottom:6, marginBottom:12, fontWeight:600 }}>Academic & Schedule</h4>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                          {[
                            { key:'qualification', label:'Qualification', placeholder:'e.g. MCS, BCS' },
                            { key:'subject', label:'Main Subject', placeholder:'e.g. Web Development' },
                            { key:'courses', label:'Courses (comma-sep)', placeholder:'e.g. Web Dev, Agentic AI' },
                            { key:'schedule', label:'Schedule', placeholder:'e.g. Mon-Wed 4pm-6pm' },
                            { key:'salary', label:'Monthly Salary (Rs)', placeholder:'e.g. 25000' },
                            { key:'joinDate', label:'Join Date', placeholder:'' },
                          ].map(f => (
                            <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>{f.label}</label>
                              <input className="glass-input" type={f.key==='salary'?'number':f.key==='joinDate'?'date':'text'} placeholder={f.placeholder} value={teacherForm[f.key]} onChange={e => setTeacherForm({...teacherForm,[f.key]:e.target.value})} style={{ padding:'8px 10px', fontSize:'0.88rem' }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status & Notes */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>Status</label>
                          <select className="glass-input" value={teacherForm.status} onChange={e=>setTeacherForm({...teacherForm,status:e.target.value})} style={{ padding:'8px 10px' }}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive / Left</option>
                          </select>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <label style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>Notes</label>
                          <input className="glass-input" placeholder="Any additional notes" value={teacherForm.notes} onChange={e=>setTeacherForm({...teacherForm,notes:e.target.value})} style={{ padding:'8px 10px' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border-muted)', display:'flex', justifyContent:'flex-end', gap:12 }}>
                      <button onClick={() => setShowTeacherModal(false)} className="btn-secondary">Cancel</button>
                      <button onClick={saveTeacher} className="btn-primary">💾 Save Teacher</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'agents' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Session Agent</h3>
                  <span className={`badge badge-${agentInfo.status === 'Connected' ? 'connected' : 'disconnected'}`}>
                    {agentInfo.status === 'Connected' ? 'Active' : 'Offline'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-muted)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Agent Name:</span>
                    <span style={{ fontWeight: 600 }}>{agentInfo.sessionName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Linked Phone:</span>
                    <span style={{ fontWeight: 600 }}>{agentInfo.phone || 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{ fontWeight: 600, color: agentInfo.status === 'Connected' ? 'var(--color-success)' : '#ef4444' }}>{agentInfo.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Last Active:</span>
                    <span style={{ fontWeight: 600 }}>{agentInfo.lastActive ? new Date(agentInfo.lastActive).toLocaleString('en-PK') : 'Never'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={restartWhatsApp} disabled={isRestarting} className="btn-primary" style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={14} className={isRestarting ? 'spin-anim' : ''} /> {isRestarting ? 'Restarting...' : 'Restart Session'}
                  </button>
                  {agentInfo.status === 'Connected' && (
                    <button onClick={disconnectWhatsApp} className="btn-secondary" style={{ flex: 1, padding: '10px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <LogOut size={14} /> Disconnect
                    </button>
                  )}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Agent Logs & Health</h3>
                <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', overflowY: 'auto', maxHeight: '200px', color: '#a3a3a3' }}>
                  <p style={{ color: '#10b981' }}>[SYSTEM] Agent initialized.</p>
                  {agentInfo.status === 'Connected' ? (
                    <p style={{ color: '#10b981' }}>[SYSTEM] Session connected successfully to WhatsApp network.</p>
                  ) : (
                    <p style={{ color: '#f59e0b' }}>[WARNING] Session is currently offline/disconnected.</p>
                  )}
                  <p>[SYSTEM] Ready for incoming student messages.</p>
                  <p>[SYSTEM] Port 5000 API integration live.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. WhatsApp Connection Tab */}
          {activeTab === 'whatsapp' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
              {/* QR Panel */}
              <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Scan QR Code</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Scan this QR code with WhatsApp Linked Devices to link the AI bot.</p>
                
                {wsStatus.status === 'QR_Ready' && wsStatus.qr ? (
                  <div className="pulse-glow" style={{ padding: '16px', background: 'white', borderRadius: '16px', display: 'inline-block', marginBottom: '24px' }}>
                    <img src={wsStatus.qr} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                  </div>
                ) : wsStatus.status === 'Connected' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '40px 0' }}>
                    <CheckCircle size={80} color="var(--color-success)" />
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-success)', fontWeight: 600 }}>Successfully Connected!</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '40px 0' }}>
                    <Clock size={80} color="var(--text-muted)" />
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Waiting for QR code generation...</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <button onClick={restartWhatsApp} disabled={isRestarting} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Restart Client
                  </button>
                  {wsStatus.status !== 'Disconnected' && (
                    <button onClick={disconnectWhatsApp} disabled={isDisconnecting} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                      <LogOut size={14} /> Disconnect WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions & Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Instructions</h3>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <li>Open WhatsApp on your mobile device.</li>
                    <li>Tap **Menu** (three dots on Android) or **Settings** (iOS) and select **Linked Devices**.</li>
                    <li>Tap **Link a Device**.</li>
                    <li>Point your phone camera to this dashboard screen to scan the QR code.</li>
                    <li>Once scanned, the bot connection status will change to **Connected** and start answering student inquiries automatically.</li>
                  </ol>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Bot Behavior Settings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>AI Auto-Responder Status</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle the bot reply module on WhatsApp chat events.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.botActive}
                        onChange={(e) => {
                          const updated = { ...settings, botActive: e.target.checked };
                          setSettings(updated);
                          fetch(`${API_BASE}/api/settings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updated)
                          });
                        }}
                        style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Admissions Tab */}
          {activeTab === 'admissions' && (
            <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Search Bar */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by student name, ID, or course..."
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '38px' }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Course Name</th>
                      <th>Phone</th>
                      <th>WhatsApp</th>
                      <th>City</th>
                      <th>Registration Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations
                      .filter(r => 
                        r.fullName.toLowerCase().includes(regSearch.toLowerCase()) ||
                        r.studentId.toLowerCase().includes(regSearch.toLowerCase()) ||
                        r.course.toLowerCase().includes(regSearch.toLowerCase())
                      )
                      .map((reg) => (
                        <tr key={reg.studentId} onClick={() => setSelectedStudent(reg)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{reg.studentId}</td>
                          <td>{reg.fullName}</td>
                          <td>{reg.course}</td>
                          <td>{reg.phone}</td>
                          <td>{reg.whatsapp}</td>
                          <td>{reg.city}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <a
                                href={`${API_BASE}/api/registrations/${reg.studentId}/form-pdf`}
                                download={`RegForm_${reg.studentId}.pdf`}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#0b4bbf', border: '1px solid rgba(11,75,191,0.25)', backgroundColor: 'rgba(11,75,191,0.07)', display:'flex', alignItems:'center', gap:'4px', textDecoration:'none' }}
                                title="Download Registration Form PDF"
                              >
                                <Download size={12} /> Reg Form
                              </a>
                              {reg.generatedPdf && (
                                <a href={`${API_BASE}${reg.generatedPdf}`} download className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                                  <Download size={12} /> PDF
                                </a>
                              )}
                              {reg.generatedImage && (
                                <a href={`${API_BASE}${reg.generatedImage}`} download className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                                  <Download size={12} /> PNG
                                </a>
                              )}
                              <button onClick={() => deleteRegistrationData(reg.studentId)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} title="Delete Registration">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Student Details Modal Side Drawer */}
              {selectedStudent && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-muted)', padding: '32px', zIndex: 100, overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registration Details</h3>
                    <button onClick={() => setSelectedStudent(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                     <a
                       href={`${API_BASE}/api/registrations/${selectedStudent.studentId}/form-pdf`}
                       download={`RegForm_${selectedStudent.studentId}.pdf`}
                       style={{
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         gap: '8px',
                         padding: '10px 16px',
                         background: 'linear-gradient(135deg, #032b74, #0b4bbf)',
                         color: '#fff',
                         borderRadius: '8px',
                         textDecoration: 'none',
                         fontSize: '0.9rem',
                         fontWeight: 600,
                         boxShadow: '0 2px 8px rgba(11,75,191,0.3)'
                       }}
                     >
                       <Download size={16} /> Download Registration Form (PDF)
                     </a>
                   </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STUDENT ID</span>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 700 }}>{selectedStudent.studentId}</h4>
                    </div>

                    {[
                      { section: 'Personal Information', fields: [
                        { label: 'Full Name', value: selectedStudent.fullName },
                        { label: "Father's Name", value: selectedStudent.fatherName },
                        { label: 'CNIC / B-Form', value: selectedStudent.cnic },
                        { label: 'Date of Birth', value: selectedStudent.dob },
                        { label: 'Gender', value: selectedStudent.gender },
                        { label: 'Nationality', value: selectedStudent.nationality },
                        { label: 'Religion', value: selectedStudent.religion },
                        { label: 'Phone', value: selectedStudent.phone },
                        { label: 'WhatsApp', value: selectedStudent.whatsapp },
                        { label: 'Email', value: selectedStudent.email },
                        { label: 'Address', value: selectedStudent.address },
                        { label: 'City', value: selectedStudent.city },
                        { label: 'Postal Code', value: selectedStudent.postalCode }
                      ]},
                      { section: 'Academic Profile', fields: [
                        { label: 'Qualification', value: selectedStudent.qualification },
                        { label: 'School / College', value: selectedStudent.school },
                        { label: 'Passing Year', value: selectedStudent.passingYear },
                        { label: 'Marks / CGPA', value: selectedStudent.marks }
                      ]},
                      { section: 'Course Details', fields: [
                        { label: 'Course Name', value: selectedStudent.course },
                        { label: 'Batch Timing', value: selectedStudent.batch },
                        { label: 'Preferred Days', value: selectedStudent.preferredDays },
                        { label: 'Reference / Source', value: selectedStudent.reference }
                      ]},
                      { section: 'Emergency Contact Info', fields: [
                        { label: 'Emergency Contact Person', value: selectedStudent.emergencyName },
                        { label: 'Relationship', value: selectedStudent.relationship },
                        { label: 'Phone Number', value: selectedStudent.emergencyPhone },
                        { label: 'Alternate Phone', value: selectedStudent.alternatePhone },
                        { label: 'Emergency Address', value: selectedStudent.emergencyAddress }
                      ]}
                    ].map((sec, i) => (
                      <div key={i}>
                        <h5 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px', marginBottom: '10px' }}>{sec.section}</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {sec.fields.map((f, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{f.label}:</span>
                              <span style={{ fontWeight: 500, textAlign: 'right' }}>{f.value || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 4. Live Chat Tab */}
          {activeTab === 'chat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', flex: 1, height: 'calc(100vh - 200px)' }}>
              
              {/* Chat List Column */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-muted)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="glass-input"
                      style={{ width: '100%', paddingLeft: '34px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversations
                    .filter(c => c.name.toLowerCase().includes(chatSearch.toLowerCase()) || c.phone.includes(chatSearch))
                    .map((conv) => {
                      const lastMsg = conv.messages[conv.messages.length - 1];
                      const active = activeChatPhone === conv.phone;
                      return (
                        <div
                          key={conv.phone}
                          onClick={() => {
                            setActiveChatPhone(conv.phone);
                            // Clear state
                            setReplyText('');
                          }}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid var(--border-muted)',
                            cursor: 'pointer',
                            backgroundColor: active ? 'rgba(255,255,255,0.03)' : 'transparent',
                            borderLeft: active ? '3px solid var(--color-primary)' : 'none',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conv.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              <button onClick={(e) => deleteConversation(e, conv.phone)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', marginLeft: '8px', verticalAlign: 'middle' }} title="Delete Chat">
                                <Trash2 size={14} />
                              </button>
                            </span>
                          </div>
                          <div className="flex-between">
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                              {lastMsg ? lastMsg.text : 'No messages'}
                            </span>
                            <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{conv.intent}</span>
                          </div>
                          {conv.registrationStatus === 'Active' && (
                            <span style={{ display: 'inline-block', fontSize: '0.7rem', color: 'var(--color-accent)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '4px', marginTop: '6px', fontWeight: 600 }}>
                              📝 Step {conv.activeStep + 1}/26
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Chat Detail Message Pane */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {activeChatPhone ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex-between" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-muted)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{activeChat ? activeChat.name : activeChatPhone}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeChatPhone}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-connected">{activeChat ? activeChat.registrationStatus : 'Idle'}</span>
                        <button onClick={(e) => deleteConversation(e, activeChatPhone)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '6px' }} title="Delete Chat">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {activeChat && activeChat.messages.map((msg, i) => {
                        const isStudent = msg.sender === 'student';
                        return (
                          <div
                            key={i}
                            style={{
                              alignSelf: isStudent ? 'flex-start' : 'flex-end',
                              maxWidth: '70%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isStudent ? 'flex-start' : 'flex-end'
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: isStudent ? 'rgba(255, 255, 255, 0.04)' : 'rgba(56, 189, 248, 0.08)',
                                border: isStudent ? '1px solid var(--border-muted)' : '1px solid rgba(56, 189, 248, 0.15)',
                                padding: '12px 16px',
                                borderRadius: isStudent ? '12px 12px 12px 0' : '12px 12px 0 12px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                lineHeight: '1.4',
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {msg.text}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Send reply footer */}
                    <form onSubmit={sendDirectMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: '12px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <input
                        type="text"
                        placeholder="Type a message to reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="glass-input"
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}><Send size={16} /></button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <MessageSquare size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                    <span>Select a conversation from the sidebar to view history and chat live.</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 5. Courses Tab */}
          {activeTab === 'courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setEditCourse({ name: '', duration: '', fee: '', installment: '', schedule: '', description: '', careerOpportunities: '' });
                    setIsNewCourse(true);
                  }}
                  className="btn-primary"
                >
                  <Plus size={16} /> Add Program
                </button>
              </div>

              {/* Courses Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {courses.map((course) => (
                  <div key={course.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{course.name}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditCourse(course);
                              setIsNewCourse(false);
                            }}
                            className="btn-secondary"
                            style={{ padding: '6px 8px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCourseData(course.id)}
                            className="btn-secondary"
                            style={{ padding: '6px 8px', color: 'var(--color-error)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>{course.description}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-muted)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <Calendar size={14} color="var(--text-secondary)" />
                          <span>Duration: <b>{course.duration}</b></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <DollarSign size={14} color="var(--text-secondary)" />
                          <span>Fee: <b>{course.fee}</b> ({course.installment})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                          <Clock size={14} color="var(--text-secondary)" />
                          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Schedule: {course.schedule}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-muted)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Career Paths:</span>
                      <span>{course.careerOpportunities}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Course Modal Box */}
              {editCourse && (
                <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                  <form onSubmit={saveCourseData} className="glass-panel" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{isNewCourse ? 'Add New Coaching Program' : 'Edit Coaching Program'}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Program Name</label>
                      <input type="text" required value={editCourse.name} onChange={(e) => setEditCourse({ ...editCourse, name: e.target.value })} className="glass-input" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duration</label>
                        <input type="text" required placeholder="e.g. 4 Months" value={editCourse.duration} onChange={(e) => setEditCourse({ ...editCourse, duration: e.target.value })} className="glass-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Course Fee</label>
                        <input type="text" required placeholder="e.g. 24,000 PKR" value={editCourse.fee} onChange={(e) => setEditCourse({ ...editCourse, fee: e.target.value })} className="glass-input" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Installment Tier</label>
                        <input type="text" required placeholder="e.g. 6,000 PKR/Month" value={editCourse.installment} onChange={(e) => setEditCourse({ ...editCourse, installment: e.target.value })} className="glass-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Weekly Schedule</label>
                        <input type="text" required placeholder="e.g. Sat & Sun (10-12)" value={editCourse.schedule} onChange={(e) => setEditCourse({ ...editCourse, schedule: e.target.value })} className="glass-input" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
                      <textarea required rows={3} value={editCourse.description} onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })} className="glass-input" style={{ resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Career Opportunities</label>
                      <input type="text" required placeholder="e.g. Graphic Designer, UI/UX Architect" value={editCourse.careerOpportunities} onChange={(e) => setEditCourse({ ...editCourse, careerOpportunities: e.target.value })} className="glass-input" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setEditCourse(null)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Scanner Panel */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>📝 Mark Attendance</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Enter Student Roll Number to mark attendance. Press Enter or click the Mark button.</p>
                <div style={{ display: 'flex', gap: '12px', maxWidth: '450px', marginBottom: '20px', alignItems: 'center' }}>
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={attendanceScan}
                    onChange={e => setAttendanceScan(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') scanBarcode(attendanceScan); }}
                    className="glass-input"
                    placeholder="Enter Roll Number e.g. TSS-001..."
                    style={{ flex: 1, padding: '12px 16px', fontSize: '1rem', letterSpacing: '1px' }}
                    autoFocus
                  />
                  <button onClick={() => scanBarcode(attendanceScan)} className="btn-primary" style={{ padding: '12px 20px' }} disabled={attendanceLoading}>
                    {attendanceLoading ? '...' : <><ScanLine size={16} /> Mark</>}
                  </button>
                </div>

                {/* Scan Result */}
                {attendanceResult && (
                  <div style={{
                    padding: '20px 24px',
                    borderRadius: '12px',
                    border: `1px solid ${attendanceResult.success ? (attendanceResult.feePending ? '#f59e0b' : '#22c55e') : '#ef4444'}`,
                    background: attendanceResult.success ? (attendanceResult.feePending ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)') : 'rgba(239,68,68,0.08)',
                    maxWidth: '480px'
                  }}>
                    {attendanceResult.success ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          {attendanceResult.alreadyMarked
                            ? <Clock size={22} style={{ color: '#f59e0b' }} />
                            : attendanceResult.feePending
                              ? <AlertCircle size={22} style={{ color: '#f59e0b' }} />
                              : <CheckCircle size={22} style={{ color: '#22c55e' }} />}
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {attendanceResult.alreadyMarked
                              ? 'Already Marked Today'
                              : attendanceResult.feePending
                                ? '⚠️ Monthly Fee Pending!'
                                : '✅ Attendance Marked!'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                          <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{attendanceResult.student?.name}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Roll No:</span> <strong>{attendanceResult.student?.rollNo}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Course:</span> <strong>{attendanceResult.student?.course}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Month:</span> <strong>{attendanceResult.month}</strong></div>
                        </div>
                        {attendanceResult.feePending && !attendanceResult.alreadyMarked && (
                          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(245,158,11,0.15)', borderRadius: '8px', fontWeight: 600, color: '#f59e0b', fontSize: '0.9rem' }}>
                            ⚠️ Monthly Fee Pending — Please collect fee for {attendanceResult.month}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#ef4444', fontWeight: 600 }}>
                        ❌ {attendanceResult.error || 'Student not found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Today's Attendance & History */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📋 Attendance Records</h3>
                  <button onClick={fetchAttendance} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                        {['Roll No', 'Name', 'Course', 'Date', 'Time', 'Fee Status', 'Action'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records yet. Start scanning!</td></tr>
                      ) : attendance.map(rec => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>{rec.rollNo}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{rec.studentName}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{rec.course}</td>
                          <td style={{ padding: '10px 12px' }}>{rec.date}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{new Date(rec.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge badge-${rec.feePaid ? 'connected' : 'pending'}`}>
                              {rec.feePaid ? '✅ Paid' : '⚠️ Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button onClick={async () => { await fetch(`${API_BASE}/api/attendance/${rec.id}`, { method: 'DELETE' }); fetchAttendance(); }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Left Panel: Bot configurations */}
                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>Bot Configurations</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Active Auto-Reply Bot</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Control whether the bot should auto-answer customer queries.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.botActive}
                      onChange={(e) => setSettings({ ...settings, botActive: e.target.checked })}
                      style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>Escalation Phone Contact</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>The number provided when a student requests human support.</p>
                    <input
                      type="text"
                      required
                      value={settings.escalationContact}
                      onChange={(e) => setSettings({ ...settings, escalationContact: e.target.value })}
                      className="glass-input"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>Default Greeting Message</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Introduces the institute when a conversation session resets.</p>
                    <textarea
                      required
                      rows={4}
                      value={settings.greetingText}
                      onChange={(e) => setSettings({ ...settings, greetingText: e.target.value })}
                      className="glass-input"
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>

                {/* Right Panel: Agent Prompt Settings */}
                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>AI Counselor Prompt</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>System Instruction Prompt</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Define AI Counselor's personality, knowledge and rules. Use <code>{"{{courses}}"}</code> to insert the course catalog automatically.
                    </p>
                    <textarea
                      required
                      rows={12}
                      value={settings.agentSystemPrompt || ''}
                      onChange={(e) => setSettings({ ...settings, agentSystemPrompt: e.target.value })}
                      className="glass-input"
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', flex: 1, minHeight: '260px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Stamp & Signature Upload Panel */}
              <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>
                  🖋️ Fee Slip — Official Stamp &amp; Admin Signature
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                  Upload once — these images will automatically appear on every fee slip. Use <strong>transparent background PNG</strong> for best results.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

                  {/* Official Stamp */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>📮 Official Stamp</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-6px' }}>Appears in the stamp circle on the fee slip.</p>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', border: '2.5px dashed var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.06)', overflow: 'hidden' }}>
                      {settings.adminStampImage
                        ? <img src={settings.adminStampImage} alt="Stamp Preview" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                        : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>No stamp uploaded</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <label htmlFor="stamp-upload-input" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        ⬆️ Upload Stamp
                      </label>
                      <input id="stamp-upload-input" type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          const form = new FormData(); form.append('stamp', file);
                          const res = await fetch(`${API_BASE}/api/upload/stamp`, { method: 'POST', body: form });
                          if (res.ok) { const updated = await fetch(`${API_BASE}/api/settings`).then(r => r.json()); setSettings(updated); showToast('✅ Stamp uploaded!'); }
                          else showToast('❌ Upload failed', 'error');
                          e.target.value = '';
                        }} />
                      {settings.adminStampImage && (
                        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={async () => {
                            await fetch(`${API_BASE}/api/upload/stamp`, { method: 'DELETE' });
                            const updated = await fetch(`${API_BASE}/api/settings`).then(r => r.json());
                            setSettings(updated); showToast('🗑️ Stamp removed');
                          }}>Remove</button>
                      )}
                    </div>
                  </div>

                  {/* Admin Signature */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>✍️ Admin Signature</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-6px' }}>Appears above the Admin Signature line on the fee slip.</p>
                    <div style={{ width: 180, height: 70, borderRadius: 8, border: '1.5px dashed var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                      {settings.adminSignImage
                        ? <img src={settings.adminSignImage} alt="Signature Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        : <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>No signature uploaded</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <label htmlFor="sign-upload-input" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        ⬆️ Upload Signature
                      </label>
                      <input id="sign-upload-input" type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return;
                          const form = new FormData(); form.append('sign', file);
                          const res = await fetch(`${API_BASE}/api/upload/sign`, { method: 'POST', body: form });
                          if (res.ok) { const updated = await fetch(`${API_BASE}/api/settings`).then(r => r.json()); setSettings(updated); showToast('✅ Signature uploaded!'); }
                          else showToast('❌ Upload failed', 'error');
                          e.target.value = '';
                        }} />
                      {settings.adminSignImage && (
                        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={async () => {
                            await fetch(`${API_BASE}/api/upload/sign`, { method: 'DELETE' });
                            const updated = await fetch(`${API_BASE}/api/settings`).then(r => r.json());
                            setSettings(updated); showToast('🗑️ Signature removed');
                          }}>Remove</button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Panel: Intent / Auto-Response Rules Builder */}

              <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border-muted)', paddingBottom: '12px' }}>Direct Auto-Reply Q&A Rules</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                  Define specific keywords or phrases that trigger an instant, exact auto-response bypassing the AI.
                </p>

                {/* Add Rule Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr auto', gap: '12px', alignItems: 'end', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px dashed var(--border-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Keyword Trigger *</label>
                    <input
                      type="text"
                      placeholder="e.g. scholarship"
                      value={newRuleKeyword}
                      onChange={e => setNewRuleKeyword(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Auto-Response Answer *</label>
                    <input
                      type="text"
                      placeholder="e.g. We offer up to 50% merit scholarships. Visit our campus to apply!"
                      value={newRuleResponse}
                      onChange={e => setNewRuleResponse(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAgentRule}
                    className="btn-primary"
                    style={{ padding: '12px 20px', height: '42px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Rule
                  </button>
                </div>

                {/* Rules Table */}
                <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, width: '25%' }}>Keyword (If message contains)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Instant Answer Response</th>
                        <th style={{ padding: '10px 12px', width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!settings.agentRules || settings.agentRules.length === 0) ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No custom direct reply rules defined. Messages will go directly to the AI Counselor.
                          </td>
                        </tr>
                      ) : (
                        settings.agentRules.map((rule) => (
                          <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{rule.keyword}</td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rule.response}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeAgentRule(rule.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={20} /> Danger Zone
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>Reset Application Database</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Permanently delete all student registrations, leads list, chat history, and generated fee slips. Course data and system settings will remain unaffected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllData}
                    className="btn-secondary"
                    style={{
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={16} /> Clear All Data
                  </button>
                </div>
              </div>

              {/* Save All Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={saveSettingsData} className="btn-primary" style={{ padding: '12px 32px' }}>
                  💾 Save All Configurations
                </button>
              </div>
            </div>
          )}

          {/* ── FEE SLIP GENERATOR TAB ── */}
          {activeTab === 'fee-slip' && (() => {
            const total = parseFloat((feeSlipForm.totalFee || '0').toString().replace(/[^0-9.]/g, '')) || 0;
            const paid  = parseFloat((feeSlipForm.amountPaid || '0').toString().replace(/[^0-9.]/g, '')) || 0;
            const balance = total - paid;
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => setSlipView('form')} className={slipView === 'form' ? 'btn-primary' : 'btn-secondary'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}>
                    <FileText size={15} /> Generate New Slip
                  </button>
                  <button onClick={() => setSlipView('history')} className={slipView === 'history' ? 'btn-primary' : 'btn-secondary'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}>
                    <Eye size={15} /> History ({feeSlips.length})
                  </button>
                  <button onClick={() => setShowCustomCSS(v => !v)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', marginLeft: 'auto' }}>
                    <Edit3 size={15} /> {showCustomCSS ? 'Hide' : 'Edit'} Slip Style
                  </button>
                </div>

                {/* HTML + CSS Dual Editor */}
                {showCustomCSS && (
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <button onClick={() => setHtmlEditorTab('css')} className={htmlEditorTab === 'css' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 18px', fontSize: '0.82rem' }}>🎨 CSS</button>
                      <button onClick={() => setHtmlEditorTab('html')} className={htmlEditorTab === 'html' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 18px', fontSize: '0.82rem' }}>🏗️ HTML</button>
                      <button onClick={saveSlipStyle} className="btn-primary" style={{ padding: '6px 18px', fontSize: '0.82rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', borderColor: '#059669', color: '#fff' }}>
                        💾 Save Template
                      </button>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {htmlEditorTab === 'html'
                          ? 'Available variables: {{studentName}} {{studentId}} {{fatherName}} {{course}} {{feePeriod}} {{monthlyFee}} {{amountPaid}} {{balance}} {{paymentMethod}} {{slipNumber}} {{date}} {{time}} {{remarks}} {{logoSrc}}'
                          : 'Edit CSS class styles — changes reflect in preview instantly.'}
                      </span>
                    </div>
                    {htmlEditorTab === 'css' && (
                      <textarea value={customSlipCSS} onChange={e => setCustomSlipCSS(e.target.value)} className="glass-input"
                        style={{ width: '100%', minHeight: '220px', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
                    )}
                    {htmlEditorTab === 'html' && (
                      <textarea value={customSlipHTML} onChange={e => setCustomSlipHTML(e.target.value)} className="glass-input"
                        style={{ width: '100%', minHeight: '380px', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
                    )}
                  </div>
                )}

                {/* Form + Preview */}
                {slipView === 'form' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>

                    {/* Form */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={18} style={{ color: 'var(--color-primary)' }} /> Student & Fee Details
                      </h3>
                      {[
                        { key: 'studentName', label: 'Student Name *', placeholder: 'Muhammad Hassan' },
                        { key: 'studentId',   label: 'Student ID',      placeholder: 'TSS-1234 (optional)' },
                        { key: 'fatherName',  label: "Father's Name",   placeholder: 'e.g. Ahmad Khan' },
                      ].map(f => (
                        <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</label>
                          <input className="glass-input" placeholder={f.placeholder} value={feeSlipForm[f.key]}
                            onChange={e => setFeeSlipForm(p => ({ ...p, [f.key]: e.target.value }))} />
                        </div>
                      ))}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Enrolled *</label>
                        <select className="glass-input" value={feeSlipForm.course}
                          onChange={e => handleCourseChange(e.target.value)}>
                          <option value="">-- Select Course --</option>
                          {courses.map(c => <option key={c.id} value={c.name}>{c.name} — Monthly: {c.installment}</option>)}
                          <option value="custom">Custom / Other</option>
                        </select>
                        {feeSlipForm.course === 'custom' && (
                          <input className="glass-input" placeholder="Enter custom course name" style={{ marginTop: '6px' }}
                            onChange={e => setFeeSlipForm(p => ({ ...p, course: e.target.value }))} />
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                        <input
                          type="checkbox"
                          id="isOneShot"
                          checked={feeSlipForm.isOneShot || false}
                          onChange={e => handleOneShotToggle(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="isOneShot" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          💵 Full Course One-Shot Payment (25% Auto Discount)
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fee Period *</label>
                        <input className="glass-input" placeholder="e.g. June 2025 / Month 1 of 3" value={feeSlipForm.feePeriod}
                          onChange={e => setFeeSlipForm(p => ({ ...p, feePeriod: e.target.value }))} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {feeSlipForm.isOneShot ? 'Discounted Full Fee (PKR) *' : 'Monthly Fee (PKR) *'}
                          </label>
                          <input className="glass-input" placeholder="30000" type="number" value={feeSlipForm.totalFee}
                            onChange={e => setFeeSlipForm(p => ({ ...p, totalFee: e.target.value }))} />
                          {feeSlipForm.isOneShot && (() => {
                            const sel = courses.find(c => c.name === feeSlipForm.course);
                            if (sel) {
                              return (
                                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                                  🎉 25% Off applied on original fee of {sel.fee} (Saved: PKR {(parseFloat(sel.fee.replace(/[^0-9]/g, '')) * 0.25).toLocaleString()})
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount Paid (PKR) *</label>
                          <input className="glass-input" placeholder="10000" type="number" value={feeSlipForm.amountPaid}
                            onChange={e => setFeeSlipForm(p => ({ ...p, amountPaid: e.target.value }))} />
                        </div>
                      </div>

                      {(total > 0 || paid > 0) && (
                        <div style={{ background: balance <= 0 ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.1)', border: `1px solid ${balance <= 0 ? '#16a34a' : '#dc2626'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '0.88rem', fontWeight: 700, color: balance <= 0 ? '#16a34a' : '#dc2626' }}>
                          {balance <= 0 ? '✅ Fee Fully Cleared' : `⚠️ Remaining Balance: PKR ${balance.toLocaleString()}`}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Method</label>
                        <select className="glass-input" value={feeSlipForm.paymentMethod}
                          onChange={e => setFeeSlipForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                          <option>Cash</option>
                          <option>Bank Transfer</option>
                          <option>EasyPaisa</option>
                          <option>JazzCash</option>
                          <option>Cheque</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Remarks (Optional)</label>
                        <textarea className="glass-input" rows={2} style={{ resize: 'none' }}
                          placeholder="e.g. Partial payment — next monthly fee due July 1..."
                          value={feeSlipForm.remarks} onChange={e => setFeeSlipForm(p => ({ ...p, remarks: e.target.value }))} />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                          onClick={async () => { const s = await saveFeeSlip(); if (s) printFeeSlip(s); }}>
                          <Printer size={16} /> Save & Print
                        </button>
                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 14px' }}
                          onClick={() => printFeeSlip(feeSlipForm)}>
                          <Eye size={15} /> Preview
                        </button>
                      </div>
                    </div>

                    {/* Live Preview — iframe driven by template */}
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>📄 Live Preview</h3>
                      <div style={{ background: '#e8edf5', borderRadius: '10px', padding: '10px', overflow: 'hidden' }}>
                        <iframe
                          srcDoc={buildSlipDoc(feeSlipForm, 'SLIP-PREVIEW', '/tss-logo.png')}
                          style={{ width: '100%', height: '640px', border: 'none', borderRadius: '6px', background: '#fff' }}
                          title="Fee Slip Preview"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* History Table */}
                {slipView === 'history' && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>📋 Fee Slip History</h3>
                    {feeSlips.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                        <Receipt size={44} style={{ opacity: 0.25, marginBottom: '12px' }} />
                        <p style={{ fontWeight: 600 }}>No fee slips generated yet.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Switch to "Generate New Slip" to create your first receipt.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                              {['Slip No','Student','Course','Period','Total Fee','Paid','Balance','Method','Date',''].map((h,i) => (
                                <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {feeSlips.map(slip => {
                              const t = parseFloat((slip.totalFee||'0').toString().replace(/[^0-9.]/g,''))||0;
                              const p2 = parseFloat((slip.amountPaid||'0').toString().replace(/[^0-9.]/g,''))||0;
                              const b = t - p2;
                              return (
                                <tr key={slip.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>{slip.slipNumber}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{slip.studentName}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slip.course}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{slip.feePeriod}</td>
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>PKR {Number(slip.totalFee).toLocaleString()}</td>
                                  <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>PKR {Number(slip.amountPaid).toLocaleString()}</td>
                                  <td style={{ padding: '10px 12px', color: b<=0?'#16a34a':'#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>{b<=0?'✅ Cleared':`PKR ${b.toLocaleString()}`}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{slip.paymentMethod}</td>
                                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{new Date(slip.generatedAt).toLocaleDateString('en-PK')}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => printFeeSlip(slip)}><Printer size={12}/> Print</button>
                                      <button style={{ padding: '5px 8px', fontSize: '0.76rem', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: '6px', cursor: 'pointer' }}
                                        onClick={() => deleteFeeSlipRecord(slip.id)}><Trash2 size={12}/></button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

        </section>
      </main>

      {/* Global CSS spinner animations */}
      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
