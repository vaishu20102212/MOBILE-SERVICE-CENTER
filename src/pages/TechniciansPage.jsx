import React, { useState, useEffect } from 'react';
import {
  UserCog,
  PlusCircle,
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Phone,
  Mail,
  Eye,
  Edit2
} from 'lucide-react';
import { techniciansApi, jobCardsApi } from '../api/services';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { isValidPhone, isValidEmail } from '../utils/constants';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTechJobs, setSelectedTechJobs] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Screen & OLED Displays',
    status: 'Available',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [techs, cards] = await Promise.all([
        techniciansApi.getAll().catch(() => []),
        jobCardsApi.getAll().catch(() => []),
      ]);
      setTechnicians(techs || []);
      setJobCards(cards || []);
    } catch (err) {
      console.error('Failed to load technician roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (tech, newStatus) => {
    try {
      await techniciansApi.updateStatus(tech.id, newStatus, currentUser);
      notifySuccess(`${tech.name} status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      notifyError('Failed to update status: ' + err.message);
    }
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      notifyWarning('Technician name and phone are required');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      notifyWarning('Phone must be a valid 10-digit number');
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      notifyWarning('Valid email is required');
      return;
    }

    try {
      await techniciansApi.create(formData, currentUser);
      notifySuccess(`Technician ${formData.name} added to service team!`);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: 'Screen & OLED Displays',
        status: 'Available',
      });
      loadData();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const openAssignedJobs = (tech) => {
    const assigned = jobCards.filter((jc) => Number(jc.technicianId) === Number(tech.id));
    setSelectedTechJobs({ tech, jobs: assigned });
  };

  if (loading) return <LoadingSpinner text="Loading technician workloads..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-blue-600" />
            Technician Management & Workload
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track technician availability, skill specializations, active repairs, and ratings.
          </p>
        </div>

        {hasPermission('manage_technicians') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Technician</span>
          </button>
        )}
      </div>

      {/* Technician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {technicians.map((tech) => {
          const activeJobsCount = jobCards.filter(
            (jc) =>
              Number(jc.technicianId) === Number(tech.id) &&
              !['Delivered', 'Cancelled', 'Repair Failed'].includes(jc.status)
          ).length;

          return (
            <div
              key={tech.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition"
            >
              <div>
                {/* Avatar & Availability Selector */}
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={tech.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={tech.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs"
                  />

                  {/* Status Toggle Dropdown */}
                  <select
                    value={tech.status}
                    disabled={!hasPermission('manage_technicians')}
                    onChange={(e) => handleStatusChange(tech, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition ${
                      tech.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : tech.status === 'Busy'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    <option value="Available">🟢 Available</option>
                    <option value="Busy">🟡 Busy</option>
                    <option value="On Leave">🔴 On Leave</option>
                  </select>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {tech.name}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {tech.specialization}
                </p>

                {/* Rating & Contact */}
                <div className="mt-3 flex items-center gap-1 text-xs text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{tech.rating || 4.8}</span>
                  <span className="text-slate-400 font-normal ml-1">
                    ({tech.completedJobs || 0} completed)
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{tech.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{tech.email}</span>
                  </div>
                </div>

                {/* Workload Meter */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-500">Active Repair Queue:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeJobsCount} Jobs
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeJobsCount >= 3
                          ? 'bg-rose-500'
                          : activeJobsCount > 0
                          ? 'bg-blue-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (activeJobsCount / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openAssignedJobs(tech)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Assigned Jobs ({activeJobsCount})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add Technician */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Technician to Service Roster"
      >
        <form onSubmit={handleCreateTechnician} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Full Name *:
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              placeholder="e.g. Vikramaditya Sen"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Phone Number *:
              </label>
              <input
                type="tel"
                required
                maxLength="10"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
                placeholder="9811223344"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Email Address:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                placeholder="tech@fixmaster.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Technical Specialization:
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
            >
              <option value="Screen & OLED Displays">Screen & OLED Displays</option>
              <option value="Motherboard & Micro-soldering">Motherboard & Micro-soldering</option>
              <option value="Battery, Charging IC & Water Damage">Battery, Charging IC & Water Damage</option>
              <option value="Camera & Sensor Diagnostics">Camera & Sensor Diagnostics</option>
              <option value="General Diagnostics & Software">General Diagnostics & Software</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Save Technician
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: View Technician Assigned Jobs */}
      {selectedTechJobs && (
        <Modal
          isOpen={!!selectedTechJobs}
          onClose={() => setSelectedTechJobs(null)}
          title={`Assigned Repairs: ${selectedTechJobs.tech.name}`}
          subtitle={`${selectedTechJobs.jobs.length} total repairs assigned`}
        >
          <div className="space-y-4">
            {selectedTechJobs.jobs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No active repairs currently assigned to this technician.
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedTechJobs.jobs.map((jc) => (
                  <div
                    key={jc.id}
                    className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600">{jc.jobCardNumber}</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2">{jc.deviceModel}</span>
                      <p className="text-slate-500 mt-0.5">{jc.issueDescription}</p>
                    </div>
                    <StatusBadge status={jc.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedTechJobs(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
