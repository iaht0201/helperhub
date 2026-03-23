import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Zap, Star, Crown, X, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionApi } from '../api/subscriptionApi';
import toast from 'react-hot-toast';

const SubscriptionPage: React.FC = () => {
    const { user } = useAuth();
    const [isYearly, setIsYearly] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingText, setLoadingText] = useState("");

    const plans = [
        {
            id: 'basic',
            planCode: 'BASIC',
            name: 'Basic',
            price: 0,
            features: [
                { text: 'NTD: Xem 1 hồ sơ ứng tuyển & 1 tìm việc', included: true },
                { text: 'Người tìm việc: 1 ứng tuyển & 1 tin đăng', included: true },
                { text: 'Hỗ trợ 24/7', included: true },
                { text: 'Tin đăng cần Admin duyệt', included: true },
                { text: 'Ưu tiên tin top', included: false },
                { text: 'Chuyển vai trò linh hoạt', included: false }
            ],
            color: 'slate',
            icon: <Zap size={24} />,
            recommended: false
        },
        {
            id: 'pro',
            planCode: 'PRO',
            name: 'Professional',
            price: 199000,
            features: [
                { text: 'NTD: Xem 10 hồ sơ ứng tuyển & 10 tìm việc', included: true },
                { text: 'Người tìm việc: 10 ứng tuyển & 10 tin đăng', included: true },
                { text: 'Ưu tiên tin top & Duyệt nhanh hơn', included: true },
                { text: 'Hỗ trợ nhanh 24/7', included: true },
                { text: 'Chuyển vai trò linh hoạt', included: false },
                { text: 'Đăng bài không cần duyệt', included: false }
            ],
            color: 'orange',
            icon: <Star size={24} />,
            recommended: true
        },
        {
            id: 'enterprise',
            planCode: 'ENTERPRISE',
            name: 'Enterprise',
            price: 499000,
            features: [
                { text: 'Đăng tin & Xem hồ sơ không giới hạn', included: true },
                { text: 'Ứng tuyển không giới hạn', included: true },
                { text: 'Đăng bài không cần duyệt', included: true },
                { text: 'Chuyển vai trò linh hoạt', included: true },
                { text: 'Hỗ trợ nhanh ưu tiên', included: true },
                { text: 'Tối ưu hóa hiển thị đặc biệt', included: true }
            ],
            color: 'zinc',
            icon: <Crown size={24} />,
            recommended: false
        }
    ].map(p => ({
        ...p,
        finalPrice: isYearly ? p.price * 10 : p.price
    }));

    const initiatePayment = (plan: any) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handlePayment = async (method: string) => {
        if (!selectedPlan) return;
        
        if (!user) {
            toast.error("Vui lòng đăng nhập để tiếp tục thanh toán!");
            return;
        }

        if (method === 'vnpay') {
            setIsProcessing(true);
            try {
                setLoadingText("Đang kết nối cổng VNPay...");
                const response = await subscriptionApi.vnpayPayment(selectedPlan.planCode);
                const payUrl = response.data.payUrl || response.data.PayUrl;
                if (payUrl) {
                    window.location.href = payUrl;
                } else {
                    throw new Error("Không tìm thấy link thanh toán");
                }
            } catch (error) {
                setIsProcessing(false);
                toast.error("Lỗi kết nối VNPay. Vui lòng thử lại!");
            }
            return;
        }

        if (method === 'demo') {
            setIsProcessing(true);
            
            try {
                // STEP 1: Create Order in Backend
                setLoadingText("Đang kết nối cổng thanh toán an toàn...");
                const orderResponse = await subscriptionApi.createOrder(selectedPlan.planCode);
                const orderId = orderResponse.data.orderId;
                await new Promise(r => setTimeout(r, 1000));
                
                // STEP 2: Create Payment Session
                setLoadingText("Đang khởi tạo phiên thanh toán...");
                const payResponse = await subscriptionApi.createPayment(orderId);
                const payUrl = payResponse.data.payUrl;
                await new Promise(r => setTimeout(r, 1500));
                
                // STEP 3: Redirect to Fake Gateway
                window.location.href = payUrl;
            } catch (error) {
                setIsProcessing(false);
                toast.error("Lỗi khởi tạo thanh toán. Vui lòng thử lại!");
            }
            return;
        }

        toast.error("Phương thức thanh toán đang bảo trì!");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <header className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 inline-block shadow-sm border border-orange-200">Bảng giá gói tin</span>
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-zinc-950 mb-6 leading-[0.9]">Nâng tầm <span className="text-orange-600">tuyển dụng</span> chuyên nghiệp.</h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">Chọn gói dịch vụ phù hợp để tiếp cận hàng ngàn ứng viên tiềm năng và tối ưu hóa quy trình tuyển dụng của bạn ngay hôm nay.</p>
                    
                    <div className="flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 w-fit mx-auto">
                        <button onClick={() => setIsYearly(false)} className={`px-8 py-3 rounded-xl text-xs font-bold transition-all ${!isYearly ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-400 hover:text-zinc-950'}`}>Hàng tháng</button>
                        <button onClick={() => setIsYearly(true)} className={`px-8 py-3 rounded-xl text-xs font-bold transition-all relative ${isYearly ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-400 hover:text-zinc-950'}`}>
                            Năm (Tiết kiệm 20%)
                            <span className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[8px] px-2 py-1 rounded-full font-black animate-bounce shadow-lg">HOT</span>
                        </button>
                    </div>
                </motion.div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`group relative bg-white rounded-[3rem] p-10 border transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 ${plan.recommended ? 'border-orange-200 shadow-xl scale-105 z-10' : 'border-slate-100 shadow-sm'}`}>
                            {plan.recommended && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black px-6 py-2 rounded-full shadow-lg border-2 border-white uppercase tracking-widest">Phổ biến nhất</div>}
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 bg-${plan.color}-50 text-${plan.color}-600 border border-${plan.color}-100 transition-transform group-hover:rotate-6 shadow-sm`}>{plan.icon}</div>
                            <h3 className="text-2xl font-bold mb-2 tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black tracking-tighter">{(plan.finalPrice).toLocaleString()}</span>
                                <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">đ/{isYearly ? 'năm' : 'tháng'}</span>
                            </div>
                            <div className="space-y-4 mb-10">
                                {plan.features.map((f: any, i: number) => (
                                    <div key={i} className={`flex items-center gap-3 font-medium text-sm ${f.included ? 'text-slate-600' : 'text-slate-300'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${f.included ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                            {f.included ? <Check size={12} /> : <X size={10} />}
                                        </div>
                                        <span className={f.included ? '' : 'line-through decoration-slate-200'}>{f.text}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => initiatePayment(plan)} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${plan.recommended ? 'bg-orange-600 text-white hover:bg-zinc-950 hover:shadow-orange-200' : 'bg-slate-50 text-slate-900 hover:bg-zinc-950 hover:text-white'}`}>Bắt đầu ngay</button>
                        </div>
                    ))}
                </div>
            </main>

            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] w-full max-w-lg p-12 relative overflow-hidden shadow-2xl border border-white">
                            <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-zinc-900 transition-colors bg-slate-50 rounded-full"><X size={20} /></button>
                            <div className="mb-12">
                                <h3 className="text-4xl font-semibold text-zinc-900 uppercase tracking-tighter leading-none mb-4">Thanh toán</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">{selectedPlan?.name} — Gói {isYearly ? 'Chính Quy (Năm)' : 'Hàng Tháng'}</p>
                                <p className="text-3xl font-bold text-orange-600">{(selectedPlan?.finalPrice).toLocaleString()} đ</p>
                            </div>
                            <div className="space-y-6">
                                <PaymentOption onClick={() => handlePayment('vnpay')} icon={<img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" className="w-10 h-6 object-contain" alt="VNPay" />} label="Thanh toán qua VNPay" sub="Cổng thanh toán quốc gia" color="blue" />
                                <PaymentOption onClick={() => handlePayment('demo')} icon={<CreditCard size={24} />} label="Fake Gateway (Dùng thử)" sub="Thanh toán giả lập để test luồng" color="orange" />
                            </div>
                            <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Shield size={60} /></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold uppercase tracking-widest text-[9px]"><Shield size={14} className="text-emerald-500" /> Hệ thống thanh toán an toàn</div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Giao dịch của bạn được mã hóa 256-bit và bảo mật bởi tiêu chuẩn quốc tế. Chúng tôi không lưu trữ thông tin thẻ của bạn.</p>
                                </div>
                            </div>
                            <div className="mt-12 flex items-center justify-center space-x-3 text-[9px] font-semibold text-slate-200 uppercase tracking-[0.3em]">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span>SSL Encrypted Transaction</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isProcessing && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[4rem] shadow-4xl text-center max-w-sm w-full border border-white">
                            <div className="relative w-24 h-24 mx-auto mb-10">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CreditCard size={32} className="text-orange-500 animate-bounce" />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter mb-4 leading-none">Đang xử lý thanh toán</h3>
                            
                            <div className="space-y-3 mb-8">
                                <ProcessingStep label="Đang kết nối cổng thanh toán an toàn..." active={loadingText.includes("cổng")} completed={loadingText.includes("xác thực") || loadingText.includes("kích hoạt")} />
                                <ProcessingStep label="Đang xác thực giao dịch..." active={loadingText.includes("xác thực")} completed={loadingText.includes("kích hoạt")} />
                                <ProcessingStep label="Đang kích hoạt gói dịch vụ..." active={loadingText.includes("kích hoạt")} completed={false} />
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Vui lòng không đóng trình duyệt</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProcessingStep: React.FC<{ label: string, active: boolean, completed: boolean }> = ({ label, active, completed }) => (
    <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'scale-105' : 'opacity-50'}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${completed ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'border-orange-500 text-orange-500' : 'border-slate-200'}`}>
            {completed ? <Check size={12} /> : <div className={`w-1.5 h-1.5 rounded-full bg-current ${active ? 'animate-ping' : ''}`} />}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-zinc-950' : 'text-slate-400'}`}>{label}</span>
    </div>
);

const PaymentOption: React.FC<{ onClick: () => void, icon: any, label: string, sub: string, color: string }> = ({ onClick, icon, label, sub, color }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/20 transition-all group overflow-hidden relative">
        <div className={`absolute inset-y-0 left-0 w-1 bg-${color}-500 transition-all group-hover:w-2`}></div>
        <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className="text-left">
                <p className="text-sm font-bold text-zinc-900 mb-0.5">{label}</p>
                <p className="font-medium text-slate-400 text-[10px] uppercase tracking-widest">{sub}</p>
            </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white transition-colors"><Check size={14} /></div>
    </button>
);

export default SubscriptionPage;
