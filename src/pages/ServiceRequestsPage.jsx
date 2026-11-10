import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Smartphone,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Wrench,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  serviceRequestsApi,
  customersApi,
  devicesApi,
  jobCardsApi
} from '../api/services';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  formatCurrency,
  formatDate,
  isValidPhone,
  isValidIMEI,
  isWarrantyActive
} from '../utils/constants';

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Wizard state for creating request
  const [showWizard, setShowWizard] = useState(searchParams.get('new') === 'true');
  const [wizardStep, setWizardStep] = useState(1);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [newDevice, setNewDevice] = useState({
    brand: 'Apple',
    model: '',
    imei: '',
    serialNumber: '',
    warrantyStart: '2026-01-01',
    warrantyExpiry: '2027-01-01',
  });
  const [isAddingNewDevice, setIsAddingNewDevice] = useState(false);

  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState('Screen / Display');
  const [priority, setPriority] = useState('Medium');
  const [estimatedCost, setEstimatedCost] = useState(1500);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, c, d] = await Promise.all([
        serviceRequestsApi.getAll().catch(() => []),
        customersApi.getAll().catch(() => []),
        devicesApi.getAll().catch(() => []),
      ]);
      setRequests(r || []);
      setCustomers(c || []);
      setDevices(d || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();

    try {
      let finalCustomerId = selectedCustomerId;
      let finalCustomerName = '';
      let finalCustomerPhone = '';

      // 1. If adding new customer, validate and create
      if (isAddingNewCustomer) {
        if (!newCustomer.name || !newCustomer.phone) {
          notifyWarning('Customer name and phone are required');
          return;
        }
        if (!isValidPhone(newCustomer.phone)) {
          notifyWarning('Phone must be a valid 10-digit number (e.g. 9876543210)');
          return;
        }
        const createdCust = await customersApi.create(newCustomer, currentUser);
        finalCustomerId = createdCust.id;
        finalCustomerName = createdCust.name;
        finalCustomerPhone = createdCust.phone;
      } else {
        const found = customers.find((c) => String(c.id) === String(selectedCustomerId));
        if (!found) {
          notifyWarning('Please select or add a customer');
          return;
        }
        finalCustomerName = found.name;
        finalCustomerPhone = found.phone;
      }

      // 2. If adding new device, validate and create
      let finalDeviceId = selectedDeviceId;
      let finalDeviceModel = '';
      let finalImei = '';
      let isUnderWarranty = false;

      if (isAddingNewDevice) {
        if (!newDevice.model || !newDevice.imei) {
          notifyWarning('Device model and IMEI number are required');
          return;
        }
        if (!isValidIMEI(newDevice.imei)) {
          notifyWarning('IMEI must be a valid 15-digit number');
          return;
        }
        isUnderWarranty = isWarrantyActive(newDevice.warrantyExpiry);
        const createdDev = await devicesApi.create(
          {
            ...newDevice,
            customerId: Number(finalCustomerId),
            warrantyStatus: isUnderWarranty ? 'Under Warranty' : 'Expired',
          },
          currentUser
        );
        finalDeviceId = createdDev.id;
        finalDeviceModel = `${createdDev.brand} ${createdDev.model}`;
        finalImei = createdDev.imei;
      } else {
        const foundDev = devices.find((d) => String(d.id) === String(selectedDeviceId));
        if (!foundDev) {
          notifyWarning('Please select or add a device');
          return;
        }
        finalDeviceModel = `${foundDev.brand} ${foundDev.model}`;
        finalImei = foundDev.imei;
        isUnderWarranty = foundDev.warrantyStatus === 'Under Warranty' || isWarrantyActive(foundDev.warrantyExpiry);
      }

      // 3. Generate Request Number and Job Card Number
      const randomSeq = String(Math.floor(100 + Math.random() * 900));
      const requestNumber = `SR-2026-${randomSeq}`;
      const jobCardNumber = `JC-2026-${randomSeq}`;

      // 4. Create Service Request
      const serviceReq = await serviceRequestsApi.create(
        {
          requestNumber,
          customerId: Number(finalCustomerId),
          deviceId: Number(finalDeviceId),
          issueTitle,
          issueCategory,
          priority,
          status: 'Job Card Created',
          estimatedCost: Number(estimatedCost),
          jobCardNumber,
        },
        currentUser
      );

      // 5. Create Job Card in JSON Server
      const createdJobCard = await jobCardsApi.create(
        {
          jobCardNumber,
          serviceRequestId: serviceReq.id,
          customerId: Number(finalCustomerId),
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          deviceId: Number(finalDeviceId),
          deviceModel: finalDeviceModel,
          imei: finalImei,
          warrantyCovered: isUnderWarranty,
          technicianId: null,
          technicianName: null,
          status: 'Job Card Created',
          priority,
          issueDescription: issueTitle,
          diagnosisNotes: '',
          repairNotes: '',
          partsUsed: [],
          laborCost: 500,
          partsCost: 0,
          discount: isUnderWarranty ? 500 : 0,
          taxRate: 18,
          totalCost: isUnderWarranty ? 0 : 590,
          estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        },
        currentUser
      );

      notifySuccess(`Service Request ${requestNumber} and Job Card ${jobCardNumber} created!`);
      setShowWizard(false);
      loadData();
      navigate(`/job-cards/${createdJobCard.id}`);
    } catch (err) {
      notifyError('Failed to create request: ' + err.message);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      r.requestNumber?.toLowerCase().includes(q) ||
      r.issueTitle?.toLowerCase().includes(q) ||
      r.jobCardNumber?.toLowerCase().includes(q);

    const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const availableDevicesForSelectedCustomer = devices.filter(
    (d) => String(d.customerId) === String(selectedCustomerId)
  );

  if (loading) return <LoadingSpinner text="Loading service requests..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Service Requests & Intake
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log front-desk customer repair requests and auto-generate Job Cards.
          </p>
        </div>

        <button
          onClick={() => {
            setShowWizard(true);
            setWizardStep(1);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Service Intake</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Request #, Issue title, Job Card #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
      </div>

      {/* Service Requests: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No service requests found.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {req.requestNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.priority === 'High'
                        ? 'bg-rose-100 text-rose-700'
                        : req.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {req.issueTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      {req.issueCategory}
                    </span>
                    <span>•</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {req.jobCardNumber}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="text-slate-400">{formatDate(req.createdAt)}</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Est: {formatCurrency(req.estimatedCost)}
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
                <th className="px-6 py-3.5">Request #</th>
                <th className="px-6 py-3.5">Issue Description</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Linked Job Card</th>
                <th className="px-6 py-3.5">Estimated Cost</th>
                <th className="px-6 py-3.5">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {req.requestNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white max-w-sm">
                      {req.issueTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
                      {req.issueCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        req.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : req.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {req.jobCardNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(req.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatDate(req.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SERVICE REQUEST WIZARD MODAL */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title="Register New Service Request & Job Card"
        subtitle="Step-by-step customer intake and device issue capture"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRequest} className="space-y-5">
          {/* Step 1: Customer Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                1. Customer Details
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {isAddingNewCustomer ? 'Select Existing Customer' : '+ Register New Customer'}
              </button>
            </div>

            {isAddingNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Customer Full Name *"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />
                <input
                  type="tel"
                  placeholder="Phone (10 digits) *"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Physical Address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
            ) : (
              <div>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedDeviceId('');
                  }}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Device Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                2. Device & Warranty Information
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNewDevice(!isAddingNewDevice)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {isAddingNewDevice ? 'Select Existing Device' : '+ Register New Device'}
              </button>
            </div>

            {isAddingNewDevice ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newDevice.brand}
                  onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Model Name (e.g. iPhone 15 Pro, S24) *"
                  required
                  value={newDevice.model}
                  onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />

                <input
                  type="text"
                  placeholder="IMEI (15 digits) *"
                  required
                  maxLength="15"
                  value={newDevice.imei}
                  onChange={(e) => setNewDevice({ ...newDevice, imei: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono"
                />

                <input
                  type="text"
                  placeholder="Serial Number (Optional)"
                  value={newDevice.serialNumber}
                  onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                  className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono"
                />

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Warranty Expiry Date</label>
                  <input
                    type="date"
                    value={newDevice.warrantyExpiry}
                    onChange={(e) => setNewDevice({ ...newDevice, warrantyExpiry: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  required
                  disabled={!selectedCustomerId && !isAddingNewCustomer}
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="">
                    {selectedCustomerId
                      ? '-- Select Customer Device --'
                      : '-- Select Customer in Step 1 First --'}
                  </option>
                  {availableDevicesForSelectedCustomer.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.brand} {d.model} (IMEI: {d.imei}) [{d.warrantyStatus}]
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 3: Issue Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              3. Issue Specifications
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reported Issue & Symptoms *:
              </label>
              <textarea
                rows="2"
                required
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. Broken front screen glass, flickering green stripes, battery dying fast..."
                className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="Screen / Display">Screen / Display</option>
                  <option value="Battery">Battery</option>
                  <option value="Charging Port">Charging Port</option>
                  <option value="Motherboard / IC">Motherboard / IC</option>
                  <option value="Camera">Camera</option>
                  <option value="Audio / Speaker">Audio / Speaker</option>
                  <option value="Water Damage">Water Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Estimate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowWizard(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Generate Service Request & Job Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
