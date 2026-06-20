import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Plus, List, Video as VideoIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    fetchPlaylists();
    fetchVideos();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/videos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaylistItems = async (playlistId: string) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylistItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/playlists`, { name: newPlaylistName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPlaylistName('');
      fetchPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPlaylist = (playlist: any) => {
    setSelectedPlaylist(playlist);
    fetchPlaylistItems(playlist._id);
  };

  const handleAddVideoToPlaylist = async (videoId: string) => {
    if (!selectedPlaylist) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/playlists/${selectedPlaylist._id}/items`, { videoId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlaylistItems(selectedPlaylist._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedPlaylist) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/playlists/${selectedPlaylist._id}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlaylistItems(selectedPlaylist._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the playlist when clicking delete
    if (!window.confirm('Are you sure you want to delete this playlist? This will remove all items inside it.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedPlaylist?._id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistItems([]);
      }
      fetchPlaylists();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 tracking-tight text-white flex items-center">
        <List className="w-8 h-8 mr-3 text-red-500" /> Playlists
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 flex-1 min-h-0 pb-4">
        
        {/* Left Col: Playlists List */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 flex flex-col shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white"><List className="w-5 h-5 mr-2 text-red-500"/> Your Playlists</h2>
          
          <form onSubmit={handleCreatePlaylist} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="New playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
            <button type="submit" className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white">
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {playlists.map((pl: any) => (
              <div 
                key={pl._id}
                onClick={() => handleSelectPlaylist(pl)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${selectedPlaylist?._id === pl._id ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-gray-900 border border-gray-700 hover:bg-gray-700 text-white'}`}
              >
                <span className="truncate pr-4">{pl.name}</span>
                <button 
                  onClick={(e) => handleDeletePlaylist(pl._id, e)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {playlists.length === 0 && <p className="text-gray-500 text-center mt-4">No playlists yet.</p>}
          </div>
        </div>

        {/* Middle Col: Playlist Items */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 flex flex-col md:col-span-1 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-white">{selectedPlaylist ? `Editing: ${selectedPlaylist.name}` : 'Select a Playlist'}</h2>
          
          {selectedPlaylist ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {playlistItems.map((item: any, index) => (
                <div key={item._id} className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <span className="text-gray-500 font-mono mr-3 w-4">{index + 1}</span>
                    <span className="truncate pr-2">{item.videoId?.title || 'Unknown Video'}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleRemoveItem(item._id)} className="text-gray-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {playlistItems.length === 0 && <p className="text-gray-500 text-center mt-4">Playlist is empty.</p>}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a playlist to view or edit its videos.
            </div>
          )}
        </div>

        {/* Right Col: Available Videos */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 flex flex-col md:col-span-1 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center text-white"><VideoIcon className="w-5 h-5 mr-2 text-red-500"/> Available Videos</h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {videos.map((video: any) => (
              <div key={video._id} className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex flex-col justify-between group">
                <span className="truncate mb-2" title={video.title}>{video.title}</span>
                <button 
                  onClick={() => handleAddVideoToPlaylist(video._id)}
                  disabled={!selectedPlaylist}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-3 py-1 rounded transition-colors self-end"
                >
                  Add to Playlist
                </button>
              </div>
            ))}
            {videos.length === 0 && <p className="text-gray-500 text-center mt-4">No videos found. Upload some first.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Playlists;
