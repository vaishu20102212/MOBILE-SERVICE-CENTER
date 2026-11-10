import apiClient from './apiClient';

// Helper to log audit activity
export const logActivity = async (action, description, user = 'Current User', role = 'Admin') => {
  try {
    const payload = {
      action,
      description,
      timestamp: new Date().toISOString(),
      user: user || 'Staff',
      role: role || 'Admin',
    };
    const res = await apiClient.post('/activities', payload);
    return res.data;
  } catch (err) {
    console.warn('Could not log activity:', err);
  }
};

// Users
export const usersApi = {
  getAll: () => apiClient.get('/users').then((r) => r.data || []),
  getById: (id) => apiClient.get(`/users/${id}`).then((r) => r.data),
};

// Customers
export const customersApi = {
  getAll: (params) => apiClient.get('/customers', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/customers/${id}`).then((r) => r.data),
  create: async (data, user) => {
    const res = await apiClient.post('/customers', {
      ...data,
      registeredAt: new Date().toISOString(),
    });
    await logActivity('Customer Added', `Customer ${data.name} was registered`, user?.name, user?.role);
    return res.data;
  },
  update: async (id, data, user) => {
    const res = await apiClient.put(`/customers/${id}`, data);
    await logActivity('Customer Updated', `Customer ${data.name} details updated`, user?.name, user?.role);
    return res.data;
  },
  delete: async (id, name, user) => {
    const res = await apiClient.delete(`/customers/${id}`);
    await logActivity('Customer Deleted', `Customer ${name || id} removed`, user?.name, user?.role);
    return res.data;
  },
};

// Devices
export const devicesApi = {
  getAll: (params) => apiClient.get('/devices', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/devices/${id}`).then((r) => r.data),
  getByCustomerId: (customerId) => apiClient.get(`/devices?customerId=${customerId}`).then((r) => r.data || []),
  create: async (data, user) => {
    const res = await apiClient.post('/devices', {
      ...data,
      registeredAt: new Date().toISOString(),
    });
    await logActivity('Device Registered', `${data.brand} ${data.model} (IMEI: ${data.imei}) registered`, user?.name, user?.role);
    return res.data;
  },
  update: async (id, data, user) => {
    const res = await apiClient.put(`/devices/${id}`, data);
    await logActivity('Device Updated', `${data.brand} ${data.model} updated`, user?.name, user?.role);
    return res.data;
  },
  delete: async (id, user) => {
    const res = await apiClient.delete(`/devices/${id}`);
    await logActivity('Device Deleted', `Device #${id} removed`, user?.name, user?.role);
    return res.data;
  },
};

