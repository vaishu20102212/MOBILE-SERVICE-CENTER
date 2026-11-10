import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  IndianRupee,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Smartphone,
  Eye,
  Send,
  Calendar
} from 'lucide-react';
import { invoicesApi, paymentsApi } from '../api/services';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate } from '../utils/constants';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { currentUser, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Selected Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [customRef, setCustomRef] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invs, pays] = await Promise.all([
        invoicesApi.getAll(),
        paymentsApi.getAll(),
      ]);
      setInvoices(invs || []);
      setPayments(pays || []);
    } catch (err) {
      console.error(err);
      notifyError('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await invoicesApi.recordPayment(
        selectedInvoice,
        {
          paymentMethod,
          transactionRef: customRef || `${paymentMethod}-REF-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: selectedInvoice.totalAmount,
        },
        currentUser
      );

      notifySuccess(`Payment of ₹${selectedInvoice.totalAmount} collected via ${paymentMethod}!`);
      setShowPayModal(false);
      setSelectedInvoice(null);
      setCustomRef('');
      loadData();
    } catch (err) {
      notifyError('Payment recording failed: ' + err.message);
    }
  };

  const totalCollected = invoices
    .filter((i) => i.paymentStatus === 'Paid')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  const totalPending = invoices
    .filter((i) => i.paymentStatus === 'Pending')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  const filteredInvoices = invoices.filter((i) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.jobCardNumber?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q) ||
      i.deviceModel?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || i.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner text="Loading billing ledgers & invoices..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-blue-600" />
            Billing, Invoices & Payment Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track service charges, spare parts billing, GST tax breakdowns, and payment settlements.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue Settled
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalCollected)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {invoices.filter((i) => i.paymentStatus === 'Paid').length} Invoices Cleared
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Outstanding Dues
            </p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(totalPending)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {invoices.filter((i) => i.paymentStatus === 'Pending').length} Pending Payments
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Invoices Logged
            </p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {invoices.length} Bills
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative: {formatCurrency(totalCollected + totalPending)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Invoice # (e.g. INV-2026-001), Customer, Job Card #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Invoices</option>
          <option value="Paid">Settled (Paid)</option>
          <option value="Pending">Unpaid (Pending)</option>
        </select>
      </div>

      {/* Invoices View: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No invoices found matching current filters.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {inv.invoiceNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.paymentStatus === 'Paid' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>{inv.paymentStatus}</span>
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {inv.customerName}
                    </h4>
                    <p className="text-xs text-slate-500">{inv.deviceModel}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">Job: {inv.jobCardNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {formatCurrency(inv.totalAmount)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(inv.date)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs text-slate-400">
                    Labor: {formatCurrency(inv.laborCost)} • Parts: {formatCurrency(inv.partsCost)}
                  </span>
                  <div className="flex items-center gap-2">
                    {inv.paymentStatus === 'Pending' && hasPermission('process_billing') && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowPayModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Collect
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold hover:bg-slate-50"
                    >
                      Bill
                    </button>
                  </div>
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
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer & Device</th>
                <th className="px-6 py-3.5">Job Card Ref</th>
                <th className="px-6 py-3.5">Labor + Parts</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {inv.customerName}
                    </div>
                    <div className="text-xs text-slate-500">{inv.deviceModel}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {inv.jobCardNumber}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <span>Labor: {formatCurrency(inv.laborCost)}</span>
                    <span className="text-slate-300 mx-1.5">•</span>
                    <span>Parts: {formatCurrency(inv.partsCost)}</span>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.paymentStatus === 'Paid' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{inv.paymentStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.paymentStatus === 'Pending' && hasPermission('process_billing') && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowPayModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                        >
                          Collect Pay
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                        title="View / Print"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Settle / Collect Payment */}
      {selectedInvoice && showPayModal && (
        <Modal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          title={`Collect Payment for ${selectedInvoice.invoiceNumber}`}
          subtitle={`Amount due: ${formatCurrency(selectedInvoice.totalAmount)}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Select Payment Mode:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['UPI', 'Cash', 'Credit Card', 'Net Banking'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                      paymentMethod === method
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Transaction Reference / UPI ID (Optional):
              </label>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="e.g. UPI-TXN-8899231 or Cash Drawer Receipt #12"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
              Payment will update the invoice to "Paid" and record in the accounting transactions.
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: View Printable Invoice */}
      {selectedInvoice && !showPayModal && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice Sheet: ${selectedInvoice.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h2 className="text-xl font-extrabold text-blue-600">FixMaster Services</h2>
                <p className="text-xs text-slate-500">Official Customer Repair Bill</p>
              </div>
              <div className="text-right text-xs">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full font-bold uppercase ${
                    selectedInvoice.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedInvoice.paymentStatus}
                </span>
                <p className="text-slate-400 mt-1">Date: {formatDate(selectedInvoice.date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold">Client</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedInvoice.customerName}</p>
                <p className="text-slate-500">{selectedInvoice.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase font-bold">Device</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedInvoice.deviceModel}</p>
                <p className="text-slate-500 font-mono">Job: {selectedInvoice.jobCardNumber}</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-t border-b">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3">Labor & Diagnostics</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(selectedInvoice.laborCost)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Spare Parts</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(selectedInvoice.partsCost)}</td>
                </tr>
                {selectedInvoice.discount > 0 && (
                  <tr className="text-emerald-600 font-semibold">
                    <td className="py-2.5 px-3">Warranty Discount</td>
                    <td className="py-2.5 px-3 text-right">- {formatCurrency(selectedInvoice.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 px-3">Tax ({selectedInvoice.taxRate || 18}%)</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(selectedInvoice.taxAmount)}</td>
                </tr>
                <tr className="font-bold text-sm bg-slate-50">
                  <td className="py-3 px-3">Total Billed</td>
                  <td className="py-3 px-3 text-right text-blue-600">{formatCurrency(selectedInvoice.totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
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
