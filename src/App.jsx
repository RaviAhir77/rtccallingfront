import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VideoChat from './pages/VideoChat';
import AudioChat from './pages/AudioChat';
import TextChat from './pages/TextChat';
import Profile from './pages/Profile';
import { ToastProvider } from './providers/ToastProvider';
import { SocketProvider } from './providers/SocketProvider';

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video" element={<VideoChat />} />
            <Route path="/audio" element={<AudioChat />} />
            <Route path="/text" element={<TextChat />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
