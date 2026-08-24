import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data?.success && res.data.data) {
        setWorkspaces(res.data.data);
        const storedWsId = localStorage.getItem('active_workspace_id');
        const match = res.data.data.find((w) => w.id === storedWsId) || res.data.data[0];
        if (match) {
          setActiveWorkspace(match);
          localStorage.setItem('active_workspace_id', match.id);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        await fetchWorkspaces();
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaces]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { access_token, refresh_token, user: userInfo } = res.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        if (userInfo.workspace_id) {
          localStorage.setItem('active_workspace_id', userInfo.workspace_id);
        }
        setUser(userInfo);
        await fetchWorkspaces();
        showToast('Welcome back! Login successful.', 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const register = async (email, password, fullName, role = 'Admin') => {
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        role,
      });
      if (res.data?.success) {
        const { access_token, refresh_token, user: userInfo } = res.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        if (userInfo.workspace_id) {
          localStorage.setItem('active_workspace_id', userInfo.workspace_id);
        }
        setUser(userInfo);
        await fetchWorkspaces();
        showToast('Registration complete! Welcome to Cloud Optimizer.', 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.clear();
    setUser(null);
    setActiveWorkspace(null);
    setWorkspaces([]);
    showToast('Logged out successfully.', 'info');
  };

  const switchWorkspace = (workspaceId) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('active_workspace_id', ws.id);
      showToast(`Switched to workspace: ${ws.name}`, 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        workspaces,
        loading,
        login,
        register,
        logout,
        switchWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        refreshUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