// Technicians
export const techniciansApi = {
  getAll: (params) => apiClient.get('/technicians', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/technicians/${id}`).then((r) => r.data),
  create: async (data, user) => {
    const res = await apiClient.post('/technicians', {
      ...data,
      activeJobs: 0,
      completedJobs: 0,
      rating: 5.0,
      avatar: data.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    });
    await logActivity('Technician Added', `Technician ${data.name} added to roster`, user?.name, user?.role);
    return res.data;
  },
  update: async (id, data, user) => {
    const res = await apiClient.put(`/technicians/${id}`, data);
    await logActivity('Technician Updated', `Technician ${data.name} details updated`, user?.name, user?.role);
    return res.data;
  },
  updateStatus: async (id, status, user) => {
    const tech = await apiClient.get(`/technicians/${id}`).then((r) => r.data).catch(() => ({ name: 'Technician' }));
    const res = await apiClient.patch(`/technicians/${id}`, { status });
    await logActivity('Technician Status Changed', `${tech.name} status changed to ${status}`, user?.name, user?.role);
    return res.data;
  },
  delete: (id) => apiClient.delete(`/technicians/${id}`).then((r) => r.data),
};

// Service Requests
export const serviceRequestsApi = {
  getAll: (params) => apiClient.get('/serviceRequests', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/serviceRequests/${id}`).then((r) => r.data),
  create: async (data, user) => {
    const res = await apiClient.post('/serviceRequests', {
      ...data,
      createdAt: new Date().toISOString(),
    });
    await logActivity('Service Request Created', `Request ${data.requestNumber} logged for ${data.issueTitle}`, user?.name, user?.role);
    return res.data;
  },
  update: (id, data) => apiClient.patch(`/serviceRequests/${id}`, data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/serviceRequests/${id}`).then((r) => r.data),
};

// Job Cards
export const jobCardsApi = {
  getAll: (params) => apiClient.get('/jobCards', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/jobCards/${id}`).then((r) => r.data),
  getByNumber: async (number) => {
    const res = await apiClient.get(`/jobCards?jobCardNumber=${number}`).then((r) => r.data);
    return Array.isArray(res) ? res[0] : res;
  },
  create: async (data, user) => {
    const res = await apiClient.post('/jobCards', {
      ...data,
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'Device Received',
          timestamp: new Date().toISOString(),
          updatedBy: `${user?.name || 'Receptionist'} (${user?.role || 'Staff'})`,
          note: 'Device checked in at counter',
        },
        {
          status: 'Job Card Created',
          timestamp: new Date().toISOString(),
          updatedBy: `${user?.name || 'Receptionist'} (${user?.role || 'Staff'})`,
          note: `Job card ${data.jobCardNumber} created`,
        },
      ],
    });
    await logActivity('Job Card Created', `Job Card ${data.jobCardNumber} created for ${data.customerName}`, user?.name, user?.role);
    return res.data;
  },
  update: (id, data) => apiClient.put(`/jobCards/${id}`, data).then((r) => r.data),
  patch: (id, data) => apiClient.patch(`/jobCards/${id}`, data).then((r) => r.data),
  
  // Transition Workflow Status
  transitionStatus: async (jobCard, nextStatus, note, user) => {
    const updatedHistory = [
      ...(jobCard.history || []),
      {
        status: nextStatus,
        timestamp: new Date().toISOString(),
        updatedBy: `${user?.name || 'Staff'} (${user?.role || 'Staff'})`,
        note: note || `Status updated to ${nextStatus}`,
      },
    ];

    const updates = {
      status: nextStatus,
      history: updatedHistory,
    };

    if (nextStatus === 'Delivered') {
      updates.actualCompletion = new Date().toISOString();
    }

    const res = await apiClient.patch(`/jobCards/${jobCard.id}`, updates);

    // Sync corresponding service request status
    if (jobCard.serviceRequestId) {
      try {
        await apiClient.patch(`/serviceRequests/${jobCard.serviceRequestId}`, { status: nextStatus });
      } catch (err) {
        console.warn('Could not sync serviceRequest status', err);
      }
    }

    await logActivity(
      'Status Changed',
      `Job Card ${jobCard.jobCardNumber} moved to "${nextStatus}" by ${user?.name}`,
      user?.name,
      user?.role
    );
    return res.data;
  },

  // Assign Technician
  assignTechnician: async (jobCard, technician, user) => {
    const updatedHistory = [
      ...(jobCard.history || []),
      {
        status: 'Technician Assigned',
        timestamp: new Date().toISOString(),
        updatedBy: `${user?.name || 'Admin'} (${user?.role || 'Admin'})`,
        note: `Assigned to ${technician.name} (${technician.specialization})`,
      },
    ];

    const res = await apiClient.patch(`/jobCards/${jobCard.id}`, {
      technicianId: technician.id,
      technicianName: technician.name,
      status: jobCard.status === 'Job Card Created' || jobCard.status === 'Diagnosis' ? 'Technician Assigned' : jobCard.status,
      history: updatedHistory,
    });

    // Update technician active jobs count
    try {
      const currentTech = await apiClient.get(`/technicians/${technician.id}`).then((r) => r.data);
      if (currentTech) {
        await apiClient.patch(`/technicians/${technician.id}`, {
          activeJobs: (currentTech.activeJobs || 0) + 1,
          status: (currentTech.activeJobs || 0) + 1 >= 3 ? 'Busy' : currentTech.status,
        });
      }
    } catch (e) {
      console.warn('Technician count update failed', e);
    }

    await logActivity('Technician Assigned', `${technician.name} assigned to ${jobCard.jobCardNumber}`, user?.name, user?.role);
    return res.data;
  },

  // Add Spare Part Used
  useSparePart: async (jobCard, part, quantity, user) => {
    if (part.stockQuantity < quantity) {
      throw new Error(`Insufficient stock for ${part.name}. Available: ${part.stockQuantity}`);
    }

    // 1. Decrement part stock in spareParts
    const newStock = part.stockQuantity - quantity;
    await apiClient.patch(`/spareParts/${part.id}`, {
      stockQuantity: newStock,
    });

    // 2. Record inventory transaction
    await apiClient.post('/inventoryTransactions', {
      partId: part.id,
      partName: part.name,
      type: 'OUT',
      quantity,
      reason: `Used in Job Card ${jobCard.jobCardNumber}`,
      referenceJobCard: jobCard.jobCardNumber,
      date: new Date().toISOString(),
      performedBy: `${user?.name || 'Technician'} (${user?.role || 'Staff'})`,
    });

    // 3. Update Job Card's partsUsed and total cost
    const currentParts = Array.isArray(jobCard.partsUsed) ? jobCard.partsUsed : [];
    const existingIndex = currentParts.findIndex((p) => p.partId === part.id);
    let updatedParts = [];

    if (existingIndex >= 0) {
      updatedParts = currentParts.map((p, idx) =>
        idx === existingIndex
          ? {
              ...p,
              quantity: p.quantity + quantity,
              total: (p.quantity + quantity) * p.unitPrice,
            }
          : p
      );
    } else {
      updatedParts = [
        ...currentParts,
        {
          partId: part.id,
          partCode: part.partCode,
          name: part.name,
          quantity,
          unitPrice: part.unitPrice,
          total: quantity * part.unitPrice,
        },
      ];
    }

    const partsCost = updatedParts.reduce((sum, p) => sum + p.total, 0);
    const laborCost = jobCard.laborCost || 0;
    const discount = jobCard.discount || 0;
    const subtotal = Math.max(0, partsCost + laborCost - discount);
    const taxRate = jobCard.taxRate || 18;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalCost = subtotal + taxAmount;

    const res = await apiClient.patch(`/jobCards/${jobCard.id}`, {
      partsUsed: updatedParts,
      partsCost,
      totalCost,
    });

    await logActivity(
      'Part Used',
      `${quantity}x ${part.name} consumed for ${jobCard.jobCardNumber}. Remaining stock: ${newStock}`,
      user?.name,
      user?.role
    );

    return { jobCard: res.data, remainingStock: newStock };
  },
};

