import React from 'react'
import { BrowserRouter, Navigate, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorLogin from './pages/DoctorLogin'
import DoctorRegister from './pages/DoctorRegister'
import PatientHome from './pages/PatientHome'
import DoctorHome from './pages/DoctorHome'
import { authService } from './api'

const Landing = () => {
  const user = authService.getStoredUser()
  const role = localStorage.getItem('role')

  const renderPortalLink = (to, redirectTo, label, className, requiredRole) => {
    const isAllowed = Boolean(user && role === requiredRole)
    return (
      <Link to={isAllowed ? to : redirectTo} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6">
      <div className="max-w-5xl w-full grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-6 p-8 bg-white/90 rounded-3xl shadow-xl border border-slate-200">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Appointment Booking</h1>
            <p className="mt-3 text-slate-600">Choose the portal that fits your role and start using the system.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {renderPortalLink('/patient', '/login', 'Patient Home', 'block rounded-2xl bg-indigo-600 text-white py-4 text-center font-medium shadow hover:bg-indigo-700', 'patient')}
            {renderPortalLink('/doctor', '/doctor/login', 'Doctor Home', 'block rounded-2xl border border-indigo-600 text-indigo-600 py-4 text-center font-medium hover:bg-indigo-50', 'doctor')}
            <Link to="/login" className="block rounded-2xl bg-slate-900 text-white py-4 text-center font-medium shadow hover:bg-slate-800">Patient Login</Link>
            <Link to="/doctor/login" className="block rounded-2xl border border-slate-900 text-slate-900 py-4 text-center font-medium hover:bg-slate-100">Doctor Login</Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 p-10 text-white shadow-2xl">
          <h2 className="text-3xl font-semibold mb-3">Built for both patients and doctors</h2>
          <p className="text-slate-100/90 leading-relaxed">A friendly booking system should offer separate home pages for patients and doctors, while keeping login and registration easy to access.</p>
          <ul className="mt-8 space-y-3 text-sm">
            <li>• Patient booking dashboard</li>
            <li>• Doctor clinic and schedule management</li>
            <li>• Responsive, card-based UI</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children, allowedRole, redirectTo }) => {
  const user = authService.getStoredUser()
  const role = localStorage.getItem('role')

  if (!user || role !== allowedRole) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRole="patient" redirectTo="/login">
              <PatientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRole="doctor" redirectTo="/doctor/login">
              <DoctorHome />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/register" element={<DoctorRegister />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
