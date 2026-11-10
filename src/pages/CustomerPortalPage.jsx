import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Receipt,
  Printer,
  ChevronRight,
  ExternalLink,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { jobCardsApi, invoicesApi } from '../api/services';
import WorkflowStepper from '../components/common/WorkflowStepper';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate } from '../utils/constants';

export default function CustomerPortalPage() {
  const [searchParams] = useSearchParams();
  const { currentUser, role } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [query, setQuery] = useState(searchParams.get('job') || 'JC-2026-001');
  const [activeJobCard, setActiveJobCard] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (targetQuery) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    try {
      setLoading(true);
      setSearched(true);
      const cards = (await jobCardsApi.getAll().catch(() => [])) || [];
      const match = cards.find(
        (c) =>
          c && (
            c.jobCardNumber?.toLowerCase() === q.toLowerCase() ||
            c.customerPhone === q ||
            c.imei === q
          )
      );

      if (match) {
        setActiveJobCard(match);
        const inv = await invoicesApi.getByJobCardNumber(match.jobCardNumber).catch(() => null);
        setInvoice(inv || null);
      } else {
        setActiveJobCard(null);
        setInvoice(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If logged in as customer, look up customer's job card
    if (role === 'customer' && currentUser?.customerId) {
      jobCardsApi.getAll().then((cards) => {
        const myJob = cards.find((c) => Number(c.customerId) === Number(currentUser.customerId));
        if (myJob) {
          setQuery(myJob.jobCardNumber);
          handleSearch(myJob.jobCardNumber);
        }
      });
    } else {
      handleSearch('JC-2026-001');
    }
  }, [role, currentUser]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl text-center sm:text-left">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-400/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Customer Tracking System
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Track Your Device Repair in Real-Time
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2">
            Enter your Job Card Number (e.g. <b>JC-2026-001</b>) or your registered 10-digit phone number to track diagnostics, technician progress and billing.
          </p>
        </div>

        {/* Search input inside banner */}
        <div className="mt-5 sm:mt-6 max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Job Card (JC-2026-001) or Phone..."
                className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white text-slate-900 placeholder-slate-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-md outline-none focus:ring-4 focus:ring-blue-400/40"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Track Device</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Querying service database for device status..." />
      ) : activeJobCard ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Tracking Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {activeJobCard.jobCardNumber}
                  </span>
                  <StatusBadge status={activeJobCard.status} size="md" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeJobCard.deviceModel}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  IMEI: {activeJobCard.imei} • Received on {formatDate(activeJobCard.createdAt)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Estimated Repair Total</span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(activeJobCard.totalCost)}
                </p>
                {activeJobCard.warrantyCovered && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Covered Under Warranty
                  </span>
                )}
              </div>
            </div>

            {/* Visual Workflow Stepper */}
            <div className="pt-6 pb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Repair Stepper
              </h3>
              <WorkflowStepper currentStatus={activeJobCard.status} />
            </div>

            {/* Current Stage Explanation */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 mt-4 flex items-start gap-3">
              <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  Current Stage: {activeJobCard.status}
                </h4>
                <p className="text-xs text-blue-800/80 dark:text-blue-300 mt-0.5">
                  {activeJobCard.diagnosisNotes
                    ? `Diagnosis: ${activeJobCard.diagnosisNotes}`
                    : 'Device is currently being evaluated by certified service engineers.'}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown & Bill Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parts & Services */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Device Service Scope</span>
              </h3>

              <div className="text-xs space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="font-bold text-slate-400 uppercase">Customer Issue:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeJobCard.issueDescription}
                  </p>
                </div>

                {activeJobCard.partsUsed && activeJobCard.partsUsed.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-400 uppercase">Parts Replaced:</span>
                    <ul className="mt-1 space-y-1">
                      {activeJobCard.partsUsed.map((p, idx) => (
                        <li key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name} (x{p.quantity})</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bill & Settlement */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Cost Summary & Receipt</span>
                </h3>

                <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Service & Labor:</span>
                    <span className="font-bold">{formatCurrency(activeJobCard.laborCost)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">OEM Spare Parts:</span>
                    <span className="font-bold">{formatCurrency(activeJobCard.partsCost)}</span>
                  </div>
                  {activeJobCard.discount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600 font-bold">
                      <span>Warranty Discount:</span>
                      <span>- {formatCurrency(activeJobCard.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">GST (18%):</span>
                    <span className="font-bold">
                      {formatCurrency(
                        Math.round(
                          (Math.max(0, (activeJobCard.laborCost || 0) + (activeJobCard.partsCost || 0) - (activeJobCard.discount || 0)) * 18) / 100
                        )
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 text-base font-extrabold text-blue-600">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(activeJobCard.totalCost)}</span>
                  </div>
                </div>
              </div>

              {invoice && invoice.paymentStatus === 'Paid' ? (
                <div className="mt-5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Invoice {invoice.invoiceNumber} Paid in Full via {invoice.paymentMethod || 'UPI'}.</span>
                </div>
              ) : (
                <div className="mt-5 pt-3 border-t">
                  <p className="text-xs text-slate-400 mb-2">Payment settled upon device collection.</p>
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Status Summary</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : searched ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border p-12 text-center text-slate-400">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No repair records found for "{query}"
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please double-check your Job Card Number (e.g. JC-2026-001) or 10-digit mobile number, or speak to counter staff.
          </p>
        </div>
      ) : null}
    </div>
  );
}