// Spare Parts & Inventory
export const sparePartsApi = {
  getAll: (params) => apiClient.get('/spareParts', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/spareParts/${id}`).then((r) => r.data),
  create: async (data, user) => {
    const res = await apiClient.post('/spareParts', {
      ...data,
      stockQuantity: Number(data.stockQuantity),
      minThreshold: Number(data.minThreshold || 5),
      unitPrice: Number(data.unitPrice),
      costPrice: Number(data.costPrice || data.unitPrice * 0.7),
      lastRestocked: new Date().toISOString().split('T')[0],
    });
    await apiClient.post('/inventoryTransactions', {
      partId: res.data.id,
      partName: res.data.name,
      type: 'IN',
      quantity: Number(data.stockQuantity),
      reason: 'Initial stock intake',
      referenceJobCard: null,
      date: new Date().toISOString(),
      performedBy: `${user?.name || 'Staff'}`,
    });
    await logActivity('Spare Part Added', `Added ${data.name} (Qty: ${data.stockQuantity})`, user?.name, user?.role);
    return res.data;
  },
  update: async (id, data, user) => {
    const res = await apiClient.put(`/spareParts/${id}`, data);
    await logActivity('Spare Part Updated', `Updated details for ${data.name}`, user?.name, user?.role);
    return res.data;
  },
  restock: async (partId, quantity, reason, user) => {
    const part = await apiClient.get(`/spareParts/${partId}`).then((r) => r.data).catch(() => ({ name: 'Spare Part', stockQuantity: 0 }));
    const newStock = (Number(part.stockQuantity) || 0) + Number(quantity);
    const res = await apiClient.patch(`/spareParts/${partId}`, {
      stockQuantity: newStock,
      lastRestocked: new Date().toISOString().split('T')[0],
    });

    await apiClient.post('/inventoryTransactions', {
      partId,
      partName: part.name,
      type: 'IN',
      quantity: Number(quantity),
      reason: reason || 'Restocked by inventory manager',
      referenceJobCard: null,
      date: new Date().toISOString(),
      performedBy: `${user?.name || 'Inventory Manager'}`,
    });

    await logActivity('Stock Replenished', `Restocked ${quantity} units of ${part.name}. New total: ${newStock}`, user?.name, user?.role);
    return res.data;
  },
  delete: (id) => apiClient.delete(`/spareParts/${id}`).then((r) => r.data),
};

// Inventory Transactions
export const inventoryTransactionsApi = {
  getAll: (params) => apiClient.get('/inventoryTransactions?_sort=date&_order=desc', { params }).then((r) => r.data || []),
};

// Invoices & Billing
export const invoicesApi = {
  getAll: (params) => apiClient.get('/invoices?_sort=date&_order=desc', { params }).then((r) => r.data || []),
  getById: (id) => apiClient.get(`/invoices/${id}`).then((r) => r.data),
  getByJobCardNumber: async (num) => {
    const res = await apiClient.get(`/invoices?jobCardNumber=${num}`).then((r) => r.data);
    return Array.isArray(res) ? res[0] : res;
  },
  create: async (data, user) => {
    const res = await apiClient.post('/invoices', {
      ...data,
      date: new Date().toISOString(),
    });
    await logActivity('Invoice Created', `Invoice ${data.invoiceNumber} created for amount ₹${data.totalAmount}`, user?.name, user?.role);
    return res.data;
  },
  recordPayment: async (invoice, paymentDetails, user) => {
    const payment = await apiClient.post('/payments', {
      paymentId: `PAY-${Date.now().toString().slice(-6)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amount: paymentDetails.amount || invoice.totalAmount,
      paymentMethod: paymentDetails.paymentMethod,
      transactionRef: paymentDetails.transactionRef || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'Completed',
      paymentDate: new Date().toISOString(),
      receivedBy: `${user?.name || 'Receptionist'} (${user?.role || 'Staff'})`,
    });

    const updatedInvoice = await apiClient.patch(`/invoices/${invoice.id}`, {
      paymentStatus: 'Paid',
      paymentMethod: paymentDetails.paymentMethod,
    });

    await logActivity(
      'Payment Recorded',
      `Payment of ₹${paymentDetails.amount || invoice.totalAmount} received for ${invoice.invoiceNumber} via ${paymentDetails.paymentMethod}`,
      user?.name,
      user?.role
    );

    return { payment: payment.data, invoice: updatedInvoice.data };
  },
};

