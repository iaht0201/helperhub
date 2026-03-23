import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import logoFooter from './assets/logo.png';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobSearchPage from './pages/JobSearchPage';
import JobDetailsPage from './pages/JobDetailsPage';
import PostJobPage from './pages/PostJobPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import MessagePage from './pages/MessagePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import JobApplicationsPage from './pages/JobApplicationsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EditProfilePage from './pages/EditProfilePage';
import AboutPage from './pages/AboutPage';
import PaymentResultPage from './pages/PaymentResultPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import FakeGatewayPage from './pages/FakeGatewayPage';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Toaster 
            position="top-center" 
            toastOptions={{
                className: 'font-semibold uppercase tracking-widest text-xs',
                style: { borderRadius: '1rem' }
            }} 
        />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<JobSearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/jobs" element={<JobSearchPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/messages" element={<MessagePage />} />
              <Route path="/post-job" element={<PostJobPage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/my-applications" element={<Navigate to="/dashboard" replace />} />
              <Route path="/jobs/:id/applications" element={<JobApplicationsPage />} />
            </Route>
            <Route 
              path="/admin" 
              element={user?.role === 'Admin' ? <AdminDashboardPage /> : <Navigate to="/" />} 
            />
            <Route path="/payment-result" element={<PaymentResultPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/fake-gateway" element={<FakeGatewayPage />} />
          </Routes>
        </main>
        <footer className="bg-zinc-900 text-white py-16 mt-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={150} /></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-6 h-16">
                    <img src={logoFooter} alt="HelperHub" className="h-full w-auto object-contain" />
                </div>
                <p className="text-slate-400 max-w-sm font-medium leading-relaxed ">
                  Hệ thống kết nối nhân lực và việc làm chuyên nghiệp tại Việt Nam. 
                  Nơi niềm tin được gửi gắm và sự thành công luôn đón chờ.
                </p>
              </div>
              <div>
                <h3 className="font-semibold uppercase tracking-widest text-xs text-slate-500 mb-6">Liên kết nhanh</h3>
                <ul className="space-y-3 text-sm font-bold">
                  <li><Link to="/jobs" className="text-slate-400 hover:text-primary-400 transition-colors">Tìm việc làm</Link></li>
                  <li><Link to="/post-job" className="text-slate-400 hover:text-primary-400 transition-colors">Đăng tin tuyển dụng</Link></li>
                  <li><Link to="/subscription" className="text-slate-400 hover:text-primary-400 transition-colors">Gói cước Premium</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold uppercase tracking-widest text-xs text-slate-500 mb-6">Hỗ trợ khách hàng</h3>
                <ul className="space-y-3 text-sm font-bold">
                  <li><a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">Trung tâm trợ giúp</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">Điều khoản dịch vụ</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">Chính sách bảo mật</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-16 pt-10 text-center text-slate-500 text-xs font-semibold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} HelperHub - Nền tảng kết nối người giúp việc hàng đầu.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
