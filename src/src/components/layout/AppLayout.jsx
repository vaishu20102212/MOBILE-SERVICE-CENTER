import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { sparePartsApi } from '../../api/services';

export default function AppLayout() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    sparePartsApi.getAll().then((parts) => {
      if (parts) {
        const low = parts.filter((p) => p.stockQuantity <= (p.minThreshold || 5));
        setLowStockCount(low.length);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar
        lowStockCount={lowStockCount}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Left Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area - with pb-20 on mobile to not be obscured by BottomNav */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
