import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

import { GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            await login(response.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await authApi.googleLogin({ idToken: credentialResponse.credential });
            await login(response.data.token);
            navigate('/');
        } catch (err: any) {
            setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans overflow-hidden">
            {/* Cột trái: Banner Image (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-zinc-900 overflow-hidden">
                <img 
                    src="/login_banner.png" 
                    alt="HelperHub Banner" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
                
                {/* Content on Image */}
                <div className="absolute bottom-16 left-16 right-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 uppercase tracking-tighter">
                            Kết nối nhân sự <br/>
                            <span className="text-[#FF6A00]">chuyên nghiệp</span> ngay lập tức.
                        </h1>
                        <p className="text-zinc-300 text-lg max-w-md font-medium">
                            Tìm kiếm những người giúp việc, kỹ thuật viên và tài xế tốt nhất cho ngôi nhà của bạn.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Cột phải: Form Đăng nhập */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-slate-50 relative">

                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[420px]"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="p-10">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Đăng nhập</h2>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    Tiếp tục hành trình của bạn với HelperHub
                                </p>
                            </div>
                            
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-800 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full bg-white border ${error && email === '' ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3.5 px-4 text-sm text-zinc-900 focus:border-[#FF6A00] focus:ring-1 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 font-medium`}
                                        placeholder="Nhập email của bạn..."
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Mật khẩu</label>
                                        <button type="button" className="text-xs font-bold text-[#FF6A00] hover:underline">Quên mật khẩu?</button>
                                    </div>
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full bg-white border ${error && password === '' ? 'border-red-500' : 'border-slate-200'} rounded-xl py-3.5 px-4 text-sm text-zinc-900 focus:border-[#FF6A00] focus:ring-1 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 font-medium`}
                                        placeholder="Nhập mật khẩu..."
                                    />
                                </div>

                                {/* Error Message */}
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-red-500 text-xs font-bold flex items-center gap-2 bg-red-50 p-4 rounded-xl border border-red-100"
                                        >
                                            <AlertCircle size={14} className="flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full bg-[#FF6A00] hover:bg-zinc-900 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-[11px] shadow-sm shadow-orange-600/10 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Đang thực hiện...' : 'Đăng nhập'}
                                </button>
                            </form>

                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-100"></span>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-5 bg-white text-[11px] uppercase font-bold text-slate-400 tracking-[0.2em]">Hoặc với</span>
                                </div>
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

                            <div className="mt-12 text-center">
                                <p className="text-slate-500 text-[13px] font-medium">
                                    Bạn chưa có tài khoản?{' '}
                                    <Link to="/register" className="text-[#FF6A00] font-bold hover:underline">
                                        Đăng ký miễn phí
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Minimal Footer */}
                <div className="absolute bottom-6 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    &copy; 2026 HelperHub Vietnam
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
