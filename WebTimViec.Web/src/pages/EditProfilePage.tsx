import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Phone, Calendar, Heart, Save, ArrowLeft, Loader2, MapPinIcon, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import locationsData from '../data/locations.json';
import toast from 'react-hot-toast';

const INTEREST_CATEGORIES = [
    { id: 'IT', name: 'IT / Phần mềm' },
    { id: 'Architecture', name: 'Kiến trúc / Nội thất' },
    { id: 'Electrical', name: 'Điện / Dân dụng' },
    { id: 'Accounting', name: 'Kế toán / Kiểm toán' },
    { id: 'Housekeeping', name: 'Giúp việc nhà' },
    { id: 'Childcare', name: 'Trông trẻ em' },
    { id: 'Worker', name: 'Công nhân sản xuất' },
    { id: 'Driver', name: 'Tài xế / Giao hàng' },
    { id: 'Security', name: 'Bảo vệ / An ninh' },
    { id: 'Sales', name: 'Bán hàng / Tư vấn' },
    { id: 'Medical', name: 'Y tế / Chăm sóc' },
    { id: 'Service', name: 'Nhà hàng / Dịch vụ' },
    { id: 'Technical', name: 'Thợ kỹ thuật' },
    { id: 'Janitor', name: 'Tạp vụ / Buồng phòng' },
    { id: 'Design', name: 'Thiết kế / Sáng tạo' },
    { id: 'Other', name: 'Lĩnh vực khác' },
];

interface ProfileForm {
    fullName: string;
    phone: string;
    age: number | '';
    gender: string;
    specificAddress: string;
    selectedProvinceId: string;
    selectedWardId: number;
    skills: string;
    experience: string;
}

