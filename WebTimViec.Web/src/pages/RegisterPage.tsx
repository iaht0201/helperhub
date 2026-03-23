import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, User, Briefcase, MapPinned, ShieldCheck, TrendingUp, Filter, Cpu, Compass, Zap, BookOpen, Hospital, Coffee, Layout, Plus, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../api';
import locationsData from '../data/locations.json';

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'IT', name: 'IT / Phần mềm', icon: <Cpu size={16} /> },
    { id: 'Architecture', name: 'Kiến trúc / Nội thất', icon: <Compass size={16} /> },
    { id: 'Electrical', name: 'Điện / Điện dân dụng', icon: <Zap size={16} /> },
    { id: 'Accounting', name: 'Kế toán / Kiểm toán', icon: <BookOpen size={16} /> },
    { id: 'Housekeeping', name: 'Giúp việc nhà', icon: <Home size={16} /> },
    { id: 'Childcare', name: 'Trông trẻ em', icon: <User size={16} /> },
    { id: 'Worker', name: 'Công nhân SX', icon: <Briefcase size={16} /> },
    { id: 'Driver', name: 'Tài xế / Giao hàng', icon: <MapPinned size={16} /> },
    { id: 'Security', name: 'Bảo vệ / An ninh', icon: <ShieldCheck size={16} /> },
    { id: 'Sales', name: 'Bán hàng / Tư vấn', icon: <TrendingUp size={16} /> },
    { id: 'Medical', name: 'Y tế / Chăm sóc', icon: <Hospital size={16} /> },
    { id: 'Service', name: 'Nhà hàng / Dịch vụ', icon: <Coffee size={16} /> },
    { id: 'Technical', name: 'Thợ kỹ thuật', icon: <Filter size={16} /> },
    { id: 'Janitor', name: 'Tạp vụ / Buồng phòng', icon: <Filter size={16} /> },
    { id: 'Design', name: 'Thiết kế / Sáng tạo', icon: <Layout size={16} /> },
    { id: 'Other', name: 'Lĩnh vực khác', icon: <Plus size={16} /> },
];

