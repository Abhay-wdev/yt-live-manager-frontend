import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Upload, Link as LinkIcon, Trash2 } from 'lucide-react';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const token = useAuthStore(state => state.token);
  const [driveLink, setDriveLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('https://yt-live-manager-backend.onrender.com/api/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      await axios.post('https://yt-live-manager-backend.onrender.com/api/videos/local', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      fetchVideos();
      alert('Video uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDriveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('https://yt-live-manager-backend.onrender.com/api/videos/drive', { driveLink }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDriveLink('');
      fetchVideos();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`https://yt-live-manager-backend.onrender.com/api/videos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-6 sm:mb-8">Video Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white"><LinkIcon className="w-5 h-5 mr-2 text-red-500" /> Add Google Drive Video</h2>
          <form onSubmit={handleAddDriveLink} className="space-y-4">
            <input
              type="url"
              placeholder="Google Drive Share Link"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors shadow-lg w-full sm:w-auto text-white">
              Add Link
            </button>
          </form>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white"><Upload className="w-5 h-5 mr-2 text-red-500" /> Upload Local Video</h2>
          <form onSubmit={handleUploadLocal} className="space-y-4">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              required
              disabled={isUploading}
            />
            <button 
              type="submit" 
              disabled={isUploading || !file}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 text-sm font-medium text-gray-400">Preview</th>
                <th className="p-4 text-sm font-medium text-gray-400">Title</th>
                <th className="p-4 text-sm font-medium text-gray-400">Source</th>
                <th className="p-4 text-sm font-medium text-gray-400">Added On</th>
                <th className="p-4 text-sm font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {videos.map((video: any) => {
              const driveId = video.sourceType === 'google-drive' ? new URL(video.path).searchParams.get('id') : null;
              
              return (
              <tr key={video._id} className="border-t border-gray-700">
                <td className="p-4">
                  {video.sourceType === 'local' ? (
                    <video 
                      src={`https://yt-live-manager-backend.onrender.com/uploads/${video.filename}`} 
                      className="w-48 h-28 object-cover rounded bg-black" 
                      controls 
                    />
                  ) : (
                    <iframe 
                      src={`https://drive.google.com/file/d/${driveId}/preview`} 
                      className="w-48 h-28 rounded border-none bg-black" 
                      allow="autoplay"
                    />
                  )}
                </td>
                <td className="p-4 font-semibold">{video.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${video.sourceType === 'google-drive' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                    {video.sourceType}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(video._id)} className="text-red-500 hover:text-red-400">
                    <Trash2 className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            )})}
            {videos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No videos found. Add one above.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Videos;
