import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!email || !token) {
            setStatus('error');
            return;
        }
        authApi.verifyEmail(email, token)
            .then(() => {
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            })
            .catch(() => {
                setStatus('error');
            });
    }, [email, token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans px-4 py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-600/10 via-zinc-950 to-zinc-950"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-[2rem] max-w-md w-full text-center relative z-10 shadow-2xl"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mb-6"></div>
                        <h2 className="text-xl font-semibold text-white uppercase tracking-widest">Đang xác nhận...</h2>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-500 mb-6" size={80} />
                        <h2 className="text-2xl font-semibold text-white uppercase tracking-widest mb-4">Thành công!</h2>
                        <p className="text-slate-400 font-medium mb-8">Email của bạn đã được xác nhận. Bạn sẽ được chuyển hướng tới trang đăng nhập...</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-white text-zinc-950 font-semibold uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors w-full"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="text-red-500 mb-6" size={80} />
                        <h2 className="text-2xl font-semibold text-white uppercase tracking-widest mb-4">Lỗi xác nhận</h2>
                        <p className="text-slate-400 font-medium mb-8">Link xác nhận không hợp lệ hoặc đã hết hạn.</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="bg-white text-zinc-950 font-semibold uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors w-full"
                        >
                            Về trang chủ
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
