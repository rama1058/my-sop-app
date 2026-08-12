import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './Login';
import SopFormModal from './SopFormModal';
import html2pdf from 'html2pdf.js';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Send, 
  FileText,
  UserCheck,
  UserX,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  X,
  Download,
  Share2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Printer,
  History,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App Navigation & Search
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'reader' | 'audit_log'
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [sops, setSops] = useState([]);
  const [selectedSop, setSelectedSop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSignOffs, setUserSignOffs] = useState([]);

  // Analytics Real-time State
  const [teamComplianceRate, setTeamComplianceRate] = useState(0);
  const [pendingStaffList, setPendingStaffList] = useState([]);
  const [compliantStaffCount, setCompliantStaffCount] = useState(0);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Modal Admin
  const [isSopModalOpen, setIsSopModalOpen] = useState(false);
  const [editingSop, setEditingSop] = useState(null);

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user);
      else {
        setCurrentUser(null);
        setIsAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, departments(name)')
        .eq('email', authUser.email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentUser(data);
      } else {
        setCurrentUser({
          id: authUser.id,
          full_name: authUser.email.split('@')[0],
          role: 'Staff',
          departments: { name: 'Operasional' }
        });
      }
    } catch (err) {
      console.error('Error profile fetch:', err.message);
    } finally {
      setIsAuthChecking(false);
    }
  };

  // FETCH ALL DATA
  const loadData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch SOPs
      const { data: sopData, error: sopError } = await supabase
        .from('sops')
        .select('*, departments(name)')
        .order('created_at', { ascending: false });
      if (sopError) throw sopError;

      // 2. Fetch User Sign-offs
      const { data: signData, error: signError } = await supabase
        .from('sign_offs')
        .select('*')
        .eq('user_id', currentUser.id);
      if (signError) throw signError;

      // 3. Fetch Analytics
      const { data: analyticsData } = await supabase
        .from('user_compliance_summary')
        .select('*');

      if (analyticsData) {
        const total = analyticsData.reduce((acc, curr) => acc + Number(curr.compliance_percentage || 0), 0);
        const avgRate = analyticsData.length > 0 ? Math.round(total / analyticsData.length) : 0;
        setTeamComplianceRate(avgRate);

        const pendingList = analyticsData.filter(item => item.compliance_percentage < 100);
        setPendingStaffList(pendingList);

        const compliantCount = analyticsData.filter(item => item.compliance_percentage >= 100).length;
        setCompliantStaffCount(compliantCount);
      }

      // 4. Fetch All Sign-Off Logs for Audit History
      const { data: logData } = await supabase
        .from('sign_offs')
        .select('*, users(full_name, email), sops(title, code)')
        .order('signed_at', { ascending: false });
      
      setAuditLogs(logData || []);

      setSops(sopData || []);
      setUserSignOffs(signData || []);
    } catch (err) {
      console.error('Error loading Supabase data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser]);

  // Animasi Counter
  useEffect(() => {
    let start = 0;
    const end = teamComplianceRate;
    const duration = 1000;
    const incrementTime = end > 0 ? duration / end : 10;

    const timer = setInterval(() => {
      start += 1;
      setCounter(start);
      if (start >= end) {
        setCounter(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [teamComplianceRate, currentScreen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleConfirmSignOff = async () => {
    if (!selectedSop || !currentUser) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('sign_offs').insert([
        {
          sop_id: selectedSop.id,
          user_id: currentUser.id,
          signed_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSop = async (e, sopId) => {
    e.stopPropagation();
    if (!window.confirm('Apakah kamu yakin ingin menghapus SOP ini?')) return;

    try {
      const { error } = await supabase.from('sops').delete().eq('id', sopId);
      if (error) throw error;
      await loadData();
    } catch (err) {
      alert('Gagal menghapus SOP: ' + err.message);
    }
  };

  // FITUR CETAK / DOWNLOAD PDF SOP
  const handleDownloadPDF = () => {
    const element = document.getElementById('sop-print-area');
    if (!element) return;

    const opt = {
      margin:       0.5,
      filename:     `${selectedSop.code}_${selectedSop.title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  // FITUR EXPORT REKAP CSV (ADMIN)
  const handleExportCSV = () => {
    if (auditLogs.length === 0) {
      alert('Belum ada data audit trail untuk diexport.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Waktu Sign-Off,Nama Staf,Email,Kode SOP,Judul SOP\n";

    auditLogs.forEach((log) => {
      const time = new Date(log.signed_at).toLocaleString('id-ID');
      const name = `"${log.users?.full_name || '-'}"`;
      const email = `"${log.users?.email || '-'}"`;
      const code = `"${log.sops?.code || '-'}"`;
      const title = `"${log.sops?.title || '-'}"`;
      csvContent += `${time},${name},${email},${code},${title}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Kepatuhan_SOP_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSopSigned = (sopId) => userSignOffs.some(sign => sign.sop_id === sopId);

  const getSignedDate = (sopId) => {
    const record = userSignOffs.find(sign => sign.sop_id === sopId);
    if (!record) return null;
    return new Date(record.signed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs text-slate-500 font-medium">Memeriksa Sesi Autentikasi...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentScreen('dashboard')}>
              <div className="w-9 h-9 bg-slate-900 group-hover:bg-emerald-600 transition-colors rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md">
                S
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">SOP-HUB</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Knowledge Base</span>
              </div>
            </div>

            {/* TAB NAVIGASI KHUSUS ADMIN */}
            {currentUser?.role === 'Admin' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentScreen === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button
                  onClick={() => setCurrentScreen('audit_log')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentScreen === 'audit_log' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Audit Log
                </button>
              </div>
            )}
          </div>

          {/* SEARCH BAR REALTIME */}
          <div className="relative hidden md:block w-96">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP, kode, atau instruksi..." 
              className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-500">
                  <span className={currentUser?.role === 'Admin' ? 'text-indigo-600 font-bold' : ''}>
                    {currentUser?.role || 'Staff'}
                  </span> • {currentUser?.departments?.name || 'Operasional'}
                </p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors cursor-pointer" 
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD SCREEN */}
      {currentScreen === 'dashboard' && (
        <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          
          {/* STATS HERO */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Total Kepatuhan Tim Real-Time
              </span>

              <div className="text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 py-1">
                {counter}%
              </div>

              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Rata-rata persentase staf yang telah membaca & menyetujui dokumen SOP wajib saat ini.
              </p>
            </div>
          </div>

          {/* DYNAMIC ACTION BANNER */}
          {sops.length > 0 && (
            <div className="relative bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{sops[0]?.title}</h2>
                    <span className="px-2.5 py-0.5 bg-amber-200/60 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Wajib Sign-Off
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Dokumen prioritas tinggi. Pastikan kamu telah membaca dan melakukan konfirmasi pemahaman.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setSelectedSop(sops[0]);
                  setCurrentScreen('reader');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                Baca SOP Sekarang <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* GRID KOLEKSI & SIDEBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Koleksi Dokumen SOP
                  </h3>

                  {currentUser?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setEditingSop(null);
                        setIsSopModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah SOP
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs">
                  {['Semua', 'Operasional', 'Keuangan', 'Pelayanan'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer ${
                        activeFilter === filter 
                          ? 'bg-white text-slate-900 shadow-sm font-semibold' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <p className="text-xs">Memuat data dari Supabase...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sops
                    .filter(s => activeFilter === 'Semua' || s.departments?.name === activeFilter)
                    .filter(s => 
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.content.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((sop) => {
                      const signed = isSopSigned(sop.id);
                      return (
                        <div 
                          key={sop.id} 
                          onClick={() => {
                            setSelectedSop(sop);
                            setCurrentScreen('reader');
                          }}
                          className="p-4 bg-slate-50/50 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl flex items-center justify-between gap-4 group transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">
                              {sop.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 text-[11px] font-medium">
                                {sop.departments?.name || 'Umum'}
                              </span>
                              <span className="font-mono text-[11px]">{sop.code}</span>
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3" /> v{sop.version}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {signed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Signed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
                              </span>
                            )}

                            {currentUser?.role === 'Admin' && (
                              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSop(sop);
                                    setIsSopModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit SOP"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSop(e, sop.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus SOP"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>

            {/* SIDEBAR ANALYTICS */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-500" />
                  Belum Membaca ({pendingStaffList.length} Staf)
                </h4>

                {pendingStaffList.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    ✓ Seluruh staf telah membaca dokumen wajib!
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {pendingStaffList.map((staff) => (
                      <div key={staff.user_id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-800">{staff.full_name}</p>
                          <p className="text-[11px] text-slate-400">{staff.department_name || 'Operasional'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {staff.compliance_percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Sudah 100% Membaca ({compliantStaffCount} Staf)
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Staf yang sudah menyelesaikan seluruh konfirmasi SOP wajib.
                </p>
              </div>

              {currentUser?.role === 'Admin' && (
                <button 
                  onClick={handleExportCSV}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Export Rekap Audit (CSV)
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 2: BACA SOP & CETAK PDF */}
      {currentScreen === 'reader' && selectedSop && (
        <div className="animate-in fade-in duration-300 pb-32">
          <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Cetak PDF"
                >
                  <Printer className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>

          <main id="sop-print-area" className="max-w-4xl mx-auto px-4 md:px-8 pt-8 space-y-8 bg-white my-4 p-8 rounded-2xl border border-slate-200/60">
            <div className="space-y-4 border-b border-slate-200 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
                  {selectedSop.departments?.name || 'Operasional'}
                </span>
                {isSopSigned(selectedSop.id) ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Signed ({getSignedDate(selectedSop.id)})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Mandatory Sign-Off
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedSop.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <p>Kode: <span className="font-mono text-slate-700 font-medium">{selectedSop.code}</span></p>
                <p>•</p>
                <p>Versi: <span className="text-slate-700 font-medium">{selectedSop.version}</span></p>
              </div>
            </div>

            <article className="p-2 text-slate-700 leading-relaxed text-sm whitespace-pre-line">
              {selectedSop.content}
            </article>
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-4 shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isSopSigned(selectedSop.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  {isSopSigned(selectedSop.id) ? <UserCheck className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {isSopSigned(selectedSop.id) ? 'Konfirmasi Pemahaman Terverifikasi' : 'Pernyataan Kepatuhan Staf'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isSopSigned(selectedSop.id) ? `Dikonfirmasi oleh ${currentUser?.full_name}` : 'Selesaikan membaca sebelum konfirmasi.'}
                  </p>
                </div>
              </div>

              <div>
                {isSopSigned(selectedSop.id) ? (
                  <button disabled className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Terkonfirmasi
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" /> Saya Sudah Membaca & Memahami
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: TAB AUDIT TRAIL LOG (ADMIN ONLY) */}
      {currentScreen === 'audit_log' && currentUser?.role === 'Admin' && (
        <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Audit Trail History</h1>
              <p className="text-xs text-slate-500">Catatan riwayat aktivitas konfirmasi & sign-off staf secara resmi.</p>
            </div>
            
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV Laporan
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">Waktu Sign-Off</th>
                  <th className="p-4">Staf</th>
                  <th className="p-4">Kode SOP</th>
                  <th className="p-4">Judul Dokumen SOP</th>
                  <th className="p-4 text-right">Status Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Belum ada riwayat sign-off yang tercatat.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-500 font-mono">
                        {new Date(log.signed_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {log.users?.full_name || 'Staf'}
                        <span className="block text-[10px] text-slate-400 font-normal">{log.users?.email}</span>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-600">
                        {log.sops?.code || '-'}
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        {log.sops?.title || '-'}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Audit
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* MODAL SIGN OFF */}
      {isModalOpen && selectedSop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Konfirmasi Sign-Off</h3>
                  <p className="text-xs text-slate-400">Audit Trail Supabase Auth</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                Dengan menekan tombol di bawah, kamu (<strong className="text-slate-900">{currentUser?.full_name}</strong>) menyatakan secara sadar telah membaca dan memahami <strong className="text-slate-900">{selectedSop.title}</strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer">
                Batal
              </button>
              <button 
                onClick={handleConfirmSignOff} 
                disabled={isSubmitting}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi & Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN */}
      <SopFormModal
        isOpen={isSopModalOpen}
        onClose={() => {
          setIsSopModalOpen(false);
          setEditingSop(null);
        }}
        onRefresh={loadData}
        editData={editingSop}
      />

    </div>
  );
}