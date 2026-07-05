import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService, fetchAppointments, updateAppointmentStatus } from '../api'

const DoctorHome = () => {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const doctor = useMemo(() => authService.getStoredUser(), [])

  useEffect(() => {
    if (!doctor) {
      navigate('/doctor/login')
      return
    }

    const loadData = async () => {
      try {
        const list = await fetchAppointments({ doctorId: doctor._id })
        setAppointments(list)
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to fetch appointments')
      }
    }

    loadData()
  }, [doctor, navigate])

  const handleStatusChange = async (appointmentId, status) => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await updateAppointmentStatus(appointmentId, status)
      const list = await fetchAppointments({ doctorId: doctor._id })
      setAppointments(list)
      setMessage(`Appointment marked as ${status}`)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update appointment')
    } finally {
      setLoading(false)
    }
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">Doctor Dashboard</p>
            <h1 className="text-3xl font-semibold">Welcome, {doctor.name}</h1>
            <p className="mt-2 text-slate-300">Review appointments and update their status.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-100">Home</Link>
            <button
              onClick={() => {
                authService.clearSession()
                navigate('/doctor/login')
              }}
              className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        {message ? <div className="rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div> : null}

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
          <h2 className="text-xl font-semibold">Appointments</h2>
          <div className="mt-4 space-y-3">
            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No appointments available.</div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{appointment.patientId?.name || 'Patient'}</p>
                      <p className="text-sm text-slate-400">{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.slotTime}</p>
                      <p className="mt-1 text-sm text-slate-400">Notes: {appointment.notes || 'No notes'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">{appointment.status}</span>
                      <button
                        onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                        disabled={loading}
                        className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                        disabled={loading}
                        className="rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorHome
