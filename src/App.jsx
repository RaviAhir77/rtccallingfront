import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import VideoChat from './pages/VideoChat';
import AudioChat from './pages/AudioChat';
import TextChat from './pages/TextChat';
import Profile from './pages/Profile';
import { ToastProvider } from './providers/ToastProvider';
import { SocketProvider } from './providers/SocketProvider';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/video",
    element: <VideoChat />,
  },
  {
    path: "/audio",
    element: <AudioChat />,
  },
  {
    path: "/text",
    element: <TextChat />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
]);

function App() {
  return (
    <ToastProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
