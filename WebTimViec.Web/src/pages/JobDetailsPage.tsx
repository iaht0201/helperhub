import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Clock, Briefcase, Calendar, 
    ArrowLeft, Send, MessageCircle, ShieldCheck, 
    Share2, CheckCircle2, XCircle, Mail,
    Users, Star, Phone, Award, MapPin, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi, applicationApi } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const JobDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [job, setJob] = useState<any>(null);
    const [similarJobs, setSimilarJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [isApplied, setIsApplied] = useState(false);
    const [hasViewedInfo, setHasViewedInfo] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        const fetchJob = async () => {
            setIsLoading(true);
            try {
                const response = await jobApi.getJobById(id!);
                setJob(response.data);
                
                // If phone is already unmasked, set viewed info to true
                if (response.data.user?.phone && !response.data.user.phone.includes('•')) {
                    setHasViewedInfo(true);
                }

                if (user) {
                    const isOwner = user.id === response.data.userId;
                    const isAdmin = user.role === 'Admin';
                    const isEnterprise = user.subscriptionTier === 'ENTERPRISE';

                    // Auto-unlock info for owner, admin, or enterprise
                    if (isOwner || isAdmin || isEnterprise) {
                        setHasViewedInfo(true);
                    }

                    // Fetch applications if owner
                    if (isOwner || isAdmin) {
                        try {
                            const appsRes = await applicationApi.getJobApplications(id!);
                            setApplications(appsRes.data);
                        } catch (err) {
                            console.error("Failed to fetch applications for this job", err);
                        }
                    }

                    const myAppsRes = await applicationApi.getMyApplications();
                    const applied = myAppsRes.data.some((a: any) => a.jobPostId === id);
                    setIsApplied(applied);
                }

                const allJobs = await jobApi.getAllJobs();
                setSimilarJobs(allJobs.data.items.filter((j: any) => j.serviceType === response.data.serviceType && j.id !== id).slice(0, 3));
            } catch (error) {
                console.error('Error fetching job details', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [id, user]);

    const handleViewInfo = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        if (hasViewedInfo) return;

        try {
            await jobApi.viewJobInfo(id!);
            toast.success('Thành công! Bạn đã mở khóa thông tin liên hệ.');
            setHasViewedInfo(true);
            refreshUser();
            
            // Refetch job to get unmasked data
            const response = await jobApi.getJobById(id!);
            setJob(response.data);
        } catch (error: any) {
            const errorMsg = error.response?.data || 'Hết lượt xem miễn phí hoặc có lỗi xảy ra.';
            toast.error(errorMsg);
            if (error.response?.status === 400) {
                navigate('/subscription');
            }
        }
    };

    const handleApply = async () => {
        if (!user) {
            navigate('/login', { state: { from: `/jobs/${id}`, action: 'apply' } });
            return;
        }

        const isOwner = user.id === job.userId;
        const isAdmin = user.role === 'Admin';
        const isWorkerPost = job.isForWorker;
        const currentWorkingRole = user.workingRole || (isAdmin ? 'Employer' : user.role);

        // Required Role check
        if (!isOwner && !isAdmin) {
            const isSubscribed = user.isSubscribed;

            if (isWorkerPost && currentWorkingRole !== 'Employer') {
                if (!isSubscribed) {
                    toast.error('Bạn cần nâng cấp để có thể dễ dàng chuyển sang vai trò "Nhà tuyển dụng" để mời ứng viên này.');
                    navigate('/subscription');
                } else {
                    toast.error('Vui lòng chuyển sang vai trò "Nhà tuyển dụng" ở menu bên trái để mời ứng viên này.');
                }
                return;
            }
            if (!isWorkerPost && currentWorkingRole !== 'Worker') {
                if (!isSubscribed) {
                    toast.error('Bạn cần nâng cấp để có thể dễ dàng chuyển sang vai trò "Người tìm việc" để ứng tuyển.');
                    navigate('/subscription');
                } else {
                    toast.error('Vui lòng chuyển sang vai trò "Người tìm việc" ở menu bên trái để ứng tuyển.');
                }
                return;
            }
        }
        
        try {
             await applicationApi.apply(id!);
             setIsApplied(true);
             setShowApplyModal(true);
             refreshUser();
             toast.success(isWorkerPost ? 'Đã gửi lời mời nhận việc!' : 'Đã gửi đơn ứng tuyển!');
        } catch (error: any) {
             console.error('Action failed', error);
             const errorMsg = error.response?.data || 'Có lỗi xảy ra, vui lòng thử lại.';
             toast.error(errorMsg);
             if (error.response?.status === 400 && error.response?.data.includes('hết lượt')) {
                 navigate('/subscription');
             }
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: job?.title,
                text: `Xem việc làm: ${job?.title} tại HelperHub`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Đã sao chép liên kết!');
        }
    };

    const handleChat = () => {
        const phone = job?.user?.phone;
        handleChatWithPhone(phone);
    };

    const handleChatWithPhone = (phone: string) => {
        if (phone && !phone.includes('•')) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://zalo.me/${cleanPhone}`, '_blank');
        } else {
            toast.error('Vui lòng mở khóa thông tin liên hệ để dùng tính năng Chat Zalo.');
        }
    };

    const handleUpdateAppStatus = async (appId: string, status: string) => {
        try {
            await applicationApi.updateStatus(appId, status);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
            toast.success(status === 'Accepted' ? 'Đã chấp nhận ứng viên' : 'Đã từ chối ứng viên');
        } catch (error) {
            toast.error('Cập nhật thất bại');
        }
    };

    const handleViewApplicant = async (applicant: any) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedApplicant(applicant);
    };

    const handleUnlockApplicant = async (applicantId: string) => {
        try {
            await applicationApi.viewApplicant(applicantId);
            toast.success('Đã mở khóa thông tin ứng viên!');
            
            // Refetch applications to get unmasked data
            const appsRes = await applicationApi.getJobApplications(id!);
            const updatedApp = appsRes.data.find((a: any) => a.applicantId === applicantId);
            if (updatedApp) {
                setSelectedApplicant(updatedApp.applicant);
            }
            setApplications(appsRes.data);
            refreshUser();
        } catch (error: any) {
            const errorMsg = error.response?.data || 'Hết lượt xem hoặc có lỗi xảy ra.';
            toast.error(errorMsg);
            if (error.response?.status === 400) {
                navigate('/subscription');
            }
        }
    };

    if (isLoading) return <div className="pt-40 text-center font-semibold uppercase tracking-widest text-slate-300 animate-pulse">Đang tải dữ liệu...</div>;
    if (!job) return <div className="pt-40 text-center font-semibold uppercase text-red-500">Không tìm thấy công việc!</div>;

    return (
        <div className="bg-slate-50 min-h-screen selection:bg-orange-100 selection:text-orange-950 font-sans pb-12">
            
            {/* Header Area - Scaled Down */}
            <div className="bg-white border-b border-slate-200 py-4 mb-6 pt-32">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center gap-4">
                    <Link to="/jobs" className="p-2.5 bg-slate-50 text-slate-500 hover:text-orange-600 rounded-xl transition-all border border-slate-200">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 uppercase tracking-tight leading-none">Chi tiết công việc</h2>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    
                    {/* Main Content Areas */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* HERO BLOCK - Scaled Down */}
                        <section className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                             <div className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[8px] font-semibold uppercase tracking-widest mb-4 border border-orange-100">
                                <Award size={10} className="fill-orange-600" /> <span>Tuyển dụng chính thức</span>
                             </div>
                             
                             <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-zinc-900 leading-tight tracking-tighter uppercase mb-2">
                                {job.title}
                             </h1>

                             <div className="flex items-center gap-1.5 text-orange-600 font-semibold text-xs uppercase tracking-widest mb-8">
                                <ShieldCheck size={14} /> <span>HelperHub Xác Nhận</span>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-slate-100">
                                <ProDetailItem icon={<MapPin size={18} />} value={job.location} label="Địa chỉ" />
                                <ProDetailItem icon={<Clock size={18} />} value={job.jobType} label="Loại hình" />
                                <ProDetailItem icon={<Users size={18} />} value={`${job.ageMin}-${job.ageMax} Tuổi`} label="Tuổi" />
                                <ProDetailItem icon={<Calendar size={18} />} value={new Date(job.createdAt).toLocaleDateString()} label="Ngày đăng" />
                             </div>
                        </section>

                        {/* CONTENT BLOCK - Scaled Down */}
                        <section className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-600 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div> Mô tả công việc
                                </h3>
                                <p className="text-base text-slate-600 font-medium leading-[1.7] whitespace-pre-line">
                                    {job.description}
                                </p>
                            </div>

                            {job.skills && (
                                <div>
                                    <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-600 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div> Kỹ năng yêu cầu
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.split(',').map((s: string) => (
                                            <span key={s} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-semibold uppercase text-slate-500 tracking-widest">
                                                {s.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* CREATOR CONTACT BLOCK - Scaled Down */}
                        <section className="bg-zinc-900 p-6 md:p-10 rounded-3xl text-white relative overflow-hidden group shadow-lg">
                             <div className="absolute top-0 right-0 p-6 opacity-5 -rotate-12 translate-x-4 translate-y-4">
                                <Briefcase size={150} />
                             </div>
                             
                             <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center font-semibold text-xl shadow-xl shadow-orange-950/20">
                                        {job.user?.fullName?.charAt(0) || 'H'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg md:text-xl font-semibold uppercase tracking-tight">{job.user?.fullName || 'Nhà tuyển dụng'}</h4>
                                        <div className="flex items-center text-orange-400 text-[8px] font-semibold uppercase tracking-widest space-x-3">
                                            <span className="flex items-center"><ShieldCheck size={10} className="mr-1" /> Xác minh</span>
                                            <span className="flex items-center text-orange-400"><Star size={10} className="mr-1 fill-orange-400" /> Uy tín</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 w-full md:w-auto relative">
                                     {!hasViewedInfo && (
                                         <div className="absolute -top-10 left-0 right-0 text-center">
                                             <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[0.2em] animate-pulse">
                                                 SỐ LƯỢT XEM CÒN LẠI: {user?.maxViews === -1 ? '∞' : `${Math.max(0, (user?.maxViews || 0) - (user?.consumedViews || 0))}/${user?.maxViews || 0}`}
                                             </p>
                                         </div>
                                     )}
                                     <div 
                                        onClick={handleViewInfo}
                                        className={`p-4 rounded-xl border backdrop-blur-md transition-all cursor-pointer group/lock relative ${
                                            hasViewedInfo 
                                                ? 'bg-white/10 border-white/10' 
                                                : 'bg-white/5 border-orange-600/30 hover:bg-white/10'
                                        }`}
                                     >
                                        <div className={`flex items-center justify-between gap-4 transition-all duration-500 ${!hasViewedInfo ? 'blur-[5px] select-none scale-[0.98]' : 'blur-0 scale-100'}`}>
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2.5 bg-white/10 rounded-xl text-orange-500 shadow-inner"><Phone size={16} /></div>
                                                <div className="text-sm font-bold tracking-widest">
                                                    {job.user?.phone || '•••• ••• •••'}
                                                </div>
                                            </div>
                                        </div>

                                        {!hasViewedInfo && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 rounded-xl group-hover/lock:bg-zinc-900/20 transition-all border border-dashed border-orange-600/20">
                                                <div className="flex flex-col items-center gap-1.5 translate-y-0 text-center">
                                                    <Lock size={20} className="text-orange-500 mb-0.5" />
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.1em] drop-shadow-md">NHẤN ĐỂ MỞ KHÓA</span>
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                     <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 rounded-lg border border-orange-600/30 w-full md:w-fit">
                                        <Phone size={12} className="text-orange-500" />
                                        <span className="text-[9px] font-bold text-orange-100 uppercase tracking-widest">Hotline: 1900 6789</span>
                                     </div>
                                </div>
                             </div>

                             <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed text-center md:text-left ">
                                     Bảo mật bởi HelperHub.
                                 </p>
                                 <div className="flex items-center space-x-3">
                                     <button 
                                        onClick={handleShare}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-orange-600 transition-all"
                                     >
                                        <Share2 size={16} />
                                     </button>
                                     <button 
                                        onClick={handleChat}
                                        className="px-6 py-3 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest text-[9px] flex items-center space-x-2"
                                     >
                                        <MessageCircle size={16} /> <span>Chat</span>
                                     </button>
                                 </div>
                             </div>
                        </section>
                    </div>

                    {/* SIDEBAR - Scaled Down */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="flex flex-col gap-3 mb-4">
                            {user?.role !== 'Admin' && user?.id !== job.userId && !hasViewedInfo && (
                                <button 
                                    onClick={handleViewInfo}
                                    className="w-full py-4 rounded-2xl font-semibold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 bg-orange-600 text-white shadow-xl shadow-orange-100/20 hover:bg-zinc-900 active:scale-95"
                                >
                                    <Lock size={18} /> <span>Mở khóa toàn bộ thông tin</span>
                                </button>
                            )}

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setShowApplyModal(true); setIsApplied(true); }}
                                    className="flex-1 py-4 rounded-2xl font-semibold uppercase text-[10px] tracking-widest transition-all hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center gap-2"
                                >
                                    <Star size={16} /> Quan tâm
                                </button>
                                <div className="flex-[2] flex flex-col gap-1">
                                    {!isApplied && user && user.role !== 'Admin' && (
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Lượt ứng tuyển: {user?.maxApplications === -1 ? '∞' : `${Math.max(0, (user?.maxApplications || 0) - (user?.consumedApplications || 0))}/${user?.maxApplications}`}
                                        </p>
                                    )}
                                    <button 
                                        onClick={isApplied ? () => navigate('/my-applications') : handleApply}
                                        className={`w-full py-4 rounded-2xl font-semibold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] ${
                                            isApplied ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-orange-600 text-white shadow-orange-100 hover:bg-zinc-900'
                                        }`}
                                    >
                                        {isApplied 
                                            ? <><CheckCircle2 size={18} /> <span>{job.isForWorker ? 'Đã mời' : 'Đã ứng tuyển'}</span></> 
                                            : <><Send size={18} /> <span>{job.isForWorker ? 'Mời nhận việc' : 'Ứng tuyển'}</span></>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>

                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center relative overflow-hidden group">
                            <p className="text-[8px] font-semibold text-orange-400 uppercase tracking-widest mb-2 relative z-10">Lương thỏa thuận</p>
                            <div className="text-4xl font-semibold text-zinc-900 tracking-tighter mb-1 relative z-10">
                                {(job.salary/1000000).toFixed(1)}<span className="text-xl ml-1">Tr</span>
                            </div>
                            <p className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest relative z-10">VND / Tháng</p>
                            <div className="w-8 h-1 bg-orange-100 mx-auto my-6 rounded-full relative z-10"></div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed relative z-10 px-2">Đã bao gồm phụ cấp cơ bản.</p>
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm relative overflow-hidden">
                             <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Tin cậy</h4>
                             <div className="space-y-4">
                                <ProSafetyItem icon={<ShieldCheck size={14} />} text="Không mất phí trung gian" />
                                <ProSafetyItem icon={<ShieldCheck size={14} />} text="Nhà tuyển dụng xác thực KYC" />
                                <ProSafetyItem icon={<ShieldCheck size={14} />} text="BH HelperHub bảo hộ" />
                             </div>
                        </section>

                        <section className="bg-zinc-950 p-8 rounded-3xl text-white">
                            <h4 className="text-base font-semibold uppercase tracking-tight mb-4 flex items-center gap-2">
                                <Briefcase size={16} className="text-orange-500" /> Liên quan
                            </h4>
                            <div className="space-y-3">
                                {similarJobs.map(sj => (
                                    <Link key={sj.id} to={`/jobs/${sj.id}`} className="block group border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                        <h5 className="text-xs font-semibold uppercase tracking-tight group-hover:text-orange-500 transition-colors line-clamp-1">{sj.title}</h5>
                                        <div className="flex items-center text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            <MapPin size={8} className="mr-1 text-orange-500" /> {sj.location}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </aside>

                    {/* Applicants List Section - Visible to Owner/Admin */}
                    {user && (user.id === job.userId || user.role === 'Admin') && (
                        <div className="lg:col-span-12 mt-12 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-orange-600 flex items-center gap-2">
                                     <Users size={16} /> Danh sách ứng viên ({applications.length})
                                </h3>
                                <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {applications.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                                        <Users size={48} className="text-slate-100 mb-4" />
                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Chưa có ứng viên nào ứng tuyển</p>
                                    </div>
                                ) : (
                                    applications.map(app => (
                                        <motion.div 
                                            key={app.id}
                                            whileHover={{ y: -5 }}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                                        >
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-slate-300 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                                    {app.applicant?.fullName?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-bold text-zinc-900 truncate uppercase tracking-tight">{app.applicant?.fullName}</h4>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${
                                                        app.status === 'Accepted' ? 'text-emerald-500' : 
                                                        app.status === 'Rejected' ? 'text-red-400' : 'text-orange-500'
                                                    }`}>
                                                        {app.status === 'Pending' ? 'Đang chờ duyệt' : 
                                                         app.status === 'Accepted' ? 'Phù hợp' : 'Không phù hợp'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-6 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                 <div className="flex items-center gap-2">
                                                    <Phone size={12} className="text-orange-500" />
                                                    <span>{app.applicant?.phone || '•••• ••• •••'}</span>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    <span className="truncate">{app.applicant?.address || 'Khu vực khác'}</span>
                                                 </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleViewApplicant(app.applicant)}
                                                    className="flex-1 py-3.5 bg-zinc-950 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-zinc-950/20 active:scale-95"
                                                >
                                                    Xem hồ sơ
                                                </button>
                                                {app.status === 'Pending' && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateAppStatus(app.id, 'Accepted')}
                                                            className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateAppStatus(app.id, 'Rejected')}
                                                            className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-50"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* APPLICANT PROFILE MODAL */}
            <AnimatePresence>
                {selectedApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[3rem] p-8 md:p-12 max-w-lg w-full relative shadow-2xl overflow-hidden"
                        >
                            <button 
                                onClick={() => setSelectedApplicant(null)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-zinc-950 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-orange-600/20 mb-6">
                                    {selectedApplicant.fullName.charAt(0)}
                                </div>
                                <h3 className="text-2xl font-semibold text-zinc-900 uppercase tracking-tight mb-1">{selectedApplicant.fullName}</h3>
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em]">{selectedApplicant.age || '??'} Tuổi • {selectedApplicant.gender || 'Chưa cập nhật'}</p>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm"><Phone size={14}/></div>
                                        <span className="text-xs font-bold tracking-widest text-zinc-900">
                                            {selectedApplicant.phone || 'Chưa cập nhật'}
                                        </span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><Mail size={14}/></div>
                                        <span className="text-xs font-bold tracking-tight text-slate-600">
                                            {selectedApplicant.email || 'Chưa cập nhật'}
                                        </span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><MapPin size={14}/></div>
                                        <span className="text-xs font-bold tracking-tight text-slate-600 truncate">{selectedApplicant.address || 'Chưa cập nhật'}</span>
                                     </div>
                                </div>
                                
                                {user && (selectedApplicant.phone?.includes('•') || selectedApplicant.email?.includes('•')) && (
                                    <div className="space-y-4">
                                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 animate-pulse">
                                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center mb-3">
                                                Lượt xem còn lại: {user?.maxViews === -1 ? '∞' : `${Math.max(0, (user?.maxViews || 0) - (user?.consumedViews || 0))}/${user?.maxViews || 0}`}
                                            </p>
                                            <button 
                                                onClick={() => handleUnlockApplicant(selectedApplicant.id)}
                                                className="w-full py-4 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-orange-600/20 hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck size={16} /> <span>Mở khóa thông tin liên hệ</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Kỹ năng & Kinh nghiệm</h4>
                                    <div className="flex flex-wrap gap-2 px-2">
                                        {(selectedApplicant.skills || "Chưa cập nhật").split(',').map((s: string) => (
                                            <span key={s} className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                                                {s.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-4 px-2 text-xs text-slate-600 leading-relaxed font-medium">
                                        {selectedApplicant.experience || "Ứng viên chưa cập nhật mô tả kinh nghiệm chi tiết."}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-10">
                                {selectedApplicant.phone && !selectedApplicant.phone.includes('•') && (
                                    <button 
                                        onClick={() => handleChatWithPhone(selectedApplicant.phone)}
                                        className="flex-1 py-5 bg-[#0068ff] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#0052cc] transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} /> <span>Chat Zalo</span>
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedApplicant(null)}
                                    className={`${selectedApplicant.phone && !selectedApplicant.phone.includes('•') ? 'flex-1' : 'w-full'} py-5 bg-zinc-950 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95`}
                                >
                                    Đóng hồ sơ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS MODAL - REFINED UX */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative shadow-2xl text-center border border-white"
                        >
                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                                <CheckCircle2 size={32} />
                            </div>
                            
                            {/* 1. Confirmation & 2. Context */}
                            <h3 className="text-3xl font-semibold text-zinc-900 mb-2 uppercase tracking-tighter">Ứng tuyển thành công!</h3>
                            <p className="text-[10px] text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">
                                Hồ sơ của bạn đã được gửi tới <span className="text-zinc-900">{job.user?.fullName}</span>.
                            </p>
                            
                            {/* 3. Status & 4. Expectation */}
                            <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Trạng thái: Đang chờ duyệt</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight leading-normal">
                                    Nhà tuyển dụng sẽ xem hồ sơ của bạn và phản hồi qua tin nhắn hoặc số điện thoại trong vòng 24-48h.
                                </p>
                            </div>

                            {/* 5. Next Steps (CTA Hierarchy) */}
                            <div className="space-y-3 mb-8">
                                <button 
                                    onClick={() => navigate('/my-applications')} 
                                    className="w-full py-5 bg-orange-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                                >
                                    <span>Xem việc đã ứng tuyển</span>
                                    <ArrowLeft size={14} className="rotate-180" />
                                </button>
                                <button 
                                    onClick={() => navigate('/jobs')} 
                                    className="w-full py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-zinc-950 transition-colors border border-slate-100 rounded-2xl"
                                >
                                    Tiếp tục tìm việc khác
                                </button>
                            </div>

                            {/* 6. Support (Subtle) */}
                            <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-4">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Cần hỗ trợ?</span>
                                <div className="flex items-center gap-1 text-[10px] font-black text-zinc-400">
                                    <Phone size={10} /> 1900 6789
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* PRO COMPONENTS - Scaled Down */

const ProDetailItem = ({ icon, value, label }: any) => (
    <div className="flex flex-col items-start gap-1.5">
        <p className="text-[7px] font-semibold text-slate-300 uppercase tracking-widest">{label}</p>
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-orange-600">{icon}</div>
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-tight">{value}</span>
        </div>
    </div>
);

const ProSafetyItem = ({ icon, text }: any) => (
    <div className="flex items-center space-x-2">
        <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">{icon}</div>
        <p className="text-[9px] font-semibold uppercase text-slate-500 tracking-tight leading-none">{text}</p>
    </div>
);

export default JobDetailsPage;
