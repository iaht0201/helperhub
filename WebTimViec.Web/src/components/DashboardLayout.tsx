import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, Star, ArrowLeftRight, Crown } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DashboardLayout: React.FC = () => {
    const { user, toggleRole } = useAuth();
    const [counts, setCounts] = React.useState({ apps: 0, invitations: 0 });
    const location = useLocation();
    
    React.useEffect(() => {
        const fetchCounts = async () => {
            if (user) {
                try {
                    const { applicationApi } = await import('../api/applicationApi');
                    const [apps, invs] = await Promise.all([
                        applicationApi.getMyApplications(),
                        applicationApi.getMyInvitations()
                    ]);
                    setCounts({
                        apps: apps.data.length,
                        invitations: invs.data.length
                    });
                } catch (err) {
                    console.error("Failed to fetch counts", err);
                }
            }
        };
        fetchCounts();
    }, [user]);

    const activeRole = user?.workingRole || (user?.role === 'Admin' ? 'Employer' : user?.role);
    const isWorker = activeRole === 'Worker';

    const handleToggleRole = async () => {
        try {
            await toggleRole();
            const newRole = user?.workingRole === 'Worker' ? 'Employer' : 'Worker';
            toast.success(`Đã chuyển sang vai trò ${newRole === 'Worker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}`);
        } catch (err) {
            toast.error("Không thể chuyển đổi vai trò");
        }
    };

    const totalBadge = counts.apps + counts.invitations;

    const navItems = [
        { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/dashboard', badge: totalBadge },
        { icon: User, label: 'Hồ sơ cá nhân', path: '/profile/edit' },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-32 pb-24 min-h-screen font-sans selection:bg-orange-100 selection:text-orange-950">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* 1. True Navigation Sidebar */}
                <aside className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden"
                    >
                        {/* User Summary */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shrink-0 ${
                                    user?.subscriptionTier?.includes('PROMAX') ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-600/20' :
                                    user?.subscriptionTier?.includes('PRO') ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-600/20' :
                                    'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-600/20'
                                }`}>
                                    {user?.fullName.charAt(0) || 'U'}
                                </div>
                                {user?.isSubscribed && (
                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                                        user.subscriptionTier?.includes('PROMAX') ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}>
                                        <Crown size={10} className="text-white fill-white" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-sm font-bold text-zinc-900 truncate">{user?.fullName || 'Người dùng'}</h2>
                                    {totalBadge > 0 && (
                                        <span className="w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                            {totalBadge}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                                    user?.subscriptionTier?.includes('PROMAX') ? 'text-amber-600' :
                                    user?.subscriptionTier?.includes('PRO') ? 'text-blue-600' :
                                    'text-orange-600'
                                }`}>
                                   {isWorker ? 'Người tìm việc' : 'Nhà tuyển dụng'}
                                </p>
                                {user?.isSubscribed && (
                                    <div className="flex flex-col mt-1">
                                         <span className={`text-[8px] font-black uppercase ${user.subscriptionTier?.includes('PROMAX') ? 'text-amber-500' : 'text-blue-500'}`}>
                                             {user.subscriptionTier?.includes('PROMAX') ? 'Thành viên PRO MAX' : 'Thành viên PRO'}
                                         </span>
                                        {user.subscriptionExpiredAt && (
                                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                                 Hạn: {user.role === 'Admin' ? 'Vĩnh viễn' : new Date(user.subscriptionExpiredAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Navigation Menu */}
                        <nav className="space-y-1">
                            {navItems.map((item, idx) => {
                                const isActive = location.pathname.startsWith(item.path) && item.path !== '#';
                                
                                return (
                                    <Link 
                                        key={idx}
                                        to={item.path}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                            isActive 
                                                ? 'bg-zinc-950 text-white shadow-lg' 
                                                : 'text-slate-400 hover:bg-slate-50 hover:text-orange-600'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon size={16} />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge ? (
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                            
                            {(user?.subscriptionTier === 'ENTERPRISE' || user?.role === 'Admin') && (
                                <button 
                                    onClick={handleToggleRole}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-orange-600 hover:bg-orange-50 mt-2 border border-orange-100/50 border-dashed"
                                >
                                    <ArrowLeftRight size={16} />
                                    <div className="text-left">
                                        <span className="block">Chuyển vai trò</span>
                                        <span className="text-[10px] text-orange-400 normal-case tracking-tight">Đang hiện: {isWorker ? 'Người tìm việc' : 'Nhà tuyển dụng'}</span>
                                    </div>
                                </button>
                            )}
                        </nav>
                    </motion.div>
                    
                    {!isWorker && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-zinc-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
                        >
                            <h3 className="font-bold text-sm mb-2 flex items-center uppercase tracking-widest">
                                <Star size={14} className="mr-2 text-orange-500" fill="currentColor" /> 
                                HelperHub Pro
                            </h3>
                            <p className="text-slate-400 text-[10px] mb-6 leading-relaxed font-semibold tracking-wide">
                                Mở khóa thông tin liên hệ ứng viên và ưu tiên hiển thị tin đăng của bạn.
                            </p>
                            <Link to="/subscription" className="block w-full py-3 bg-white text-zinc-950 font-bold rounded-xl text-center hover:bg-orange-600 hover:text-white transition-all text-[10px] uppercase tracking-widest shadow-lg">
                                Nâng cấp ngay
                            </Link>
                        </motion.div>
                    )}
                </aside>

                {/* 2. Main Dashboard Area */}
                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
