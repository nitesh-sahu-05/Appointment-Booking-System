import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doctorRegister } from '../api'

const emptySlot = () => ({ date: '', startTime: '', endTime: '' })

const DoctorRegister = () => {
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('')
  const [fees, setFees] = useState('')
  const [availableSlots, setAvailableSlots] = useState([emptySlot()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSlotChange = (index, key, value) => {
    setAvailableSlots(prev => prev.map((s, i) => i === index ? { ...s, [key]: value } : s))
  }

  const addSlot = () => setAvailableSlots(prev => [...prev, emptySlot()])
  const removeSlot = (index) => setAvailableSlots(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // prepare slots: filter out empty rows
    const slots = availableSlots
      .filter(s => s.date && s.startTime && s.endTime)
      .map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }))

    try {
      await doctorRegister({
        name,
        email,
        password,
        specialization: specialty,
        experience: Number(experience) || 0,
        fees: Number(fees) || 0,
        availableSlots: slots,
      })
      navigate('/doctor')
    } catch (err) {
      setError(err?.response?.data?.message || 'Doctor registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600">Doctor portal</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Doctor registration</h1>
          <p className="mt-2 text-sm text-slate-500">Create your doctor account and define available slots for patients to book.</p>
        </div>
        {error ? <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Dr. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Specialty</label>
            <input
              type="text"
              value={specialty}
              required
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Dermatology, Cardiology, etc."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Experience (years)</label>
              <input
                type="number"
                min="0"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fees</label>
              <input
                type="number"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="doctor@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Choose a secure password"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Available slots</h3>
              <button type="button" onClick={addSlot} className="text-sm text-sky-600">Add slot</button>
            </div>
            <div className="mt-3 space-y-3">
              {availableSlots.map((slot, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-4 items-end">
                  <div>
                    <label className="block text-xs text-slate-600">Date</label>
                    <input type="date" value={slot.date} onChange={(e) => handleSlotChange(idx, 'date', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600">Start</label>
                    <input type="time" value={slot.startTime} onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600">End</label>
                    <input type="time" value={slot.endTime} onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => removeSlot(idx)} className="mt-1 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-70">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered? <Link to="/doctor/login" className="text-sky-600">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default DoctorRegister
