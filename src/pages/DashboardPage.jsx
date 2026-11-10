import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  RotateCw,
  CheckCircle2,
  Users2,
  AlertTriangle,
  IndianRupee,
  PlusCircle,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { getDashboardStats, activitiesApi } from '../api/services';
import { formatCurrency, formatDate } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role, hasPermission } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, acts] = await Promise.all([
        getDashboardStats(),
        activitiesApi.getAll(),
      ]);
      setStats(s);
      setActivities(acts || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />;

  const statCards = [
    {
      title: 'Total Service Requests',
      value: stats?.totalRequests || 0,
      icon: Smartphone,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      link: '/service-requests',
    },
    {
      title: 'Pending Repairs',
      value: stats?.pendingRepairs || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      link: '/job-cards?filter=pending',
    },
    {
      title: 'Repairs in Progress',
      value: stats?.inProgressRepairs || 0,
      icon: RotateCw,
      color: 'from-cyan-500 to-blue-500',
      bgLight: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      link: '/job-cards?filter=inprogress',
    },
    {
      title: 'Completed Repairs',
      value: stats?.completedRepairs || 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      link: '/job-cards?filter=completed',
    },
    {
      title: 'Available Technicians',
      value: `${stats?.availableTechs || 0} / ${stats?.totalTechs || 0}`,
      icon: Users2,
      color: 'from-purple-500 to-indigo-600',
      bgLight: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      link: '/technicians',
    },
    {
      title: 'Low-Stock Parts',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-600',
      bgLight: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      link: '/inventory?filter=low',
      badge: stats?.lowStockCount > 0 ? 'Restock Required' : 'Optimal',
    },
    {
      title: 'Total Revenue (Paid)',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: IndianRupee,
      color: 'from-green-600 to-emerald-700',
      bgLight: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      link: '/billing',
      subtext: `Pending: ${formatCurrency(stats?.pendingRevenue || 0)}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Service Center Command
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            FixMaster Operations Control
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            Real-time repair tracking, technician workloads, inventory status, and automated customer billing.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {hasPermission('create_service_request') && (
            <Link
              to="/service-requests?new=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Service Request</span>
            </Link>
          )}
          <Link
            to="/job-cards"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition border border-white/10"
          >
            <Wrench className="w-4 h-4" />
            <span>View Job Cards</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgLight}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {card.value}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  Details <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.slice(4).map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgLight}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {card.value}
                  </span>
                  {card.subtext && (
                    <p className="text-xs text-slate-400 mt-0.5">{card.subtext}</p>
                  )}
                </div>
                {card.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      card.value > 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    }`}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>


      {/* Main Grid: Recent Job Cards & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Job Cards */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Job Cards & Repair Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current devices undergoing diagnosis, repair and quality check
              </p>
            </div>
            <Link
              to="/job-cards"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats?.recentJobCards?.map((jc) => (
              <div
                key={jc.id}
                onClick={() => navigate(`/job-cards/${jc.id}`)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2.5 rounded-xl cursor-pointer transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {jc.jobCardNumber}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {jc.deviceModel}
                    </span>
                    {jc.warrantyCovered && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3" />
                        Warranty
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {jc.customerName}
                    </span>{' '}
                    — {jc.issueDescription}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Assigned: <span className="font-medium text-slate-600 dark:text-slate-300">{jc.technicianName || 'Unassigned'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <StatusBadge status={jc.status} />
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Audit Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Activity Log
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time audit log of customer check-ins, status updates & inventory usage
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent activities</p>
              ) : (
                activities.slice(0, 7).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {act.action}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 leading-snug">
                        {act.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{act.user} ({act.role})</span>
                        <span>•</span>
                        <span>{formatDate(act.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/reports"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Generate Detailed Audit Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
