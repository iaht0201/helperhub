import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, User, Crown, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import logo from '../assets/logo.png';
import NotificationsDropdown from './NotificationsDropdown';

const Navbar: React.FC = () => {
    const { user, logout, toggleRole } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isDarkHeroPage = location.pathname === '/' && !new URLSearchParams(location.search).toString();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isLogin = location.pathname === '/login';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isAuthPage) {
        return (
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-sm' : 'py-6 md:py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center h-10">
                    <Link to="/" className="flex items-center space-x-2 group">
                         <img src={logo} alt="HelperHub" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                    </Link>
                    
                    <div className="flex items-center space-x-6">
                        <Link to="/" className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${scrolled ? 'text-slate-500 hover:text-orange-600' : 'text-white/70 hover:text-white'}`}>
                            Quay lại trang chủ
                        </Link>
                        <Link to={isLogin ? '/register' : '/login'} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all hidden sm:block ${
                            scrolled 
                            ? 'bg-zinc-900 text-white hover:bg-orange-600 shadow-lg' 
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm'
                        }`}>
                            {isLogin ? 'Tham gia ngay' : 'Đăng nhập'}
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    const navLinks = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Bảng giá', path: '/subscription' },
        { name: 'Giới thiệu', path: '/about' },
    ];

    const textColorClass = (!scrolled && isDarkHeroPage) ? 'text-white' : 'text-zinc-900';
    const linkColorClass = (!scrolled && isDarkHeroPage) ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-orange-600';

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
            scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)] py-2' 
            : `py-5 ${isDarkHeroPage ? 'bg-transparent' : 'bg-white/80 backdrop-blur-sm'}`
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 group h-14">
                             <img src={logo} alt="HelperHub" className="h-[40px] w-auto object-contain transition-transform group-hover:scale-105" />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all ${
                                        isActive ? 'text-orange-600' : linkColorClass
                                    }`}
                                >
                                    <span>{link.name}</span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="nav-underline" 
                                            className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-orange-600 rounded-full" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden lg:flex items-center space-x-5">
                        {user && <NotificationsDropdown textColorClass={textColorClass} />}
                        {user ? (
                            <div className={`flex items-center space-x-4 pl-6 border-l transition-colors ${scrolled ? 'border-slate-100' : 'border-white/10'}`}>
                                <div className="text-right">
                                    <p className={`text-[8px] font-semibold uppercase tracking-widest opacity-40 ${textColorClass}`}>Chào bạn,</p>
                                    <p className={`text-[11px] font-semibold uppercase ${textColorClass}`}>{user.fullName.split(' ').pop()}</p>
                                </div>
                                <div className="group relative">
                                    <Link to="/dashboard" className={`block w-9 h-9 rounded-full p-0.5 shadow-lg group-hover:scale-105 transition-all ${
                                        user.subscriptionTier?.includes('PROMAX') ? 'bg-gradient-to-tr from-amber-600 to-amber-300' : 
                                        user.subscriptionTier?.includes('PRO') ? 'bg-gradient-to-tr from-blue-600 to-blue-300' : 
                                        'bg-slate-200'
                                    }`}>
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-zinc-900 font-bold text-xs overflow-hidden">
                                            {user.fullName.charAt(0)}
                                        </div>
                                    </Link>
                                    
                                    {user.isSubscribed && user.subscriptionTier !== 'BASIC' && user.subscriptionTier !== 'FREE' && (
                                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                                            user.subscriptionTier?.includes('PROMAX') ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}>
                                            <Crown size={8} className="text-white fill-white" />
                                        </div>
                                    )}

                                    <div className="absolute top-10 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                                        <div className="px-3 py-2 mb-2 border-b border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Cấp độ tài khoản</p>
                                            <div className="flex items-center space-x-1.5">
                                                <span className={`text-[11px] font-black uppercase ${
                                                    user.subscriptionTier === 'ENTERPRISE' ? 'text-orange-600' :
                                                    user.subscriptionTier?.includes('PROMAX') ? 'text-amber-500' : 
                                                    user.subscriptionTier?.includes('PRO') ? 'text-blue-500' : 
                                                    'text-slate-400'
                                                }`}>
                                                     {user.subscriptionTier === 'ENTERPRISE' ? 'Gói Enterprise' : 
                                                      user.subscriptionTier?.includes('PROMAX') ? 'Gói PRO MAX' : 
                                                      user.subscriptionTier === 'PRO' ? 'Gói Professional' : 
                                                      'Thành viên thường'}
                                                </span>
                                            </div>
                                            {user.isSubscribed && user.subscriptionExpiredAt && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                                    Hạn dùng: {user.role === 'Admin' ? 'Vĩnh viễn' : new Date(user.subscriptionExpiredAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>

                                        {user.role === 'Admin' && (
                                            <Link to="/admin" className="flex items-center space-x-3 p-3 hover:bg-orange-50 rounded-xl transition-colors text-orange-600">
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><ShieldCheck size={16} /></div>
                                                <span className="text-[11px] font-semibold uppercase">Quản trị hệ thống</span>
                                            </Link>
                                        )}

                                        {(user.subscriptionTier === 'ENTERPRISE' || user.role === 'Admin') && (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await toggleRole();
                                                        toast.success(`Đã chuyển sang vai trò ${user.role === 'Worker' ? 'Nhà tuyển dụng' : 'Người tìm việc'}`);
                                                    } catch (err) {
                                                        toast.error("Không thể chuyển đổi vai trò");
                                                    }
                                                }}
                                                className="w-full flex items-center space-x-3 p-3 hover:bg-orange-50 rounded-xl transition-all text-orange-600"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><ArrowLeftRight size={16} /></div>
                                                <div className="text-left">
                                                    <span className="text-[11px] font-semibold uppercase block leading-none">Chuyển vai trò</span>
                                                    <span className="text-[8px] font-medium text-orange-400 uppercase tracking-tighter">Hiện tại: {user.role === 'Worker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}</span>
                                                </div>
                                            </button>
                                        )}
                                        <Link to="/dashboard" className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><LayoutDashboard size={16} /></div>
                                            <span className="text-[11px] font-semibold uppercase text-slate-700">Quản lý cá nhân</span>
                                        </Link>
                                        <Link to="/profile/edit" className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><User size={16} /></div>
                                            <span className="text-[11px] font-semibold uppercase text-slate-700">Chỉnh sửa hồ sơ</span>
                                        </Link>
                                        <button onClick={logout} className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-500">
                                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><LogOut size={16} /></div>
                                            <span className="text-[11px] font-semibold uppercase">Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                 <Link to="/login" className={`text-xs font-semibold uppercase tracking-widest hover:text-orange-600 transition-colors px-4 py-2 ${textColorClass}`}>Đăng nhập</Link>
                                 <Link to="/register" className="bg-zinc-950 text-white px-7 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-zinc-950/20 active:scale-95">Tham gia ngay</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className={`p-2 transition-colors ${textColorClass}`}>
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-8 space-y-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-xl font-semibold text-zinc-900 uppercase tracking-tighter hover:text-orange-600 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-6 border-t border-slate-50 flex flex-col space-y-3">
                                {user ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full py-4 bg-slate-50 text-zinc-900 font-semibold rounded-xl flex items-center justify-center space-x-2">
                                            <LayoutDashboard size={18} /> <span>QUẢN LÝ</span>
                                        </Link>
                                        <button onClick={() => { logout(); setIsOpen(false); }} className="w-full py-4 bg-red-50 text-red-500 font-semibold rounded-xl flex items-center justify-center space-x-2">
                                            <LogOut size={18} /> <span>ĐĂNG XUẤT</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center py-4 font-semibold text-zinc-900 border border-slate-100 rounded-xl">ĐĂNG NHẬP</Link>
                                        <Link to="/register" onClick={() => setIsOpen(false)} className="block w-full text-center py-4 bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/20">ĐĂNG KÝ</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