// Separate state for interest categories (not part of react-hook-form)

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [discoveryLocation, setDiscoveryLocation] = useState<string>('All');

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ProfileForm>({
        mode: 'onChange',
        defaultValues: {
            fullName: '',
            phone: '',
            age: '',
            gender: '',
            specificAddress: '',
            selectedProvinceId: locationsData.length > 0 ? String(locationsData[0].matinhTMS) : '',
            selectedWardId: locationsData.length > 0 && locationsData[0].phuongxa.length > 0 ? Number(locationsData[0].phuongxa[0].maphuongxa) : 0,
            skills: '',
            experience: ''
        }
    });

    const formValues = watch();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authApi.getMe();
                const { fullName, phone, address, age, gender, skills, experience, preferredCategories } = response.data;
                
                let provId = locationsData.length > 0 ? String(locationsData[0].matinhTMS) : '';
                let wardId = locationsData.length > 0 && locationsData[0].phuongxa.length > 0 ? Number(locationsData[0].phuongxa[0].maphuongxa) : 0;
                let specStr = '';

                // Address parsing
                if (address) {
                    const parts = address.split(', ').map((s: string) => s.trim());
                    if (parts.length >= 2) {
                        const provinceName = parts[parts.length - 1];
                        const wardName = parts[parts.length - 2];
                        specStr = parts.slice(0, parts.length - 2).join(', ');

                        const province = locationsData.find((p: any) => p.tentinhmoi === provinceName);
                        if (province) {
                            provId = String(province.matinhTMS);
                            const ward = province.phuongxa.find((w: any) => w.tenphuongxa === wardName);
                            if (ward) {
                                wardId = Number(ward.maphuongxa);
                            }
                        }
                    } else {
                        specStr = address;
                    }
                }

                reset({
                    fullName: fullName || '',
                    phone: phone || '',
                    age: age === 0 || !age ? '' : age,
                    gender: gender || '',
                    specificAddress: specStr,
                    selectedProvinceId: provId,
                    selectedWardId: wardId,
                    skills: skills || '',
                    experience: experience || ''
                });

                // Load saved interests from localStorage or preferredCategories from DB
                const savedInterests = preferredCategories || localStorage.getItem('job_preferences');
                if (savedInterests) {
                    setSelectedInterests(savedInterests.split(',').filter(Boolean));
                }

            } catch (error) {
                toast.error('Không thể tải thông tin cá nhân');
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [navigate, reset]);

    const getFullAddress = (data: ProfileForm) => {
        const province = locationsData.find((p: any) => String(p.matinhTMS) === String(data.selectedProvinceId));
        const ward = province?.phuongxa.find((w: any) => Number(w.maphuongxa) === Number(data.selectedWardId));
        
        const addrParts: string[] = [];
        if (data.specificAddress.trim()) addrParts.push(data.specificAddress.trim());
        if (ward) addrParts.push(ward.tenphuongxa);
        if (province) addrParts.push(province.tentinhmoi);
        
        return addrParts.join(', ');
    };

    const onSubmit = async (data: ProfileForm) => {
        setIsSaving(true);

        try {
            const finalAddress = getFullAddress(data);
            const interestsString = selectedInterests.join(',');
            
            await authApi.updateProfile({
                fullName: data.fullName,
                phone: data.phone,
                age: Number(data.age) || 0,
                gender: data.gender,
                address: finalAddress,
                skills: data.skills,
                experience: data.experience,
                preferredCategories: interestsString,
                preferredLocation: discoveryLocation
            });

            // Persist to localStorage for instant home page filtering
            if (interestsString) {
                localStorage.setItem('job_preferences', interestsString);
            }

            localStorage.setItem('job_location', discoveryLocation);
            
            await refreshUser();
            toast.success('Đã cập nhật hồ sơ thành công!');
            reset(data);
        } catch (error) {
            toast.error('Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleInterest = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(prev => prev.filter(i => i !== id));
        } else if (selectedInterests.length < 5) {
            setSelectedInterests(prev => [...prev, id]);
        } else {
            toast.error('Bạn chỉ có thể chọn tối đa 5 lĩnh vực!');
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-orange-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
                
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-zinc-900 transition-colors mb-8 font-bold uppercase tracking-widest text-xs gap-2 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Trở lại
                </button>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
                >
                    <div className="bg-zinc-950 p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150">
                            <User size={150} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter uppercase mb-2 relative z-10">Cập nhật hồ sơ</h1>
                        <p className="text-slate-400 font-bold tracking-wide text-xs relative z-10">
                            Đảm bảo thông tin cá nhân đầy đủ và chính xác để tăng cơ hội kết nối với nhà tuyển dụng.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-12">
                        
                        {/* Section 1: Thông tin cá nhân */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> 
                                Thông tin cơ bản
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <Label icon={User} text="Họ và tên" required subtitle="Sử dụng tên thật để tạo sự tin tưởng." />
                                    <input
                                        type="text"
                                        className={`${inputClasses} ${errors.fullName ? 'border-red-500 bg-red-50' : ''}`}
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.fullName as any).message}</p>}
                                </div>

                                <div>
                                    <Label icon={Phone} text="Số điện thoại" required subtitle="Dùng để nhà tuyển dụng liên hệ với bạn." />
                                    <input
                                        type="tel"
                                        className={`${inputClasses} ${errors.phone ? 'border-red-500 bg-red-50' : ''}`}
                                        placeholder="Ví dụ: 0912345678"
                                        {...register('phone', { 
                                            required: 'Vui lòng nhập số điện thoại',
                                            pattern: { value: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                                        })}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.phone as any).message}</p>}
                                </div>

                                <div>
                                    <Label icon={Calendar} text="Tuổi của bạn" required subtitle="Hãy là số lớn hơn hoặc bằng 16." />
                                    <input
                                        type="number"
                                        className={`${inputClasses} ${errors.age ? 'border-red-500 bg-red-50' : ''}`}
                                        placeholder="Ví dụ: 25"
                                        {...register('age', { 
                                            required: 'Vui lòng nhập số tuổi',
                                            min: { value: 16, message: 'Bạn phải từ 16 tuổi trở lên' },
                                            max: { value: 100, message: 'Tuổi không hợp lệ' }
                                        })}
                                    />
                                    {errors.age && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.age as any).message}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <Label icon={Heart} text="Giới tính" required />
                                    <select
                                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat ${errors.gender ? 'border-red-500 bg-red-50' : ''}`}
                                        {...register('gender', { required: 'Vui lòng chọn giới tính' })}
                                    >
                                        <option value="" disabled>─ Bấm để chọn giới tính ─</option>
                                        <option value="Male">Nam</option>
                                        <option value="Female">Nữ</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                    {errors.gender && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{(errors.gender as any).message}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Địa chỉ liên hệ */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> 
                                Địa chỉ liên hệ
                            </h3>
                             
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <Label icon={MapPinIcon} text="Tỉnh / Thành phố" required />
                                    <select 
                                        {...register('selectedProvinceId')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setValue('selectedProvinceId', val, { shouldDirty: true });
                                            const p = locationsData.find(x => String(x.matinhTMS) === val);
                                            if (p && p.phuongxa.length > 0) {
                                                setValue('selectedWardId', Number(p.phuongxa[0].maphuongxa), { shouldDirty: true });
                                            }
                                        }}
                                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`}
                                    >
                                        {locationsData.map((p: any) => <option key={p.matinhTMS} value={p.matinhTMS}>{p.tentinhmoi}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <Label icon={MapPinIcon} text="Quận / Huyện / Phường" required />
                                    <select 
                                        {...register('selectedWardId')}
                                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1.5rem_center] bg-no-repeat`}
                                    >
                                        {locationsData.find((p: any) => String(p.matinhTMS) === String(formValues.selectedProvinceId))?.phuongxa.map((w: any) => (
                                            <option key={w.maphuongxa} value={w.maphuongxa}>{w.tenphuongxa}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label text="Số nhà / Tên đường" subtitle="Chi tiết cụ thể nơi bạn sống." />
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="Ví dụ: 123 Đường Nam Kỳ Khởi Nghĩa..."
                                        {...register('specificAddress')}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Kỹ năng & Kinh nghiệm */}
                        <section className="space-y-6">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span> 
                                Kỹ năng & Kinh nghiệm
                            </h3>
                            
                            <div className="space-y-8">
                                <div>
                                    <Label text="Kỹ năng nghề nghiệp" subtitle="Các kỹ năng bạn có (ví dụ: Nấu ăn, Dọn dẹp, Chăm sóc trẻ...)" />
                                    <textarea
                                        className={`${inputClasses} min-h-[120px] resize-none pt-4`}
                                        placeholder="Ví dụ: Nấu thức ăn miền Bắc, dọn dẹp nhà cửa nhanh chóng, sử dụng thành thạo máy hút bụi..."
                                        {...register('skills')}
                                    />
                                </div>
                                
                                <div>
                                    <Label text="Kinh nghiệm làm việc" subtitle="Tóm tắt các công việc bạn đã từng làm trước đây." />
                                    <textarea
                                        className={`${inputClasses} min-h-[120px] resize-none pt-4`}
                                        placeholder="Ví dụ: 2 năm làm việc tại căn hộ Vinhomes, chuyên dọn dẹp và đi chợ cho chủ nhà nước ngoài..."
                                        {...register('experience')}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Lĩnh vực & Khu vực quan tâm */}
                        <section className="space-y-8">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                Cài đặt trải nghiệm cá nhân
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <Label text="Khu vực bạn muốn xem tin" subtitle="Chọn khu vực mà bạn mong muốn hệ thống ưu tiên hiển thị công việc." />
                                    <div className="relative">
                                        <select 
                                            value={discoveryLocation}
                                            onChange={(e) => setDiscoveryLocation(e.target.value)}
                                            className={`${inputClasses} appearance-none cursor-pointer`}
                                        >
                                            <option value="All">Tất cả các tỉnh thành (Mặc định)</option>
                                            {locationsData.map((p: any) => (
                                                <option key={p.matinhTMS} value={p.tentinhmoi.replace(/^Thành phố /i, '').replace(/^Tỉnh /i, '').trim()}>{p.tentinhmoi.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                            <MapPinIcon size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label text="Ngành nghề / Lĩnh vực quan tâm" subtitle="Chọn tối đa 5 lĩnh vực để nhận được gợi ý chính xác hơn." />
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {INTEREST_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => toggleInterest(cat.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border-2 ${
                                                    selectedInterests.includes(cat.id)
                                                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105'
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600'
                                                }`}
                                            >
                                                {selectedInterests.includes(cat.id) && <Check size={12} strokeWidth={4} />}
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`h-1.5 rounded-full transition-all ${
                                                i < selectedInterests.length ? 'bg-orange-600 flex-1' : 'bg-slate-200 w-8'
                                            }`} />
                                        ))}
                                        <span className="text-xs font-bold text-slate-400 ml-2">{selectedInterests.length}/5</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Submit Button & Actions */}
                        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-full md:w-auto px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2 border-2 border-slate-200 text-slate-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                            >
                                <X size={16} /> <span>Hủy bỏ</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full md:w-auto px-12 py-4 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all uppercase tracking-widest text-[11px] shadow-xl ${
                                    isSaving
                                        ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' 
                                        : 'bg-orange-600 text-white hover:bg-zinc-900 shadow-orange-600/20 active:scale-95'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Đang cập nhật...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} /> <span>Lưu thay đổi</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
        </div>
    );
};

export default EditProfilePage;
