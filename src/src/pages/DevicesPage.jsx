import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Search,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  History,
  Trash2,
  Edit2,
  Calendar,
  User
} from 'lucide-react';
import { devicesApi, customersApi, jobCardsApi } from '../api/services';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDate, isValidIMEI, isWarrantyActive } from '../utils/constants';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [warrantyFilter, setWarrantyFilter] = useState('All');
  const { currentUser, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [selectedDeviceHistory, setSelectedDeviceHistory] = useState(null);
  const [deviceJobCards, setDeviceJobCards] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    brand: 'Apple',
    model: '',
    imei: '',
    serialNumber: '',
    color: 'Black',
    warrantyStart: '2026-01-01',
    warrantyExpiry: '2027-01-01',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [d, c] = await Promise.all([
        devicesApi.getAll(),
        customersApi.getAll(),
      ]);
      setDevices(d || []);
      setCustomers(c || []);
    } catch (err) {
      console.error(err);
      notifyError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDevice(null);
    setFormData({
      customerId: customers[0]?.id || '',
      brand: 'Apple',
      model: '',
      imei: '',
      serialNumber: '',
      color: 'Titanium Blue',
      warrantyStart: '2026-01-01',
      warrantyExpiry: '2027-01-01',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (dev) => {
    setEditingDevice(dev);
    setFormData({
      customerId: dev.customerId || '',
      brand: dev.brand || 'Apple',
      model: dev.model || '',
      imei: dev.imei || '',
      serialNumber: dev.serialNumber || '',
      color: dev.color || '',
      warrantyStart: dev.warrantyStart || '2026-01-01',
      warrantyExpiry: dev.warrantyExpiry || '2027-01-01',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      notifyWarning('Please assign a customer to this device');
      return;
    }
    if (!formData.model.trim()) {
      notifyWarning('Model name is required');
      return;
    }
    if (!isValidIMEI(formData.imei)) {
      notifyWarning('IMEI number must be exactly 15 digits');
      return;
    }

    const underWarranty = isWarrantyActive(formData.warrantyExpiry);
    const payload = {
      ...formData,
      customerId: Number(formData.customerId),
      warrantyStatus: underWarranty ? 'Under Warranty' : 'Expired',
    };

    try {
      if (editingDevice) {
        await devicesApi.update(editingDevice.id, payload, currentUser);
        notifySuccess(`Device ${payload.brand} ${payload.model} updated!`);
      } else {
        await devicesApi.create(payload, currentUser);
        notifySuccess(`Device ${payload.brand} ${payload.model} registered!`);
      }
      setShowAddModal(false);
      loadData();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleViewHistory = async (dev) => {
    setSelectedDeviceHistory(dev);
    try {
      const cards = await jobCardsApi.getAll();
      setDeviceJobCards(cards.filter((jc) => Number(jc.deviceId) === Number(dev.id)) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const q = searchTerm.toLowerCase();
    const cust = customers.find((c) => Number(c.id) === Number(d.customerId));
    const matchSearch =
      !searchTerm ||
      d.model?.toLowerCase().includes(q) ||
      d.brand?.toLowerCase().includes(q) ||
      d.imei?.includes(q) ||
      cust?.name?.toLowerCase().includes(q);

    const matchBrand = brandFilter === 'All' || d.brand === brandFilter;
    const matchWarranty =
      warrantyFilter === 'All' ||
      (warrantyFilter === 'active' && isWarrantyActive(d.warrantyExpiry)) ||
      (warrantyFilter === 'expired' && !isWarrantyActive(d.warrantyExpiry));

    return matchSearch && matchBrand && matchWarranty;
  });

  if (loading) return <LoadingSpinner text="Loading mobile devices..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-blue-600" />
            Mobile Device Management & Warranty
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Register smartphone IMEI/Serial, track brand warranties, and past service logs.
          </p>
        </div>

        {hasPermission('create_customer') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Device</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Model, Brand, IMEI, Customer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Brands</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Google">Google</option>
          <option value="OnePlus">OnePlus</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>

        <select
          value={warrantyFilter}
          onChange={(e) => setWarrantyFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Warranty States</option>
          <option value="active">Under Warranty (Active)</option>
          <option value="expired">Warranty Expired</option>
        </select>
      </div>

      {/* Devices View: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No devices registered yet.
            </div>
          ) : (
            filteredDevices.map((dev) => {
              const cust = customers.find((c) => Number(c.id) === Number(dev.customerId));
              const activeWarranty = isWarrantyActive(dev.warrantyExpiry);

              return (
                <div key={dev.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>{dev.brand} {dev.model}</span>
                    </div>
                    {activeWarranty ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3" />
                        Under Warranty
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        <ShieldAlert className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">IMEI</span>
                      <p className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{dev.imei}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Owner</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{cust?.name || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Exp: {formatDate(dev.warrantyExpiry)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewHistory(dev)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                        title="History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {hasPermission('edit_customer') && (
                        <button
                          onClick={() => handleOpenEdit(dev)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Device Details</th>
                <th className="px-6 py-3.5">IMEI / Serial</th>
                <th className="px-6 py-3.5">Registered Owner</th>
                <th className="px-6 py-3.5">Warranty Status</th>
                <th className="px-6 py-3.5">Warranty Validity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredDevices.map((dev) => {
                const cust = customers.find((c) => Number(c.id) === Number(dev.customerId));
                const activeWarranty = isWarrantyActive(dev.warrantyExpiry);

                return (
                  <tr key={dev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span>{dev.brand} {dev.model}</span>
                      </div>
                      {dev.color && (
                        <span className="text-xs text-slate-400">Color: {dev.color}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {dev.imei}
                      </div>
                      {dev.serialNumber && (
                        <div className="font-mono text-[11px] text-slate-400">
                          SN: {dev.serialNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust?.name || 'Unassigned'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{cust?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {activeWarranty ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Under Warranty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div>Expires: {formatDate(dev.warrantyExpiry)}</div>
                      <div className="text-[10px] text-slate-400">Since {formatDate(dev.warrantyStart)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewHistory(dev)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="View Service History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {hasPermission('edit_customer') && (
                          <button
                            onClick={() => handleOpenEdit(dev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                            title="Edit Device"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register / Edit Device */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingDevice ? 'Edit Mobile Device' : 'Register Mobile Device'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Select Device Owner *:
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Brand *:
              </label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Google">Google</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Model Name *:
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                placeholder="e.g. iPhone 15 Pro Max"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                IMEI Number (15 digits) *:
              </label>
              <input
                type="text"
                required
                maxLength="15"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
                placeholder="354892019485721"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Serial Number:
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
                placeholder="F2LX99K8PL"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Warranty Start Date:
              </label>
              <input
                type="date"
                required
                value={formData.warrantyStart}
                onChange={(e) => setFormData({ ...formData, warrantyStart: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Warranty Expiry Date:
              </label>
              <input
                type="date"
                required
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>
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
              Save Device
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Device Service History */}
      {selectedDeviceHistory && (
        <Modal
          isOpen={!!selectedDeviceHistory}
          onClose={() => setSelectedDeviceHistory(null)}
          title={`Service History: ${selectedDeviceHistory.brand} ${selectedDeviceHistory.model}`}
          subtitle={`IMEI: ${selectedDeviceHistory.imei}`}
        >
          <div className="space-y-4">
            {deviceJobCards.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No past repair requests on record for this device.
              </p>
            ) : (
              <div className="space-y-2.5">
                {deviceJobCards.map((jc) => (
                  <div
                    key={jc.id}
                    className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600">{jc.jobCardNumber}</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {jc.issueDescription}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Completed on: {formatDate(jc.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={jc.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedDeviceHistory(null)}
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
