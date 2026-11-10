import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Calendar,
  Smartphone,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { jobCardsApi, techniciansApi } from '../api/services';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ALL_STATUSES, formatCurrency, formatDate } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, hasPermission } = useAuth();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || 'All');
  const [techFilter, setTechFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cards, techs] = await Promise.all([
        jobCardsApi.getAll().catch(() => []),
        techniciansApi.getAll().catch(() => []),
      ]);
      setJobCards(cards || []);
      setTechnicians(techs || []);
    } catch (err) {
      console.error('Error loading job cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync url search param if changed
  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearchTerm(s);
    const f = searchParams.get('filter');
    if (f) {
      if (f === 'pending') setStatusFilter('Device Received');
      else if (f === 'inprogress') setStatusFilter('Repair in Progress');
      else if (f === 'completed') setStatusFilter('Delivered');
      else setStatusFilter(f);
    }
  }, [searchParams]);

  const filteredCards = jobCards
    .filter((jc) => {
      // Role-based visibility: if technician, optionally highlight their jobs
      // Search term
      const query = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        jc.jobCardNumber?.toLowerCase().includes(query) ||
        jc.customerName?.toLowerCase().includes(query) ||
        jc.customerPhone?.includes(query) ||
        jc.deviceModel?.toLowerCase().includes(query) ||
        jc.imei?.includes(query);

      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'All') {
        matchStatus = jc.status === statusFilter;
      }

      // Tech filter
      let matchTech = true;
      if (techFilter !== 'All') {
        matchTech = String(jc.technicianId) === String(techFilter);
      }

      return matchSearch && matchStatus && matchTech;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'costHigh') return (b.totalCost || 0) - (a.totalCost || 0);
      if (sortBy === 'costLow') return (a.totalCost || 0) - (b.totalCost || 0);
      return 0;
    });

  if (loading) return <LoadingSpinner text="Loading repair job cards..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-blue-600" />
            Repair Job Cards & Workflow
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track device repair progression from check-in to quality assurance and delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {hasPermission('create_service_request') && (
            <Link
              to="/service-requests?new=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Request</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Job # (JC-...), Customer, Phone, Model, IMEI..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="All">All Technicians</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="costHigh">Cost: Highest First</option>
              <option value="costLow">Cost: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'All'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Statuses ({jobCards.length})
          </button>
          {ALL_STATUSES.map((status) => {
            const count = jobCards.filter((c) => c.status === status).length;
            if (count === 0 && !['Device Received', 'Diagnosis', 'Repair in Progress', 'Delivered'].includes(status)) {
              return null;
            }
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Cards View: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredCards.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No job cards found matching current filters.
            </div>
          ) : (
            filteredCards.map((jc) => (
              <div
                key={jc.id}
                onClick={() => navigate(`/job-cards/${jc.id}`)}
                className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      {jc.jobCardNumber}
                    </span>
                    {jc.priority === 'High' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                        High
                      </span>
                    )}
                  </div>
                  <StatusBadge status={jc.status} size="xs" />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      {jc.deviceModel}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{jc.customerName}</span> • <span>{jc.customerPhone}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(jc.totalCost)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(jc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="text-slate-500">
                    Tech: <b className="text-slate-700 dark:text-slate-300">{jc.technicianName || 'Unassigned'}</b>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    Manage &gt;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Job Card #</th>
                <th className="px-6 py-3.5">Device & Customer</th>
                <th className="px-6 py-3.5">Workflow Status</th>
                <th className="px-6 py-3.5">Assigned Technician</th>
                <th className="px-6 py-3.5">Total Estimate</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No job cards found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCards.map((jc) => (
                  <tr
                    key={jc.id}
                    onClick={() => navigate(`/job-cards/${jc.id}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {jc.jobCardNumber}
                      </span>
                      {jc.priority === 'High' && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                          High
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          {jc.deviceModel}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{jc.customerName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{jc.customerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={jc.status} />
                    </td>
                    <td className="px-6 py-4">
                      {jc.technicianName ? (
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {jc.technicianName}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(jc.totalCost)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(jc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/job-cards/${jc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
