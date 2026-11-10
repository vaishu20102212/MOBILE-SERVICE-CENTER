import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
  X,
  ExternalLink,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function MobileDrawer({ isOpen, onClose }) {
  const { role, currentUser, switchRole, logout, isAuthenticated } = useAuth();
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
      name: 'Public Customer Portal',
      href: '/portal',
      icon: Search,
      allowed: ['admin', 'receptionist', 'technician', 'customer', 'guest'],
      badge: 'Live',
    },
  ];

  const filteredNav = navigation.filter(
    (item) => !item.allowed || item.allowed.includes(role)
  );

  const handleLogout = () => {
    logout();
    onClose();
    notifySuccess('Logged out successfully');
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Wrench className="w-4 h-4 transform -rotate-45" />
              </div>
              <span className="font-black text-slate-900 dark:text-white text-base">
                Fix<span className="text-blue-600">Master</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Navigation Menu
            </p>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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

        {/* User profile & Quick role switcher + Logout at bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          {isAuthenticated && currentUser ? (
            <>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Switch Persona (Evaluation):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEFAULT_USERS.map((u) => (
                    <button
                      key={u.role}
                      onClick={() => {
                        switchRole(u.role);
                        onClose();
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition text-center cursor-pointer ${
                        u.role === role
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 hover:bg-red-100 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out / Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to FixMaster</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
