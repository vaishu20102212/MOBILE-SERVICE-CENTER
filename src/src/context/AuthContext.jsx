import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '../api/services';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'admin',
    email: 'admin@fixmaster.com',
    title: 'Operations Director',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'receptionist',
    email: 'reception@fixmaster.com',
    title: 'Front Desk Officer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 3,
    name: 'David Chen',
    role: 'technician',
    email: 'david.tech@fixmaster.com',
    title: 'Lead Display Specialist',
    technicianId: 2,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    id: 4,
    name: 'Ananya Iyer',
    role: 'customer',
    email: 'ananya@example.com',
    title: 'Verified Customer',
    customerId: 1,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fixmaster_active_role');
    if (saved) {
      const match = DEFAULT_USERS.find((u) => u.role === saved);
      if (match) return match;
    }
    return DEFAULT_USERS[0]; // Admin by default
  });

  useEffect(() => {
    usersApi
      .getAll()
      .then((data) => {
        if (data && data.length) {
          setUsers(data);
          // If current user is in data, update it
          const updated = data.find((u) => u.role === currentUser.role);
          if (updated) setCurrentUser(updated);
        }
      })
      .catch((err) => {
        console.warn('Using default users list:', err.message);
      });
  }, []);

  const switchRole = (roleName) => {
    const targetUser = users.find((u) => u.role === roleName) || DEFAULT_USERS.find((u) => u.role === roleName);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('fixmaster_active_role', roleName);
    }
  };

  const hasPermission = (permission) => {
    const role = currentUser.role;
    switch (permission) {
      case 'manage_technicians':
      case 'manage_users':
      case 'view_revenue_reports':
      case 'manage_all_settings':
        return role === 'admin';

      case 'manage_inventory':
        return role === 'admin' || role === 'technician';

      case 'create_service_request':
      case 'create_customer':
      case 'edit_customer':
        return role === 'admin' || role === 'receptionist';

      case 'assign_technician':
        return role === 'admin' || role === 'receptionist';

      case 'update_diagnosis':
      case 'use_spare_parts':
        return role === 'admin' || role === 'technician';

      case 'update_workflow_status':
        return role === 'admin' || role === 'technician' || role === 'receptionist';

      case 'process_billing':
        return role === 'admin' || role === 'receptionist';

      case 'view_full_reports':
        return role === 'admin' || role === 'receptionist';

      case 'customer_portal_only':
        return role === 'customer';

      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        switchRole,
        users,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
