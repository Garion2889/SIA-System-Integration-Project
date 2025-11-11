import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from './utils/supabase/client';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Logo } from './components/Logo';
import { 
  LayoutDashboard, 
  Package, 
  Map,
  FileText,
  Bell, 
  LogOut,
  Settings,
  Users,
  TruckIcon,
  Menu,
  X,
  Calendar
} from 'lucide-react';

// Shared Components
import { LoginPage } from './components/LoginPage';
import { PublicTracking } from './components/PublicTracking';

// Admin Components (lazy loaded to prevent timeout)
import { LogisticsDashboard } from './components/admin/LogisticsDashboard';
import { DeliveryManagement } from './components/admin/DeliveryManagement';
import { DriverManagement } from './components/admin/DriverManagement';
import { ReturnsManagement } from './components/admin/ReturnsManagement';
import { Reports } from './components/admin/Reports';

// Driver Components
import { AssignedDeliveries } from './components/driver/AssignedDeliveries';

type Portal = 'admin' | 'driver' | 'public';
type AdminPage = 'dashboard' | 'deliveries' | 'drivers' | 'returns' | 'reports' | 'notifications';
type DriverPage = 'deliveries';

export default function App() {
  const [portal, setPortal] = useState<Portal>('public');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<AdminPage | DriverPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string, role: string, id: string) => {
    setAccessToken(token);
    setUserRole(role);
    setUserId(id);
    setPortal(role as Portal);
    setCurrentPage('dashboard');
    setShowTracking(false);
  };

  const handleShowTracking = () => {
    setShowTracking(true);
  };

  const handleBackToLogin = () => {
    setShowTracking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setPortal('public');
    setCurrentPage('dashboard');
    setUserRole('');
    setUserId('');
    setShowTracking(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AdminPage | DriverPage);
    setSidebarOpen(false);
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Public Tracking Page
  if (showTracking && (portal === 'public' || !accessToken)) {
    return (
      <>
        <Toaster />
        <PublicTracking onBackToLogin={handleBackToLogin} />
      </>
    );
  }

  // Login Page
  if (portal === 'public' || !accessToken) {
    return (
      <>
        <Toaster />
        <LoginPage onLogin={handleLogin} onShowTracking={handleShowTracking} />
      </>
    );
  }

  // Driver Portal
  if (portal === 'driver' && accessToken) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-gray-50">
          {/* Mobile Header */}
          <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                    Driver
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 pb-20">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl mb-1">My Deliveries</h1>
                <p className="text-sm text-gray-600">Manage your assigned deliveries</p>
              </div>
              
              {userId ? (
                <AssignedDeliveries 
                  accessToken={accessToken} 
                  driverId={userId} 
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading driver profile...</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </>
    );
  }

  // Admin Portal
  const adminNavigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Delivery Management', icon: Package },
    { id: 'drivers', label: 'Driver Management', icon: TruckIcon },
    { id: 'returns', label: 'Returns', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-[#f9fafb]">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#1f2937] text-white
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 border-b border-gray-700">
            <Logo className="text-white mb-2" />
            <div className="text-xs text-gray-400">RMT Marketing Solutions Inc.</div>
          </div>

          <nav className="p-4 space-y-1">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#10b981] text-white shadow-md' 
                      : 'text-gray-300 hover:bg-[#334155]'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-gray-300 hover:bg-[#374151] hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <header className="bg-white border-b sticky top-0 z-40">
            <div className="px-4 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    {sidebarOpen ? <X /> : <Menu />}
                  </Button>
                  <div>
                    <h2 className="text-lg">
                      {adminNavigation.find(n => n.id === currentPage)?.label || 'Dashboard'}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm bg-[#10b981] text-white px-3 py-1 rounded-full">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-8">
            {currentPage === 'dashboard' && (
              <LogisticsDashboard accessToken={accessToken} />
            )}
            {currentPage === 'deliveries' && (
              <DeliveryManagement accessToken={accessToken} />
            )}
            {currentPage === 'drivers' && (
              <DriverManagement accessToken={accessToken} />
            )}
            {currentPage === 'returns' && (
              <ReturnsManagement accessToken={accessToken} />
            )}
            {currentPage === 'reports' && (
              <Reports accessToken={accessToken} />
            )}
            {currentPage === 'notifications' && (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl text-gray-600">Notifications</h3>
                <p className="text-gray-500 mt-2">Coming soon...</p>
              </div>
            )}
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}
