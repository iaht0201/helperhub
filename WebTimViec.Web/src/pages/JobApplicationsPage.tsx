import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Users, ArrowLeft, Phone, Mail, 
    Calendar, MapPin, CheckCircle2, 
    XCircle, ShieldCheck,
    CreditCard, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi, applicationApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Applicant {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    age?: number;
    gender?: string;
    skills?: string;
    experience?: string;
}

interface Application {
    id: string;
    applicantId: string;
    applicant: Applicant;
    status: string;
    createdAt: string;
}

const JobApplicationsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [applications, setApplications] = useState<Application[]>([]);
    const [suggestions, setSuggestions] = useState<Applicant[]>([]);
    const [job, setJob] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewedContactId, setViewedContactId] = useState<string | null>(null);
    const [statusConfirm, setStatusConfirm] = useState<{ id: string, status: string } | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [jobRes, appsRes, suggestionsRes] = await Promise.all([
                    jobApi.getJobById(id!),
                    applicationApi.getJobApplications(id!),
                    jobApi.suggestWorkers(id!)
                ]);
                
                setJob(jobRes.data);
                setApplications(appsRes.data);
                setSuggestions(suggestionsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) return <div className="pt-40 text-center font-semibold uppercase tracking-widest text-slate-300 animate-pulse">Đang tải danh sách ứng viên...</div>;
    if (!job) return <div className="pt-40 text-center font-semibold uppercase text-red-500">Không tìm thấy công việc!</div>;

    const isSubscribed = user?.role === 'Admin' || user?.isSubscribed || false;

    const handleViewContact = (applicantId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!isSubscribed) {
            toast.error('Bạn cần nâng cấp gói để xem đầy đủ thông tin liên hệ!');
            return;
        }
        setViewedContactId(applicantId);
    };

    const handleUpdateStatus = async (appId: string, status: string) => {
        try {
            await applicationApi.updateStatus(appId, status);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
            setStatusConfirm(null);
            toast.success(status === 'Accepted' ? 'Đã chấp nhận ứng viên' : 'Đã từ chối ứng viên');
        } catch (error) {
            toast.error('Cập nhật thất bại');
        }
    };

    return (
        <div className="w-full">
            {/* Header Sticky */}
            <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-3xl border-b border-slate-100 py-5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center space-x-6 w-full md:w-auto">
                        <button onClick={() => navigate('/dashboard')} className="p-3.5 bg-slate-50 text-slate-500 hover:text-orange-600 rounded-2xl transition-all border border-slate-100 shadow-sm">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-semibold text-zinc-900 uppercase tracking-tighter">Ứng viên: {job.title}</h2>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${job.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {job.isActive ? 'Đang tuyển' : 'Đã đóng'}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Users size={12} className="text-orange-500" /> {applications.length} người đã gửi hồ sơ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link to={`/jobs/${job.id}`} className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-600 hover:bg-zinc-950 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 text-center">
                            Xem tin gốc
                        </Link>
                        <button onClick={() => toast.error('Tính năng đang phát triển')} className="flex-1 md:flex-none px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 text-center">
                            Sửa tin đăng
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {!isSubscribed && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-950 p-8 rounded-[2.5rem] mb-12 relative overflow-hidden group shadow-2xl shadow-orange-950/20 border border-zinc-800"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform scale-150">
                            <Sparkles size={120} className="text-orange-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30 shrink-0">
                                    <ShieldCheck size={32} className="text-white" />
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-xl md:text-2xl font-semibold uppercase tracking-tighter text-white mb-2">Nhà tuyển dụng Professional</h3>
                                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest max-w-sm">Mở khóa thông tin liên hệ không giới hạn và nhận diện ứng viên tiềm năng nhanh chóng.</p>
                                </div>
                            </div>
                            <Link to="/subscription" className="w-full md:w-auto px-10 py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                                <CreditCard size={18} /> Nâng cấp ngay
                            </Link>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {applications.length > 0 ? (
                        applications.map((app) => (
                            <motion.div 
                                key={app.id}
                                layout
                                className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-2xl hover:shadow-orange-600/5 group relative overflow-hidden"
                            >
                                <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                                    {/* Candidate Main Info */}
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white rounded-[2rem] flex items-center justify-center text-3xl font-semibold text-slate-300 group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white transition-all shadow-xl">
                                                {app.applicant.fullName.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center">
                                                <ShieldCheck size={16} className="text-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-xl font-semibold text-zinc-900 uppercase tracking-tight">{app.applicant.fullName}</h4>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' : 
                                                    app.status === 'Rejected' ? 'bg-red-50 text-red-400' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {app.status === 'Pending' ? 'Đang chờ duyệt' : 
                                                     app.status === 'Accepted' ? 'Phù hợp & Đã liên hệ' : 'Không phù hợp'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                                                {app.applicant.skills || 'Kỹ năng: Chưa cập nhật danh mục quan tâm'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-orange-500" /> {app.applicant.age || '??'} tuổi</span>
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {app.applicant.address?.split(',').pop()?.trim() || 'Khu vực khác'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Section - Progressive View */}
                                    <div className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 md:min-w-[260px] flex flex-col gap-3">
                                        <div className="flex items-center justify-between group/contact">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover/contact:text-orange-500 transition-colors">
                                                    <Phone size={14} />
                                                </div>
                                                <span className="text-xs font-bold tracking-[0.2em] text-zinc-900">
                                                    {(isSubscribed || viewedContactId === app.applicant.id) ? (app.applicant.phone || '09**********') : '•••• ••• •••'}
                                                </span>
                                            </div>
                                            {!isSubscribed && viewedContactId !== app.applicant.id && (
                                                <button 
                                                    onClick={() => handleViewContact(app.applicant.id)}
                                                    className="w-8 h-8 rounded-xl hover:bg-orange-100 flex items-center justify-center transition-all"
                                                >
                                                    <CreditCard size={14} className="text-orange-500" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold tracking-tight text-slate-400 lowercase truncate max-w-[150px]">
                                                {(isSubscribed || viewedContactId === app.applicant.id) ? (app.applicant.email || '••••••••@gmail.com') : '••••••••••••'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                        <button 
                                            onClick={() => setStatusConfirm({ id: app.id, status: 'Accepted' })}
                                            className="flex-1 py-4 px-6 bg-zinc-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-3 active:scale-95 whitespace-nowrap"
                                        >
                                            <CheckCircle2 size={16} /> Phù hợp
                                        </button>
                                        <button 
                                            onClick={() => setStatusConfirm({ id: app.id, status: 'Rejected' })}
                                            className="px-4 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <XCircle size={16} /> Loại
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                             <Users size={80} className="mx-auto text-slate-100 mb-8" />
                             <h3 className="text-2xl font-semibold text-slate-300 uppercase  tracking-tighter">Chưa có ứng viên nào</h3>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Tin đăng của bạn đang được duyệt và hiển thị</p>
                        </div>
                    )}
                </div>

                {/* Suggestions Section */}
                <div className="mt-24 space-y-12">
                    <div className="flex items-center gap-4">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-100"></div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-orange-600 flex items-center gap-2">
                             <Sparkles size={16} /> Gợi ý ứng viên tiềm năng
                        </h3>
                        <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-100"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {suggestions.map((s) => (
                            <motion.div 
                                key={s.id}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-xl flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-center text-2xl font-semibold text-slate-300 group-hover:bg-zinc-900 group-hover:text-white transition-all mb-6">
                                    {s.fullName.charAt(0)}
                                </div>
                                <h4 className="text-xl font-semibold text-zinc-900 uppercase tracking-tight mb-2">{s.fullName}</h4>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-4">
                                    <span>{s.age || '??'} Tuổi</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{s.address || 'Khu vực khác'}</span>
                                </div>
                                
                                <div className="w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-8 text-left space-y-3">
                                   <div className="flex items-center gap-3">
                                        <Phone size={14} className="text-slate-300" />
                                        <span className="text-[10px] font-bold tracking-widest">
                                            {(isSubscribed || viewedContactId === s.id) ? (s.phone || '090xxxxxxx') : '•••• ••• •••'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={14} className="text-slate-300" />
                                        <span className="text-[10px] font-bold tracking-widest lowercase">
                                            {(isSubscribed || viewedContactId === s.id) ? (s.email || '••••••••••••') : '••••••••••••'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => handleViewContact(s.id)}
                                        className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all"
                                    >
                                        Liên hệ ngay
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {statusConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setStatusConfirm(null)}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl overflow-hidden"
                        >
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto ${statusConfirm.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {statusConfirm.status === 'Accepted' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                            </div>
                            <h3 className="text-2xl font-semibold text-zinc-900 text-center uppercase tracking-tighter mb-4">
                                Xác nhận {statusConfirm.status === 'Accepted' ? 'phù hợp' : 'từ chối'}?
                            </h3>
                            <p className="text-slate-500 text-sm text-center font-semibold mb-10">
                                {statusConfirm.status === 'Accepted' 
                                    ? 'Ứng viên sẽ nhận được thông báo về sự quan tâm của bạn. Đừng quên liên lạc với họ qua số điện thoại!' 
                                    : 'Hồ sơ này sẽ bị đánh dấu là không phù hợp và không hiển thị trong danh sách tiềm năng.'}
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setStatusConfirm(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(statusConfirm.id, statusConfirm.status)}
                                    className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${statusConfirm.status === 'Accepted' ? 'bg-orange-600 shadow-orange-600/20' : 'bg-zinc-900 shadow-zinc-950/20'}`}
                                >
                                    Đồng ý
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default JobApplicationsPage;
