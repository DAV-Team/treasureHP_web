import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QuestSelectPage } from './pages/QuestSelectPage'
import { MapPage } from './pages/MapPage'
import { LocationDetailPage } from './pages/LocationDetailPage'
import { QuestCompletedPage } from './pages/QuestCompletedPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuthPage } from './pages/AuthPage'
import { AdminPage } from './pages/AdminPage'
import { AccountPage } from './pages/AccountPage'
import { RequireAuth } from './components/RequireAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quests/select" element={<QuestSelectPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/locations/:id" element={<LocationDetailPage />} />
        <Route path="/quests/completed" element={<QuestCompletedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
