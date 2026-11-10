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
  X
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';

export default function Navbar({ lowStockCount = 0, onOpenMenu }) {
  const { currentUser, role, switchRole, users } = useAuth();
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

  const roleBadges = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
    receptionist: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    technician: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    customer: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Drawer Hamburger */}
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400">Fix</span>Master
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 uppercase tracking-wider">
                Service Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Center Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleQuickSearch} className="w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search Job Card # (e.g. JC-2026-001), IMEI, or Customer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm border-0 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </form>
        </div>

        {/* Right Actions & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status indicator */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
            title="Database Ready"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </span>

          {/* Mobile search toggle icon */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
            aria-label="Toggle Search"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Low Stock Warning Pill (Tablet/Desktop) */}
          {lowStockCount > 0 && role !== 'customer' && (
            <Link
              to="/inventory?filter=low"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
              title="Parts requiring restock"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{lowStockCount} Low Stock</span>
            </Link>
          )}

          {/* Quick Track link for customers */}
          <Link
            to="/portal"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <span>Live Tracker</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Role Switcher Interactive Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 transition shadow-xs"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-blue-500/20"
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
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Switch User Role (Evaluation Mode)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Instantly test permissions across all 4 personas
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
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-xs font-semibold">{u.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {u.title}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                              roleBadges[u.role]
                            }`}
                          >
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
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
