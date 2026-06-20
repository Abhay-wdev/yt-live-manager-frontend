import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Play, Square, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';

const StreamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  
  const [tab, setTab] = useState('config');
  const [instance, setInstance] = useState<any>(null);
  const [state, setState] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  
  // Configuration Form State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const socket = io(import.meta.env.VITE_API_URL, {
      extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true'
      }
    });
    socket.on('stream-status', () => fetchState());
    socket.on('health-update', ({ streamId, health }) => {
      if (streamId === id) setState((s: any) => ({ ...s, health }));
    });
    socket.on('ffmpeg-log', ({ streamId, log }) => {
      if (streamId === id) setLiveLogs(prev => [...prev.slice(-49), log]);
    });

    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [tab]);

  const fetchData = async () => {
    try {
      const [instRes, accRes, plRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/stream/instances`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/youtube-accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/playlists`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const current = instRes.data.find((i: any) => i._id === id);
      setInstance(current);
      if (current) {
         setFormData({
            name: current.name,
            youtubeAccountId: current.youtubeAccountId?._id || current.youtubeAccountId,
            playlistId: current.playlistId?._id || current.playlistId,
            qualityProfile: current.qualityProfile,
            videoLoopCount: current.videoLoopCount,
            playlistLoopCount: current.playlistLoopCount,
            autoRestart: current.autoRestart,
            maxRestartAttempts: current.maxRestartAttempts,
            restartDelaySeconds: current.restartDelaySeconds,
            resumeMode: current.resumeMode,
         });
      }
      setAccounts(accRes.data);
      setPlaylists(plRes.data);
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchState = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/stream/states`, { headers: { Authorization: `Bearer ${token}` } });
      const current = res.data.find((s: any) => s.streamInstanceId?._id === id || s.streamInstanceId === id);
      setState(current || {});
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/stream/instances/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data);
    } catch (err) {}
  };

  const handleAction = async (action: 'start' | 'stop') => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/stream/${id}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchState();
    } catch (err) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/stream/instances/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      alert('Settings saved successfully');
      fetchData();
    } catch (err) {
      alert('Error saving settings');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev: any) => ({ ...prev, [e.target.name]: value }));
  };

  if (!instance || !formData) return <div className="p-8 text-white">Loading...</div>;

  const isActive = state.status === 'Live' || state.status === 'Starting' || state.status === 'Restarting';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate('/streams')} className="text-gray-400 hover:text-white flex items-center mb-4 sm:mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Streams
      </button>

      {/* Header Profile */}
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{instance.name}</h1>
           <div className="flex flex-wrap items-center gap-2 sm:space-x-4 text-xs sm:text-sm">
             <span className={`px-2 py-1 rounded font-semibold ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{state.status || 'Offline'}</span>
             <span className="text-gray-400">Health: {isActive ? `${state.health?.masterScore || 100}%` : 'N/A'}</span>
             <span className="text-gray-400">Loop: {state.currentPlaylistLoopCount || 0}</span>
           </div>
         </div>
         <div className="flex w-full sm:w-auto space-x-3">
            <button onClick={() => handleAction('start')} disabled={isActive} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded flex items-center shadow-lg"><Play className="w-4 h-4 mr-2" /> Start</button>
            <button onClick={() => handleAction('stop')} disabled={!isActive} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded flex items-center shadow-lg"><Square className="w-4 h-4 mr-2" /> Stop</button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700 mb-6 overflow-x-auto">
        <button onClick={() => setTab('config')} className={`pb-2 px-1 whitespace-nowrap ${tab === 'config' ? 'border-b-2 border-red-500 text-white font-semibold' : 'text-gray-400'}`}>Configuration</button>
        <button onClick={() => setTab('logs')} className={`pb-2 px-1 whitespace-nowrap ${tab === 'logs' ? 'border-b-2 border-red-500 text-white font-semibold' : 'text-gray-400'}`}>Logs & Events</button>
      </div>

      {tab === 'config' && (
        <form onSubmit={handleSave} className="space-y-6">
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Instance Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">YouTube Channel</label>
                <select name="youtubeAccountId" value={formData.youtubeAccountId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Playlist</label>
                <select name="playlistId" value={formData.playlistId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  {playlists.map(pl => <option key={pl._id} value={pl._id}>{pl.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Quality</label>
                <select name="qualityProfile" value={formData.qualityProfile} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Video Loop Count (-1 for infinite)</label>
                <input type="number" name="videoLoopCount" value={formData.videoLoopCount} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm">Playlist Loop Count (-1 for infinite)</label>
                <input type="number" name="playlistLoopCount" value={formData.playlistLoopCount} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-gray-700">
                <div className="mb-4 flex items-center">
                  <input type="checkbox" id="autoRestart" name="autoRestart" checked={formData.autoRestart} onChange={handleChange} className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-red-500" />
                  <label htmlFor="autoRestart" className="ml-2 text-white text-sm">Enable Auto-Restart</label>
                </div>
              </div>
           </div>
           <div className="flex space-x-4">
             <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"><Save className="w-4 h-4 mr-2"/> Save Changes</button>
             <button type="button" onClick={async () => {
                if (window.confirm('Are you sure you want to permanently delete this stream?')) {
                   try {
                     await axios.post(`${import.meta.env.VITE_API_URL}/api/stream/bulk/delete`, { ids: [id] }, { headers: { Authorization: `Bearer ${token}` } });
                     navigate('/streams');
                   } catch (e) { alert('Failed to delete stream.'); }
                }
             }} className="px-6 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg flex items-center transition-colors">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Stream
             </button>
           </div>
        </form>
      )}

      {tab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Event History (Database)</h2>
            <div className="space-y-3 h-96 overflow-y-auto pr-2">
               {logs.map((log: any) => (
                 <div key={log._id} className="text-sm p-3 bg-gray-900 rounded border border-gray-700">
                   <div className="flex justify-between text-gray-400 text-xs mb-1">
                     <span className={log.type === 'error' ? 'text-red-400' : 'text-blue-400'}>{log.type.toUpperCase()}</span>
                     <span>{new Date(log.timestamp).toLocaleString()}</span>
                   </div>
                   <p className="text-gray-200">{log.message}</p>
                 </div>
               ))}
               {logs.length === 0 && <p className="text-gray-500">No events recorded.</p>}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Live Terminal (WebSocket)</h2>
            <div className="bg-black p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs text-green-400">
               {liveLogs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
               {liveLogs.length === 0 && <span className="text-gray-600">Waiting for stream logs...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamDetails;
