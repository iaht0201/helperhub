import React, { useEffect, useState } from 'react';
import { 
    Users, Briefcase, CreditCard, ShieldCheck, 
    UserCheck, UserX, Trash2, Plus, 
    LayoutDashboard, Package, Activity,
    Edit, Check, X, User as UserIcon, MapPin,
    Eye, Filter, AlertCircle, Clock, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../api';
import toast from 'react-hot-toast';

interface PackageType {
    id: string;
    code: string;
    name: string;
    price: number;
    days: number;
    description: string;
    isActive: boolean;
    maxViews: number;
    maxApplications: number;
    maxJobPosts: number;
    needsApproval: boolean;
    isPriority: boolean;
    supportLevel: string;
    allowRoleSwitch: boolean;
}

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [packages, setPackages] = useState<PackageType[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'jobs' | 'audit' | 'packages' | 'subscriptions'>('stats');
    const [isLoading, setIsLoading] = useState(true);
    
    // Modals
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const [showJobModal, setShowJobModal] = useState(false);
    const [viewingJob, setViewingJob] = useState<any>(null);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [targetUser, setTargetUser] = useState<any>(null);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{show: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

    // Search and Sort
    const [userSearch, setUserSearch] = useState('');
    const [jobSearch, setJobSearch] = useState('');
    const [auditSearch, setAuditSearch] = useState('');

    const isPremiumUser = (user: any) => {
        if (!user?.subscriptions) return false;
        return user.subscriptions.some((s: any) => s.isActive && new Date(s.expiredAt) > new Date());
    };

    const filteredUsers = users.filter(u => 
        (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone || '').includes(userSearch)
    );

    const filteredJobsList = jobs.filter(j => 
        (j.title || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
        (j.user?.fullName || '').toLowerCase().includes(jobSearch.toLowerCase())
    );

    const pendingJobs = jobs
        .filter(j => !j.isApproved)
        .filter(j => 
            (j.title || '').toLowerCase().includes(auditSearch.toLowerCase()) || 
            (j.user?.fullName || '').toLowerCase().includes(auditSearch.toLowerCase())
        )
        .sort((a, b) => {
            const aP = isPremiumUser(a.user) ? 1 : 0;
            const bP = isPremiumUser(b.user) ? 1 : 0;
            return bP - aP; // Premium first
        });

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes, jobsRes, packagesRes, subsRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getUsers(),
                adminApi.getJobs(),
                adminApi.getPackages(),
                adminApi.getSubscriptions()
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setJobs(jobsRes.data);
            setPackages(packagesRes.data);
            setSubscriptions(subsRes.data);
        } catch (err) {
            console.error("Admin Access Denied or Error:", err);
            toast.error("Không có quyền truy cập quản trị hoặc lỗi máy chủ");
            setStats({ totalUsers: 0, totalJobs: 0, pendingJobs: 0, newUsersToday: 0, newJobsToday: 0, recentUsers: [] });
            setUsers([]);
            setJobs([]);
            setPackages([]);
            setSubscriptions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserStatus = async (userId: string) => {
        try {
            const res = await adminApi.toggleUserStatus(userId);
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: res.data.isActive } : u));
            toast.success(res.data.isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
        } catch (err) { toast.error("Lỗi khi thay đổi trạng thái người dùng"); }
    };

    const deleteUser = async (userId: string) => {
        setConfirmState({
            show: true,
            title: "Xác nhận xóa tài khoản",
            message: "Hồ sơ người dùng và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?",
            onConfirm: async () => {
                try {
                    await adminApi.deleteUser(userId);
                    setUsers(users.filter(u => u.id !== userId));
                    toast.success("Đã xóa người dùng");
                } catch (err) { toast.error("Lỗi khi xóa người dùng"); }
            }
        });
    };

    const handleSaveUser = async (userData: any) => {
        try {
            const res = await adminApi.updateUser(editingUser.id, userData);
            setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
            toast.success("Cập nhật thông tin thành công");
            setShowUserModal(false);
        } catch (err) { toast.error("Lỗi khi cập nhật"); }
    };

    const handleAssignPackage = async (userId: string, packageCode: string) => {
        try {
            await adminApi.assignPackage(userId, packageCode);
            toast.success(`Đã cấp gói ${packageCode} thành công`);
            fetchAdminData(); // Refresh to show new package
        } catch (err) {
            toast.error("Lỗi khi cấp gói cước");
        }
    };

    const approveJob = async (jobId: string) => {
        try {
            await adminApi.approveJob(jobId);
            setJobs(jobs.map(j => j.id === jobId ? { ...j, isApproved: true } : j));
            setStats({...stats, pendingJobs: stats.pendingJobs - 1});
            toast.success("Đã phê duyệt tin đăng");
        } catch (err) { toast.error("Lỗi phê duyệt"); }
    };

    const deleteJob = async (jobId: string) => {
        setConfirmState({
            show: true,
            title: "Xác nhận xóa tin đăng",
            message: "Tin đăng này sẽ bị gỡ bỏ vĩnh viễn vì vi phạm quy định của HelperHub. Thao tác này không thể hoàn tác.",
            onConfirm: async () => {
                try {
                    await adminApi.deleteJob(jobId);
                    setJobs(jobs.filter(j => j.id !== jobId));
                    toast.success("Đã xóa tin đăng vi phạm");
                    if (activeTab === 'audit') setStats({...stats, pendingJobs: Math.max(0, stats.pendingJobs - 1)});
                } catch (err) { toast.error("Lỗi khi xóa tin đăng"); }
            }
        });
    };

    const handleSavePackage = async (pkg: Partial<PackageType>) => {
        try {
            if (editingPackage) {
                const res = await adminApi.updatePackage(editingPackage.id, pkg);
                setPackages(packages.map(p => p.id === editingPackage.id ? res.data : p));
                toast.success("Đã cập nhật gói dịch vụ");
            } else {
                const res = await adminApi.createPackage(pkg);
                setPackages([...packages, res.data]);
                toast.success("Đã tạo gói dịch vụ mới");
            }
            setShowPackageModal(false);
            setEditingPackage(null);
        } catch (err) { toast.error("Lỗi khi lưu gói dịch vụ"); }
    };

    const deletePackage = async (id: string) => {
        setConfirmState({
            show: true,
            title: "Xóa cấu hình gói cước",
            message: "Gói dịch vụ này sẽ không còn hiển thị cho người dùng mua mới. Thao tác này có thể ảnh hưởng đến doanh thu.",
            onConfirm: async () => {
                try {
                    await adminApi.deletePackage(id);
                    setPackages(packages.filter(p => p.id !== id));
                    toast.success("Đã xóa gói dịch vụ");
                } catch (err) { toast.error("Lỗi khi xóa gói dịch vụ"); }
            }
        });
    };

    // const pendingJobs = jobs.filter(j => !j.isApproved); // REMOVED DUPLICATE

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang đồng bộ dữ liệu quản trị...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-950 pb-20">
            
            {/* Header Area */}
            <div className="bg-[#111111] pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[150px] -mr-64 -mt-64"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-6">
                                <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Master Version 2.0</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Hệ thống sẵn sàng</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-semibold text-white mb-3 tracking-tighter uppercase  leading-[0.85]">
                                Helper<span className="text-orange-600">Admin</span>
                            </h1>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] ">Premium Management System • AI Optimized</p>
                        </div>
                        
                        <div className="flex bg-white/5 backdrop-blur-sm p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
                            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<LayoutDashboard size={14} />} label="Hệ thống" />
                            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14} />} label="Người dùng" />
                            <TabButton active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Briefcase size={14} />} label="Bài đăng" />
                            <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<ShieldCheck size={14} />} label="Duyệt tin" count={stats?.pendingJobs || 0} />
                            <TabButton active={activeTab === 'packages'} onClick={() => setActiveTab('packages')} icon={<Package size={14} />} label="Gói cước" />
                            <TabButton active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')} icon={<CreditCard size={14} />} label="Giao dịch" />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                {activeTab === 'stats' && stats && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <StatCard label="Thành viên" value={stats.totalUsers || 0} trend="+8%" subValue={`+${stats.newUsersToday || 0} mới hôm nay`} icon={<Users />} color="blue" />
                            <StatCard label="Bài đăng" value={stats.totalJobs || 0} trend="+12%" subValue={`+${stats.newJobsToday || 0} mới hôm nay`} icon={<Briefcase />} color="emerald" />
                            <StatCard label="Đang chờ duyệt" value={stats.pendingJobs || 0} subValue="Kiểm duyệt ngay" icon={<Clock />} color="orange" highlight={(stats.pendingJobs || 0) > 0} />
                            
                            <StatCard label="Ứng tuyển" value={stats.totalApplications || 0} trend="+15%" subValue="Tổng số lượt kết nối" icon={<Activity />} color="purple" />
                            <StatCard label="Gói trả phí" value={stats.activeSubscriptions || 0} trend="+5%" subValue="Doanh thu đang chạy" icon={<CreditCard />} color="rose" />
                            <StatCard label="Tỷ lệ lấp đầy" value="84%" subValue="Hiệu quả hệ thống" icon={<Zap />} color="amber" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-[0.3em] flex items-center">
                                            <Activity size={18} className="mr-4 text-orange-600" /> Hoạt động mới nhất
                                        </h3>
                                        <button className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-orange-600 transition-colors">Xem tất cả</button>
                                    </div>
                                    <div className="space-y-8">
                                        {(stats.recentUsers || []).map((u: any) => (
                                            <div key={u.id} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-300 group-hover:bg-orange-50 group-hover:border-orange-100 group-hover:text-orange-600 transition-all">
                                                        {(u.fullName || 'U').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-base uppercase  tracking-tighter leading-none mb-1.5">{u.fullName}</div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${u.role === 'Admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {u.role}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(u.createdAt).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-200 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                     <QuickActionCard label="Tạo thông báo" icon={<AlertCircle />} />
                                     <QuickActionCard label="Email Marketing" icon={<Edit />} />
                                </div>
                            </div>

                            <div className="bg-[#111111] rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 translate-x-10 translate-y-10 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={280} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-[0.4em] mb-12">Bảo mật & Hiệu năng</h3>
                                    <div className="space-y-6">
                                        <SecurityStatus label="Trạng thái tường lửa" status="On" />
                                        <SecurityStatus label="Database Health" status="98%" />
                                        <SecurityStatus label="Tốc độ phản hồi" status="124ms" />
                                        <SecurityStatus label="Tải máy chủ" status="Lo (24%)" />
                                    </div>
                                </div>
                                <div className="mt-12 p-8 bg-white/5 rounded-3xl border border-white/10 relative z-10 backdrop-blur-sm">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6  border-l-2 border-orange-600 pl-4">
                                        Hệ thống được giám sát thời gian thực. Mọi truy cập trái phép đều bị ngăn chặn tự động.
                                    </p>
                                    <button className="w-full py-4 bg-orange-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-zinc-950 transition-all shadow-xl shadow-orange-600/20 active:scale-95">Quản lý phiên đăng nhập</button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.4em]">Giao dịch mới nhất</h3>
                                <button onClick={() => setActiveTab('subscriptions')} className="text-[10px] font-bold text-orange-600 uppercase tracking-widest hover:translate-x-1 transition-transform">XEM TẤT CẢ LỊCH SỬ</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {subscriptions.slice(0, 4).map(s => (
                                    <div key={s.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-orange-500 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                <CreditCard size={20} />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-zinc-950 uppercase tracking-tighter">{(s.amount/1000).toLocaleString()}K</div>
                                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{s.tier}</div>
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-bold text-zinc-950 uppercase truncate leading-none mb-1">{s.userName}</div>
                                        <div className="text-[9px] font-bold text-slate-400 truncate tracking-widest lowercase mb-3">{s.userEmail}</div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <span className="text-[9px] font-bold text-slate-300">{new Date(s.createdAt).toLocaleDateString()}</span>
                                            <span className={`text-[7px] font-bold uppercase tracking-widest ${s.isActive ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                {s.isActive ? 'THÀNH CÔNG' : 'THẤT BẠI'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-50">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950 uppercase  tracking-tighter mb-1 leading-none">Cơ sở dữ liệu người dùng</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tìm kiếm và điều chỉnh quyền tài khoản</p>
                            </div>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <Filter size={14} className="my-auto ml-3 text-slate-300" />
                                <SearchInput 
                                    placeholder="TÊN / EMAIL / SỐ ĐIỆN THOẠI..." 
                                    value={userSearch} 
                                    onChange={(e: any) => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <th className="pb-8 pl-4">Thông tin cơ bản</th>
                                        <th className="pb-8">Liên hệ / Vai trò</th>
                                        <th className="pb-8">Gói cước</th>
                                        <th className="pb-8">Trạng thái</th>
                                        <th className="pb-8 text-right pr-4">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-8 pl-4">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 uppercase">
                                                        {u.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm text-zinc-900 uppercase  tracking-tighter leading-none mb-1.5">{u.fullName}</div>
                                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8">
                                                <div className="text-xs font-semibold text-zinc-950 mb-1 leading-none">{u.phone || 'Chưa cập nhật'}</div>
                                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded leading-none ${u.role === 'Admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-8">
                                                <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                                                    u.currentPackage === 'PROMAX' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    u.currentPackage === 'PRO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    {u.currentPackage || 'FREE'}
                                                </span>
                                            </td>
                                            <td className="py-8">
                                                <StatusTag active={u.isActive} />
                                            </td>
                                            <td className="py-8 text-right pr-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-zinc-950 hover:border-slate-300 shadow-sm transition-all" title="Sửa hồ sơ"><Edit size={16} /></button>
                                                    <button 
                                                        onClick={() => {
                                                            setTargetUser(u);
                                                            setShowAssignModal(true);
                                                        }} 
                                                        className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-orange-600 hover:bg-orange-600 hover:text-white shadow-sm transition-all"
                                                        title="Cấp gói cước"
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                    <button onClick={() => toggleUserStatus(u.id)} className={`p-3 border rounded-xl shadow-sm transition-all ${u.isActive ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>{u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}</button>
                                                    <button onClick={() => deleteUser(u.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950 uppercase  tracking-tighter mb-1 leading-none">Thư viện bài đăng</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giám sát {filteredJobsList.length} tin tức trên hệ thống</p>
                            </div>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <Filter size={14} className="my-auto ml-3 text-slate-300" />
                                <SearchInput 
                                    placeholder="TÌM TIÊU ĐỀ / NGƯỜI ĐĂNG..." 
                                    value={jobSearch} 
                                    onChange={(e: any) => setJobSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredJobsList.map(j => (
                                <div key={j.id} className="p-8 rounded-[2.5rem] border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                                    <div className="flex items-center gap-8">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${j.isForWorker ? 'bg-[#111111] text-white' : 'bg-orange-50 text-orange-600'}`}>
                                            {j.isForWorker ? <UserIcon size={24} /> : <Briefcase size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-lg uppercase  tracking-tighter leading-none">{j.title}</h4>
                                                {!j.isApproved && <span className="bg-orange-500 text-white text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Đang chờ duyệt</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="flex items-center"><MapPin size={12} className="mr-1.5 text-orange-600" /> {j.location}</span>
                                                <span className="flex items-center"><Activity size={12} className="mr-1.5" /> {j.serviceType}</span>
                                                <span className="flex items-center  text-zinc-950">@{j.user?.fullName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setViewingJob(j); setShowJobModal(true); }} className="flex-1 md:flex-none py-3 px-6 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-orange-600 hover:text-orange-600 transition-all flex items-center justify-center gap-2"><Eye size={16} /> Xem</button>
                                        <button onClick={() => deleteJob(j.id)} className="py-3 px-6 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2"><Trash2 size={16} /> Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[500px]">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950 uppercase  tracking-tighter mb-1 leading-none">Duyệt tin đăng mới</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiểm duyệt nội dung trước khi công khai</p>
                            </div>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <SearchInput 
                                    placeholder="SÁNG LỌC TIN CẦN DUYỆT..." 
                                    value={auditSearch} 
                                    onChange={(e: any) => setAuditSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        {pendingJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-100">
                                    <ShieldCheck size={40} />
                                </div>
                                <h4 className="text-lg font-semibold uppercase  tracking-tighter text-zinc-950 mb-2">Mọi thứ đã được làm sạch</h4>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Không có tin đăng nào đang đợi phê duyệt</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {pendingJobs.map(j => (
                                    <div key={j.id} className="p-8 rounded-[2.5rem] border-2 border-orange-100 bg-orange-50/20 hover:bg-orange-50/40 transition-all group">
                                        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                                            <div className="flex gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-100 text-orange-600">
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xl uppercase  tracking-tighter leading-none mb-3">{j.title}</h4>
                                                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                        {isPremiumUser(j.user) && (
                                                            <span className="bg-zinc-900 text-orange-500 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                                <CreditCard size={10} /> TÀI KHOẢN CAO CẤP
                                                            </span>
                                                        )}
                                                        <span>Loại: {j.serviceType}</span>
                                                        <span>Người đăng: {j.user?.fullName}</span>
                                                        <span className="text-orange-600">Lương: {(j.salary/1000000).toFixed(1)}M</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => { setViewingJob(j); setShowJobModal(true); }} className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-zinc-950 transition-all">Chi tiết</button>
                                                <button onClick={() => approveJob(j.id)} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-950 transition-all shadow-lg shadow-emerald-100">Phê duyệt ngay</button>
                                                <button onClick={() => deleteJob(j.id)} className="px-6 py-4 bg-white border border-red-100 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white/60 rounded-2xl border border-orange-50">
                                            <p className="text-[11px] font-medium text-slate-500  leading-relaxed">{j.description || 'Không có mô tả chi tiết'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950 uppercase tracking-tighter mb-1 leading-none">Cấu hình doanh thu</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tùy chỉnh các gói dịch vụ cao cấp trên hệ thống</p>
                            </div>
                            <button 
                                onClick={() => { setEditingPackage(null); setShowPackageModal(true); }}
                                className="bg-[#111111] text-white px-10 py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center shadow-2xl shadow-zinc-200 hover:bg-orange-600 transition-all active:scale-95 shrink-0"
                            >
                                <Plus size={18} className="mr-3" /> Tạo định dạng mới
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {packages.map(p => (
                                <div key={p.id} className={`p-10 rounded-[3.5rem] border-2 transition-all flex flex-col h-full relative group overflow-hidden ${p.isActive ? 'bg-white border-slate-50 hover:border-orange-500 shadow-xl shadow-slate-100 hover:shadow-orange-100/30' : 'bg-slate-50/30 border-dashed border-slate-100 grayscale opacity-60'}`}>
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                                        <Package size={120} />
                                    </div>
                                    <div className="flex justify-between items-start mb-10 relative z-10">
                                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                                            <CreditCard size={28} />
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => { setEditingPackage(p); setShowPackageModal(true); }} className="p-3 bg-white text-slate-400 hover:text-zinc-950 hover:shadow-md rounded-xl transition-all"><Edit size={16} /></button>
                                            <button onClick={() => deletePackage(p.id)} className="p-3 bg-white text-slate-300 hover:text-red-500 hover:shadow-md rounded-xl transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <h4 className="text-2xl font-bold uppercase tracking-tighter mb-3 leading-none text-zinc-950 relative z-10">{p.name}</h4>
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.25em] flex items-center">
                                            <Clock size={12} className="mr-2" /> {p.days} NGÀY
                                        </div>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                                            CODE: {p.code}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 mb-8 relative z-10 flex-grow">
                                        <div className="grid grid-cols-3 gap-3">
                                            <MetricBox label="Views" value={p.maxViews} />
                                            <MetricBox label="Apps" value={p.maxApplications} />
                                            <MetricBox label="Jobs" value={p.maxJobPosts} />
                                        </div>

                                        <div className="space-y-3 py-4 border-y border-slate-50">
                                            <FeatureRow active={!p.needsApproval} label={p.needsApproval ? "Cần Admin duyệt bài" : "Đăng bài không cần duyệt"} />
                                            <FeatureRow active={p.isPriority} label="Ưu tiên tin Top & Duyệt nhanh" />
                                            <FeatureRow active={p.allowRoleSwitch} label="Chuyển vai trò linh hoạt" />
                                            <FeatureRow active label={p.supportLevel} />
                                        </div>

                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">"{p.description}"</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50 relative z-10">
                                        <div>
                                            <div className="text-3xl font-bold tracking-tighter text-zinc-950">{(p.price/1000).toLocaleString()}K</div>
                                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Đơn giá VND</div>
                                        </div>
                                        <StatusTag active={p.isActive} small />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'subscriptions' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-950 uppercase  tracking-tighter mb-1 leading-none">Lịch sử giao dịch & Đăng ký</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giám sát {subscriptions.length} giao dịch gần nhất</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        <th className="pb-8 pl-4">Mã giao dịch</th>
                                        <th className="pb-8">Khách hàng</th>
                                        <th className="pb-8">Gói cước</th>
                                        <th className="pb-8">Giá trị</th>
                                        <th className="pb-8">Ngày mua / Hết hạn</th>
                                        <th className="pb-8 text-right pr-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {subscriptions.map(s => (
                                        <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-8 pl-4">
                                                <div className="text-xs font-black font-mono text-zinc-950 uppercase tracking-tight">#{s.transactionId}</div>
                                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">ID: {s.id.split('-')[0]}</div>
                                            </td>
                                            <td className="py-8">
                                                <div className="text-sm font-semibold text-zinc-900 uppercase tracking-tighter leading-none mb-1.5">{s.userName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 lowercase">{s.userEmail}</div>
                                            </td>
                                            <td className="py-8 text-xs font-black text-orange-600 tracking-widest uppercase">{s.tier}</td>
                                            <td className="py-8 font-bold text-zinc-950">{(s.amount/1000).toLocaleString()}K</td>
                                            <td className="py-8">
                                                <div className="text-[10px] font-bold text-slate-500 mb-1">{new Date(s.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{new Date(s.expiredAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="py-8 text-right pr-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${s.isActive && new Date(s.expiredAt) > new Date() ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                    {s.isActive && new Date(s.expiredAt) > new Date() ? 'Đang hoạt động' : 'Hết hạn'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showPackageModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full max-h-[90vh] flex flex-col relative shadow-2xl border border-white"
                        >
                            <h3 className="text-3xl font-semibold text-zinc-900 uppercase tracking-tighter mb-10 leading-none shrink-0">
                                {editingPackage ? 'Cập nhật cấu hình' : 'Thiết lập định dạng mới'}
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
                                <PackageForm 
                                    initialData={editingPackage} 
                                    onSave={handleSavePackage} 
                                    onCancel={() => { setShowPackageModal(false); setEditingPackage(null); }} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {showUserModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full relative shadow-2xl border border-white"
                        >
                            <h3 className="text-3xl font-semibold text-zinc-900 uppercase  tracking-tighter mb-10 leading-none">Chỉnh sửa hồ sơ</h3>
                            <UserEditForm 
                                data={editingUser} 
                                onSave={handleSaveUser} 
                                onCancel={() => { setShowUserModal(false); setEditingUser(null); }} 
                            />
                        </motion.div>
                    </div>
                )}

                {showAssignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full relative shadow-2xl border border-white"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-3xl font-semibold text-zinc-900 uppercase  tracking-tighter mb-1 leading-none">Cấp quyền truy cập</h3>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">{targetUser?.fullName} • {targetUser?.email}</p>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="p-3 bg-slate-50 rounded-full text-slate-300 hover:text-zinc-950 transition-all"><X size={20} /></button>
                            </div>
                            
                            <div className="space-y-4 mb-10">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Chọn gói cước muốn cấp:</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {['FREE', 'TRIAL', 'PRO', 'PROMAX'].map(code => (
                                        <button 
                                            key={code}
                                            onClick={() => {
                                                handleAssignPackage(targetUser.id, code);
                                                setShowAssignModal(false);
                                            }}
                                            className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-100 rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="text-left py-1">
                                                    <div className="text-[11px] font-bold text-zinc-950 uppercase tracking-widest">{code}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Kích hoạt ngay lập tức</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-200 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setShowAssignModal(false)} className="w-full py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-zinc-950 transition-colors">Đóng cửa sổ</button>
                        </motion.div>
                    </div>
                )}

                {showJobModal && (
                    <JobDetailModal 
                        job={viewingJob} 
                        onClose={() => { setShowJobModal(false); setViewingJob(null); }} 
                        onApprove={approveJob} 
                    />
                )}
                
                {confirmState?.show && (
                    <ConfirmDialog 
                        title={confirmState.title}
                        message={confirmState.message}
                        onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
                        onCancel={() => setConfirmState(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

/* Sub-components */

const TabButton = ({ active, onClick, icon, label, count }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center space-x-3 px-8 py-4 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-widest transition-all relative ${active ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-slate-400 hover:text-white'}`}
    >
        {icon} 
        <span>{label}</span>
        {count !== undefined && count > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[8px] tracking-normal ${active ? 'bg-white text-orange-600' : 'bg-orange-500 text-white animate-pulse'}`}>
                {count}
            </span>
        )}
    </button>
);

const StatCard = ({ label, value, subValue, icon, color, highlight, trend }: any) => (
    <div className={`p-10 rounded-[3rem] border transition-all relative group overflow-hidden ${highlight ? 'bg-orange-50 border-orange-100 animate-pulse-subtle' : 'bg-white border-slate-50 shadow-xl shadow-slate-200/40 hover:border-slate-100'}`}>
        <div className={`w-14 h-14 rounded-[1.5rem] bg-${color}-50 flex items-center justify-center mb-8 group-hover:rotate-[10deg] transition-transform text-${color}-600`}>
            {icon}
        </div>
        <div>
            <div className="flex items-baseline space-x-3 mb-2">
                <div className="text-5xl font-bold text-zinc-950 tracking-tighter leading-none">{value?.toLocaleString() || '0'}</div>
                {trend && <div className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">{trend}</div>}
            </div>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-3">{label}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ">{subValue}</div>
        </div>
    </div>
);

const SecurityStatus = ({ label, status }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group cursor-default">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
        <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-4 py-1.5 rounded-xl">{status}</span>
    </div>
);

const StatusTag = ({ active, small }: { active: boolean, small?: boolean }) => (
    <span className={`inline-flex items-center font-bold uppercase tracking-widest rounded-full ${small ? 'text-[7px] px-2 py-0.5' : 'text-[9px] px-3 py-1.5'} ${active ? 'text-emerald-500 bg-emerald-50 border border-emerald-100' : 'text-red-400 bg-red-50 border border-red-100'}`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-400'}`} />
        {active ? 'Hoạt động' : 'Bị khóa'}
    </span>
);

const QuickActionCard = ({ label, icon }: any) => (
    <div className="p-8 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-orange-200 transition-all">
         <div className="flex items-center space-x-6 text-zinc-950">
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">{icon}</div>
             <span className="text-[11px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">{label}</span>
         </div>
         <ChevronRight size={18} className="text-slate-100 group-hover:text-orange-600 transition-colors" />
    </div>
);

const FeatureBadge = ({ active, label, color, inverted }: any) => {
    const isShown = inverted ? !active : active;
    return (
        <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all ${
            isShown 
                ? `bg-${color}-50 text-${color}-600 border border-${color}-100` 
                : 'bg-slate-50 text-slate-300 border border-slate-100 opacity-50'
        }`}>
            {isShown ? '✓ ' : '✕ '}{label}
        </div>
    );
};

const ToggleButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <div className="flex flex-col space-y-2">
        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <button 
            onClick={onClick} 
            className={`w-full py-3 rounded-xl border-2 flex items-center justify-center transition-all ${active ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white border-slate-100 text-slate-200'}`}
        >
            {active ? <Check size={16} /> : <X size={16} />}
        </button>
    </div>
);

const SearchInput = ({ placeholder, value, onChange }: any) => (
    <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-transparent px-5 py-4 outline-none text-[10px] font-bold uppercase tracking-widest text-zinc-950 placeholder:text-slate-300 w-full md:w-80"
    />
);

const PackageForm = ({ initialData, onSave, onCancel }: any) => {
    const [data, setData] = useState(initialData || { 
        name: '', 
        code: '', 
        price: 0, 
        days: 30, 
        description: '', 
        isActive: true,
        maxViews: 1,
        maxApplications: 1,
        maxJobPosts: 1,
        needsApproval: true,
        isPriority: false,
        supportLevel: 'Normal',
        allowRoleSwitch: false
    });
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Tên gói cước</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="VÍ DỤ: CHỦ NHÀ VIP" />
                </div>
                <div className="col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Mã gói (Code)</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.code} onChange={e => setData({...data, code: e.target.value})} placeholder="VÍ DỤ: VIP_PLAN" />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Đơn giá (VND)</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.price} onChange={e => setData({...data, price: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Hiệu lực (Ngày)</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.days} onChange={e => setData({...data, days: Number(e.target.value)})} />
                </div>

                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Lượt xem (Views)</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.maxViews} onChange={e => setData({...data, maxViews: Number(e.target.value)})} placeholder="-1 = Không giới hạn" />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Lượt ứng tuyển</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.maxApplications} onChange={e => setData({...data, maxApplications: Number(e.target.value)})} placeholder="-1 = Không giới hạn" />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Lượt đăng bài</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.maxJobPosts} onChange={e => setData({...data, maxJobPosts: Number(e.target.value)})} placeholder="-1 = Không giới hạn" />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Mức độ hỗ trợ</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" value={data.supportLevel} onChange={e => setData({...data, supportLevel: e.target.value})} placeholder="VÍ DỤ: 24/7, FAST..." />
                </div>

                <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ToggleButton label="Cần duyệt bài" active={data.needsApproval} onClick={() => setData({...data, needsApproval: !data.needsApproval})} />
                    <ToggleButton label="Ưu tiên Top" active={data.isPriority} onClick={() => setData({...data, isPriority: !data.isPriority})} />
                    <ToggleButton label="Đổi vai trò" active={data.allowRoleSwitch} onClick={() => setData({...data, allowRoleSwitch: !data.allowRoleSwitch})} />
                    <ToggleButton label="Phát hành" active={data.isActive} onClick={() => setData({...data, isActive: !data.isActive})} />
                </div>

                <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Mô tả đặc quyền</label>
                    <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold focus:ring-4 focus:ring-orange-100 outline-none h-32 resize-none transition-all" value={data.description} onChange={e => setData({...data, description: e.target.value})} placeholder="LIỆT KÊ CÁC TÍNH NĂNG MỞ KHÓA..." />
                </div>
            </div>
            <div className="flex gap-4 pt-10 border-t border-slate-50">
                <button onClick={onCancel} className="flex-1 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-zinc-950 transition-colors">Hủy thao tác</button>
                <button onClick={() => onSave(data)} className="flex-[2] py-5 bg-zinc-950 text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl active:scale-95">Lưu cấu hình</button>
            </div>
        </div>
    );
};

const UserEditForm = ({ data, onSave, onCancel }: any) => {
    const [u, setU] = useState(data);
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Họ và tên</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold outline-none" value={u.fullName} onChange={e => setU({...u, fullName: e.target.value})} />
                </div>
                <div className="col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email tài khoản</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold outline-none" value={u.email} onChange={e => setU({...u, email: e.target.value})} />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Số điện thoại</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold outline-none" value={u.phone} onChange={e => setU({...u, phone: e.target.value})} />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Vai trò (Role)</label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold outline-none" value={u.role} onChange={e => setU({...u, role: e.target.value})}>
                        <option value="Worker">Worker</option>
                        <option value="Employer">Employer</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-4 pt-6">
                <button onClick={onCancel} className="flex-1 py-4 text-[10px] font-bold text-slate-400 uppercase">Hủy</button>
                <button onClick={() => onSave(u)} className="flex-1 py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-bold uppercase shadow-lg">Lưu lại</button>
            </div>
        </div>
    );
};

const JobDetailModal = ({ job, onClose, onApprove }: any) => {
    if (!job) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-12 max-w-4xl w-full relative overflow-hidden"
            >
                <button onClick={onClose} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full text-slate-300 hover:text-zinc-950 transition-colors"><X size={20} /></button>
                <div className="flex flex-col md:flex-row gap-12">
                    <div className="w-full md:w-1/3 space-y-8">
                        <div className={`w-full aspect-square rounded-[2rem] flex items-center justify-center text-5xl font-bold ${job.isForWorker ? 'bg-zinc-950 text-white' : 'bg-orange-50 text-orange-600'}`}>
                            {job.title.charAt(0)}
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                            <DetailRow label="Tác giả" value={job.user?.fullName} />
                            <DetailRow label="Liên hệ" value={job.user?.phone || 'N/A'} />
                            <DetailRow label="Lương" value={`${(job.salary/1000000).toFixed(1)} triệu VND`} />
                            <DetailRow label="Hình thức" value={job.jobType} />
                        </div>
                    </div>
                    <div className="flex-1 space-y-8">
                        <div>
                             <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">Chi tiết bài đăng</h4>
                            <h2 className="text-4xl font-semibold uppercase  tracking-tighter text-zinc-950 leading-none">{job.title}</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Nội dung tuyển dụng/giới thiệu</span>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed  border-l-4 border-orange-100 pl-6">{job.description}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-zinc-950 uppercase tracking-widest">Kỹ năng & Yêu cầu</span>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {(job.skills || 'Liên hệ để biết thêm').split(',').map((s: string) => (
                                        <span key={s} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest">{s.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="pt-10 flex gap-4">
                            {!job.isApproved && (
                                <button onClick={() => { onApprove(job.id); onClose(); }} className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-zinc-950 transition-all">Phê duyệt ngay</button>
                            )}
                            <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-zinc-950 rounded-[2rem] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Đóng cửa sổ</button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const DetailRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-300">{label}</span>
        <span className="text-zinc-950 ">{value}</span>
    </div>
);

const ConfirmDialog = ({ title, message, onConfirm, onCancel }: any) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl overflow-hidden border border-white"
        >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform">
                <AlertCircle size={200} />
            </div>
            <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-100/50">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 uppercase  tracking-tighter mb-4 leading-none">{title}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10  border-l-2 border-red-500 pl-4 text-left">
                    {message}
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-zinc-950 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-5 bg-red-500 text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-950 transition-all shadow-xl shadow-red-100 active:scale-95"
                    >
                        Tiếp tục xóa
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
);

const MetricBox = ({ label, value }: { label: string, value: number }) => (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
        <div className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">{label}</div>
        <div className="text-sm font-black text-zinc-950">{value === -1 ? '∞' : value}</div>
    </div>
);

const FeatureRow = ({ active, label }: { active: boolean, label: string }) => (
    <div className={`flex items-center gap-3 text-[11px] font-bold ${active ? 'text-slate-600' : 'text-slate-300 opacity-50'}`}>
        {active ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-slate-200" />}
        {label}
    </div>
);

export default AdminDashboardPage;
