import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    Briefcase, Plus, Database, Activity, MapPin, 
    ChevronRight, Users, Loader2, Search, CheckCircle, Clock4, XCircle, Send, Crown, CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi, applicationApi, subscriptionApi } from '../api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

interface Job {
    id: string;
    title: string;
    location: string;
    salary: number;
    createdAt: string;
    userId: string;
    isApproved?: boolean;
    isForWorker?: boolean;
}

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'posts' | 'interactions' | 'transactions') || 'posts';
    const interactionSubTab = (searchParams.get('sub') as 'applied' | 'received') || 'applied';

    const setActiveTab = (tab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        setSearchParams(params);
    };

    const setInteractionSubTab = (sub: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sub', sub);
        setSearchParams(params);
    };

    const activeWorkingRole = user?.workingRole || user?.role;
    const isWorker = activeWorkingRole === 'Worker';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, appsRes, invRes, subRes] = await Promise.all([
                    jobApi.getMyJobs(),
                    applicationApi.getMyApplications(),
                    applicationApi.getMyInvitations(),
                    subscriptionApi.getMySubscriptions()
                ]);
                
                setMyJobs(jobsRes.data);
                setApplications(appsRes.data);
                setInvitations(invRes.data);
                setSubscriptions(subRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
                toast.error('Không thể tải dữ liệu bảng điều khiển');
            } finally {
                setIsLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Accepted':
                return <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[9px] font-bold uppercase border border-emerald-100"><CheckCircle size={10}/> Đã nhận</span>;
            case 'Rejected':
                return <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full text-[9px] font-bold uppercase border border-red-100"><XCircle size={10}/> Từ chối</span>;
            default:
                return <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full text-[9px] font-bold uppercase border border-indigo-100"><Clock4 size={10}/> Đang chờ</span>;
        }
    };

    return (
        <div className="space-y-8 min-w-0">
            {/* PROJOB */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div>
                            <h1 className="text-2xl font-semibold text-zinc-900 uppercase tracking-tighter flex items-center gap-3">
                                <Activity className="text-orange-600" size={24} /> Bảng điều khiển
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Chào {user?.fullName}, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <Link to="/post-job" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-zinc-950 transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-[11px] uppercase tracking-widest shrink-0">
                            <Plus size={16} /> 
                            <span>{isWorker ? 'Đăng tin tìm việc' : 'Đăng tin tuyển dụng'}</span>
                        </Link>
            </motion.div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <StatusStat 
                    icon={<Briefcase />} 
                    label={isWorker ? "Tin tìm việc" : "Tin tuyển dụng"} 
                    value={myJobs.length.toString()} 
                    color="primary" 
                    onClick={() => setActiveTab('posts')}
                />
                <StatusStat 
                    icon={<Users />} 
                    label={isWorker ? "Lời mời nhận" : "Hồ sơ nhận"} 
                    value={invitations.length.toString()} 
                    color="secondary" 
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('tab', 'interactions');
                        params.set('sub', 'received');
                        setSearchParams(params);
                    }}
                />
                <StatusStat 
                    icon={<Send />} 
                    label={isWorker ? "Việc đã ứng tuyển" : "Ứng viên đã mời"} 
                    value={applications.length.toString()} 
                    color="accent" 
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('tab', 'interactions');
                        params.set('sub', 'applied');
                        setSearchParams(params);
                    }}
                />
                
                {/* Quota Section */}
                <div 
                    onClick={() => setActiveTab('transactions')}
                    className="bg-[#111111] p-6 rounded-[2rem] border border-white/10 shadow-xl flex flex-col justify-between group cursor-pointer hover:border-orange-600/50 transition-all"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                             <Crown size={20} />
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${user?.subscriptionTier ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {user?.subscriptionTier || 'FREE'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-tighter mb-1.5">
                            {isWorker ? 'Hạn mức ứng tuyển' : 'Hạn mức xem hồ sơ'}
                        </p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-white leading-none tracking-tighter">
                                {isWorker 
                                    ? (user?.maxApplications === -1 ? '∞' : `${user?.consumedApplications}/${user?.maxApplications}`)
                                    : (user?.maxViews === -1 ? '∞' : `${user?.consumedViews}/${user?.maxViews}`)
                                }
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lượt còn lại</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (isWorker 
                                    ? (user?.maxApplications === -1 ? 100 : ((user?.consumedApplications || 0) / (user?.maxApplications || 1)) * 100)
                                    : (user?.maxViews === -1 ? 100 : ((user?.consumedViews || 0) / (user?.maxViews || 1)) * 100)
                                ))}%` }}
                                className="h-full bg-orange-600"
                            />
                        </div>
                        {user?.subscriptionExpiredAt && (
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">
                                    {(() => {
                                        const diff = new Date(user.subscriptionExpiredAt).getTime() - new Date().getTime();
                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                        return days > 0 ? `${days} ngày còn lại` : "Hết hạn";
                                    })()}
                                </p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-right">
                                    Hết hạn: {new Date(user.subscriptionExpiredAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-50">
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'text-orange-600 bg-orange-50/30 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {isWorker ? 'Quản lý tin tìm việc' : 'Quản lý tin tuyển dụng'} ({myJobs.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('interactions')}
                        className={`flex-1 py-5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'interactions' ? 'text-orange-600 bg-orange-50/30 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Hoạt động & Kết nối ({applications.length + invitations.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('transactions')}
                        className={`flex-1 py-5 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'transactions' ? 'text-orange-600 bg-orange-50/30 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <CreditCard size={14} /> Lịch sử giao dịch ({subscriptions.length})
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="animate-spin text-orange-600" size={32} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                            </div>
                        ) : activeTab === 'posts' ? (
                            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                {myJobs.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <Database className="text-slate-300 mx-auto mb-4" size={32} />
                                        <p className="text-sm font-bold text-zinc-900 uppercase mb-2">Chưa có tin đăng nào</p>
                                        <Link to="/post-job" className="text-indigo-600 text-[10px] font-bold uppercase underline">Tạo ngay</Link>
                                    </div>
                                ) : (
                                    myJobs.map(job => (
                                        <div key={job.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 transition-all group">
                                            <div className="min-w-0 flex-1 pr-4">
                                                <h4 className="text-sm font-bold text-zinc-900 truncate uppercase group-hover:text-orange-600 transition-colors">{job.title}</h4>
                                                <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><MapPin size={10} className="text-orange-600" /> {job.location}</span>
                                                    {!job.isApproved && <span className="text-orange-600">Đang chờ duyệt</span>}
                                                </div>
                                            </div>
                                            <Link to={`/jobs/${job.id}`} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-zinc-950 hover:text-white transition-all">
                                                <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        ) : activeTab === 'interactions' ? (
                            <motion.div key="interactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {/* Sub Tabs for Interactions */}
                                <div className="flex gap-2 bg-slate-50 p-1 rounded-xl w-fit">
                                    <button onClick={() => setInteractionSubTab('applied')} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${interactionSubTab === 'applied' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                                        {isWorker ? 'Việc đã ứng tuyển' : 'Ứng viên đã mời'} ({applications.length})
                                    </button>
                                    <button onClick={() => setInteractionSubTab('received')} className={`px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${interactionSubTab === 'received' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                                        {isWorker ? 'Lời mời làm việc' : 'Hồ sơ ứng tuyển'} ({invitations.length})
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(interactionSubTab === 'applied' ? applications : invitations).length === 0 ? (
                                        <div className="text-center py-20">
                                            <Search className="text-slate-200 mx-auto mb-4" size={32} />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Không có dữ liệu</p>
                                        </div>
                                    ) : (
                                        (interactionSubTab === 'applied' ? applications : invitations).map((item: any) => (
                                            <div key={item.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-zinc-900 uppercase mb-2">{item.jobPost?.title || 'Thông tin bài đăng'}</h5>
                                                        {interactionSubTab === 'received' && item.applicant && (
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-[10px]">
                                                                    {item.applicant.fullName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-zinc-900 leading-none">{item.applicant.fullName}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{item.applicant.phone}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase">
                                                            <span>Ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                                            {getStatusBadge(item.status)}
                                                        </div>
                                                    </div>
                                                    <Link to={`/jobs/${item.jobPostId}`} className="text-orange-600 p-2 hover:bg-orange-50 rounded-lg transition-colors">
                                                        <ChevronRight size={18} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        ) : activeTab === 'transactions' ? (
                            <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                <th className="pb-6">Mã GD</th>
                                                <th className="pb-6">Gói</th>
                                                <th className="pb-6">Giá trị</th>
                                                <th className="pb-6">Ngày mua</th>
                                                <th className="pb-6 text-right">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {subscriptions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase">Chưa có giao dịch</td>
                                                </tr>
                                            ) : (
                                                subscriptions.map(s => (
                                                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                                                        <td className="py-6 font-mono text-[9px] font-black text-zinc-950 uppercase">#{s.transactionId}</td>
                                                        <td className="py-6 text-[10px] font-bold text-orange-600 uppercase tracking-widest">{s.packageName}</td>
                                                        <td className="py-6 text-[10px] font-bold text-zinc-900">{(s.amount/1000).toLocaleString()}K</td>
                                                        <td className="py-6 text-[9px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                                                        <td className="py-6 text-right">
                                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest ${s.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                                                {s.isActive ? 'Thành công' : 'Thất bại'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const StatusStat: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, onClick?: () => void }> = ({ icon, label, value, color, onClick }) => {
    const colorStyles: Record<string, string> = {
        primary: 'bg-orange-50 text-orange-600 border-orange-100',
        secondary: 'bg-zinc-900 text-white border-zinc-800',
        accent: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return (
        <motion.div 
            whileHover={{ y: -4 }} 
            onClick={onClick}
            className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 ${onClick ? 'cursor-pointer hover:border-orange-200' : ''}`}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-bold shadow-sm shrink-0 ${colorStyles[color] || colorStyles.primary}`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
            </div>
            <div className="min-w-0">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1 truncate">{label}</p>
                <p className="text-2xl font-semibold text-zinc-900 tracking-tighter leading-none">{value}</p>
            </div>
        </motion.div>
    );
};

export default DashboardPage;
