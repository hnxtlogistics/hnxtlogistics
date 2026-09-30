import { Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ResetPasswordPage from './ResetPasswordPage';
import AdminLayout from './AdminLayout';
import EnquiriesSection from './sections/EnquiriesSection';
import CompanySection from './sections/CompanySection';
import HomeSection from './sections/HomeSection';
import AboutSection from './sections/AboutSection';
import ServicesSection from './sections/ServicesSection';
import LanesSection from './sections/LanesSection';
import FaqsSection from './sections/FaqsSection';
import SeoSection from './sections/SeoSection';
import PopupSection from './sections/PopupSection';
import NotificationsSection from './sections/NotificationsSection';
import AccountSection from './sections/AccountSection';

function Gate() {
  const { status } = useAuth();
  /* The reset screen has to render for a signed-out visitor holding a link,
     so it is checked before the auth gate. */
  const onResetRoute = window.location.pathname === '/admin/reset';

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand">
        <p className="font-label text-[11px] uppercase tracking-[0.16em] text-on-brand/72">Checking session…</p>
      </div>
    );
  }

  if (onResetRoute) return <ResetPasswordPage />;
  if (status !== 'authenticated') return <LoginPage />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<EnquiriesSection />} />
        <Route path="company" element={<CompanySection />} />
        <Route path="homepage" element={<HomeSection />} />
        <Route path="about" element={<AboutSection />} />
        <Route path="services" element={<ServicesSection />} />
        <Route path="lanes" element={<LanesSection />} />
        <Route path="faqs" element={<FaqsSection />} />
        <Route path="seo" element={<SeoSection />} />
        <Route path="popup" element={<PopupSection />} />
        <Route path="notifications" element={<NotificationsSection />} />
        <Route path="account" element={<AccountSection />} />
        <Route path="*" element={<EnquiriesSection />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
