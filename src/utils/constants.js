export const WORKFLOW_STAGES = [
  'Device Received',
  'Job Card Created',
  'Diagnosis',
  'Technician Assigned',
  'Repair in Progress',
  'Quality Check',
  'Ready for Pickup',
  'Delivered',
];

export const SPECIAL_STATUSES = ['Cancelled', 'Repair Failed'];

export const ALL_STATUSES = [...WORKFLOW_STAGES, ...SPECIAL_STATUSES];

export const STATUS_CONFIG = {
  'Device Received': {
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
    step: 1,
    description: 'Device logged into inventory at front desk',
  },
  'Job Card Created': {
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    step: 2,
    description: 'Job card generated with device and issue details',
  },
  'Diagnosis': {
    color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
    step: 3,
    description: 'Hardware and software diagnostic inspection',
  },
  'Technician Assigned': {
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    step: 4,
    description: 'Assigned to qualified repair technician',
  },
  'Repair in Progress': {
    color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-500',
    step: 5,
    description: 'Technician actively repairing and replacing parts',
  },
  'Quality Check': {
    color: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300',
    dot: 'bg-teal-500',
    step: 6,
    description: 'Post-repair benchmarking, power and sensor tests',
  },
  'Ready for Pickup': {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    step: 7,
    description: 'Repair verified, device ready and customer notified',
  },
  'Delivered': {
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-600',
    step: 8,
    description: 'Device handed over to customer and payment settled',
  },
  'Cancelled': {
    color: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-500',
    step: 0,
    description: 'Service request cancelled by customer or admin',
  },
  'Repair Failed': {
    color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300',
    dot: 'bg-rose-500',
    step: 0,
    description: 'Unrepairable damage (motherboard PCB crack, liquid burn)',
  },
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// Check if a warranty date is currently active
export const isWarrantyActive = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) >= new Date();
};

// Validation helpers
export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(String(phone).trim());
export const isValidIMEI = (imei) => /^\d{15}$/.test(String(imei).trim());
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
