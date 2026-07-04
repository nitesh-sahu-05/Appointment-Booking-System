import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const setSession = (user, token, role) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('role', role);
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const authService = {
  setSession,
  clearSession,
  getStoredUser,
};

export const patientLogin = async (payload) => {
  const { data } = await api.post('/auth/users/login', payload);
  if (data.token && data.user) {
    setSession(data.user, data.token, 'patient');
  }
  return data;
};

export const patientRegister = async (payload) => {
  const { data } = await api.post('/auth/users/register', payload);
  if (data.token && data.user) {
    setSession(data.user, data.token, 'patient');
  }
  return data;
};

export const doctorLogin = async (payload) => {
  const { data } = await api.post('/auth/doctors/login', payload);
  if (data.token && data.doctor) {
    setSession(data.doctor, data.token, 'doctor');
  }
  return data;
};

export const doctorRegister = async (payload) => {
  const { data } = await api.post('/auth/doctors/register', payload);
  if (data.token && data.doctor) {
    setSession(data.doctor, data.token, 'doctor');
  }
  return data;
};

export const fetchDoctors = async (params = {}) => {
  const { data } = await api.get('/auth/doctors', { params });
  return data.doctors || [];
};

export const fetchDoctorById = async (id) => {
  const { data } = await api.get(`/auth/doctors/${id}`);
  return data.doctor;
};

export const fetchAvailableSlots = async (doctorId, date) => {
  const { data } = await api.get(`/api/appointments/available-slots/${doctorId}`, {
    params: { date },
  });
  return data;
};

export const createAppointment = async (payload) => {
  const { data } = await api.post('/api/appointments', payload);
  return data;
};

export const fetchAppointments = async (params = {}) => {
  const { data } = await api.get('/api/appointments', { params });
  return data.appointments || [];
};

export const updateAppointment = async (appointmentId, payload) => {
  const { data } = await api.patch(`/api/appointments/${appointmentId}`, payload);
  return data.appointment;
};

export const deleteAppointment = async (appointmentId) => {
  const { data } = await api.delete(`/api/appointments/${appointmentId}`);
  return data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const { data } = await api.patch(`/api/appointments/${appointmentId}`, { status });
  return data.appointment;
};
