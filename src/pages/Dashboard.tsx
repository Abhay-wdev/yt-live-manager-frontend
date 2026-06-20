import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Activity, Clock, PlayCircle, AlertCircle, Play, Square, RefreshCcw, Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expandedHealth, setExpandedHealth] = useState<string | null>(null);
  
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    
    const socket = io(import.meta.env.VITE_API_URL, {
      extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true'
      }
    });
    socket.on('stream-status', () => fetchData());
    socket.on('health-update', ({ streamId, health }) => {
      setStates(prev => prev.map(s => {
        if (s.streamInstanceId?._id === streamId || s.streamInstanceId === streamId) {
          return { ...s, health };
        }
        return s;
      }));
    });
    
    socket.on('stream-alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
    });

    socket.on('ffmpeg-log', ({ streamId, log }) => {
      setLogs((prev: any) => ({
        ...prev,
        [streamId]: [...(prev[streamId] || []).slice(-19), log]
      }));
    });

    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const [instRes, statRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/stream/instances`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/stream/states`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setInstances(instRes.data);
      setStates(statRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id: string, action: 'start' | 'stop') => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/stream/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing stream action');
    }
  };

  const getState = (instanceId: string) => {
    return states.find(s => s.streamInstanceId?._id === instanceId || s.streamInstanceId === instanceId) || {};
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthIcon = (score: number, status: string) => {
    if (status !== 'Live' && status !== 'Restarting') return <ShieldX className="w-8 h-8 text-gray-500" />;
    if (score >= 75) return <ShieldCheck className="w-8 h-8 text-green-500" />;
    return <ShieldAlert className={`w-8 h-8 ${score >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />;
  };

  // Aggregates
  const totalLive = states.filter(s => s.status === 'Live').length;
  const totalWarning = states.filter(s => s.status === 'Live' && s.health?.masterScore < 75 && s.health?.masterScore >= 25).length;
  const totalCritical = states.filter(s => s.status === 'Live' && s.health?.masterScore < 25).length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <button 
          onClick={() => navigate('/settings')}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20"
        >
          <Plus className="w-5 h-5 mr-2" /> New Stream
        </button>
      </div>

      {/* Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
           <h3 className="text-gray-400 text-xs sm:text-sm font-medium">Platform Health</h3>
           <p className="text-xl sm:text-2xl font-bold text-white mt-1">{totalCritical > 0 ? 'Degraded' : 'Healthy'}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
           <h3 className="text-gray-400 text-xs sm:text-sm font-medium">Live Streams</h3>
           <p className="text-xl sm:text-2xl font-bold text-green-500 mt-1">{totalLive}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
           <h3 className="text-gray-400 text-xs sm:text-sm font-medium">Warning Streams</h3>
           <p className="text-xl sm:text-2xl font-bold text-yellow-500 mt-1">{totalWarning}</p>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
           <h3 className="text-gray-400 text-xs sm:text-sm font-medium">Critical Streams</h3>
           <p className="text-xl sm:text-2xl font-bold text-red-500 mt-1">{totalCritical}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 sm:mb-8 space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`p-3 sm:p-4 rounded-lg border ${a.level === 'Critical' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'} flex items-center text-sm shadow-lg`}>
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {instances.map(instance => {
          const state = getState(instance._id);
          const isActive = state.status === 'Live' || state.status === 'Starting' || state.status === 'Restarting';
          const health = state.health || {};
          const score = isActive ? (health.masterScore || 100) : 0;
          
          return (
            <div key={instance._id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">{instance.name}</h2>
                  <p className="text-sm text-gray-400">Channel: {instance.youtubeAccountId?.name || 'Unknown'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                     <p className={`font-bold text-lg ${isActive ? getHealthColor(score) : 'text-gray-500'}`}>{isActive ? `${score}%` : 'Offline'}</p>
                     <p className="text-xs text-gray-400">{isActive ? health.masterStatus : 'N/A'}</p>
                  </div>
                  {getHealthIcon(score, state.status)}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-gray-700 bg-gray-800/50">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className={`font-semibold flex items-center ${isActive ? 'text-green-500' : state.status === 'Error' ? 'text-red-500' : 'text-gray-300'}`}>
                    <Activity className="w-4 h-4 mr-1" /> {state.status || 'Offline'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Playlist Loops</p>
                  <p className="font-semibold text-gray-300">{state.currentPlaylistLoopCount || 0} / {instance.playlistLoopCount === -1 ? '∞' : instance.playlistLoopCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Restarts</p>
                  <p className="font-semibold text-gray-300 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" /> {state.restartAttemptCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Health Details</p>
                  <button onClick={() => setExpandedHealth(expandedHealth === instance._id ? null : instance._id)} className="text-blue-400 hover:text-blue-300 flex items-center text-sm">
                    {expandedHealth === instance._id ? <><ChevronUp className="w-4 h-4 mr-1"/> Hide</> : <><ChevronDown className="w-4 h-4 mr-1"/> View</>}
                  </button>
                </div>
              </div>

              {/* Detailed Health Panel */}
              {expandedHealth === instance._id && isActive && (
                <div className="p-4 bg-gray-900 border-b border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                   <div>
                     <p className="text-gray-400 text-xs">YouTube Connection</p>
                     <p className={health.youtube?.status === 'Connected' ? 'text-green-400' : 'text-red-400'}>{health.youtube?.status}</p>
                   </div>
                   <div>
                     <p className="text-gray-400 text-xs">FFmpeg Core</p>
                     <p className={health.ffmpeg?.status === 'Healthy' ? 'text-green-400' : 'text-yellow-400'}>{health.ffmpeg?.status}</p>
                   </div>
                   <div>
                     <p className="text-gray-400 text-xs">Stream Quality</p>
                     <p className={health.quality?.status === 'Stable' ? 'text-green-400' : 'text-yellow-400'}>{health.quality?.status}</p>
                   </div>
                   <div>
                     <p className="text-gray-400 text-xs">Buffer Health</p>
                     <p className={health.buffer?.status === 'Normal' ? 'text-green-400' : 'text-yellow-400'}>{health.buffer?.status}</p>
                   </div>
                   <div>
                     <p className="text-gray-400 text-xs">Server CPU ({health.cpu?.usage}%)</p>
                     <p className={health.cpu?.usage > 90 ? 'text-red-400' : health.cpu?.usage > 70 ? 'text-yellow-400' : 'text-green-400'}>{health.cpu?.status}</p>
                   </div>
                   <div>
                     <p className="text-gray-400 text-xs">Server RAM ({health.memory?.usage}%)</p>
                     <p className={health.memory?.usage > 90 ? 'text-red-400' : health.memory?.usage > 70 ? 'text-yellow-400' : 'text-green-400'}>{health.memory?.status}</p>
                   </div>
                </div>
              )}

              {/* Controls & Logs */}
              <div className="p-4 flex-1 flex flex-col space-y-4">
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleAction(instance._id, 'start')}
                    disabled={isActive}
                    className="flex-1 flex items-center justify-center py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start
                  </button>
                  <button 
                    onClick={() => handleAction(instance._id, 'stop')}
                    disabled={!isActive && state.status !== 'Starting'}
                    className="flex-1 flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Square className="w-4 h-4 mr-2" /> Stop
                  </button>
                </div>

                <div className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto h-32 border border-gray-700">
                  {(!logs[instance._id] || logs[instance._id].length === 0) ? (
                    <span className="text-gray-600">No logs yet...</span>
                  ) : (
                    logs[instance._id].map((log: string, i: number) => (
                      <div key={i} className="text-green-400 mb-1 truncate">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
