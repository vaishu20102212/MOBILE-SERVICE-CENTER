import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  Smartphone,
  UserCog,
  Boxes,
  Receipt,
  BarChart3,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { role, currentUser } = useAuth();

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

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>
        <nav className="space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
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

      {/* Role Banner / Profile at bottom of sidebar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">
                {role} Mode
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
