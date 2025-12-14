import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VideoChat from './pages/VideoChat';
import AudioChat from './pages/AudioChat';
// import TextChat from './pages/TextChat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video" element={<VideoChat />} />
        <Route path="/audio" element={<AudioChat />} />
        <Route path="/text" element={<div style={{ padding: '2rem' }}>Text Chat Page (Coming Soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
