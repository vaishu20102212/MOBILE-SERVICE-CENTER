import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Wrench,
  Users,
  Boxes,
  FileSpreadsheet,
  Receipt,
  UserCheck,
  Search,
  Settings,
  HelpCircle,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function Sidebar() {
  const { role, currentUser, logout, isAuthenticated } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      allowed: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Job Cards',
      href: '/job-cards',
      icon: Wrench,
      allowed: ['admin', 'receptionist', 'technician'],
      badge: 'Core',
    },
    {
      name: 'Service Requests',
      href: '/service-requests',
      icon: Smartphone,
      allowed: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Customer Directory',
      href: '/customers',
      icon: Users,
      allowed: ['admin', 'receptionist'],
    },
    {
      name: 'Device Registry',
      href: '/devices',
      icon: Smartphone,
      allowed: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Technician Roster',
      href: '/technicians',
      icon: UserCheck,
      allowed: ['admin'],
    },
    {
      name: 'Spare Parts & Inventory',
      href: '/inventory',
      icon: Boxes,
      allowed: ['admin', 'technician'],
    },
    {
      name: 'Invoices & Billing',
      href: '/billing',
      icon: Receipt,
      allowed: ['admin', 'receptionist'],
    },
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: FileSpreadsheet,
      allowed: ['admin', 'receptionist'],
    },
    {
      name: 'Customer Portal',
      href: '/portal',
      icon: Search,
      allowed: ['admin', 'receptionist', 'technician', 'customer', 'guest'],
      badge: 'Public',
    },
  ];

  const filteredNav = navigation.filter(
    (item) => !item.allowed || item.allowed.includes(role)
  );

  const handleLogout = () => {
    logout();
    notifySuccess('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between hidden md:flex shrink-0">
      <div className="p-4 space-y-4">
        {/* Navigation Links */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Banner / Profile & Logout at bottom of sidebar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {isAuthenticated && currentUser ? (
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 ring-1 ring-blue-500/20">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">
                  {role} Mode
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out / Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
}
