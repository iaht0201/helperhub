import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone, Building, Check, X, Clock, Lock, ArrowLeft, CreditCard } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';
import toast from 'react-hot-toast';

const FakeGatewayPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId') || "ORD_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const [method, setMethod] = useState("momo");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = async (resultCode: number) => {
        setIsProcessing(true);
        try {
            const response = await subscriptionApi.paymentCallback(orderId, resultCode);
            window.location.href = response.data.redirectUrl;
        } catch (error) {
            setIsProcessing(false);
            toast.error("Lỗi xác nhận giao dịch!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-emerald-100">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row relative z-10"
            >
                {/* Left Panel: Luxury Context */}
                <div className="md:w-[380px] bg-zinc-950 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                    
                    <div className="relative z-10">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mb-12"
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <ShieldCheck size={24} className="text-zinc-950" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Secure Gateway</span>
                                <span className="text-xs font-bold text-slate-500">Verified by HelperHub</span>
                            </div>
                        </motion.div>

                        <div className="space-y-10">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h1 className="text-4xl font-black tracking-tight mb-2 leading-none">Thanh toán</h1>
                                <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                            </motion.div>
                            
                            <div className="space-y-6 pt-4">
                                <InfoBlock label="Mã đơn hàng" value={orderId} isMono color="text-emerald-400" />
                                <InfoBlock label="Đơn vị thanh toán" value="HelperHub Việt Nam" />
                                <InfoBlock label="Trạng thái" value="Đang chờ thanh toán..." />
                            </div>
                        </div>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="pt-10 border-t border-white/5 space-y-4"
                    >
                        <div className="flex items-center gap-2 text-emerald-400/80">
                            <Lock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">PCI DSS Level 1</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Môi trường giả lập bảo mật. Tuyệt đối không nhập thông tin ngân hàng thật của bạn tại đây.
                        </p>
                    </motion.div>
                </div>

                {/* Right Panel: Sleek Actions */}
                <div className="flex-1 p-12 bg-white flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <button className="flex items-center gap-2 text-slate-400 hover:text-zinc-950 transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest leading-none">Quay lại</span>
                        </button>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bước 2 / 2</div>
                    </div>

                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">1. Chọn phương thức thanh toán</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                        <MethodCard active={method === 'momo'} onClick={() => setMethod('momo')} icon={<Smartphone />} label="Momo" />
                        <MethodCard active={method === 'zalopay'} onClick={() => setMethod('zalopay')} icon={<Smartphone />} label="ZaloPay" />
                        <MethodCard active={method === 'atm'} onClick={() => setMethod('atm')} icon={<Building />} label="Thẻ ATM" />
                        <MethodCard active={method === 'visa'} onClick={() => setMethod('visa')} icon={<CreditCard />} label="Visa/Master" />
                    </div>

                    <div className="mt-auto space-y-4">
                        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 text-center">2. Kết quả mô phỏng</h3>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <ActionButton 
                                disabled={isProcessing} 
                                onClick={() => handleAction(0)} 
                                variant="success" 
                                icon={<Check size={18} />}
                                label="Thành công" 
                            />
                            <ActionButton 
                                disabled={isProcessing} 
                                onClick={() => handleAction(1)} 
                                variant="danger" 
                                icon={<X size={18} />}
                                label="Thất bại" 
                            />
                        </div>
                        <button 
                            disabled={isProcessing} 
                            onClick={() => handleAction(2)}
                            className="w-full flex items-center justify-center gap-2 p-4 text-slate-400 hover:text-amber-500 font-black uppercase tracking-[0.2em] text-[10px] transition-all rounded-2xl hover:bg-amber-50"
                        >
                            <Clock size={16} /> 
                            {isProcessing ? "Đang xử lý..." : "Chờ xử lý (Pending)"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InfoBlock: React.FC<{ label: string, value: string, isMono?: boolean, color?: string }> = ({ label, value, isMono, color }) => (
    <div className="group">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-emerald-500/50 transition-colors">{label}</p>
        <p className={`text-base font-bold tracking-tight ${isMono ? 'font-mono' : ''} ${color || 'text-white'}`}>{value}</p>
    </div>
);

const MethodCard: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick} 
        className={`relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 text-left ${
            active 
            ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]' 
            : 'border-slate-100 bg-white hover:border-slate-300 text-slate-500'
        }`}
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-white/10 text-emerald-400' : 'bg-slate-50 text-slate-400'}`}>
            {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
        </div>
        <div className="flex flex-col">
            <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-zinc-950'}`}>{label}</span>
            <span className="text-[10px] font-bold opacity-50">Instant Pay</span>
        </div>
        <AnimatePresence>
            {active && (
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-4 right-4 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40"
                >
                    <Check size={12} strokeWidth={4} className="text-zinc-950" />
                </motion.div>
            )}
        </AnimatePresence>
    </button>
);

const ActionButton: React.FC<{ disabled: boolean, onClick: () => void, variant: 'success' | 'danger', icon: any, label: string }> = ({ disabled, onClick, variant, icon, label }) => {
    const styles = {
        success: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white',
        danger: 'bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50'
    };

    return (
        <button 
            disabled={disabled} 
            onClick={onClick} 
            className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl ${styles[variant]} disabled:opacity-50 disabled:pointer-events-none`}
        >
            {icon}
            {label}
        </button>
    );
};

export default FakeGatewayPage;
