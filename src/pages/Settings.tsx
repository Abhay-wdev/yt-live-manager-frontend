import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    youtubeAccountId: '',
    playlistId: '',
    qualityProfile: '1080p',
    videoLoopCount: 1,
    playlistLoopCount: 1,
    autoRestart: true,
    maxRestartAttempts: 5,
    restartDelaySeconds: 10,
    resumeMode: 'restart-video',
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [accRes, plRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/youtube-accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/playlists`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAccounts(accRes.data);
      setPlaylists(plRes.data);
      if (accRes.data.length > 0) setFormData(f => ({ ...f, youtubeAccountId: accRes.data[0]._id }));
      if (plRes.data.length > 0) setFormData(f => ({ ...f, playlistId: plRes.data[0]._id }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/stream/instances`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving instance');
    }
  };

  if (accounts.length === 0 || playlists.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Create Stream Instance</h1>
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 p-4 rounded-lg">
          You must create at least one YouTube Channel and one Playlist before creating a Stream Instance.
        </div>
      </div>
    );
  }

  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, 
        { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      
      {/* Change Password Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Account Settings</h1>
        <form onSubmit={submitPasswordChange} className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">Change Password</h2>
          
          {passwordMessage.text && (
            <div className={`p-3 rounded mb-4 ${passwordMessage.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-green-500/20 text-green-500 border border-green-500'}`}>
              {passwordMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Current Password</label>
              <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">New Password</label>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Confirm New Password</label>
              <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Update Password
            </button>
          </div>
        </form>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Create Stream Instance</h1>
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Info */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-400 mb-2">Instance Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" placeholder="Main Gaming Channel Stream" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">YouTube Channel</label>
              <select name="youtubeAccountId" value={formData.youtubeAccountId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none">
                {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Playlist to Stream</label>
              <select name="playlistId" value={formData.playlistId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none">
                {playlists.map(pl => <option key={pl._id} value={pl._id}>{pl.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Quality Profile</label>
              <select name="qualityProfile" value={formData.qualityProfile} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none">
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="4k">4K (High CPU)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Looping */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">Looping Behavior</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-400 mb-2">Video Loop Count (-1 for infinite)</label>
              <input type="number" name="videoLoopCount" value={formData.videoLoopCount} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Playlist Loop Count (-1 for infinite)</label>
              <input type="number" name="playlistLoopCount" value={formData.playlistLoopCount} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Recovery */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">Auto-Recovery Settings</h2>
          
          <div className="mb-6 flex items-center">
            <input type="checkbox" id="autoRestart" name="autoRestart" checked={formData.autoRestart} onChange={handleChange} className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-red-500 focus:ring-red-500" />
            <label htmlFor="autoRestart" className="ml-3 text-white font-medium">Enable Auto-Restart on Crash</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 opacity-100 transition-opacity">
            <div>
              <label className="block text-gray-400 mb-2">Max Attempts (-1 for infinite)</label>
              <input type="number" name="maxRestartAttempts" value={formData.maxRestartAttempts} onChange={handleChange} disabled={!formData.autoRestart} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Delay Before Restart (sec)</label>
              <input type="number" name="restartDelaySeconds" value={formData.restartDelaySeconds} onChange={handleChange} disabled={!formData.autoRestart} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Resume Strategy</label>
              <select name="resumeMode" value={formData.resumeMode} onChange={handleChange} disabled={!formData.autoRestart} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-red-500 focus:outline-none disabled:opacity-50">
                <option value="restart-video">Restart Current Video</option>
                <option value="skip-video">Skip to Next Video</option>
                <option value="resume-timestamp">Resume at Last Known Timestamp</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg shadow-red-900/20">
            Create Stream Instance
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default Settings;