const RegisterPage: React.FC = () => {
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'Worker',
        phone: '',
        address: 'Hà Nội',
        age: 25,
        gender: 'Other'
    });
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<string>(String(locationsData.length > 0 ? locationsData[0].matinhTMS : ''));
    const [selectedWardId, setSelectedWardId] = useState<number>(locationsData.length > 0 && locationsData[0].phuongxa.length > 0 ? Number(locationsData[0].phuongxa[0].maphuongxa) : 0);
    const [specificAddress, setSpecificAddress] = useState<string>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const province = locationsData.find((p: any) => p.matinhTMS === selectedProvinceId);
        const ward = province?.phuongxa.find((w: any) => w.maphuongxa === Number(selectedWardId));
        
        const addrParts: string[] = [];
        if (specificAddress.trim()) addrParts.push(specificAddress.trim());
        if (ward) addrParts.push(ward.tenphuongxa);
        if (province) addrParts.push(province.tentinhmoi);
        
        setFormData(prev => ({...prev, address: addrParts.join(', ')}));
    }, [selectedProvinceId, selectedWardId, specificAddress]);

    useEffect(() => {
        const prefs = localStorage.getItem('job_preferences');
        if (prefs) {
            setSelectedCats(prefs.split(','));
        }
    }, []);

    const toggleCat = (id: string) => {
        if (selectedCats.includes(id)) setSelectedCats(prev => prev.filter(i => i !== id));
        else if (selectedCats.length < 5) setSelectedCats(prev => [...prev, id]);
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
            setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (selectedCats.length === 0) {
            setError('Vui lòng chọn ít nhất 1 lĩnh vực quan tâm.');
            return;
        }

        setIsLoading(true);

        try {
            await authApi.register({
                ...formData,
                preferredCategories: selectedCats.join(','),
                preferredLocation: 'All'
            });
            
            localStorage.setItem('job_preferences', selectedCats.join(','));
            localStorage.setItem('job_location', 'All');
            
            toast.success('Đăng ký thành công! Vui lòng kiểm tra email xác nhận.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại.');
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await authApi.googleLogin({ 
                idToken: credentialResponse.credential,
                role: formData.role
            });
            await login(response.data.token);
            navigate('/');
        } catch (err: any) {
            setError('Đăng nhập Google thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans overflow-hidden">
            {/* Cột trái: Banner (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-zinc-900 overflow-hidden">
                <img 
                    src="/register_banner.png" 
                    alt="HelperHub Register Banner" 
                    className="absolute inset-0 w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent"></div>
                

                <div className="absolute bottom-20 left-12 right-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-6 tracking-tighter uppercase">
                            Gia nhập cộng đồng<br/>
                            <span className="text-[#FF6A00]">Tin cậy & Hạnh phúc.</span>
                        </h1>
                        <p className="text-zinc-300 text-lg max-w-md font-medium">
                            Hãy bắt đầu hành trình của bạn ngay hôm nay để trải nghiệm dịch vụ kết nối tốt nhất.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Cột phải: Form Đăng ký */}
            <div className="w-full lg:w-1/2 flex flex-col items-center bg-slate-50 relative overflow-y-auto px-6 py-12 md:p-12">

                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={step}
                    className="w-full max-w-[560px]"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="p-8 md:p-10">
                            <div className="mb-10">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#FF6A00]' : 'bg-slate-100'}`}></div>
                                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#FF6A00]' : 'bg-slate-100'}`}></div>
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                    {step === 1 ? 'Tạo tài khoản' : 'Sở thích công việc'}
                                </h2>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    {step === 1 ? 'Vui lòng cung cấp thông tin cá nhân của bạn' : 'Chọn các lĩnh vực mà bạn quan tâm để chúng tôi gợi ý công việc phù hợp'}
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.form 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-6" 
                                        onSubmit={handleNextStep}
                                    >
                                        {/* Role Switcher */}
                                        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData({...formData, role: 'Worker'})}
                                                className={`flex-1 py-3 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest ${formData.role === 'Worker' ? 'bg-zinc-900 text-white shadow-sm' : 'text-slate-500 hover:text-zinc-900'}`}
                                            >
                                                Tìm việc làm
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData({...formData, role: 'Employer'})}
                                                className={`flex-1 py-3 text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest ${formData.role === 'Employer' ? 'bg-[#FF6A00] text-white shadow-sm' : 'text-slate-500 hover:text-zinc-900'}`}
                                            >
                                                Thuê kiếm ứng viên
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <FormInput label="Họ và Tên" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} />
                                            <FormInput label="Số điện thoại" placeholder="09xx xxx xxx" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                                            <FormInput label="Địa chỉ Email" type="email" placeholder="vidu@email.com" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                                            <FormInput label="Mật khẩu" type="password" placeholder="••••••••" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-800 uppercase tracking-widest ml-1">Tỉnh thành</label>
                                                    <select 
                                                        value={selectedProvinceId}
                                                        onChange={(e) => setSelectedProvinceId(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:border-[#FF6A00] focus:ring-1 focus:ring-orange-100 outline-none transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                                    >
                                                        {locationsData.map((p: any) => <option key={p.matinhTMS} value={p.matinhTMS}>{p.tentinhmoi}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-800 uppercase tracking-widest ml-1">Phường xã</label>
                                                    <select 
                                                        value={selectedWardId}
                                                        onChange={(e) => setSelectedWardId(Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:border-[#FF6A00] focus:ring-1 focus:ring-orange-100 outline-none transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                                    >
                                                        {locationsData.find((p: any) => p.matinhTMS === selectedProvinceId)?.phuongxa.map((w: any) => (
                                                            <option key={w.maphuongxa} value={w.maphuongxa}>{w.tenphuongxa}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <FormInput label="Địa chỉ cụ thể" placeholder="Số nhà, đường..." value={specificAddress} onChange={(v: string) => setSpecificAddress(v)} />
                                        </div>

                                        {error && (
                                            <div className="text-red-500 text-xs font-bold flex items-center gap-2 bg-red-50 p-3.5 rounded-xl border border-red-100">
                                                <AlertCircle size={14} className="flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="w-full bg-[#FF6A00] hover:bg-zinc-900 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                                        >
                                            Tiếp theo <ChevronRight size={16} />
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form 
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-6" 
                                        onSubmit={handleSubmit}
                                    >
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-100">
                                            {CATEGORIES.map(cat => (
                                                <button 
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleCat(cat.id)}
                                                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                                        selectedCats.includes(cat.id) 
                                                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-orange-200'
                                                    }`}
                                                >
                                                    <div className={`${selectedCats.includes(cat.id) ? 'text-[#FF6A00]' : 'text-slate-300'}`}>
                                                        {cat.icon}
                                                    </div>
                                                    <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-none">{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {error && (
                                            <div className="text-red-500 text-xs font-bold flex items-center gap-2 bg-red-50 p-3.5 rounded-xl border border-red-100">
                                                <AlertCircle size={14} />
                                                {error}
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="px-6 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                            >
                                                Quay lại
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className={`flex-1 bg-[#FF6A00] hover:bg-zinc-900 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 ${isLoading ? 'opacity-70' : ''}`}
                                            >
                                                {isLoading ? 'Đang khởi tạo...' : 'Hoàn tất đăng ký'}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                                <div className="relative flex justify-center"><span className="px-4 bg-white text-[10px] uppercase font-bold text-slate-400 tracking-widest">Hoặc đăng ký bằng</span></div>
                            </div>

                            <div className="w-full flex justify-center">
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Đăng nhập Google thất bại.')}
                                    theme="outline"
                                    shape="rectangular"
                                    width="100%"
                                    size="large"
                                />
                            </div>

                            <p className="mt-10 text-center text-slate-500 text-sm font-medium">
                                Đã có tài khoản?{' '}
                                <Link to="/login" className="text-[#FF6A00] font-bold hover:underline transition-all">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Copyright */}
                <div className="mt-8 mb-6 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    &copy; 2026 HelperHub Vietnam
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, placeholder, value, onChange, type = 'text' }: any) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-800 uppercase tracking-widest ml-1">{label}</label>
        <input 
            required 
            type={type}
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:border-[#FF6A00] focus:ring-1 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 font-medium" 
            placeholder={placeholder} 
        />
    </div>
);

export default RegisterPage;
