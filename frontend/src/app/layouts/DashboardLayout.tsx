import { Outlet, Navigate, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, User, LogOut, Home, FileText, Truck, Package, Link2, Building2, Recycle, BarChart3, Users, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'citizen':
        return [
          { path: '/dashboard/citizen', label: 'Dashboard', icon: Home },
          { path: '/dashboard/citizen/report', label: 'Report Waste', icon: FileText },
          { path: '/dashboard/citizen/my-reports', label: 'My Reports', icon: Package }
        ];
      case 'collector':
        return [
          { path: '/dashboard/collector', label: 'Dashboard', icon: Home },
          { path: '/dashboard/collector/tasks', label: 'Collection Tasks', icon: Truck }
        ];
      case 'administrator':
        return [
          { path: '/dashboard/admin', label: 'Dashboard', icon: Home },
          { path: '/dashboard/admin/traceability', label: 'Traceability', icon: Link2 },
          { path: '/dashboard/admin/blockchain', label: 'Blockchain', icon: Link2 },
          { path: '/dashboard/admin/containers', label: 'Containers', icon: Package },
          { path: '/dashboard/admin/partners', label: 'Partners', icon: Building2 },
          { path: '/dashboard/admin/recycling', label: 'Recycling', icon: Recycle },
          { path: '/dashboard/admin/audit', label: 'Audit', icon: FileText },
          { path: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
          { path: '/dashboard/admin/users', label: 'Users', icon: Users }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Recycle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">SmartWaste</h2>
                <p className="text-xs text-muted-foreground">ParkCactive</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className={`${sidebarOpen ? 'space-y-2' : 'space-y-3'}`}>
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-foreground"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground text-foreground"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {user.role === 'citizen' && 'Citizen Portal'}
                {user.role === 'collector' && 'Collector Portal'}
                {user.role === 'administrator' && 'Administrator Portal'}
              </h1>
              <p className="text-sm text-muted-foreground">Republic of Congo - Brazzaville</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-accent rounded-lg">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
