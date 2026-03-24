import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Edit3, MapPinIcon, AlignLeft, Eye, CheckCircle2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi, categoryApi } from '../api';
import { useAuth } from '../context/AuthContext';
import locationsData from '../data/locations.json';
import logoFooter from '../assets/logo.png';
import toast from 'react-hot-toast';

interface JobForm {
    title: string;
    serviceType: string;
    jobType: string;
    salary: number | '';
    location: string;
    genderRequired: string;
    ageMin: number | '';
    ageMax: number | '';
    skills: string;
    description: string;
    isForWorker: boolean;
}

const PostJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const resp = await categoryApi.getCategories();
                setCategories(resp.data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<JobForm>({
        defaultValues: {
            isForWorker: user?.role === 'Worker',
            serviceType: 'Giúp việc nhà',
            jobType: 'Full-time',
            genderRequired: 'None',
            ageMin: 18,
            ageMax: 60,
            salary: '',
            title: '',
            skills: '',
            description: ''
        }
    });

    const isWorkerPost = watch('isForWorker');
    const formValues = watch();

    const [selectedProvinceId, setSelectedProvinceId] = useState<string>(locationsData.length > 0 ? String(locationsData[0].matinhTMS) : '');
    const [selectedWardId, setSelectedWardId] = useState<number>(locationsData.length > 0 && locationsData[0].phuongxa.length > 0 ? Number(locationsData[0].phuongxa[0].maphuongxa) : 0);
    const [specificAddress, setSpecificAddress] = useState<string>('');

    useEffect(() => {
        const province = locationsData.find((p: any) => p.matinhTMS === selectedProvinceId);
        const ward = province?.phuongxa.find((w: any) => w.maphuongxa === Number(selectedWardId));
        
        const addrParts = [];
        if (specificAddress.trim()) addrParts.push(specificAddress.trim());
        if (ward) addrParts.push(ward.tenphuongxa);
        if (province) addrParts.push(province.tentinhmoi);
        
        setValue('location', addrParts.join(', '));
    }, [selectedProvinceId, selectedWardId, specificAddress, setValue]);

    const formatCurrency = (value: number | '') => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
    };

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await jobApi.createJob({
                ...data,
                salary: Number(data.salary) || 0,
                ageMin: Number(data.ageMin) || 0,
                ageMax: Number(data.ageMax) || 0
            });
            setShowSuccess(true);
        } catch (error: any) {
            console.error('Failed to post job', error);
            const msg = error.response?.data || 'Có lỗi xảy ra khi đăng tin.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const Label = ({ icon: Icon, text, required = false, subtitle = '' }: any) => (
        <div className="mb-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                {Icon && <Icon size={14} className="text-orange-600" />} {text} {required && <span className="text-red-500">*</span>}
            </label>
            {subtitle && <p className="text-[10px] text-slate-400 font-semibold tracking-wide ml-1 mt-1">{subtitle}</p>}
        </div>
    );

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-slate-300";

    return (
        <div className="max-w-4xl mx-auto w-full">
                
                {/* Header Context */}
                <div className="text-center mb-12">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-6">
                        <img src={logoFooter} alt="HelperHub" className="h-[30px] w-auto object-contain" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-l border-slate-100 pl-4 ml-2">Bước 1/1: Điền thông tin</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-semibold text-zinc-900 mb-4 tracking-tighter uppercase leading-none">
                        Tạo {isWorkerPost ? 'Hồ sơ cá nhân' : 'Tin tuyển dụng'}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto">
                        {isWorkerPost 
                            ? 'Điền thông tin kỹ năng và mong muốn để hàng ngàn nhà tuyển dụng chủ động liên hệ với bạn.' 
                            : 'Cung cấp thông tin chi tiết về công việc để tìm kiếm ứng viên phù hợp nhất cho gia đình/doanh nghiệp của bạn.'}
                    </p>
                </div>

                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-12">
                        
                        {/* Section 1: Thông tin cơ bản */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
                                Thông tin cơ bản
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <Label icon={Edit3} text={isWorkerPost ? 'Tiêu đề hồ sơ' : 'Tiêu đề tin đăng'} required subtitle={isWorkerPost ? "Vd: Nữ giúp việc nhà 5 năm kinh nghiệm, nấu ăn ngon" : "Vd: Tuyển nữ giúp việc nhà bao ăn ở tại Quận 1"} />
                                    <input 
                                        className={`${inputClasses} ${errors.title ? 'border-red-500' : ''}`}
                                        placeholder="Nhập tiêu đề ngắn gọn, thu hút..."
                                        {...register('title', { required: "Vui lòng nhập tiêu đề" })} 
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.title as any).message}</p>}
                                </div>

                                <div>
                                    <Label text="Lĩnh vực / Ngành nghề" required />
                                    <select className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`} {...register('serviceType')}>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label text="Hình thức làm việc" required />
                                    <select className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`} {...register('jobType')}>
                                        <option value="Full-time">Full-time (Toàn thời gian)</option>
                                        <option value="Part-time">Part-time (Bán thời gian)</option>
                                        <option value="Theo giờ">Theo giờ</option>
                                        <option value="Ở lại">Ở lại (Live-in)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Tài chính & Địa điểm */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
                                Lương & Khu vực
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <Label text={isWorkerPost ? 'Mức lương mong muốn (VNĐ)' : 'Mức lương chi trả (VNĐ)'} required subtitle="Hệ thống tự động định dạng số tiền" />
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className={`${inputClasses} ${errors.salary ? 'border-red-500' : ''}`} 
                                            placeholder="Ví dụ: 8000000" 
                                            {...register('salary', { required: "Vui lòng nhập mức lương", min: { value: 1000, message: "Mức lương không hợp lệ" } })} 
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 right-6 text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg text-xs pointer-events-none">
                                            {formatCurrency(formValues.salary as number)}
                                        </div>
                                    </div>
                                    {errors.salary && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.salary as any).message}</p>}
                                </div>

                                <div>
                                    <Label icon={MapPin} text="Tỉnh / Thành phố" required />
                                    <select 
                                        value={selectedProvinceId}
                                        onChange={(e) => {
                                            const pId = e.target.value;
                                            setSelectedProvinceId(pId);
                                            const p = locationsData.find(x => x.matinhTMS === pId);
                                            if (p && p.phuongxa.length > 0) {
                                                setSelectedWardId(Number(p.phuongxa[0].maphuongxa));
                                            }
                                        }}
                                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`}
                                    >
                                        {locationsData.map((p: any) => <option key={p.matinhTMS} value={p.matinhTMS}>{p.tentinhmoi}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <Label icon={MapPin} text="Quận / Huyện / Phường" required />
                                    <select 
                                        value={selectedWardId}
                                        onChange={(e) => setSelectedWardId(Number(e.target.value))}
                                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`}
                                    >
                                        {locationsData.find(p => p.matinhTMS === selectedProvinceId)?.phuongxa.map((w: any) => (
                                            <option key={w.maphuongxa} value={w.maphuongxa}>{w.tenphuongxa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label icon={MapPinIcon} text={isWorkerPost ? "Khu vực có thể làm việc" : "Địa chỉ làm việc chi tiết"} subtitle={isWorkerPost ? "Vd: Các quận trung tâm, Quận 1, Quận 3..." : "Vd: 123 Đường Nam Kỳ Khởi Nghĩa..."} />
                                    <input 
                                        type="text"
                                        className={inputClasses} 
                                        placeholder="Nhập địa chỉ chi tiết (Không bắt buộc)" 
                                        value={specificAddress}
                                        onChange={(e) => setSpecificAddress(e.target.value)}
                                    />
                                    <input type="hidden" {...register('location')} />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Yêu cầu chi tiết */}
                        {!isWorkerPost && (
                            <section className="space-y-6">
                                <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                    <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span> 
                                    Yêu cầu chi tiết ứng viên
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div>
                                        <Label text="Giới tính" />
                                        <select className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`} {...register('genderRequired')}>
                                            <option value="None">Không yêu cầu</option>
                                            <option value="Female">Nữ</option>
                                            <option value="Male">Nam</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label text="Độ tuổi từ" subtitle="Nhập số tuổi" />
                                        <input type="number" className={inputClasses} placeholder="18" {...register('ageMin')} />
                                    </div>
                                    <div>
                                        <Label text="Đến độ tuổi" subtitle="Nhập số tuổi" />
                                        <input type="number" className={inputClasses} placeholder="60" {...register('ageMax')} />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 4: Mô tả thêm */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span> 
                                Kỹ năng & Mô tả
                            </h3>

                            <div className="space-y-8">
                                <div>
                                    <Label text={isWorkerPost ? "Kỹ năng nổi bật" : "Kỹ năng yêu cầu"} subtitle={isWorkerPost ? "Vd: Nấu ăn ngon, chăm trẻ khéo, đi xe máy..." : "Vd: Biết đi xe máy, không vướng bận gia đình..."} />
                                    <input className={inputClasses} placeholder="Nhập các kỹ năng..." {...register('skills')} />
                                </div>

                                <div>
                                    <Label icon={AlignLeft} text={isWorkerPost ? "Giới thiệu bản thân & Kinh nghiệm" : "Mô tả công việc & Quyền lợi"} required subtitle="Càng chi tiết, độ tin cậy càng cao." />
                                    <textarea 
                                        className={`${inputClasses} min-h-[160px] resize-y ${errors.description ? 'border-red-500' : ''}`} 
                                        placeholder={isWorkerPost ? "Hãy kể về các công việc bạn đã từng làm..." : "Mô tả công việc hàng ngày, thời gian nghỉ ngơi, các khoản thưởng..."} 
                                        {...register('description', { required: "Vui lòng nhập mô tả" })}
                                    ></textarea>
                                    {errors.description && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.description as any).message}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-end gap-4">
                            
                            <button 
                                type="button"
                                onClick={() => setPreviewMode(!previewMode)}
                                className="w-full md:w-auto px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2 border-2 border-slate-200 text-slate-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                            >
                                <Eye size={16} /> <span>Xem trước</span>
                            </button>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full md:w-auto px-12 py-4 bg-orange-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 hover:bg-zinc-900 transition-all shadow-xl shadow-orange-600/20 active:scale-95 disabled:opacity-70 disabled:grayscale uppercase tracking-widest text-[11px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        <span>{isWorkerPost ? 'Công khai hồ sơ' : 'Đăng tin ngay'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* SUCCESS MODAL - REFINED UX */}
                <AnimatePresence>
                    {showSuccess && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="bg-white rounded-[3rem] p-10 max-w-sm w-full relative shadow-2xl text-center border border-white"
                            >
                                <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                                    <CheckCircle2 size={32} />
                                </div>
                                
                                <h3 className="text-3xl font-semibold text-zinc-900 mb-2 uppercase tracking-tighter">
                                    {isWorkerPost ? 'Hồ sơ đã sẵn sàng!' : 'Đã gửi tin đăng!'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold mb-8 uppercase tracking-widest leading-relaxed">
                                    {isWorkerPost 
                                        ? 'Tài khoản của bạn đã được cập nhật thông tin tìm việc.' 
                                        : 'Tin tuyển dụng của bạn đã được chuyển tới bộ phận kiểm duyệt.'}
                                </p>
                                
                                <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                                            Trạng thái: Đang chờ duyệt
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight leading-normal">
                                        Đội ngũ HelperHub sẽ kiểm duyệt nội dung trong vòng 1-2 giờ làm việc để đảm bảo an toàn cho cộng đồng.
                                    </p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <button 
                                        onClick={() => navigate('/dashboard')} 
                                        className="w-full py-5 bg-orange-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                                    >
                                        <span>Quản lý tin đã đăng</span>
                                        <img src={logoFooter} alt="HelperHub" className="h-4 w-auto object-contain" />
                                    </button>
                                    <button 
                                        onClick={() => navigate('/')} 
                                        className="w-full py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-zinc-950 transition-colors border border-slate-100 rounded-2xl"
                                    >
                                        Quay về trang chủ
                                    </button>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-4">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Hỗ trợ nhanh?</span>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-zinc-400">
                                        <Phone size={10} /> 1900 6789
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
        </div>
    );
};

export default PostJobPage;
