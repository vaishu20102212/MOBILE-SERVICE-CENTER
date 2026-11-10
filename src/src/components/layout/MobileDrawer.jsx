import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Smartphone,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  UserCog,
  Boxes,
  Receipt,
  BarChart3,
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';

export default function MobileDrawer({ isOpen, onClose }) {
  const { role, currentUser, switchRole } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Job Cards (Repairs)',
      href: '/job-cards',
      icon: Wrench,
      roles: ['admin', 'receptionist', 'technician'],
      badge: 'Workflow',
    },
    {
      name: 'Service Requests',
      href: '/service-requests',
      icon: ClipboardList,
      roles: ['admin', 'receptionist'],
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Mobile Devices',
      href: '/devices',
      icon: Smartphone,
      roles: ['admin', 'receptionist', 'technician'],
    },
    {
      name: 'Technicians',
      href: '/technicians',
      icon: UserCog,
      roles: ['admin', 'receptionist'],
    },
    {
      name: 'Spare Parts & Stock',
      href: '/inventory',
      icon: Boxes,
      roles: ['admin', 'technician'],
    },
    {
      name: 'Billing & Invoices',
      href: '/billing',
      icon: Receipt,
      roles: ['admin', 'receptionist'],
    },
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'receptionist'],
    },
    {
      name: 'Customer Portal',
      href: '/portal',
      icon: Search,
      roles: ['admin', 'receptionist', 'technician', 'customer'],
      badge: role === 'customer' ? 'My Repairs' : null,
    },
  ];

  const visibleNav = navigation.filter((item) => item.roles.includes(role));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                <span className="text-blue-600 dark:text-blue-400">Fix</span>Master
              </span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Mobile Service Hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User profile & Quick role switcher at bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                {role}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Switch Role (Evaluation):
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_USERS.map((u) => (
                <button
                  key={u.role}
                  onClick={() => {
                    switchRole(u.role);
                    onClose();
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition text-center ${
                    u.role === role
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {u.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
