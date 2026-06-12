import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Play, Square, RefreshCcw, Trash2, Copy, Search, ShieldCheck, ShieldAlert, CheckSquare, Square as SquareOutline } from 'lucide-react';

const StreamsManager = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instRes, statRes] = await Promise.all([
        axios.get('https://yt-live-manager-backend.onrender.com/api/stream/instances', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('https://yt-live-manager-backend.onrender.com/api/stream/states', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setInstances(instRes.data);
      setStates(statRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getState = (id: string) => states.find(s => s.streamInstanceId?._id === id || s.streamInstanceId === id) || {};

  const handleBulkAction = async (action: 'start' | 'stop' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm('Are you sure you want to delete selected streams?')) return;
    
    try {
      await axios.post(`https://yt-live-manager-backend.onrender.com/api/stream/bulk/${action}`, { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert('Error executing bulk action');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await axios.post(`https://yt-live-manager-backend.onrender.com/api/stream/instances/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Error duplicating stream');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInstances.length) setSelectedIds([]);
    else setSelectedIds(filteredInstances.map(i => i._id));
  };

  const filteredInstances = instances.filter(i => {
    const s = getState(i._id);
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.youtubeAccountId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter || (!s.status && statusFilter === 'Offline');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Streams Manager</h1>
        <button onClick={() => navigate('/settings')} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-red-900/20">Create Stream</button>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or channel..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
            <option value="All">All Statuses</option>
            <option value="Live">Live</option>
            <option value="Offline">Offline</option>
            <option value="Error">Error</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
            <span className="text-gray-400 py-2 mr-2 text-sm">{selectedIds.length} selected</span>
            <button onClick={() => handleBulkAction('start')} className="px-3 py-2 bg-green-600/20 text-green-500 rounded hover:bg-green-600/30 flex items-center text-sm"><Play className="w-4 h-4 mr-1"/> Start</button>
            <button onClick={() => handleBulkAction('stop')} className="px-3 py-2 bg-orange-600/20 text-orange-500 rounded hover:bg-orange-600/30 flex items-center text-sm"><Square className="w-4 h-4 mr-1"/> Stop</button>
            <button onClick={() => handleBulkAction('delete')} className="px-3 py-2 bg-red-600/20 text-red-500 rounded hover:bg-red-600/30 flex items-center text-sm"><Trash2 className="w-4 h-4 mr-1"/> Delete</button>
          </div>
        )}
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="p-4 w-12 cursor-pointer" onClick={toggleSelectAll}>
                {selectedIds.length === filteredInstances.length && filteredInstances.length > 0 ? <CheckSquare className="w-5 h-5 text-red-500"/> : <SquareOutline className="w-5 h-5 text-gray-500"/>}
              </th>
              <th className="p-4">Stream Name</th>
              <th className="p-4">Channel</th>
              <th className="p-4">Status</th>
              <th className="p-4">Health</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredInstances.map(instance => {
              const state = getState(instance._id);
              const isActive = state.status === 'Live' || state.status === 'Starting' || state.status === 'Restarting';
              return (
                <tr key={instance._id} className="hover:bg-gray-700/50">
                  <td className="p-4 cursor-pointer" onClick={() => toggleSelect(instance._id)}>
                    {selectedIds.includes(instance._id) ? <CheckSquare className="w-5 h-5 text-red-500"/> : <SquareOutline className="w-5 h-5 text-gray-500"/>}
                  </td>
                  <td className="p-4 font-semibold hover:text-red-400 cursor-pointer" onClick={() => navigate(`/streams/${instance._id}`)}>{instance.name}</td>
                  <td className="p-4 text-gray-400">{instance.youtubeAccountId?.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-500/10 text-green-500' : state.status === 'Error' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      {state.status || 'Offline'}
                    </span>
                  </td>
                  <td className="p-4">
                    {isActive ? (
                       <div className="flex items-center text-sm">
                         {state.health?.masterScore >= 75 ? <ShieldCheck className="w-4 h-4 text-green-500 mr-1"/> : <ShieldAlert className="w-4 h-4 text-yellow-500 mr-1"/>}
                         {state.health?.masterScore || 100}%
                       </div>
                    ) : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-4 flex space-x-3 items-center">
                    <button onClick={() => navigate(`/streams/${instance._id}`)} className="text-blue-400 hover:text-blue-300 font-semibold text-sm">View / Edit</button>
                    <button onClick={() => handleDuplicate(instance._id)} className="text-gray-400 hover:text-white" title="Duplicate"><Copy className="w-4 h-4"/></button>
                    <button onClick={() => {
                      setSelectedIds([instance._id]);
                      setTimeout(() => handleBulkAction('delete'), 0);
                    }} className="text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default StreamsManager;
