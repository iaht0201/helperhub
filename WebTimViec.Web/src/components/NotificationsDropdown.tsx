import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Info, UserPlus, FileCheck, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '../api/notificationApi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface Props {
    textColorClass: string;
}

const NotificationsDropdown: React.FC<Props> = ({ textColorClass }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getNotifications();
            const newNotifications = res.data as Notification[];
            
            // CRITICAL FIX: Only toast for notifications that appear AFTER the very first fetch
            if (notifications.length > 0) {
                const currentIds = notifications.map(n => n.id);
                newNotifications.forEach(n => {
                    if (!n.isRead && !currentIds.includes(n.id)) {
                        toast.success(n.title + ": " + n.message, {
                            icon: '🔔',
                            duration: 4000,
                            position: 'top-right',
                            style: {
                                borderRadius: '1rem',
                                background: '#111',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)'
                            }
                        });
                    }
                });
            }

            setNotifications(newNotifications);
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Approval': return <FileCheck className="text-emerald-500" size={16} />;
            case 'Invitation': return <UserPlus className="text-blue-500" size={16} />;
            case 'Application': return <Info className="text-orange-500" size={16} />;
            case 'StatusUpdate': return <Check className="text-purple-500" size={16} />;
            case 'Transaction':
            case 'System': return <CreditCard className="text-amber-500" size={16} />;
            default: return <Bell className="text-slate-400" size={16} />;
        }
    };

    const handleNotificationClick = async (n: Notification) => {
        await markAsRead(n.id);
        setIsOpen(false);
        if (n.type === 'Transaction' || n.type === 'System') {
            window.location.href = '/dashboard?tab=transactions';
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all relative hover:bg-slate-100/10 ${textColorClass}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white md:border-transparent">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 md:w-96 bg-zinc-900 border border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden z-50 origin-top-right backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
                                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Thông báo</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-[8px] font-bold text-orange-500 uppercase tracking-widest hover:underline"
                                    >
                                        Đã đọc tất cả
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[min(450px,70vh)] overflow-y-auto no-scrollbar py-2">
                                {notifications.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                                        <Bell size={40} className="mb-4 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Hộp thư rỗng</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-5 flex gap-4 hover:bg-white/5 transition-all cursor-pointer relative group ${!n.isRead ? 'bg-orange-600/5' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${!n.isRead ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-[11px] font-bold text-white uppercase tracking-tight truncate pr-4">{n.title}</h4>
                                                    {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0 shadow-lg shadow-orange-600/50"></div>}
                                                </div>
                                                <p className="text-[10px] font-medium text-zinc-400 leading-relaxed line-clamp-2">{n.message}</p>
                                                <div className="mt-2 flex items-center text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                                                    <Clock size={10} className="mr-1.5 text-orange-500" /> 
                                                    {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Link 
                                to="/dashboard" 
                                onClick={() => setIsOpen(false)}
                                className="block w-full py-5 text-center text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] bg-zinc-950/50 border-t border-white/5 hover:text-orange-500 hover:bg-zinc-950 transition-all"
                            >
                                Xem tất cả hoạt động
                            </Link>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationsDropdown;
