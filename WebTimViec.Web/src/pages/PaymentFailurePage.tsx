import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, Smartphone, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PaymentFailurePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message') || 'Thanh toán không hoàn tất.';

    useEffect(() => {
        toast.error('Thanh toán thất bại!');
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-32">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 max-w-xl w-full text-center relative overflow-hidden"
            >
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
                
                <div className="mb-10 flex justify-center">
                    <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-inner">
                        <XCircle size={48} strokeWidth={1.5} />
                    </div>
                </div>

                <h1 className="text-4xl font-semibold text-zinc-900 tracking-tighter uppercase mb-4">Giao dịch thất bại!</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10 leading-relaxed">
                    Đã có lỗi xảy ra trong quá trình xử lý thanh toán. <br />
                    Tài khoản của bạn chưa bị trừ tiền.
                </p>

                <div className="bg-rose-50/50 rounded-[2rem] p-8 mb-10 text-left border border-rose-100 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-rose-100/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã lỗi</span>
                        <span className="text-xs font-black text-rose-600 tracking-tight">{resultCode || 'FE-ERROR'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chi tiết</span>
                        <span className="text-xs font-bold text-red-900 tracking-tight">{message}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Link to="/subscription" className="flex items-center justify-center space-x-3 bg-zinc-900 text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 transition-all shadow-xl shadow-zinc-900/20 group">
                        <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span>Thử lại ngay</span>
                    </Link>
                    <Link to="/dashboard" className="flex items-center justify-center space-x-3 bg-slate-100 text-slate-500 py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 hover:text-zinc-900 transition-all">
                        <ArrowLeft size={16} />
                        <span>Về trang chủ</span>
                    </Link>
                </div>

                <div className="mt-12 space-y-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Link to="/messages" className="flex items-center justify-center space-x-3 bg-emerald-50 text-emerald-600 px-8 py-4 rounded-[1.2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm">
                            <Smartphone size={16} />
                            <span>Nhắn tin cho ADMIN hỗ trợ</span>
                        </Link>
                        <div className="flex items-center justify-center space-x-3 text-[9px] font-semibold text-slate-300 uppercase tracking-[0.3em]">
                            <ShieldAlert size={14} className="text-rose-500" />
                            <span>Nếu tiền đã bị trừ, vui lòng liên hệ ngay!</span>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100 flex items-center justify-center space-x-8">
                        <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Smartphone size={14} /></div>
                             <span className="text-[10px] font-black text-zinc-900 tracking-tight">1900 6789</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hỗ trợ 24/7</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailurePage;
