import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Briefcase, Clock, 
    ArrowRight, LayoutGrid, List, Check,
    Sparkles, Flame, MapPinned,
    DollarSign, CalendarDays,
    TrendingUp, User, Home, ChevronLeft, ChevronRight,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation as useRouteLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobApi, authApi, categoryApi } from '../api';
import { getCategoryIcon } from '../utils/iconMap';
import locationsData from '../data/locations.json';
import banner from '../assets/banner.png';

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: number;
    jobType: string;
    serviceType: string;
    category?: { name: string };
    createdAt: string;
    skills: string;
    isForWorker: boolean;
    user?: { fullName: string };
}

interface PagedResult {
    items: Job[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}





const JobSearchPage: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [query, setQuery] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [paging, setPaging] = useState({ pageNumber: 1, totalPages: 1, totalCount: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const routeLocation = useRouteLocation();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    
    // Preference state
    const [showPrefModal, setShowPrefModal] = useState(false);
    const [manuallyCleared, setManuallyCleared] = useState(() => sessionStorage.getItem('filters_manually_cleared') === 'true');
    
    // Default to 'homeowner' posts (isForWorker = false) if not specified
    const activeTab = searchParams.get('isForWorker') === 'true' ? 'worker' : 'homeowner';
    const isHomePage = routeLocation.pathname === '/';

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

    useEffect(() => {
        if (!user) {
            return;
        }

        // 1. Sync DB preferences to localStorage if they exist
        if ((user as any).skills) {
             localStorage.setItem('job_preferences', (user as any).skills);
        }
        if ((user as any).address) {
             localStorage.setItem('job_location', (user as any).address);
        }

        // 2. AUTO-POPUP LOGIC:
        // ONLY show if BOTH are missing from the DB profile AND not dismissed this session
        const hasSkills = !!(user as any).skills;
        const hasLocation = !!(user as any).address;
        const wasDismissed = localStorage.getItem('pref_modal_dismissed');

        if (!hasSkills && !hasLocation && !wasDismissed && isHomePage) {
             setShowPrefModal(true);
        }

        // 3. On home page → apply user preferences ONLY if URL is fresh/empty
        // and user hasn't manually cleared filters.
        const savedPrefs = user?.preferredCategories || localStorage.getItem('job_preferences') || '';
        const savedLocation = user?.preferredLocation || localStorage.getItem('job_location') || '';

        if (isHomePage && !manuallyCleared) {
            const currentParams = new URLSearchParams(searchParams);
            let updated = false;

            // Only apply if we are on a "fresh" view (no query, no filters)
            const isFreshHome = !searchParams.toString() || (searchParams.toString() === `isForWorker=${activeTab === 'worker' ? 'true' : 'false'}`);

            if (isFreshHome) {
                // Apply Category Preferences
                if (savedPrefs && !searchParams.has('serviceType')) {
                    currentParams.set('serviceType', savedPrefs);
                    updated = true;
                }

                // Apply Location Preference (ONLY if not 'All')
                if (savedLocation && savedLocation !== 'All' && !searchParams.has('location')) {
                    currentParams.set('location', savedLocation);
                    updated = true;
                }
            }

            if (updated) {
                setSearchParams(currentParams, { replace: true });
            }
        }
    }, [user, isHomePage, searchParams]); // Added searchParams to deps to allow incremental updates

    useEffect(() => {
        fetchJobs();
    }, [searchParams]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(searchParams);
            // Only set default if isForWorker is completely absent
            if (!searchParams.has('isForWorker')) {
                params.isForWorker = 'false';
            }
            if (!params.page) params.page = '1';
            
            const response = await jobApi.getAllJobs(params);
            const data: PagedResult = response.data;
            setJobs(data.items);
            setPaging({
                pageNumber: data.pageNumber,
                totalPages: data.totalPages,
                totalCount: data.totalCount
            });
        } catch (error) {
            console.error('Error fetching jobs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAppliedStatus = async () => {
            if (user && jobs.length > 0) {
                try {
                    const { applicationApi } = await import('../api/applicationApi');
                    const appsRes = await applicationApi.getMyApplications();
                    setAppliedJobIds(appsRes.data.map((a: any) => a.jobPostId));
                } catch (err) {
                    console.error("Failed to fetch applied jobs", err);
                }
            }
        };
        fetchAppliedStatus();
    }, [user, jobs]);

    const updateFilter = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', '1'); // Reset to page 1 on filter
        
        if (key === 'serviceType') {
            const currentValues = newParams.get(key)?.split(',') || [];
            if (currentValues.includes(value)) {
                const updated = currentValues.filter(v => v !== value);
                if (updated.length > 0) newParams.set(key, updated.join(','));
                else newParams.delete(key);
            } else {
                newParams.set(key, [...currentValues, value].join(','));
            }
        } else {
            if (value !== undefined && value !== '') {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        }
        setSearchParams(newParams);
    };

    const setPage = (page: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', page.toString());
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const setTab = (tab: 'homeowner' | 'worker') => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('isForWorker', tab === 'worker' ? 'true' : 'false');
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const isFiltered = (key: string, value: string) => {
        if (key === 'serviceType') {
            return (searchParams.get(key)?.split(',') || []).includes(value);
        }
        const current = searchParams.get(key);
        if (!current && value === '') return true;
        return current === value;
    };

    const handleSearch = () => {
        // Start with a clean set of parameters for a fresh global search
        const newParams = new URLSearchParams();
        
        // Context preserving: keep current tab
        newParams.set('isForWorker', activeTab === 'worker' ? 'true' : 'false');
        newParams.set('page', '1');
        
        if (query.trim()) {
            newParams.set('query', query.trim());
        }
        
        if (locationInput && locationInput !== 'All') {
            newParams.set('location', locationInput);
        }
        
        setManuallyCleared(true);
        sessionStorage.setItem('filters_manually_cleared', 'true');

        if (isHomePage) {
            // Navigate to results page to collapse the big banner and show results clearly
            navigate(`/jobs?${newParams.toString()}`);
        } else {
            setSearchParams(newParams);
            // Scroll to top of results on search
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    const savePreferences = async (selectedIds: string[], location: string) => {
        const prefsString = selectedIds.join(',');
        // Normalize: strip Vietnamese province prefixes so it matches job location data
        const normalizedLocation = location === 'All' ? '' : location
            .replace(/^Thành phố /i, '')
            .replace(/^Tỉnh /i, '')
            .replace(/^TP\. /i, '')
            .trim();

        localStorage.setItem('job_preferences', prefsString);
        localStorage.setItem('job_location', normalizedLocation);
        
        // Sync to DB if logged in
        if (user) {
            try {
                await authApi.updateProfile({ 
                    fullName: user.fullName,
                    preferredCategories: prefsString,
                    preferredLocation: normalizedLocation
                });
                setManuallyCleared(false);
                sessionStorage.removeItem('filters_manually_cleared');
                await refreshUser(); 
            } catch (err) {
                console.error("Failed to sync preferences to DB", err);
            }
        }

        const newParams = new URLSearchParams(searchParams);
        newParams.set('serviceType', prefsString);
        if (normalizedLocation) newParams.set('location', normalizedLocation);
        else newParams.delete('location');
        setSearchParams(newParams);
        setShowPrefModal(false);
        localStorage.setItem('pref_modal_dismissed', 'true');
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-orange-100 selection:text-orange-950">
            
            <AnimatePresence>
                {showPrefModal && (
                    <PreferenceSelectionModal 
                        categories={categories}
                        onClose={() => {
                            setShowPrefModal(false);
                            localStorage.setItem('pref_modal_dismissed', 'true');
                        }} 
                        onSave={savePreferences}
                    />
                )}
            </AnimatePresence>

            <header className={`bg-zinc-950 relative overflow-hidden transition-all duration-700 ${isHomePage ? 'pt-48 pb-24 min-h-[60vh] flex items-center' : 'pt-32 pb-12'}`}>
                {/* Background Banner */}
                <div className="absolute inset-0 z-0">
                    <img src={banner} alt="" className={`w-full h-full object-cover transition-opacity duration-700 ${isHomePage ? 'opacity-30 scale-110' : 'opacity-10 scale-100'}`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950"></div>
                </div>

                <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] transition-all duration-1000 ${isHomePage ? '-mr-32 -mt-32' : '-mr-64 -mt-64'}`}></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
                    <motion.div 
                        initial={false}
                        animate={{ y: 0, opacity: 1 }}
                        className={isHomePage ? 'text-center flex flex-col items-center' : ''}
                    >
                        <div className={`mb-6 ${isHomePage ? 'space-y-4' : ''}`}>
                            <p className={`text-xs font-semibold text-orange-500 uppercase tracking-[0.5em] flex items-center ${isHomePage ? 'justify-center' : ''}`}>
                                <span className="w-4 h-px bg-orange-500/50 mr-3"></span>
                                <span className={isHomePage ? 'text-[8px] tracking-[0.4em]' : ''}>Hệ thống tìm kiếm thông minh</span>
                            </p>
                            
                            {isHomePage ? (
                                <div className="space-y-2">
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none uppercase tracking-tighter mb-4">
                                        Kết nối niềm tin — <br/>
                                        <span className="text-orange-600 tracking-normal normal-case italic font-medium">Trao gửi hạnh phúc</span>
                                    </h1>
                                    <p className="text-sm md:text-lg text-slate-300 font-bold uppercase tracking-[0.3em] opacity-80 max-w-2xl mx-auto leading-relaxed ">
                                        Kết nối niềm tin — Trao gửi hạnh phúc
                                    </p>
                                </div>
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-semibold text-white uppercase tracking-tighter leading-none mb-1">
                                    {user ? `CHÀO ${user.fullName.split(' ').pop()?.toUpperCase() || ''}, TÌM ĐÚNG - CHỐT NHANH!` : 'KHỞI ĐẦU MỚI, THÀNH CÔNG MỚI!'}
                                </h1>
                            )}
                        </div>

                        <div className={`bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl flex flex-col md:flex-row items-stretch gap-1 w-full border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] group focus-within:border-orange-600/30 transition-all ${isHomePage ? 'max-w-2xl mt-8' : 'max-w-4xl'}`}>
                            <div className="flex-[1.5] flex items-center px-5 group border-b md:border-b-0 md:border-r border-white/5 focus-within:bg-white/[0.03] transition-colors rounded-l-xl">
                                <Search className="text-white/20 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="BẠN ĐANG TÌM KIẾM GÌ?"
                                    className="w-full py-4 bg-transparent outline-none font-semibold text-white text-[11px] px-3 uppercase tracking-wider placeholder:text-white/10"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex-1 flex items-center px-5 group focus-within:bg-white/[0.03] transition-colors">
                                <MapPinned className="text-white/20 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <select 
                                    className="w-full py-4 bg-transparent outline-none font-semibold text-white text-[11px] px-3 uppercase tracking-wider appearance-none"
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                >
                                    <option value="" className="bg-zinc-900">TẤT CẢ KHU VỰC</option>
                                    {locationsData.map((p: any) => (
                                        <option key={p.matinhTMS} value={p.tentinhmoi} className="bg-zinc-900">{p.tentinhmoi.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleSearch} 
                                className="bg-orange-600 text-white px-10 py-4 rounded-xl font-semibold uppercase text-xs tracking-[0.2em] hover:bg-white hover:text-zinc-950 transition-all active:scale-[0.97] shadow-lg shadow-orange-600/20"
                            >
                                {isHomePage ? 'BẮT ĐẦU' : 'Lọc kết quả'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-12 gap-8">
                    
                    <aside className="col-span-12 lg:col-span-3 space-y-7">
                        <div className="bg-zinc-900 p-6 rounded-[1.5rem] border border-white/10 relative overflow-hidden group shadow-xl">
                            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.3em] mb-4">Bộ lọc hiện tại</h3>
                             <div className="flex flex-wrap gap-2 mb-6">
                                {Array.from(searchParams.entries()).map(([key, value]) => {
                                    if (!value || key === 'page') return null;
                                    
                                    const values = key === 'location' ? [value] : value.split(',');
                                    
                                    return values.map(v => {
                                        let label = v;
                                        if (key === 'isForWorker') label = v === 'true' ? 'Tìm việc' : 'Tuyển dụng';
                                        if (key === 'serviceType') {
                                            const cat = categories.find(c => c.code === v);
                                            label = cat ? cat.name : v;
                                        }

                                        return (
                                            <button 
                                                key={`${key}-${v}`}
                                                onClick={() => {
                                                    const params = new URLSearchParams(searchParams);
                                                    const newVal = value.split(',').filter(item => item !== v).join(',');
                                                    if (newVal) params.set(key, newVal);
                                                    else params.delete(key);
                                                    setSearchParams(params);
                                                }}
                                                className="group px-3 py-1.5 bg-white/10 rounded-full flex items-center gap-2 text-[9px] font-semibold text-orange-500 uppercase border border-white/5 transition-all hover:bg-orange-600 hover:text-white"
                                            >
                                                <span>{label}</span>
                                                <X size={10} strokeWidth={4} className="opacity-40 group-hover:opacity-100" />
                                            </button>
                                        );
                                    });
                                })}
                            </div>
                            <button 
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    params.set('isForWorker', activeTab === 'worker' ? 'true' : 'false');
                                    params.set('page', '1');
                                    setSearchParams(params);
                                    setQuery('');
                                    setLocationInput('');
                                    setManuallyCleared(true);
                                    sessionStorage.setItem('filters_manually_cleared', 'true');
                                }}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-semibold text-white uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 mb-3"
                            >
                                Làm mới bộ lọc
                            </button>
                            <button 
                                onClick={() => setShowPrefModal(true)}
                                className="w-full py-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl text-[9px] font-semibold text-orange-500 uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={12} /> Cài đặt trải nghiệm
                            </button>
                        </div>

                        <section className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-[0.2em] flex items-center">
                                <Briefcase size={12} className="mr-3 text-orange-600" /> Ngành nghề / Lĩnh vực
                            </h4>
                            <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
                                {Array.isArray(categories) && categories.map(cat => (
                                    <ProCheckbox key={cat.id} label={cat.name} active={isFiltered('serviceType', cat.code)} onClick={() => updateFilter('serviceType', cat.code)} />
                                ))}
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-[0.2em] flex items-center">
                                <DollarSign size={12} className="mr-3 text-orange-600" /> {activeTab === 'homeowner' ? 'Mức lương' : 'Lương mong muốn'}
                            </h4>
                            <div className="space-y-1">
                                <ProCheckbox label="Tất cả mức lương" active={!searchParams.get('minSalary')} onClick={() => updateFilter('minSalary', '')} />
                                <ProCheckbox label="Trên 5 Triệu" active={searchParams.get('minSalary') === '5000000'} onClick={() => updateFilter('minSalary', '5000000')} />
                                <ProCheckbox label="Trên 10 Triệu" active={searchParams.get('minSalary') === '10000000'} onClick={() => updateFilter('minSalary', '10000000')} />
                                <ProCheckbox label="Trên 15 Triệu" active={searchParams.get('minSalary') === '15000000'} onClick={() => updateFilter('minSalary', '15000000')} />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-[0.2em] flex items-center">
                                <MapPinned size={12} className="mr-3 text-orange-600" /> Khu vực
                            </h4>
                            <div className="space-y-1">
                                <ProCheckbox label="Tất cả tỉnh thành" active={!searchParams.get('location')} onClick={() => updateFilter('location', '')} />
                                {[
                                    { label: 'Hà Nội', value: 'Hà Nội' },
                                    { label: 'TP. Hồ Chí Minh', value: 'Hồ Chí Minh' },
                                    { label: 'Đà Nẵng', value: 'Đà Nẵng' },
                                    { label: 'Hải Phòng', value: 'Hải Phòng' },
                                    { label: 'Cần Thơ', value: 'Cần Thơ' },
                                    { label: 'Bình Dương', value: 'Bình Dương' },
                                    { label: 'Đồng Nai', value: 'Đồng Nai' },
                                ].map(({ label, value }) => (
                                    <ProCheckbox key={value} label={label} active={searchParams.get('location') === value} onClick={() => updateFilter('location', value)} />
                                ))}
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-[0.2em] flex items-center">
                                <Clock size={12} className="mr-3 text-orange-600" /> Loại hình
                            </h4>
                            <div className="space-y-1">
                                <ProCheckbox label="Tất cả loại hình" active={!searchParams.get('jobType')} onClick={() => updateFilter('jobType', '')} />
                                <ProCheckbox label="Toàn thời gian" active={searchParams.get('jobType') === 'Full-time'} onClick={() => updateFilter('jobType', 'Full-time')} />
                                <ProCheckbox label="Bán thời gian" active={searchParams.get('jobType') === 'Part-time'} onClick={() => updateFilter('jobType', 'Part-time')} />
                            </div>
                        </section>
                    </aside>

                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        {/* Tab Switcher - Scaled Down */}
                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
                            <button 
                                onClick={() => setTab('homeowner')}
                                className={`flex items-center space-x-3 px-8 py-3 rounded-xl font-semibold uppercase text-xs tracking-widest transition-all ${
                                    activeTab === 'homeowner' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Home size={14} /> <span>Tin tuyển dụng</span>
                            </button>
                            <button 
                                onClick={() => setTab('worker')}
                                className={`flex items-center space-x-3 px-8 py-3 rounded-xl font-semibold uppercase text-xs tracking-widest transition-all ${
                                    activeTab === 'worker' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <User size={14} /> <span>Người lao động tìm việc</span>
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <TrendingUp size={14} className="text-orange-500" />
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                                        Đang có {paging.totalCount} {activeTab === 'homeowner' ? 'tin tuyển dụng' : 'hồ sơ tìm việc'}
                                    </span>
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 uppercase tracking-tighter">
                                    {activeTab === 'homeowner' ? 'Cần tuyển lao động' : 'Hồ sơ người tìm việc'}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                                    <button onClick={() => setViewType('grid')} className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-300 hover:text-slate-500'}`}><LayoutGrid size={16} /></button>
                                    <button onClick={() => setViewType('list')} className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-300 hover:text-slate-500'}`}><List size={16} /></button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-60 bg-white border border-slate-100 rounded-[1.5rem] animate-pulse"></div>)}
                            </div>
                        ) : (
                            <>
                                {jobs.length > 0 ? (
                                    <>
                                        <div className={viewType === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                                            {jobs.map((job) => (
                                                <JobCardPremium key={job.id} job={job} isApplied={appliedJobIds.includes(job.id)} />
                                            ))}
                                        </div>
                                        
                                        {/* Pagination UI */}
                                        {paging.totalPages > 1 && (
                                            <div className="flex items-center justify-center space-x-2 pt-10">
                                                <button 
                                                    onClick={() => setPage(paging.pageNumber - 1)}
                                                    disabled={paging.pageNumber === 1}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                {[...Array(paging.totalPages)].map((_, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => setPage(i + 1)}
                                                        className={`w-12 h-12 rounded-xl font-semibold text-[11px] transition-all shadow-sm ${
                                                            paging.pageNumber === i + 1 
                                                            ? 'bg-orange-600 text-white shadow-orange-600/20' 
                                                            : 'bg-white text-slate-400 border border-slate-200 hover:border-orange-600'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                                <button 
                                                    onClick={() => setPage(paging.pageNumber + 1)}
                                                    disabled={paging.pageNumber === paging.totalPages}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-24 flex flex-col items-center text-center bg-white rounded-[2rem] border border-slate-100 border-dashed border-2">
                                        <h3 className="text-xl font-semibold text-zinc-900 uppercase tracking-tight mb-2">Không tìm thấy kết quả</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                            Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const PreferenceSelectionModal = ({ categories, onClose, onSave }: { categories: any[], onClose: () => void, onSave: (ids: string[], location: string) => void }) => {
    const [selected, setSelected] = useState<string[]>(() => {
        const saved = localStorage.getItem('job_preferences');
        return saved ? saved.split(',').filter(s => s) : [];
    });
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('job_location');
        return saved || 'All';
    });
    
    const toggle = (id: string) => {
        if (selected.includes(id)) setSelected(prev => prev.filter(i => i !== id));
        else if (selected.length < 5) setSelected(prev => [...prev, id]);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-4xl w-full relative shadow-2xl max-h-[95vh] flex flex-col"
            >
                <div className="text-center mb-8 shrink-0">
                    <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 uppercase tracking-tighter mb-4 leading-tight">
                        Cài đặt <br/> trải nghiệm cá nhân
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                        Hãy cho chúng tôi biết khu vực và nhu cầu của bạn để hệ thống tối ưu hiển thị.
                    </p>
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-8 space-y-8">
                    {/* Location Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] flex items-center">
                            <MapPinned size={14} className="mr-2" /> 1. Khu vực làm việc của bạn
                        </label>
                        <div className="relative group">
                             <select 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-xs uppercase tracking-widest focus:border-orange-500 transition-all appearance-none"
                            >
                                <option value="All">Tất cả các tỉnh thành</option>
                                {locationsData.map((p: any) => (
                                    <option key={p.matinhTMS} value={p.tentinhmoi}>{p.tentinhmoi.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <ChevronRight className="rotate-90" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] flex items-center">
                            <Sparkles size={14} className="mr-2" /> 2. Ngành nghề quan tâm (tối đa 5)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {categories.map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => toggle(cat.code)}
                                    className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 text-center group ${
                                        selected.includes(cat.code) 
                                            ? 'bg-orange-600 border-orange-600 shadow-xl shadow-orange-100 scale-105' 
                                            : 'bg-slate-50 border-slate-100 hover:border-orange-200'
                                    }`}
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${selected.includes(cat.code) ? 'bg-white/20 text-white' : 'bg-white text-slate-400 group-hover:text-orange-600 shadow-sm'}`}>
                                        {getCategoryIcon(cat.iconName, 20)}
                                    </div>
                                    <span className={`text-[9px] font-semibold uppercase tracking-tight leading-none ${selected.includes(cat.code) ? 'text-white' : 'text-slate-500'}`}>
                                        {cat.name}
                                    </span>
                                    {selected.includes(cat.code) && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-white text-orange-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                            <Check size={10} strokeWidth={5} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 shrink-0">
                    <div className="flex items-center space-x-2 order-2 md:order-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < selected.length ? 'bg-orange-600 w-6' : 'bg-slate-200'}`}></div>
                        ))}
                        <span className="text-xs font-semibold text-slate-300 ml-2">{selected.length}/5</span>
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto order-1 md:order-2">
                        <button 
                            onClick={onClose}
                            className="text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Bỏ qua
                        </button>
                        <button 
                            disabled={selected.length === 0 && (!location || location === 'All')}
                            onClick={() => onSave(selected, location)}
                            className="bg-zinc-900 text-white px-10 py-4 rounded-xl font-semibold uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-all disabled:opacity-20 disabled:grayscale shadow-xl shadow-zinc-950/20 active:scale-95"
                        >
                            Bắt đầu ngay
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ProCheckbox = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center space-x-3 group w-full text-left py-2 hover:bg-slate-50 rounded-lg px-2 transition-all">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
            active ? 'bg-orange-600 border-orange-600 shadow-sm shadow-orange-600/30' : 'border-slate-200 bg-white'
        }`}>
            {active && <Check size={10} className="text-white" strokeWidth={5} />}
        </div>
        <span className={`text-xs font-bold uppercase transition-colors ${active ? 'text-zinc-950' : 'text-slate-400'}`}>{label}</span>
    </button>
);

const JobCardPremium = ({ job, isApplied, compact = false }: { job: Job; isApplied: boolean; compact?: boolean }) => {
    const navigate = useNavigate();
    const isWorkerPost = job.isForWorker;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className={`${compact ? 'p-4' : 'p-6'} rounded-[1.25rem] border hover:shadow-xl transition-all group relative cursor-pointer flex flex-col h-full ${
                isWorkerPost 
                    ? 'bg-zinc-900 text-white border-slate-800 hover:border-indigo-500 shadow-zinc-950/20' 
                    : 'bg-white text-zinc-900 border-slate-100 hover:border-orange-200 shadow-sm'
            }`}
        >
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <span className={`flex items-center text-[8px] font-semibold uppercase px-2 py-1 rounded-full ${
                            isWorkerPost ? 'bg-orange-600 text-white' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                            {isWorkerPost ? <User size={10} className="mr-1" /> : <Flame size={10} className="mr-1" />}
                            {isWorkerPost ? 'Người Tìm Việc' : 'Tuyển Dụng'}
                        </span>
                        <span className={`block text-[8px] font-semibold uppercase px-2 py-1 rounded-full ${
                            isWorkerPost ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'
                        }`}>
                           {job.category?.name || job.serviceType || 'Khác'}
                        </span>
                        {isApplied && (
                            <span className="flex items-center text-[8px] font-semibold uppercase px-2 py-1 rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-900/20">
                                <Check size={10} className="mr-1" strokeWidth={4} /> Đã ứng tuyển
                            </span>
                        )}
                    </div>
                    <span className={`text-[9px] font-bold uppercase flex items-center ${isWorkerPost ? 'text-slate-500' : 'text-slate-300'}`}>
                        <Clock size={10} className="mr-1" /> {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                </div>
                
                <h3 className={`${compact ? 'text-xs' : 'text-sm md:text-base'} font-semibold uppercase tracking-tight leading-tight ${compact ? 'mb-2' : 'mb-4'} group-hover:text-orange-500 transition-colors line-clamp-2 ${
                    isWorkerPost ? 'text-white' : 'text-zinc-900'
                }`}>
                    {job.title}
                </h3>
                
                <div className={`${compact ? 'space-y-1 mb-3' : 'space-y-2 mb-6'} text-[10px] font-bold uppercase ${
                    isWorkerPost ? 'text-slate-400' : 'text-slate-400'
                }`}>
                    <div className="flex items-center"><MapPin size={10} className="mr-2 text-orange-600" /> {job.location}</div>
                    <div className="flex items-center"><CalendarDays size={10} className="mr-2 text-orange-600" /> {job.jobType}</div>
                </div>
            </div>

            <div className={`flex items-center justify-between border-t pt-3 ${compact ? 'mt-auto' : 'pt-4 mt-auto'} ${
                isWorkerPost ? 'border-white/5' : 'border-slate-50'
            }`}>
                <div>
                    <p className="text-[8px] font-semibold text-slate-400 uppercase mb-0.5 tracking-tighter">
                        {isWorkerPost ? 'Mức lương' : 'Mức thù lao'}
                    </p>
                    <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-orange-500 tracking-tighter`}>
                        {(job.salary/1000000).toFixed(1)}Tr <span className={`text-[9px] font-bold ${isWorkerPost ? 'text-slate-500' : 'text-slate-400'}`}>VNĐ</span>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all flex items-center ${
                    isWorkerPost 
                        ? 'bg-white text-zinc-950 hover:bg-indigo-600 hover:text-white shadow-xl' 
                        : 'bg-zinc-950 text-white hover:bg-indigo-600 shadow-lg'
                }`}>
                    <span>Xem chi tiết</span>
                    <ArrowRight size={12} className="ml-2" />
                </div>
            </div>
        </motion.div>
    );
};


export default JobSearchPage;