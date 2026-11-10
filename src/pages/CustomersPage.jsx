import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Smartphone,
  Eye,
  Calendar
} from 'lucide-react';
import { customersApi, devicesApi, jobCardsApi } from '../api/services';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDate, isValidPhone, isValidEmail } from '../utils/constants';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [customerJobCards, setCustomerJobCards] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersApi.getAll().catch(() => []);
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      notifyWarning('Name and phone are required');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      notifyWarning('Please provide a valid 10-digit Indian phone number (starts with 6, 7, 8, or 9)');
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      notifyWarning('Please provide a valid email address');
      return;
    }

    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, {
          ...editingCustomer,
          ...formData,
        }, currentUser);
        notifySuccess(`Customer ${formData.name} updated!`);
      } else {
        await customersApi.create(formData, currentUser);
        notifySuccess(`Customer ${formData.name} added successfully!`);
      }
      setShowAddModal(false);
      loadCustomers();
    } catch (err) {
      notifyError('Save error: ' + err.message);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer ${customer.name}?`)) return;
    try {
      await customersApi.delete(customer.id, customer.name, currentUser);
      notifySuccess(`Customer ${customer.name} deleted.`);
      loadCustomers();
    } catch (err) {
      notifyError('Delete failed: ' + err.message);
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomerDetails(customer);
    try {
      const [devs, cards] = await Promise.all([
        devicesApi.getByCustomerId(customer.id),
        jobCardsApi.getAll({ customerId: customer.id }),
      ]);
      setCustomerDevices(devs || []);
      setCustomerJobCards(cards.filter((jc) => Number(jc.customerId) === Number(customer.id)) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner text="Loading customers..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Maintain customer records, registered devices, and repair history.
          </p>
        </div>

        {hasPermission('create_customer') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone number, email address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-base">
                  {cust.name?.charAt(0) || 'C'}
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  ID: #{cust.id}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {cust.name}
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.phone}</span>
                </div>
                {cust.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                )}
                {cust.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{cust.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleViewDetails(cust)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>History & Devices</span>
              </button>

              <div className="flex items-center gap-1">
                {hasPermission('edit_customer') && (
                  <button
                    onClick={() => handleOpenEdit(cust)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(cust)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add / Edit Customer */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Customer Full Name *:
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              placeholder="e.g. Ananya Iyer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Phone Number (10 digits) *:
            </label>
            <input
              type="tel"
              required
              maxLength="10"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
              placeholder="e.g. 9876543210"
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
              placeholder="e.g. ananya@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Residential / Company Address:
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              placeholder="e.g. 42 MG Road, Bengaluru"
            />
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
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Customer Profile & Device History */}
      {selectedCustomerDetails && (
        <Modal
          isOpen={!!selectedCustomerDetails}
          onClose={() => setSelectedCustomerDetails(null)}
          title={`Customer Profile: ${selectedCustomerDetails.name}`}
          subtitle={`Registered since ${formatDate(selectedCustomerDetails.registeredAt)}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-sm">
            {/* Contact details bar */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedCustomerDetails.email || 'N/A'}</p>
              </div>
            </div>

            {/* Devices Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Registered Mobile Devices ({customerDevices.length})
              </h4>
              {customerDevices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No devices registered for this customer yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customerDevices.map((d) => (
                    <div key={d.id} className="p-3 bg-white dark:bg-slate-800 border rounded-xl text-xs space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {d.brand} {d.model}
                      </div>
                      <p className="font-mono text-slate-500 text-[11px]">IMEI: {d.imei}</p>
                      <p className="text-[11px] text-slate-400">
                        Warranty: <span className="font-semibold text-slate-700 dark:text-slate-300">{d.warrantyStatus}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Repairs Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Service & Repair History ({customerJobCards.length})
              </h4>
              {customerJobCards.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No previous repair job cards found.</p>
              ) : (
                <div className="space-y-2">
                  {customerJobCards.map((jc) => (
                    <div
                      key={jc.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-600">{jc.jobCardNumber}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 ml-2">{jc.deviceModel}</span>
                        <p className="text-slate-500 mt-0.5">{jc.issueDescription}</p>
                      </div>
                      <StatusBadge status={jc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedCustomerDetails(null)}
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
