import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  Wrench,
  Boxes,
  DollarSign,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search
} from 'lucide-react';
import {
  serviceRequestsApi,
  jobCardsApi,
  techniciansApi,
  sparePartsApi,
  invoicesApi,
  customersApi
} from '../api/services';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/constants';
import { useNotification } from '../context/NotificationContext';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const { notifySuccess } = useNotification();

  // Data
  const [requests, setRequests] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Customer search for history tab
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, jc, t, sp, inv, cust] = await Promise.all([
        serviceRequestsApi.getAll().catch(() => []),
        jobCardsApi.getAll().catch(() => []),
        techniciansApi.getAll().catch(() => []),
        sparePartsApi.getAll().catch(() => []),
        invoicesApi.getAll().catch(() => []),
        customersApi.getAll().catch(() => []),
      ]);
      setRequests(r || []);
      setJobCards(jc || []);
      setTechnicians(t || []);
      setSpareParts(sp || []);
      setInvoices(inv || []);
      setCustomers(cust || []);
      if (cust && cust.length > 0) setSelectedCustomerId(cust[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = String(cell).replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess(`Report exported to ${filename}.csv!`);
  };

  if (loading) return <LoadingSpinner text="Compiling analytical business reports..." />;

  const tabs = [
    { id: 'requests', label: 'Service Request Report', icon: Smartphone },
    { id: 'technicians', label: 'Technician Workload Report', icon: Wrench },
    { id: 'inventory', label: 'Spare Parts & Inventory Report', icon: Boxes },
    { id: 'revenue', label: 'Revenue & Payment Report', icon: DollarSign },
    { id: 'history', label: 'Customer Service History', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Exportable insights on repair workflows, technician workloads, inventory valuation, and sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 text-sm font-semibold pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Service Request Report */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Service Requests Summary</h3>
              <p className="text-xs text-slate-400">All intake logs and their current workflow states</p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Service_Requests_Report',
                  requests.map((r) => ({
                    RequestNumber: r.requestNumber,
                    IssueTitle: r.issueTitle,
                    Category: r.issueCategory,
                    Priority: r.priority,
                    Status: r.status,
                    JobCardNumber: r.jobCardNumber,
                    EstimatedCost: r.estimatedCost,
                    CreatedAt: r.createdAt,
                  }))
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Req #</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Issue Title</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Job Card</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{r.requestNumber}</td>
                    <td className="px-4 py-3">{r.issueCategory}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{r.issueTitle}</td>
                    <td className="px-4 py-3">{r.priority}</td>
                    <td className="px-4 py-3 font-mono">{r.jobCardNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} size="xs" /></td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(r.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Technician Workload Report */}
      {activeTab === 'technicians' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Technician Productivity & Workload</h3>
              <p className="text-xs text-slate-400">Active repair queues vs completed jobs</p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Technician_Workload_Report',
                  technicians.map((t) => {
                    const activeJobs = jobCards.filter(
                      (j) => Number(j.technicianId) === Number(t.id) && !['Delivered', 'Cancelled', 'Repair Failed'].includes(j.status)
                    ).length;
                    return {
                      TechnicianName: t.name,
                      Specialization: t.specialization,
                      Status: t.status,
                      ActiveRepairs: activeJobs,
                      CompletedRepairs: t.completedJobs,
                      Rating: t.rating,
                      Phone: t.phone,
                    };
                  })
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Active Repairs</th>
                  <th className="px-4 py-3">Completed Total</th>
                  <th className="px-4 py-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {technicians.map((t) => {
                  const activeJobs = jobCards.filter(
                    (j) => Number(j.technicianId) === Number(t.id) && !['Delivered', 'Cancelled', 'Repair Failed'].includes(j.status)
                  ).length;

                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{t.name}</td>
                      <td className="px-4 py-3">{t.specialization}</td>
                      <td className="px-4 py-3 font-semibold">{t.status}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{activeJobs} Jobs</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{t.completedJobs} Jobs</td>
                      <td className="px-4 py-3 font-bold text-amber-500">{t.rating} ★</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Spare Parts & Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Warehouse Valuation & Stock Report</h3>
              <p className="text-xs text-slate-400">Inventory levels, unit values and safety reorder alerts</p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Inventory_Valuation_Report',
                  spareParts.map((p) => ({
                    PartCode: p.partCode,
                    Name: p.name,
                    Category: p.category,
                    StockQty: p.stockQuantity,
                    MinThreshold: p.minThreshold,
                    UnitPrice: p.unitPrice,
                    TotalStockValue: p.stockQuantity * p.unitPrice,
                    LocationRack: p.locationRack,
                  }))
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Spare Part</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3 text-right">Total Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {spareParts.map((sp) => (
                  <tr key={sp.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{sp.partCode}</td>
                    <td className="px-4 py-3 font-semibold">{sp.name}</td>
                    <td className="px-4 py-3">{sp.category}</td>
                    <td className="px-4 py-3 font-bold">
                      {sp.stockQuantity} units {sp.stockQuantity <= sp.minThreshold && '(Low)'}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(sp.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(sp.stockQuantity * sp.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Revenue & Payment Report */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Revenue, Invoices & Collections</h3>
              <p className="text-xs text-slate-400">Total billings, tax collections and receivables</p>
            </div>
            <button
              onClick={() =>
                handleExportCSV(
                  'Revenue_Billing_Report',
                  invoices.map((inv) => ({
                    InvoiceNumber: inv.invoiceNumber,
                    CustomerName: inv.customerName,
                    DeviceModel: inv.deviceModel,
                    LaborCost: inv.laborCost,
                    PartsCost: inv.partsCost,
                    Discount: inv.discount,
                    TaxAmount: inv.taxAmount,
                    TotalAmount: inv.totalAmount,
                    PaymentStatus: inv.paymentStatus,
                    PaymentMethod: inv.paymentMethod || 'N/A',
                    Date: inv.date,
                  }))
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Labor</th>
                  <th className="px-4 py-3">Parts</th>
                  <th className="px-4 py-3">Tax</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold">{inv.customerName}</td>
                    <td className="px-4 py-3">{inv.deviceModel}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.laborCost)}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.partsCost)}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.taxAmount)}</td>
                    <td className="px-4 py-3 text-right font-extrabold">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Customer Service History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Customer Lifetime Service History</h3>
              <p className="text-xs text-slate-400">View past repairs, parts replaced and expenses per customer</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Select Customer:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="p-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer History details */}
          {(() => {
            const cust = customers.find((c) => String(c.id) === String(selectedCustomerId));
            const custJobs = jobCards.filter((jc) => String(jc.customerId) === String(selectedCustomerId));

            return (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-4">
                <div className="flex justify-between items-center pb-3 border-b text-xs">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{cust?.name}</h4>
                    <p className="text-slate-500">{cust?.phone} • {cust?.email} • {cust?.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Total Repairs Handled</p>
                    <p className="text-lg font-extrabold text-blue-600">{custJobs.length} Jobs</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {custJobs.map((cj) => (
                    <div key={cj.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">{cj.jobCardNumber}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{cj.deviceModel}</span>
                        </div>
                        <StatusBadge status={cj.status} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-400">Issue:</span> {cj.issueDescription}
                      </p>
                      {cj.partsUsed && cj.partsUsed.length > 0 && (
                        <p className="text-slate-500">
                          <span className="font-semibold text-slate-400">Replaced Parts:</span>{' '}
                          {cj.partsUsed.map((p) => `${p.name} (x${p.quantity})`).join(', ')}
                        </p>
                      )}
                      <div className="flex justify-between text-slate-400 pt-1 text-[11px]">
                        <span>Technician: {cj.technicianName || 'Unassigned'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Total Billed: {formatCurrency(cj.totalCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
