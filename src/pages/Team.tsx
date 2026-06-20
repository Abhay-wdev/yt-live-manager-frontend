import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, CheckCircle, XCircle, Key, Trash2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const Team = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);
  const currentUser = useAuthStore(state => state.user);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetPassword = async (id: string) => {
    const newPassword = window.prompt('Enter the new password for this user:');
    if (!newPassword) return;
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}/reset-password`, { newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Password reset successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading team...</div>;
  
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">Only the primary administrator can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Team Management</h1>
        <p className="text-gray-400 mt-2">Approve new users and manage system access.</p>
      </div>

      {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-300">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Email</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Role</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 text-white font-medium">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs uppercase tracking-wider font-bold">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.status === 'pending' && <span className="text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded text-xs uppercase font-bold">Pending</span>}
                    {user.status === 'approved' && <span className="text-green-500 bg-green-500/20 px-2 py-1 rounded text-xs uppercase font-bold">Approved</span>}
                    {user.status === 'rejected' && <span className="text-red-500 bg-red-500/20 px-2 py-1 rounded text-xs uppercase font-bold">Rejected</span>}
                  </td>
                  <td className="p-4 flex gap-2">
                    {user.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(user._id, 'approved')} className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => updateStatus(user._id, 'rejected')} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {user.status === 'approved' && (
                      <button onClick={() => updateStatus(user._id, 'rejected')} className="p-2 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500 hover:text-gray-900 transition" title="Revoke Access">
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    {user.status === 'rejected' && (
                      <button onClick={() => updateStatus(user._id, 'approved')} className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-white transition" title="Restore Access">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button onClick={() => resetPassword(user._id)} className="p-2 bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition" title="Reset Password">
                      <Key className="w-5 h-5" />
                    </button>
                    
                    {user.email !== 'admin@example.com' && (
                      <button onClick={() => deleteUser(user._id)} className="p-2 bg-gray-700 text-gray-400 rounded hover:bg-red-500 hover:text-white transition" title="Delete User">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Team;
