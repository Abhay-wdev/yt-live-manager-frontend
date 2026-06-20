import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Plus, Trash2, Tv } from 'lucide-react';

const Channels = () => {
  const token = useAuthStore((state) => state.token);
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/youtube-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/youtube-accounts`, {
        name, channelId, streamKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setName('');
      setChannelId('');
      setStreamKey('');
      setShowAdd(false);
      fetchAccounts();
    } catch (err) {
      alert('Error adding account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/youtube-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAccounts();
    } catch (err) {
      alert('Error deleting account');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center">
           <Tv className="w-8 h-8 mr-3 text-red-500" /> YouTube Channels
        </h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-red-900/20"
        >
          <Plus className="w-5 h-5 mr-2" /> {showAdd ? 'Cancel' : 'Add Channel'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 mb-6 sm:mb-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Add New Channel</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Channel Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="e.g. My Gaming Channel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Channel ID (Optional)</label>
                <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="UC..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Stream Key</label>
                <input type="password" required value={streamKey} onChange={e => setStreamKey(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="xxxx-xxxx-xxxx-xxxx" />
              </div>
            </div>
            <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none shadow-lg">Save Channel</button>
          </form>
        </div>
      )}

      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 text-sm font-medium text-gray-400 tracking-wider">Channel Name</th>
                <th className="p-4 text-sm font-medium text-gray-400 tracking-wider">Channel ID</th>
                <th className="p-4 text-sm font-medium text-gray-400 tracking-wider">Status</th>
                <th className="p-4 text-sm font-medium text-gray-400 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {accounts.map((acc: any) => (
                <tr key={acc._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 font-semibold text-white">{acc.name}</td>
                  <td className="p-4 text-gray-400">{acc.channelId || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-500 font-semibold">
                      {acc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end">
                    <button onClick={() => handleDelete(acc._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No channels added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Channels;
