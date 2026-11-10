import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Boxes,
  Menu,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav({ onOpenMenu }) {
  const { role } = useAuth();

  const isCustomer = role === 'customer';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        <NavLink
          to="/job-cards"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`
          }
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Job Cards</span>
        </NavLink>

        {!isCustomer && (
          <NavLink
            to="/service-requests"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`
            }
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Requests</span>
          </NavLink>
        )}

        <NavLink
          to={isCustomer ? '/portal' : '/inventory'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold transition ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`
          }
        >
          {isCustomer ? (
            <>
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Tracker</span>
            </>
          ) : (
            <>
              <Boxes className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Stock</span>
            </>
          )}
        </NavLink>

        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </div>
    </div>
  );
}
