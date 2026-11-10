import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notifySuccess = useCallback((msg) => addNotification(msg, 'success'), [addNotification]);
  const notifyError = useCallback((msg) => addNotification(msg, 'error', 5000), [addNotification]);
  const notifyWarning = useCallback((msg) => addNotification(msg, 'warning', 5000), [addNotification]);
  const notifyInfo = useCallback((msg) => addNotification(msg, 'info'), [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        addNotification,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => {
          const config = {
            success: {
              bg: 'bg-emerald-600 dark:bg-emerald-700 text-white',
              icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
            },
            error: {
              bg: 'bg-rose-600 dark:bg-rose-700 text-white',
              icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
            },
            warning: {
              bg: 'bg-amber-500 dark:bg-amber-600 text-white',
              icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
            },
            info: {
              bg: 'bg-blue-600 dark:bg-blue-700 text-white',
              icon: <Info className="w-5 h-5 flex-shrink-0" />,
            },
          }[n.type] || {
            bg: 'bg-slate-800 text-white',
            icon: <Info className="w-5 h-5 flex-shrink-0" />,
          };

          return (
            <div
              key={n.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0 ${config.bg}`}
            >
              {config.icon}
              <div className="flex-1 text-sm font-medium leading-snug">{n.message}</div>
              <button
                onClick={() => removeNotification(n.id)}
                className="opacity-80 hover:opacity-100 p-0.5 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
