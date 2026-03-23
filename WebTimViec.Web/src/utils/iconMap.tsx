import { 
    Cpu, Compass, Zap, BookOpen, Home, User, 
    Briefcase, MapPinned, ShieldCheck, TrendingUp, 
    Hospital, Coffee, Filter, Layout, Plus, Sparkles 
} from 'lucide-react';

export const getCategoryIcon = (iconName: string, size = 16) => {
    switch (iconName) {
        case 'Cpu': return <Cpu size={size} />;
        case 'Compass': return <Compass size={size} />;
        case 'Zap': return <Zap size={size} />;
        case 'BookOpen': return <BookOpen size={size} />;
        case 'Home': return <Home size={size} />;
        case 'User': return <User size={size} />;
        case 'Briefcase': return <Briefcase size={size} />;
        case 'MapPinned': return <MapPinned size={size} />;
        case 'ShieldCheck': return <ShieldCheck size={size} />;
        case 'TrendingUp': return <TrendingUp size={size} />;
        case 'Hospital': return <Hospital size={size} />;
        case 'Coffee': return <Coffee size={size} />;
        case 'Filter': return <Filter size={size} />;
        case 'Layout': return <Layout size={size} />;
        case 'Plus': return <Plus size={size} />;
        case 'Sparkles': return <Sparkles size={size} />;
        default: return <Sparkles size={size} />;
    }
};
