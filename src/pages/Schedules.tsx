import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Calendar, Trash2, CheckCircle, XCircle } from 'lucide-react';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const token = useAuthStore(state => state.token);

  // Form state
  const [playlistId, setPlaylistId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleType, setScheduleType] = useState('one-time');

  useEffect(() => {
    fetchSchedules();
    fetchPlaylists();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data);
      if (res.data.length > 0) {
        setPlaylistId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        playlistId,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        scheduleType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedules();
      setStartTime('');
      setEndTime('');
    } catch (err) {
      console.error(err);
      alert('Error creating schedule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-6 sm:mb-8">Schedules</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Create Schedule Form */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center text-white"><Calendar className="w-5 h-5 mr-2 text-red-500"/> New Schedule</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Playlist</label>
              <select
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                required
              >
                {playlists.map((pl: any) => (
                  <option key={pl._id} value={pl._id}>{pl.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Type</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="one-time">One Time</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-1 text-sm">Start Time (Local)</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1 text-sm">End Time (Optional)</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
              />
            </div>

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors mt-4">
              Create Schedule
            </button>
          </form>
        </div>

        {/* Schedules List */}
        <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4">Playlist</th>
                <th className="p-4">Start Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((sch: any) => (
                <tr key={sch._id} className="border-t border-gray-700">
                  <td className="p-4 font-medium">{sch.playlistId?.name || 'Deleted Playlist'}</td>
                  <td className="p-4 text-gray-400">
                    {sch.startTime ? new Date(sch.startTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    {sch.enabled ? (
                      <span className="flex items-center text-green-400 text-sm"><CheckCircle className="w-4 h-4 mr-1"/> Active</span>
                    ) : (
                      <span className="flex items-center text-gray-500 text-sm"><XCircle className="w-4 h-4 mr-1"/> Completed</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(sch._id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No schedules found.</td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
