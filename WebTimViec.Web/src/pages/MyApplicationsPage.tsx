import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    FileText, MapPin, DollarSign, Clock, 
    ChevronRight, Loader2, Search,
    CheckCircle, XCircle, Clock4, Phone,
    Bell, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationApi } from '../api';
import toast from 'react-hot-toast';

interface Application {
    id: string;
    jobPostId: string;
    jobPost: {
        id: string;
        title: string;
        location: string;
        salary: number;
    };
    status: string;
    createdAt: string;
}

interface Invitation {
    id: string;
    jobPostId: string;
    jobPost: {
        id: string;
        title: string;
        location: string;
        salary: number;
        user?: {
            fullName: string;
            phone: string;
        };
    };
    status: string;
    createdAt: string;
}

const MyApplicationsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'applied' | 'invitations'>('applied');
    const [applications, setApplications] = useState<Application[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appsRes, invRes] = await Promise.all([
                    applicationApi.getMyApplications(),
                    applicationApi.getMyInvitations()
                ]);
                setApplications(appsRes.data);
                setInvitations(invRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
                toast.error('Không thể tải dữ liệu');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Accepted':
                return (
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                        <CheckCircle size={12} /> Được chấp nhận
                    </span>
                );
            case 'Rejected':
                return (
                    <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
                        <XCircle size={12} /> Đã từ chối
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                        <Clock4 size={12} /> Đang chờ duyệt
                    </span>
                );
        }
    };

    const maskPhone = (phone: string) => {
        if (!phone || phone.length < 8) return phone;
        const visible = phone.slice(-4);
        return `***-***-${visible}`;
    };

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-zinc-900 uppercase tracking-tighter flex items-center gap-3">
                            <FileText className="text-orange-600" size={32} /> Việc làm của tôi
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                            Theo dõi trạng thái ứng tuyển và lời mời làm việc
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-1.5 rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('applied')}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold uppercase text-xs tracking-widest transition-all ${
                            activeTab === 'applied'
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                        }`}
                    >
                        <Send size={16} />
                        Việc đã ứng tuyển
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                            activeTab === 'applied' ? 'bg-white/20' : 'bg-slate-200'
                        }`}>
                            {applications.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('invitations')}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold uppercase text-xs tracking-widest transition-all ${
                            activeTab === 'invitations'
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                        }`}
                    >
                        <Bell size={16} />
                        Lời mời làm việc
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                            activeTab === 'invitations' ? 'bg-white/20' : 'bg-slate-200'
                        }`}>
                            {invitations.length}
                        </span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100"
                    >
                        <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                    </motion.div>
                ) : activeTab === 'applied' ? (
                    <motion.div
                        key="applied"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {applications.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
                                    <Search className="text-slate-200" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-tight">Bạn chưa ứng tuyển công việc nào</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-8">
                                    Khám phá hàng ngàn cơ hội việc làm hấp dẫn ngay hôm nay.
                                </p>
                                <Link 
                                    to="/jobs" 
                                    className="inline-flex items-center space-x-2 bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl hover:bg-zinc-950 transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-[11px] uppercase tracking-widest"
                                >
                                    Khám phá công việc
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {applications.map((app, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={app.id} 
                                        className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-600/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-start justify-between md:justify-start gap-4">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-zinc-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight mb-2">
                                                            {app.jobPost.title}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-orange-600" /> {app.jobPost.location}</span>
                                                            <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-emerald-500" /> {app.jobPost.salary.toLocaleString()} VND</span>
                                                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-orange-400" /> Ứng tuyển: {new Date(app.createdAt).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                                                {getStatusBadge(app.status)}
                                                <Link 
                                                    to={`/jobs/${app.jobPostId}`} 
                                                    className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-zinc-950 hover:text-white transition-all border border-slate-100 shadow-sm"
                                                >
                                                    <ChevronRight size={20} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="invitations"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {invitations.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm group">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
                                    <Bell className="text-emerald-200" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-3 uppercase tracking-tight">Chưa có lời mời làm việc</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-8">
                                    Khi chủ nhà chấp nhận hồ sơ của bạn, lời mời sẽ xuất hiện tại đây.
                                </p>
                                <Link 
                                    to="/jobs" 
                                    className="inline-flex items-center space-x-2 bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl hover:bg-zinc-950 transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-[11px] uppercase tracking-widest"
                                >
                                    Tiếp tục tìm việc
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {invitations.map((inv, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={inv.id} 
                                        className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-[2rem] border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-600/10 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                        
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-start justify-between md:justify-start gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                <Bell size={10} /> Lời mời làm việc
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight mb-2">
                                                            {inv.jobPost.title}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-500" /> {inv.jobPost.location}</span>
                                                            <span className="flex items-center gap-1.5"><DollarSign size={12} className="text-emerald-500" /> {inv.jobPost.salary.toLocaleString()} VND</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {inv.jobPost.user && (
                                                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-emerald-100">
                                                        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-emerald-100 shadow-sm">
                                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                                <Phone size={16} className="text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Liên hệ chủ nhà</p>
                                                                <p className="text-sm font-bold text-zinc-900">{inv.jobPost.user.fullName}</p>
                                                                <p className="text-xs font-semibold text-emerald-600">{maskPhone(inv.jobPost.user.phone)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-emerald-100">
                                                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                                    <CheckCircle size={12} /> Đã chấp nhận
                                                </span>
                                                <Link 
                                                    to={`/jobs/${inv.jobPostId}`} 
                                                    className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-950 transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    <ChevronRight size={20} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyApplicationsPage;