// Payments
export const paymentsApi = {
  getAll: (params) => apiClient.get('/payments?_sort=paymentDate&_order=desc', { params }).then((r) => r.data || []),
};

// Activities
export const activitiesApi = {
  getAll: (params) => apiClient.get('/activities?_sort=timestamp&_order=desc&_limit=20', { params }).then((r) => r.data || []),
};

// Dashboard Consolidated Stats API
export const getDashboardStats = async () => {
  try {
    const [requests, jobCards, technicians, spareParts, invoices] = await Promise.all([
      serviceRequestsApi.getAll().catch(() => []),
      jobCardsApi.getAll().catch(() => []),
      techniciansApi.getAll().catch(() => []),
      sparePartsApi.getAll().catch(() => []),
      invoicesApi.getAll().catch(() => []),
    ]);

    const reqList = Array.isArray(requests) ? requests : [];
    const jcList = Array.isArray(jobCards) ? jobCards : [];
    const techList = Array.isArray(technicians) ? technicians : [];
    const partsList = Array.isArray(spareParts) ? spareParts : [];
    const invList = Array.isArray(invoices) ? invoices : [];

    const totalRequests = reqList.length;
    const pendingRepairs = jcList.filter((jc) =>
      ['Device Received', 'Job Card Created', 'Diagnosis', 'Technician Assigned'].includes(jc.status)
    ).length;
    const inProgressRepairs = jcList.filter((jc) =>
      ['Repair in Progress', 'Quality Check'].includes(jc.status)
    ).length;
    const completedRepairs = jcList.filter((jc) =>
      ['Ready for Pickup', 'Delivered'].includes(jc.status)
    ).length;
    const cancelledRepairs = jcList.filter((jc) =>
      ['Cancelled', 'Repair Failed'].includes(jc.status)
    ).length;

    const availableTechs = techList.filter((t) => t.status === 'Available').length;
    const lowStockParts = partsList.filter((p) => (Number(p.stockQuantity) || 0) <= (Number(p.minThreshold) || 5));
    
    const totalRevenue = invList
      .filter((inv) => inv.paymentStatus === 'Paid')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    const pendingRevenue = invList
      .filter((inv) => inv.paymentStatus === 'Pending')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    return {
      totalRequests,
      pendingRepairs,
      inProgressRepairs,
      completedRepairs,
      cancelledRepairs,
      availableTechs,
      totalTechs: techList.length,
      lowStockCount: lowStockParts.length,
      lowStockParts,
      totalRevenue,
      pendingRevenue,
      recentJobCards: jcList.slice(-5).reverse(),
    };
  } catch (err) {
    console.warn('Dashboard stats fallback:', err);
    return {
      totalRequests: 0,
      pendingRepairs: 0,
      inProgressRepairs: 0,
      completedRepairs: 0,
      cancelledRepairs: 0,
      availableTechs: 0,
      totalTechs: 0,
      lowStockCount: 0,
      lowStockParts: [],
      totalRevenue: 0,
      pendingRevenue: 0,
      recentJobCards: [],
    };
  }
};
