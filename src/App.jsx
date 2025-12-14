import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VideoChat from './pages/VideoChat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video" element={<VideoChat />} />
        <Route path="/audio" element={<div style={{ padding: '2rem' }}>Audio Chat Page (Coming Soon)</div>} />
        <Route path="/text" element={<div style={{ padding: '2rem' }}>Text Chat Page (Coming Soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
