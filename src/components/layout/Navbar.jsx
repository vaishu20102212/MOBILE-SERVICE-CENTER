import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Wrench, 
  Bell, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Menu,
  X,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function Navbar({ lowStockCount = 0, onOpenMenu }) {
  const { currentUser, role, switchRole, logout, isAuthenticated } = useAuth();
  const { notifySuccess } = useNotification();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/job-cards?search=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
      setShowMobileSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowRoleDropdown(false);
    notifySuccess('Logged out successfully');
    navigate('/login');
  };

  const roleBadges = {
    admin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    receptionist: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    technician: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    customer: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    guest: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Hamburger + Logo Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 transform -rotate-45" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Fix<span className="text-blue-600">Master</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 tracking-wide uppercase hidden xs:inline-block">
                  PRO
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium hidden sm:block -mt-1">
                Service Center OS
              </p>
            </div>
          </Link>
        </div>

        {/* Global Quick Search - Desktop */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleQuickSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search Job Card #, IMEI, Customer, Serial..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </form>
        </div>

        {/* Right Section Actions & User Status */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search toggle button */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Low Stock Warning Alert Badge */}
          {lowStockCount > 0 && (
            <Link
              to="/inventory"
              className="relative p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition border border-amber-200/50 dark:border-amber-800/50"
              title={`${lowStockCount} items below safety reorder threshold!`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {lowStockCount}
              </span>
            </Link>
          )}

          {/* Customer Live Portal Button */}
          <Link
            to="/portal"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition border border-slate-200 dark:border-slate-700"
          >
            <span>Live Tracker</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* User Profile & Role Switcher Dropdown */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 transition shadow-xs cursor-pointer"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Role: <span className="text-blue-600 font-bold">{role}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {currentUser.email}
                        </p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mt-0.5 ${roleBadges[role] || roleBadges.admin}`}>
                          {role}
                        </span>
                      </div>
                    </div>

                    {/* Switch role evaluation section */}
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Persona (Evaluation):
                      </p>
                    </div>

                    <div className="p-2 space-y-1">
                      {DEFAULT_USERS.map((u) => {
                        const isActive = u.role === role;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchRole(u.role);
                              setShowRoleDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div>
                                <div className="text-xs font-semibold">{u.name}</div>
                                <div className="text-[9px] text-slate-400">{u.title}</div>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                roleBadges[u.role]
                              }`}
                            >
                              {u.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sign Out Action Button */}
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out / Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Field */}
      {showMobileSearch && (
        <div className="px-3 pb-3 md:hidden animate-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleQuickSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search Job Card #, IMEI, Customer..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs border-0 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </form>
        </div>
      )}
    </header>
  );
}
