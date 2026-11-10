import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  User,
  Smartphone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Printer,
  Receipt,
  Boxes,
  UserCog,
  FileText,
  DollarSign,
  ChevronRight,
  Send
} from 'lucide-react';
import {
  jobCardsApi,
  techniciansApi,
  sparePartsApi,
  invoicesApi,
  devicesApi
} from '../api/services';
import StatusBadge from '../components/common/StatusBadge';
import WorkflowStepper from '../components/common/WorkflowStepper';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  WORKFLOW_STAGES,
  formatCurrency,
  formatDate,
  formatDateTime,
  isWarrantyActive
} from '../utils/constants';

export default function JobCardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, role, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  const [jobCard, setJobCard] = useState(null);
  const [device, setDevice] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ target: '', note: '' });
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');

  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [repairNotesInput, setRepairNotesInput] = useState('');
  const [laborCostInput, setLaborCostInput] = useState(0);

  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceRecord, setInvoiceRecord] = useState(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const jc = await jobCardsApi.getById(id);
      if (!jc) {
        setJobCard(null);
        setLoading(false);
        return;
      }
      setJobCard(jc);
      setDiagnosisInput(jc.diagnosisNotes || '');
      setRepairNotesInput(jc.repairNotes || '');
      setLaborCostInput(jc.laborCost || 0);

      const [techs, parts, existingInvoice] = await Promise.all([
        techniciansApi.getAll().catch(() => []),
        sparePartsApi.getAll().catch(() => []),
        jc.jobCardNumber ? invoicesApi.getByJobCardNumber(jc.jobCardNumber).catch(() => null) : null,
      ]);
      setTechnicians(techs || []);
      setSpareParts(parts || []);
      setInvoiceRecord(existingInvoice || null);

      if (jc.deviceId) {
        devicesApi.getById(jc.deviceId).then(setDevice).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      notifyError('Failed to load Job Card: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading Job Card specifications..." />;
  if (!jobCard) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-bold text-slate-700">Job Card not found</p>
        <Link to="/job-cards" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Return to Job Cards
        </Link>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.indexOf(jobCard.status);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < WORKFLOW_STAGES.length - 1
    ? WORKFLOW_STAGES[currentStageIndex + 1]
    : null;

  // Handler: Advance to next stage with validation
  const handleRequestAdvance = (target) => {
    const stageToAdvance = target || nextStage;
    if (!stageToAdvance) return;

    // Validation checks per stage transition
    if (stageToAdvance === 'Technician Assigned' && !jobCard.technicianId) {
      setShowAssignModal(true);
      return;
    }
    if (stageToAdvance === 'Repair in Progress' && !jobCard.technicianId) {
      notifyWarning('Please assign a technician before starting repair work.');
      setShowAssignModal(true);
      return;
    }
    if (stageToAdvance === 'Quality Check' && !jobCard.diagnosisNotes) {
      notifyWarning('Please record diagnosis and repair notes before submitting for Quality Check.');
      setShowDiagnosisModal(true);
      return;
    }

    setStatusAction({
      target: stageToAdvance,
      note: `Advanced to ${stageToAdvance} by ${currentUser.name}`,
    });
    setShowStatusModal(true);
  };

  // Confirm Status Transition
  const confirmStatusTransition = async () => {
    try {
      const updated = await jobCardsApi.transitionStatus(
        jobCard,
        statusAction.target,
        statusAction.note,
        currentUser
      );
      setJobCard(updated);
      setShowStatusModal(false);
      notifySuccess(`Status updated to "${statusAction.target}"!`);
      loadAll();
    } catch (err) {
      notifyError('Status update failed: ' + err.message);
    }
  };

  // Handler: Assign Technician
  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      notifyWarning('Please select a technician');
      return;
    }
    const tech = technicians.find((t) => String(t.id) === String(selectedTechId));
    if (!tech) return;

    try {
      const updated = await jobCardsApi.assignTechnician(jobCard, tech, currentUser);
      setJobCard(updated);
      setShowAssignModal(false);
      notifySuccess(`Technician ${tech.name} assigned successfully!`);
      loadAll();
    } catch (err) {
      notifyError('Failed to assign technician: ' + err.message);
    }
  };

  // Handler: Save Diagnosis & Labor
  const handleSaveDiagnosis = async (e) => {
    e.preventDefault();
    try {
      const partsCost = (jobCard.partsUsed || []).reduce((s, p) => s + p.total, 0);
      const laborCost = Number(laborCostInput) || 0;
      const discount = jobCard.discount || 0;
      const subtotal = Math.max(0, partsCost + laborCost - discount);
      const taxRate = jobCard.taxRate || 18;
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const totalCost = subtotal + taxAmount;

      const updated = await jobCardsApi.patch(jobCard.id, {
        diagnosisNotes: diagnosisInput,
        repairNotes: repairNotesInput,
        laborCost,
        totalCost,
      });

      setJobCard(updated);
      setShowDiagnosisModal(false);
      notifySuccess('Diagnosis and labor charges saved!');
    } catch (err) {
      notifyError('Error saving diagnosis: ' + err.message);
    }
  };

  // Handler: Consume Spare Part from Inventory
  const handleAddSparePart = async (e) => {
    e.preventDefault();
    if (!selectedPartId) {
      notifyWarning('Please choose a spare part');
      return;
    }
    const part = spareParts.find((p) => String(p.id) === String(selectedPartId));
    if (!part) return;

    if (part.stockQuantity < Number(partQuantity)) {
      notifyError(`Only ${part.stockQuantity} units available in stock!`);
      return;
    }

    try {
      const result = await jobCardsApi.useSparePart(
        jobCard,
        part,
        Number(partQuantity),
        currentUser
      );
      setJobCard(result.jobCard);
      setShowAddPartModal(false);
      setSelectedPartId('');
      setPartQuantity(1);
      notifySuccess(
        `Allocated ${partQuantity}x ${part.name}. Inventory automatically reduced.`
      );
      loadAll();
    } catch (err) {
      notifyError(err.message);
    }
  };

  // Handler: Generate / View Invoice
  const handleCreateOrViewInvoice = async () => {
    if (invoiceRecord) {
      setShowInvoiceModal(true);
      return;
    }

    // Auto-generate invoice
    try {
      const newInvoiceNumber = `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`;
      const laborCost = jobCard.laborCost || 0;
      const partsCost = jobCard.partsCost || 0;
      const subtotal = laborCost + partsCost - (jobCard.discount || 0);
      const taxRate = jobCard.taxRate || 18;
      const taxAmount = Math.round((subtotal * taxRate) / 100);
      const totalAmount = subtotal + taxAmount;

      const payload = {
        invoiceNumber: newInvoiceNumber,
        jobCardNumber: jobCard.jobCardNumber,
        customerId: jobCard.customerId,
        customerName: jobCard.customerName,
        customerPhone: jobCard.customerPhone,
        deviceModel: jobCard.deviceModel,
        imei: jobCard.imei,
        laborCost,
        partsCost,
        subtotal,
        discount: jobCard.discount || 0,
        taxRate,
        taxAmount,
        totalAmount,
        paymentStatus: 'Pending',
        paymentMethod: null,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Repair completed under job card ${jobCard.jobCardNumber}. Parts covered under FixMaster warranty.`,
      };

      const created = await invoicesApi.create(payload, currentUser);
      setInvoiceRecord(created);
      setShowInvoiceModal(true);
      notifySuccess(`Invoice ${newInvoiceNumber} generated!`);
    } catch (err) {
      notifyError('Failed to generate invoice: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/job-cards')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {jobCard.jobCardNumber}
              </h1>
              <StatusBadge status={jobCard.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged on {formatDate(jobCard.createdAt)} • Priority: {jobCard.priority}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleCreateOrViewInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold text-xs transition border border-purple-200 dark:border-purple-800"
          >
            <Receipt className="w-4 h-4" />
            <span>{invoiceRecord ? 'View Invoice' : 'Generate Bill'}</span>
          </button>

          {/* Next Stage Button */}
          {nextStage && !['Cancelled', 'Repair Failed', 'Delivered'].includes(jobCard.status) && (
            <button
              onClick={() => handleRequestAdvance(nextStage)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <span>Advance to: {nextStage}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Exception options */}
          {!['Cancelled', 'Repair Failed', 'Delivered'].includes(jobCard.status) && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleRequestAdvance('Repair Failed')}
                className="px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition"
                title="Mark repair as failed due to irreparable fault"
              >
                Mark Failed
              </button>
              <button
                onClick={() => handleRequestAdvance('Cancelled')}
                className="px-2.5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                title="Cancel Job Card"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 8-Step Visual Stepper */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Step-by-Step Repair Lifecycle
        </h3>
        <WorkflowStepper currentStatus={jobCard.status} />
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Device, Diagnosis, Spare Parts Used */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device & Customer Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Device & Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Customer
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {jobCard.customerName}
                </p>
                <p className="text-xs text-slate-500">Phone: {jobCard.customerPhone}</p>
                <p className="text-xs text-slate-500">
                  Customer ID: #{jobCard.customerId}
                </p>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Device
                  </span>
                  {jobCard.warrantyCovered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      Under Warranty
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <ShieldAlert className="w-3 h-3" />
                      Out of Warranty
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {jobCard.deviceModel}
                </p>
                <p className="text-xs font-mono text-slate-500">
                  IMEI: {jobCard.imei || 'N/A'}
                </p>
                {device && (
                  <p className="text-xs text-slate-400">
                    Warranty Valid: {formatDate(device.warrantyStart)} → {formatDate(device.warrantyExpiry)}
                  </p>
                )}
              </div>
            </div>

            {/* Reported Problem */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Customer Reported Issue:
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">
                {jobCard.issueDescription}
              </p>
            </div>
          </div>

          {/* Technician & Diagnosis Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                Technical Diagnosis & Labor
              </h3>
              <div className="flex items-center gap-2">
                {hasPermission('assign_technician') && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  >
                    {jobCard.technicianName ? 'Reassign Tech' : 'Assign Technician'}
                  </button>
                )}
                {hasPermission('update_diagnosis') && (
                  <button
                    onClick={() => setShowDiagnosisModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 transition"
                  >
                    Edit Diagnosis
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <UserCog className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">Assigned Technician</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {jobCard.technicianName || 'No technician assigned yet'}
                    </div>
                  </div>
                </div>
                {jobCard.technicianName && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    Assigned
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Diagnosis Notes:
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 min-h-[50px]">
                  {jobCard.diagnosisNotes || (
                    <span className="text-slate-400 italic">
                      No diagnosis logged yet. Click "Edit Diagnosis" to record findings.
                    </span>
                  )}
                </div>
              </div>

              {jobCard.repairNotes && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Repair Action Taken:
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                    {jobCard.repairNotes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Spare Parts Consumed Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  Spare Parts Used (Inventory Link)
                </h3>
                <p className="text-xs text-slate-500">
                  Parts allocated are automatically deducted from stock quantity.
                </p>
              </div>

              {hasPermission('use_spare_parts') && (
                <button
                  onClick={() => setShowAddPartModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Use Spare Part</span>
                </button>
              )}
            </div>

            {(!jobCard.partsUsed || jobCard.partsUsed.length === 0) ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No spare parts allocated for this repair yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase">
                    <tr>
                      <th className="px-3 py-2">Part Code</th>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {jobCard.partsUsed.map((p, idx) => (
                      <tr key={idx} className="font-medium">
                        <td className="px-3 py-2.5 font-mono text-slate-500">{p.partCode}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="px-3 py-2.5 text-center">{p.quantity}</td>
                        <td className="px-3 py-2.5 text-right">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Billing Summary & Audit Trail */}
        <div className="space-y-6">
          {/* Cost Estimation & Billing Summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Cost Breakdown & Billing
            </h3>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Labor / Service Charge:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(jobCard.laborCost || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Spare Parts Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(jobCard.partsCost || 0)}
                </span>
              </div>
              {jobCard.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                  <span>Warranty Discount:</span>
                  <span>- {formatCurrency(jobCard.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>GST Tax ({jobCard.taxRate || 18}%):</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(
                    Math.round(
                      (Math.max(0, (jobCard.laborCost || 0) + (jobCard.partsCost || 0) - (jobCard.discount || 0)) *
                        (jobCard.taxRate || 18)) /
                        100
                    )
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="text-base text-blue-600 dark:text-blue-400">
                  {formatCurrency(jobCard.totalCost)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCreateOrViewInvoice}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>{invoiceRecord ? 'Open Official Invoice' : 'Generate Customer Bill'}</span>
              </button>
            </div>
          </div>

          {/* Audit Trail / History Timeline */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Audit Log & History
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {jobCard.history?.map((entry, idx) => (
                <div key={idx} className="relative text-xs">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {entry.status}
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{entry.note}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>{entry.updatedBy}</span>
                    <span>•</span>
                    <span>{formatDateTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Advance Status Confirmation */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`Confirm Status Transition: ${statusAction.target}`}
        subtitle="This action will log an audit entry and progress the repair pipeline."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Transition Note / Action Performed:
            </label>
            <textarea
              rows="3"
              value={statusAction.note}
              onChange={(e) => setStatusAction({ ...statusAction, note: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Checked 30W charging test, all audio channels cleared."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmStatusTransition}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Confirm Update
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Assign Technician */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Repair Technician"
        subtitle="Select an available technician based on expertise and active workload."
      >
        <form onSubmit={handleAssignTechnician} className="space-y-4">
          <div className="space-y-2">
            {technicians.map((t) => (
              <label
                key={t.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  String(selectedTechId) === String(t.id)
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="technician"
                    value={t.id}
                    checked={String(selectedTechId) === String(t.id)}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500">{t.specialization}</div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      t.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'Busy'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {t.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t.activeJobs || 0} active jobs
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Assign & Update
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Edit Diagnosis & Labor Charges */}
      <Modal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        title="Record Technical Diagnosis & Labor Cost"
      >
        <form onSubmit={handleSaveDiagnosis} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Diagnosis Findings:
            </label>
            <textarea
              rows="3"
              required
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Display backlight IC blown, touch traces cracked..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Repair Action Taken:
            </label>
            <textarea
              rows="2"
              value={repairNotesInput}
              onChange={(e) => setRepairNotesInput(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Replaced display and applied seal tape."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Labor Service Charge (₹):
            </label>
            <input
              type="number"
              min="0"
              required
              value={laborCostInput}
              onChange={(e) => setLaborCostInput(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setShowDiagnosisModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Save Details
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Allocate Spare Part with Live Inventory Stock Deduct */}
      <Modal
        isOpen={showAddPartModal}
        onClose={() => setShowAddPartModal(false)}
        title="Requisition Spare Part"
        subtitle="Parts are verified against current warehouse stock and deducted automatically."
      >
        <form onSubmit={handleAddSparePart} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Select Spare Part from Catalog:
            </label>
            <select
              required
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Spare Part --</option>
              {spareParts.map((sp) => (
                <option
                  key={sp.id}
                  value={sp.id}
                  disabled={sp.stockQuantity <= 0}
                >
                  {sp.name} — {formatCurrency(sp.unitPrice)} ({sp.stockQuantity} in stock @ {sp.locationRack}) {sp.stockQuantity <= 0 ? '[OUT OF STOCK]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Quantity Required:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={partQuantity}
              onChange={(e) => setPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setShowAddPartModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Deduct Stock & Add to Job
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Professional Invoice Modal with Payment Action */}
      {invoiceRecord && (
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title={`Invoice: ${invoiceRecord.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-sm">
            {/* Printable Invoice Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-blue-600">FixMaster</h2>
                <p className="text-xs text-slate-500">
                  Mobile Service Center & Authorized Diagnostics
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  GSTIN: 29AAAAA0000A1Z5 • Support: 1800-FIX-MASTER
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    invoiceRecord.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Payment: {invoiceRecord.paymentStatus}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Date: {formatDate(invoiceRecord.date)}
                </p>
              </div>
            </div>

            {/* Customer & Job Card details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-slate-700 uppercase">Billed To:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {invoiceRecord.customerName}
                </p>
                <p className="text-slate-500">Phone: {invoiceRecord.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 uppercase">Service Summary:</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {invoiceRecord.deviceModel}
                </p>
                <p className="text-slate-500 font-mono">Job Card: {invoiceRecord.jobCardNumber}</p>
              </div>
            </div>

            {/* Breakdown table */}
            <table className="w-full text-xs text-left border-t border-b border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3">Labor & Diagnostics Service</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(invoiceRecord.laborCost)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Spare Parts Replaced</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(invoiceRecord.partsCost)}</td>
                </tr>
                {invoiceRecord.discount > 0 && (
                  <tr className="text-emerald-600">
                    <td className="py-2.5 px-3">Warranty Concession</td>
                    <td className="py-2.5 px-3 text-right">- {formatCurrency(invoiceRecord.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 px-3 font-medium">GST Tax ({invoiceRecord.taxRate}%)</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(invoiceRecord.taxAmount)}</td>
                </tr>
                <tr className="font-bold text-sm bg-slate-50 dark:bg-slate-800">
                  <td className="py-3 px-3">Total Payable</td>
                  <td className="py-3 px-3 text-right text-blue-600">
                    {formatCurrency(invoiceRecord.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment settlement button if pending */}
            {invoiceRecord.paymentStatus === 'Pending' ? (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Record Settlement</h4>
                  <p className="text-[11px] text-amber-700">
                    Simulate customer payment via UPI, Cash or Card
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await invoicesApi.recordPayment(
                        invoiceRecord,
                        { paymentMethod: 'UPI', amount: invoiceRecord.totalAmount },
                        currentUser
                      );
                      notifySuccess('Payment settled successfully via UPI!');
                      loadAll();
                    } catch (e) {
                      notifyError(e.message);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  Pay ₹{invoiceRecord.totalAmount} (UPI)
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Bill Paid in Full via {invoiceRecord.paymentMethod || 'UPI'}. Receipt generated.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
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
