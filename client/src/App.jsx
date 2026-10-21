import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import thTH from 'antd/locale/th_TH'
import Login from './pages/Login.jsx'
import Shell from './pages/Shell.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  // ตอนนี้ใช้ข้อมูลสมมติ ยังไม่ต่อเซิร์ฟเวอร์
  const [user, setUser] = useState(null)

  return (
    <ConfigProvider
      locale={thTH}
      theme={{ token: { fontFamily: "'Sarabun', sans-serif", colorPrimary: '#1f3a8a' } }}
    >
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/"
          element={user ? <Shell user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}