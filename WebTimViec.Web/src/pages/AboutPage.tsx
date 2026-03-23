import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Users, Target, Zap, Globe, MessageSquare, CheckCircle2 } from 'lucide-react';

const AboutPage: React.FC = () => {
    const stats = [
        { label: 'Người dùng', value: '10,000+', icon: Users },
        { label: 'Tin tuyển dụng', value: '5,000+', icon: Zap },
        { label: 'Đánh giá 5 sao', value: '98%', icon: ShieldCheck },
        { label: 'Tỉnh thành', value: '63+', icon: Globe },
    ];

    const values = [
        {
            title: 'Sứ mệnh của chúng tôi',
            description: ' HelperHub ra đời với sứ mệnh kết nối niềm tin, trao gửi hạnh phúc. Chúng tôi không chỉ tìm việc, mà còn xây dựng cộng đồng gắn kết giữa chủ nhà và người lao động.',
            icon: Target,
            color: 'orange'
        },
        {
            title: 'Sự tử tế là ưu tiên',
            description: 'Mọi tương tác trên nền tảng đều dựa trên sự tôn trọng và minh bạch tuyệt đối. Chúng tôi bảo vệ quyền lợi của cả người thuê và người được thuê.',
            icon: Heart,
            color: 'red'
        },
        {
            title: 'Công nghệ thông minh',
            description: 'Sử dụng AI để gợi ý công việc phù hợp nhất dựa trên vị trí, kỹ năng và mức lương, giúp tiết kiệm 80% thời gian tìm kiếm.',
            icon: Zap,
            color: 'blue'
        }
    ];

    return (
        <div className="bg-white font-sans selection:bg-orange-100 selection:text-orange-950">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-600/20 via-zinc-950 to-zinc-950"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 bg-orange-500/10 rounded-full">
                            Về HelperHub Vietnam
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8 tracking-tighter uppercase">
                            Kết nối niềm tin — <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                                Trao gửi hạnh phúc
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                            HelperHub là nền tảng tiên phong tại Việt Nam chuyên kết nối những người giúp việc, kỹ thuật viên và tài xế tận tâm với những gia đình đang tìm kiếm sự hỗ trợ chuyên nghiệp.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center p-8 rounded-3xl hover:bg-slate-50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <stat.icon size={24} />
                                </div>
                                <div className="text-3xl font-black text-zinc-900 tracking-tighter mb-1">{stat.value}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Content */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {values.map((v, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="relative p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-slate-50 text-orange-600`}>
                                    <v.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight uppercase">{v.title}</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    {v.description}
                                </p>
                                <div className="absolute top-6 right-8 text-slate-100 font-black text-6xl select-none">
                                    0{idx + 1}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-24 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-20 items-center">
                        <div className="lg:w-1/2">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 block">Tại sao chọn HelperHub?</span>
                            <h2 className="text-4xl font-black text-zinc-900 mb-8 tracking-tighter uppercase">Nơi sự tin cậy <br/>được đặt lên hàng đầu</h2>
                            
                            <div className="space-y-6">
                                {[
                                    { t: 'Hồ sơ xác thực 100%', d: 'Mọi thành viên đều được xác minh danh tính và bằng cấp.' },
                                    { t: 'Hỗ trợ 24/7', d: 'Đội ngũ CSKH luôn sẵn sàng giải quyết mọi vấn đề phát sinh.' },
                                    { t: 'Hợp đồng minh bạch', d: 'Quy trình ký kết điện tử nhanh chóng và đúng pháp luật.' },
                                    { t: 'Bảo mật thông tin', d: 'Dữ liệu cá nhân luôn được mã hóa và bảo vệ tuyệt đối.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 flex-shrink-0"><CheckCircle2 className="text-orange-500" size={20} /></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">{item.t}</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-1">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-square bg-white border border-slate-200 rounded-[3rem] p-4 shadow-2xl overflow-hidden">
                                <img 
                                    src="/banner.png" 
                                    className="w-full h-full object-cover rounded-[2.5rem]" 
                                    alt="HelperHub Community" 
                                />
                            </div>
                            {/* Floating Card */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><MessageSquare size={20} /></div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tin nhắn mới</div>
                                    <div className="text-xs font-bold text-zinc-900 tracking-tight">Cần người giúp việc ngay!</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 bg-zinc-950 relative overflow-hidden text-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter uppercase italic">Sẵn sàng để thay đổi <br/>cuộc sống của bạn?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-10 py-5 bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/30">Gia nhập ngay</button>
                        <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md">Liên hệ hợp tác</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
