# FixMaster - Mobile Service Center Management System
**TASK 6 Submission - Live Production Ready**

🌐 **Live Application URL:** [https://mobile-service-center-3.onrender.com](https://mobile-service-center-3.onrender.com)  
📡 **Live REST API Endpoint:** [https://mobile-service-center-3.onrender.com/api](https://mobile-service-center-3.onrender.com/api)  
📁 **GitHub Repository:** [https://github.com/vaishu20102212/MOBILE-SERVICE-CENTER](https://github.com/vaishu20102212/MOBILE-SERVICE-CENTER)

FixMaster is an enterprise-grade Single Page Application (SPA) designed for mobile device service centers to manage customer records, smartphone devices, repair workflows, technician workloads, spare parts inventory, billing/invoicing, and executive business reports.

---

## 🚀 Quick Start Guide

### One-Click Launch (JSON Server + Vite App):
```bash
npm start
```
> This automatically runs JSON Server on port 5000 and the Vite development server on port 5173 simultaneously using `concurrently`.

### Or Run in Separate Terminals:
1. **Start Backend (JSON Server on port 5000):**
   ```bash
   npm run server
   ```
2. **Start Frontend (Vite on port 5173):**
   ```bash
   npm run dev
   ```

Open your browser at **`http://localhost:5173`**.

---

## 🛠 Technology Stack
- **Frontend Framework:** React 18
- **Language:** Modern JavaScript (ES Modules)
- **Bundler / Dev Server:** Vite 5
- **Styling:** Tailwind CSS with custom responsive utilities & print media styles
- **Icons:** Lucide React
- **Routing:** React Router v6
- **HTTP Client:** Axios with centralized interceptors, error handling, and proxy support
- **Backend / Mock Database:** JSON Server (RESTful API with 11 relational resources)

---

## 👥 User Roles & Evaluation Mode

A built-in **1-Click Role Switcher** is present in the top navigation bar to test all user personas without needing separate logins:

1. **👑 Admin (Priya Sharma):**
   - Full permissions: Users, Customers, Devices, Technicians, Inventory, Repairs, Billing, and Reports.
2. **📋 Receptionist (Rajesh Kumar):**
   - Front-desk operations: Register customers & devices, log service intake, generate Job Cards, and collect payments.
3. **🔧 Technician (David Chen / Karthik Raman):**
   - Technical workshop: View assigned repair jobs, record hardware diagnostics, requisition spare parts (with automatic stock deduction), and update repair workflow status.
4. **👤 Customer (Ananya Iyer):**
   - Self-service tracking: Live step-by-step progress tracker, warranty review, and digital invoice receipt.

---

## 🔄 Repair Workflow (Strict Step-by-Step State Machine)

Every device follows an 8-stage validated workflow pipeline:
```
Device Received ➔ Job Card Created ➔ Diagnosis ➔ Technician Assigned ➔ Repair in Progress ➔ Quality Check ➔ Ready for Pickup ➔ Delivered
```
- **Special Exit Statuses:** `Cancelled` and `Repair Failed` (with reasons recorded).
- **Interactive Stepper:** Visual progress bar with animated active stages.
- **Workflow Guards:**
  - Cannot advance to *Repair in Progress* without assigning a technician.
  - Cannot advance to *Quality Check* without recording diagnostic notes and parts replaced.
  - Automatically updates technician workload and availability status.
  - Every transition is logged in the permanent audit trail with timestamp and staff signature.

---

## 📦 Spare Parts & Inventory Management
- **Live Catalog:** Part SKU codes, brand compatibility (Apple, Samsung, Google, OnePlus, Xiaomi), rack locations, unit prices, and stock counts.
- **Automatic Stock Deduction:** When a technician adds a spare part to a Job Card, stock is instantly decremented in `db.json` and logged in `inventoryTransactions`.
- **Low Stock Alerts:** Automatic banner warnings for parts whose stock drops below minimum safety threshold (≤ 5 units).
- **Stock Replenishment:** Restock modal to log batch receipts from suppliers with PO reference numbers.

---

## 💳 Cost Estimation & Billing
- **Automated Calculation:** Service Labor Charges + Spare Parts Subtotal - Warranty Discounts + GST (18%) = Total Billed.
- **Invoice Generation:** Clean, professional invoice view with printable layout.
- **Payment Settlement:** Track payment status (`Pending` vs `Paid`) across payment modes (`UPI`, `Cash`, `Credit Card`, `Net Banking`).

---

## 📊 Reports & CSV Export
Comprehensive analytical reports with one-click **Export to CSV** and **Print**:
1. **Service Request Report:** All incoming requests, category distribution, and time-to-repair.
2. **Technician Workload Report:** Active queues, completed repairs count, and customer satisfaction ratings.
3. **Spare Parts & Inventory Valuation Report:** Total asset valuation, unit values, and reorder alerts.
4. **Revenue & Payment Report:** Collected revenue vs pending receivables.
5. **Customer Service History:** Searchable per-customer device and repair timeline.

---

## 🗄️ JSON Server Resources (`db.json`)
The application operates on 11 RESTful resources:
- `users`: Staff credentials and personas
- `customers`: Customer directory
- `devices`: Registered smartphones with IMEI and warranty validity
- `technicians`: Technician roster, workload counters, and specializations
- `serviceRequests`: Intake service requests
- `jobCards`: Full repair job cards with status history and parts used
- `spareParts`: Inventory catalog with stock quantities and shelf locations
- `inventoryTransactions`: Audit trail of all stock IN/OUT events
- `invoices`: Official billing invoices
- `payments`: Payment receipts and transaction identifiers
- `activities`: Real-time system activity stream
