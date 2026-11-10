import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Search,
  PlusCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Package,
  Layers,
  MapPin,
  TrendingDown,
  Clock
} from 'lucide-react';
import { sparePartsApi, inventoryTransactionsApi } from '../api/services';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/constants';

export default function InventoryPage() {
  const [spareParts, setSpareParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { currentUser, hasPermission } = useAuth();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  // Active view: catalog or transactions
  const [activeTab, setActiveTab] = useState('catalog');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLowOnly, setShowLowOnly] = useState(searchParams.get('filter') === 'low');

  // Modals
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(10);
  const [restockReason, setRestockReason] = useState('Bulk supplier restocking');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    partCode: '',
    category: 'Display',
    compatibleBrands: 'Apple',
    compatibleModels: 'iPhone 15 Pro',
    stockQuantity: 10,
    minThreshold: 5,
    unitPrice: 2500,
    costPrice: 1600,
    locationRack: 'Rack A-01',
    warrantyMonths: 6,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [parts, txs] = await Promise.all([
        sparePartsApi.getAll(),
        inventoryTransactionsApi.getAll(),
      ]);
      setSpareParts(parts || []);
      setTransactions(txs || []);
    } catch (err) {
      console.error(err);
      notifyError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.partCode.trim()) {
      notifyWarning('Part name and part code are required');
      return;
    }

    try {
      await sparePartsApi.create(
        {
          ...formData,
          compatibleBrands: formData.compatibleBrands.split(',').map((s) => s.trim()),
          compatibleModels: formData.compatibleModels.split(',').map((s) => s.trim()),
        },
        currentUser
      );
      notifySuccess(`Spare part ${formData.name} added to catalog!`);
      setShowAddPartModal(false);
      loadData();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockTarget || Number(restockQuantity) <= 0) return;

    try {
      await sparePartsApi.restock(
        restockTarget.id,
        Number(restockQuantity),
        restockReason,
        currentUser
      );
      notifySuccess(`Restocked ${restockQuantity} units of ${restockTarget.name}!`);
      setShowRestockModal(false);
      setRestockTarget(null);
      loadData();
    } catch (err) {
      notifyError('Restock failed: ' + err.message);
    }
  };

  const lowStockItems = spareParts.filter((p) => p.stockQuantity <= (p.minThreshold || 5));

  const filteredParts = spareParts.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(q) ||
      p.partCode?.toLowerCase().includes(q) ||
      p.locationRack?.toLowerCase().includes(q);

    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchLow = !showLowOnly || p.stockQuantity <= (p.minThreshold || 5);

    return matchSearch && matchCategory && matchLow;
  });

  if (loading) return <LoadingSpinner text="Loading inventory & warehouse parts..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-blue-600" />
            Spare Parts & Inventory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time stock tracking, automatic repair deduction, and supplier restocking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasPermission('manage_inventory') && (
            <button
              onClick={() => setShowAddPartModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Spare Part</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Low-Stock Threshold Alert ({lowStockItems.length} items critical)
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                The following parts are running below safety stock: {lowStockItems.map((p) => `${p.name} (${p.stockQuantity})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap transition"
          >
            {showLowOnly ? 'Show All Parts' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parts Catalog ({spareParts.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'transactions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory Audit Log ({transactions.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Part Name, Code (e.g. DISP-...), Rack Location..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Display">Display</option>
              <option value="Battery">Battery</option>
              <option value="Charging Port">Charging Port</option>
              <option value="Camera">Camera</option>
              <option value="IC & Motherboard">IC & Motherboard</option>
              <option value="Audio & Speaker">Audio & Speaker</option>
              <option value="Accessories & Consumables">Accessories & Consumables</option>
            </select>
          </div>

          {/* Catalog: Mobile Cards (< md) & Desktop Table (>= md) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredParts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No spare parts found matching current filters.
                </div>
              ) : (
                filteredParts.map((part) => {
                  const isLow = part.stockQuantity <= (part.minThreshold || 5);

                  return (
                    <div key={part.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {part.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                              {part.partCode}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {part.category}
                            </span>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(part.unitPrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Stock:</span>
                          <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {part.stockQuantity} units
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Low
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{part.locationRack || 'A-01'}</span>
                        </div>
                      </div>

                      {hasPermission('manage_inventory') && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => {
                              setRestockTarget(part);
                              setShowRestockModal(true);
                            }}
                            className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Restock Item</span>
                          </button>
                        </div>
                      )}
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
                    <th className="px-6 py-3.5">Part Code & Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Stock Level</th>
                    <th className="px-6 py-3.5">Unit Price</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredParts.map((part) => {
                    const isLow = part.stockQuantity <= (part.minThreshold || 5);

                    return (
                      <tr key={part.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {part.name}
                          </div>
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                            {part.partCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-sm ${
                                isLow
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {part.stockQuantity} units
                            </span>
                            {isLow && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Low Stock (≤{part.minThreshold})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(part.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{part.locationRack || 'A-01'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => {
                                setRestockTarget(part);
                                setShowRestockModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition"
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>Restock</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Audit Log Tab */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Part Name</th>
                <th className="px-6 py-3.5">Quantity</th>
                <th className="px-6 py-3.5">Reason / Reference</th>
                <th className="px-6 py-3.5">Performed By</th>
                <th className="px-6 py-3.5">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        tx.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.type === 'IN' ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                      <span>{tx.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {tx.partName}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{tx.reason}</p>
                    {tx.referenceJobCard && (
                      <p className="font-mono text-blue-600">{tx.referenceJobCard}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {tx.performedBy || 'Staff'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatDateTime(tx.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Add Spare Part */}
      <Modal
        isOpen={showAddPartModal}
        onClose={() => setShowAddPartModal(false)}
        title="Add New Spare Part Item"
      >
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Part Name *:
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              placeholder="e.g. iPhone 15 Pro OLED Display Assembly"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Part Code (SKU) *:
              </label>
              <input
                type="text"
                required
                value={formData.partCode}
                onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono"
                placeholder="DISP-IP15P-01"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Category:
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              >
                <option value="Display">Display</option>
                <option value="Battery">Battery</option>
                <option value="Charging Port">Charging Port</option>
                <option value="Camera">Camera</option>
                <option value="IC & Motherboard">IC & Motherboard</option>
                <option value="Audio & Speaker">Audio & Speaker</option>
                <option value="Accessories & Consumables">Accessories & Consumables</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Initial Stock Qty:
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Low Stock Alert Threshold:
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Selling Price (₹) *:
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Warehouse Location Rack:
              </label>
              <input
                type="text"
                value={formData.locationRack}
                onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                placeholder="Rack B-04"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Save Spare Part
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Restock Item */}
      {restockTarget && (
        <Modal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          title={`Restock: ${restockTarget.name}`}
          subtitle={`Current Available Stock: ${restockTarget.stockQuantity} units`}
        >
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Units to Inward *:
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Restock Reason / Supplier Invoice Ref:
              </label>
              <input
                type="text"
                required
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                placeholder="e.g. PO-2026-992 from Authorized Distributor"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
