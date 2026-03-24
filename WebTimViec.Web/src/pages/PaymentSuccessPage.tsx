import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShieldCheck, CreditCard, Landmark, Hash, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PaymentSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    
    // VNPay Response Parameters
    const txnRef = searchParams.get('vnp_TxnRef') || '';
    const amount = searchParams.get('vnp_Amount');
    const bankCode = searchParams.get('vnp_BankCode');
    const transNo = searchParams.get('vnp_TransactionNo');
    
    const responseCode = searchParams.get('vnp_ResponseCode');
    
    // Parse Package Name from TxnRef (format: userId_planCode_timestamp)
    const parts = txnRef.split('_');
    const planCode = parts.length >= 2 ? parts[1] : 'PREMIUM';
    
    const displayAmount = amount ? (parseInt(amount) / 100).toLocaleString() : '---';
    const isSuccess = responseCode === '00';

    useEffect(() => {
        const confirmPayment = async () => {
            if (isSuccess && responseCode === '00') {
                try {
                    toast.loading('Đang kích hoạt gói dịch vụ...', { id: 'payment-confirm' });
                    // Explicitly call the API through Ngrok (or localhost) to trigger the DB update
                    // Prefer local API in development to avoid ngrok limits/delays
                    const isLocal = window.location.hostname === 'localhost';
                    const apiUrl = isLocal 
                        ? 'http://localhost:5281/api' 
                        : (import.meta.env.VITE_API_URL || 'https://joint-honest-lark.ngrok-free.app/api');
                    
                    const response = await fetch(`${apiUrl}/webhook/vnpay-ipn${window.location.search}`, {
                        headers: {
                            'ngrok-skip-browser-warning': 'true'
                        }
                    });
                    const data = await response.json();
                    
                    if (data.RspCode === '00') {
                        toast.success('Kích hoạt tài khoản thành công!', { id: 'payment-confirm' });
                        // Refresh user data or redirect after success
                    } else {
                        toast.error('Có lỗi khi xác thực giao dịch!', { id: 'payment-confirm' });
                    }
                } catch (error) {
                    console.error('Error confirming payment:', error);
                    toast.error('Không thể kết nối tới máy chủ để xác nhận!', { id: 'payment-confirm' });
                }
            } else if (responseCode) {
                toast.error('Giao dịch không thành công!', { id: 'payment-confirm' });
            }
        };

        confirmPayment();
    }, [isSuccess, responseCode]);

    if (!isSuccess && responseCode) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-32">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 max-w-xl w-full text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-3 bg-rose-500"></div>
                    
                    <div className="mb-10 flex justify-center">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-inner border border-rose-100">
                            <XCircle size={48} strokeWidth={1.5} />
                        </div>
                    </div>

                    <h1 className="text-4xl font-semibold text-zinc-900 tracking-tighter uppercase mb-2">Giao dịch thất bại</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10 leading-relaxed max-w-sm mx-auto">
                        Rất tiếc, thanh toán của bạn không thành công hoặc đã bị hủy. Vui lòng thử lại sau.
                    </p>

                    <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 text-left border border-slate-100 shadow-sm space-y-5">
                       <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã lỗi</span>
                            <span className="text-xs font-black text-rose-600 tracking-tight">#{responseCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</span>
                            <span className="text-xs font-bold text-zinc-900 tracking-tight">{new Date().toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link to="/subscription" className="w-full flex items-center justify-center space-x-3 bg-zinc-950 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 transition-all shadow-xl shadow-zinc-950/20 group">
                            <span>Thử thanh toán lại</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center justify-center space-x-3 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                        <ShieldCheck size={14} className="text-slate-400" />
                        <span>Hệ thống hỗ trợ 24/7</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-32">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 max-w-xl w-full text-center relative overflow-hidden"
            >
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500"></div>
                
                <div className="mb-10 flex justify-center">
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-100"
                    >
                        <CheckCircle size={48} strokeWidth={1.5} />
                    </motion.div>
                </div>

                <h1 className="text-4xl font-semibold text-zinc-900 tracking-tighter uppercase mb-2">Thanh toán hoàn tất!</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10 leading-relaxed max-w-sm mx-auto">
                    Kích hoạt tài khoản thành công. Chào mừng bạn đến với gói dịch vụ cao cấp của HelperHub.
                </p>

                <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 text-left border border-slate-100 shadow-sm space-y-5">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-2 text-slate-400">
                           <CreditCard size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Gói dịch vụ</span>
                        </div>
                        <span className="text-xs font-black text-orange-600 tracking-tight uppercase">{planCode}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-2 text-slate-400">
                           <Landmark size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Ngân hàng</span>
                        </div>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">{bankCode || '---'}</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-2 text-slate-400">
                           <Hash size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Mã giao dịch</span>
                        </div>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">#{transNo || txnRef.slice(0, 8)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tiền</span>
                        <span className="text-xl font-black text-zinc-950 tracking-tighter">{displayAmount} <span className="text-xs">VNĐ</span></span>
                    </div>
                </div>

                <div className="space-y-4">
                    <Link to="/dashboard" className="w-full flex items-center justify-center space-x-3 bg-zinc-950 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-zinc-950/20 group">
                        <span>Về bảng điều khiển</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link to="/subscription" className="w-full block bg-white text-slate-500 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:text-zinc-950 transition-colors">
                        Xem các gói khác
                    </Link>
                </div>

                <div className="mt-12 flex items-center justify-center space-x-3 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Giao dịch bảo mật bởi VNPay</span>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccessPage;
