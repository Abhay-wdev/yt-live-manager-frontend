import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Videos from './pages/Videos';
import Playlists from './pages/Playlists';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';
import Channels from './pages/Channels';
import StreamsManager from './pages/StreamsManager';
import StreamDetails from './pages/StreamDetails';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="team" element={<Team />} />
          <Route path="videos" element={<Videos />} />
          <Route path="streams" element={<StreamsManager />} />
          <Route path="streams/:id" element={<StreamDetails />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="channels" element={<Channels />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
