import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { StudyPage } from './pages/StudyPage';
import { DecksPage } from './pages/DecksPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Navigation />
        <main className="animate-fade-in">
          <Routes>
            <Route path="/" element={<StudyPage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
