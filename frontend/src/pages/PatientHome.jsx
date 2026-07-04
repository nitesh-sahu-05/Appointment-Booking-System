import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  authService,
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  fetchAvailableSlots,
  fetchDoctors,
  fetchDoctorById,
  updateAppointment,
} from '../api' 

const PatientHome = () => {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingAppointmentId, setEditingAppointmentId] = useState(null)
  const [editDoctorId, setEditDoctorId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editSlot, setEditSlot] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSlots, setEditSlots] = useState([])
  const [editLoading, setEditLoading] = useState(false)

  const user = useMemo(() => authService.getStoredUser(), [])
  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return doctors

    return doctors.filter((doctor) => {
      const name = (doctor.name || '').toLowerCase()
      const specializations = (doctor.specialization || []).join(' ').toLowerCase()
      return name.includes(query) || specializations.includes(query)
    })
  }, [doctors, searchQuery])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        const doctorList = await fetchDoctors()
        setDoctors(doctorList)
        const appointmentList = await fetchAppointments({ patientId: user._id })
        setAppointments(appointmentList)
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load data')
      }
    }

    loadData()
  }, [navigate, user])

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setSlots([])
        setSelectedSlot('')
        return
      }

      try {
        const bookedData = await fetchAvailableSlots(selectedDoctor, selectedDate)
        const bookedSlots = bookedData.bookedSlots || []

        const doctor = await fetchDoctorById(selectedDoctor)
        const doctorSlots = (doctor?.availableSlots || [])
          .filter(s => s.date && s.startTime)
          .filter(s => (new Date(s.date)).toISOString().split('T')[0] === selectedDate)

        const candidateSlots = doctorSlots.map(s => s.startTime || `${s.startTime}-${s.endTime}`)
        const available = candidateSlots.filter(t => !bookedSlots.includes(t))

        setSlots(available)
        setSelectedSlot('')
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load slots')
      }
    }

    loadSlots()
  }, [selectedDoctor, selectedDate])

  useEffect(() => {
    const loadEditSlots = async () => {
      if (!editingAppointmentId || !editDoctorId || !editDate) {
        setEditSlots([])
        setEditSlot('')
        return
      }

      try {
        const bookedData = await fetchAvailableSlots(editDoctorId, editDate)
        const bookedSlots = (bookedData.bookedSlots || []).filter((slot) => slot !== editSlot)

        const doctor = await fetchDoctorById(editDoctorId)
        const doctorSlots = (doctor?.availableSlots || [])
          .filter(s => s.date && s.startTime)
          .filter(s => (new Date(s.date)).toISOString().split('T')[0] === editDate)

        const candidateSlots = doctorSlots.map(s => s.startTime || `${s.startTime}-${s.endTime}`)
        const available = candidateSlots.filter(t => !bookedSlots.includes(t))

        setEditSlots(available)
        if (!available.includes(editSlot)) {
          setEditSlot('')
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load slots')
      }
    }

    loadEditSlots()
  }, [editDate, editDoctorId, editSlot, editingAppointmentId])

  const handleBook = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setError('Please select a doctor, date, and slot')
      return
    }

    setLoading(true)
    try {
      await createAppointment({
        patientId: user._id,
        doctorId: selectedDoctor,
        appointmentDate: selectedDate,
        slotTime: selectedSlot,
        notes,
      })
      setMessage('Appointment booked successfully')
      setNotes('')
      setSelectedSlot('')
      const appointmentList = await fetchAppointments({ patientId: user._id })
      setAppointments(appointmentList)
    } catch (err) {
      setError(err?.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const startEditAppointment = (appointment) => {
    setEditingAppointmentId(appointment._id)
    setEditDoctorId(appointment.doctorId?._id || '')
    setEditDate(new Date(appointment.appointmentDate).toISOString().split('T')[0])
    setEditSlot(appointment.slotTime || '')
    setEditNotes(appointment.notes || '')
    setError('')
    setMessage('')
  }

  const cancelEditAppointment = () => {
    setEditingAppointmentId(null)
    setEditDoctorId('')
    setEditDate('')
    setEditSlot('')
    setEditNotes('')
    setEditSlots([])
  }

  const handleUpdateAppointment = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!editingAppointmentId || !editDoctorId || !editDate || !editSlot) {
      setError('Please select a doctor, date, and slot')
      return
    }

    setEditLoading(true)
    try {
      await updateAppointment(editingAppointmentId, {
        doctorId: editDoctorId,
        appointmentDate: editDate,
        slotTime: editSlot,
        notes: editNotes,
      })
      setMessage('Appointment updated successfully')
      cancelEditAppointment()
      const appointmentList = await fetchAppointments({ patientId: user._id })
      setAppointments(appointmentList)
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Delete this appointment?')) return

    setMessage('')
    setError('')

    try {
      await deleteAppointment(appointmentId)
      setMessage('Appointment deleted successfully')
      const appointmentList = await fetchAppointments({ patientId: user._id })
      setAppointments(appointmentList)
    } catch (err) {
      setError(err?.response?.data?.message || 'Deletion failed')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Patient Portal</p>
            <h1 className="text-3xl font-semibold text-slate-900">Welcome, {user.name}</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700">Home</Link>
            <button
              onClick={() => {
                authService.clearSession()
                navigate('/login')
              }}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Book an appointment</h2>
            <form onSubmit={handleBook} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Search doctors</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or specialization"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Select a doctor</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} — {doctor.specialization?.join(', ') || 'General'}
                    </option>
                  ))}
                </select>
                {searchQuery && filteredDoctors.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No doctors match your search.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Available slot</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  disabled={!selectedDoctor || !selectedDate}
                >
                  <option value="">Select a slot</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Optional notes for the doctor"
                />
              </div>

              {error ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
              {message ? <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-600">{message}</div> : null}

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-70">
                {loading ? 'Booking...' : 'Book appointment'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Your appointments</h2>
            <div className="mt-4 space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No appointments yet.</div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{appointment.doctorId?.name || 'Doctor'}</p>
                        <p className="text-sm text-slate-500">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{appointment.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Time: {appointment.slotTime}</p>
                    {appointment.notes ? <p className="mt-2 text-sm text-slate-500">Notes: {appointment.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditAppointment(appointment)}
                        className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(appointment._id)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                      >
                        Delete
                      </button>
                    </div>

                    {editingAppointmentId === appointment._id ? (
                      <form onSubmit={handleUpdateAppointment} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
                          <select
                            value={editDoctorId}
                            onChange={(e) => setEditDoctorId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                          >
                            <option value="">Select a doctor</option>
                            {doctors.map((doctor) => (
                              <option key={doctor._id} value={doctor._id}>
                                {doctor.name} — {doctor.specialization?.join(', ') || 'General'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Available slot</label>
                          <select
                            value={editSlot}
                            onChange={(e) => setEditSlot(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                            disabled={!editDoctorId || !editDate}
                          >
                            <option value="">Select a slot</option>
                            {editSlots.map((slot) => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="min-h-[80px] w-full rounded-2xl border border-slate-300 px-3 py-2"
                            placeholder="Optional notes"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                          >
                            {editLoading ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditAppointment}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientHome
