import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status'); // 0: Success, 1: Fail, 2: Pending
    const orderId = searchParams.get('orderId');
    const planName = searchParams.get('plan') || 'Premium Plan';

    useEffect(() => {
        if (status === '0') toast.success('Thanh toán thành công!');
        else if (status === '1') toast.error('Thanh toán thất bại!');
        else if (status === '2') toast.loading('Giao dịch đang được xử lý...');
    }, [status]);

    const renderStatus = () => {
        switch (status) {
            case '0':
                return {
                    icon: <CheckCircle size={48} strokeWidth={1.5} />,
                    color: 'text-emerald-500',
                    bgColor: 'bg-emerald-50',
                    accentColor: 'bg-emerald-500',
                    title: 'Giao dịch thành công!',
                    desc: `Chúc mừng! Tài khoản của bạn đã được nâng cấp lên gói ${planName}.`,
                    badge: 'Đã thanh toán'
                };
            case '1':
                return {
                    icon: <XCircle size={48} strokeWidth={1.5} />,
                    color: 'text-rose-500',
                    bgColor: 'bg-rose-50',
                    accentColor: 'bg-rose-500',
                    title: 'Giao dịch thất bại',
                    desc: 'Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
                    badge: 'Đã hủy'
                };
            case '2':
                return {
                    icon: <Clock size={48} strokeWidth={1.5} />,
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-50',
                    accentColor: 'bg-amber-500',
                    title: 'Đang chờ xử lý',
                    desc: 'Hệ thống đang xác nhận giao dịch của bạn. Vui lòng kiểm tra lại sau ít phút.',
                    badge: 'Đang xử lý'
                };
            default:
                return {
                    icon: <AlertCircle size={48} strokeWidth={1.5} />,
                    color: 'text-slate-500',
                    bgColor: 'bg-slate-50',
                    accentColor: 'bg-slate-500',
                    title: 'Không rõ trạng thái',
                    desc: 'Chúng tôi không thể xác định trạng thái giao dịch này.',
                    badge: 'Lỗi'
                };
        }
    };

    const config = renderStatus();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-32">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3.5rem] shadow-2xl border border-white p-12 max-w-xl w-full text-center relative overflow-hidden"
            >
                {/* Decorative border */}
                <div className={`absolute top-0 left-0 w-full h-3 ${config.accentColor}`}></div>
                
                <div className="mb-10 flex justify-center">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-28 h-28 ${config.bgColor} ${config.color} rounded-[3rem] flex items-center justify-center shadow-inner`}
                    >
                        {config.icon}
                    </motion.div>
                </div>

                <h1 className="text-4xl font-semibold text-zinc-900 tracking-tighter uppercase mb-4 leading-none">{config.title}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed max-w-sm mx-auto">
                    {config.desc}
                </p>

                <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 text-left space-y-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã đơn hàng</span>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">#{orderId?.toUpperCase() || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gói dịch vụ</span>
                        <span className="text-xs font-black text-zinc-900 tracking-tight uppercase">{planName}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                        <span className={`${config.bgColor} ${config.color} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current opacity-70`}>
                            {config.badge}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</span>
                        <span className="text-xs font-bold text-zinc-900 tracking-tight">{new Date().toLocaleString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Link to="/profile" className="flex items-center justify-center space-x-3 bg-zinc-950 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-zinc-950/20 group">
                        <span>Lịch sử giao dịch</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/" className="flex items-center justify-center space-x-3 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 hover:text-zinc-900 transition-all border border-slate-200">
                        <span>Về trang chủ</span>
                    </Link>
                </div>

                <div className="mt-12 flex items-center justify-center space-x-3 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Hệ thống thanh toán bảo mật 256-bit</span>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentResultPage;
