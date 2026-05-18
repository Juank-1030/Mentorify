import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import ResultadosPage from './pages/ResultadosPage';
import ProgressPage from './pages/ProgressPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:ejercicioId" element={<ChatPage />} />
        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/progreso" element={<ProgressPage />} />
      </Routes>
    </Router>
  );
}

export default App;
