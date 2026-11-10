import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '../api/services';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'admin',
    email: 'admin@fixmaster.com',
    password: 'password123',
    title: 'Operations Director',
    phone: '9810012345',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    description: 'Full administrative access, revenue metrics, team management & settings',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'receptionist',
    email: 'reception@fixmaster.com',
    password: 'password123',
    title: 'Front Desk Officer',
    phone: '9810023456',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    description: 'Customer intake, service requests, quotes & billing collection',
  },
  {
    id: 3,
    name: 'David Chen',
    role: 'technician',
    email: 'david.tech@fixmaster.com',
    password: 'password123',
    title: 'Lead Display Specialist',
    technicianId: 2,
    phone: '9822334455',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    description: 'Repair workflow, diagnostics, parts consumption & quality checks',
  },
  {
    id: 4,
    name: 'Ananya Iyer',
    role: 'customer',
    email: 'ananya@example.com',
    password: 'password123',
    title: 'Verified Customer',
    customerId: 1,
    phone: '9876543210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    description: 'Track repair status, view invoice estimate & warranty information',
  },
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(DEFAULT_USERS);

  // Initialize currentUser as null by default so the LOGIN SCREEN appears first!
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Only keep logged in if session was explicitly authenticated
      const sessionActive = sessionStorage.getItem('fixmaster_logged_in') === 'true';
      if (sessionActive) {
        const saved = sessionStorage.getItem('fixmaster_auth_user') || localStorage.getItem('fixmaster_auth_user');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read user from storage', e);
    }
    // Default to null: login screen comes first!
    return null;
  });

  useEffect(() => {
    usersApi
      .getAll()
      .then((data) => {
        if (data && data.length) {
          setUsers(data);
          if (currentUser) {
            const updated = data.find((u) => u.email === currentUser.email || u.role === currentUser.role);
            if (updated) {
              setCurrentUser((prev) => ({ ...prev, ...updated }));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Using default users list:', err.message);
      });
  }, []);

  // Login handler with email & password
  const login = async (email, password, remember = true) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const candidateList = users && users.length ? users : DEFAULT_USERS;

    const matched = candidateList.find(
      (u) => u.email?.toLowerCase() === cleanEmail || u.role?.toLowerCase() === cleanEmail
    );

    if (!matched) {
      return { success: false, message: 'No account found with this email address' };
    }

    if (password && password.length < 3) {
      return { success: false, message: 'Password must be at least 3 characters' };
    }

    setCurrentUser(matched);
    try {
      sessionStorage.setItem('fixmaster_logged_in', 'true');
      sessionStorage.setItem('fixmaster_auth_user', JSON.stringify(matched));
      if (remember) {
        localStorage.setItem('fixmaster_auth_user', JSON.stringify(matched));
        localStorage.setItem('fixmaster_active_role', matched.role);
      }
    } catch (e) {
      console.warn('Could not persist session', e);
    }
    return { success: true, user: matched };
  };

  // Direct 1-click persona login (for quick testing & evaluation)
  const loginAsUser = (user, remember = true) => {
    if (!user) return { success: false };
    setCurrentUser(user);
    try {
      sessionStorage.setItem('fixmaster_logged_in', 'true');
      sessionStorage.setItem('fixmaster_auth_user', JSON.stringify(user));
      if (remember) {
        localStorage.setItem('fixmaster_auth_user', JSON.stringify(user));
        localStorage.setItem('fixmaster_active_role', user.role);
      }
    } catch (e) {
      console.warn('Could not persist session', e);
    }
    return { success: true, user };
  };

  // Logout handler
  const logout = () => {
    try {
      sessionStorage.removeItem('fixmaster_logged_in');
      sessionStorage.removeItem('fixmaster_auth_user');
      localStorage.removeItem('fixmaster_auth_user');
      localStorage.removeItem('fixmaster_active_role');
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
    setCurrentUser(null);
    return { success: true };
  };

  // Instant role switch (for evaluation menu)
  const switchRole = (roleName) => {
    const candidateList = users && users.length ? users : DEFAULT_USERS;
    const targetUser = candidateList.find((u) => u.role === roleName) || DEFAULT_USERS.find((u) => u.role === roleName);
    if (targetUser) {
      setCurrentUser(targetUser);
      try {
        sessionStorage.setItem('fixmaster_logged_in', 'true');
        sessionStorage.setItem('fixmaster_auth_user', JSON.stringify(targetUser));
        localStorage.setItem('fixmaster_auth_user', JSON.stringify(targetUser));
        localStorage.setItem('fixmaster_active_role', roleName);
      } catch {}
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
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
        role: currentUser?.role || 'guest',
        isAuthenticated: Boolean(currentUser),
        login,
        loginAsUser,
        logout,
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
