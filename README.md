# 🩺 Doctor Appointment Booking System

A full-stack **Doctor Appointment Booking System** built using the **MERN Stack**. The application enables patients to book appointments with doctors, while doctors can manage their schedules and appointments through dedicated dashboards.

## 🚀 Features

### 👨‍⚕️ Patient
- User registration and login
- Secure JWT authentication
- Browse available doctors
- Book appointments
- View appointment history
- Update profile information

### 👩‍⚕️ Doctor
- Secure doctor login
- Manage profile
- View booked appointments
- Accept or reject appointment requests
- Update appointment status

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Role-based authorization (Doctor & Patient)

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- Axios
- CSS / Tailwind CSS (if applicable)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

## 📂 Project Structure

```
appointment-booking-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/appointment-booking-system.git
```

### 2. Navigate to the project

```bash
cd appointment-booking-system
```

### 3. Install dependencies

Frontend

```bash
cd frontend
npm install
```

Backend

```bash
cd ../backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 5. Run the application

Backend

```bash
npm run dev
```

Frontend

```bash
npm run dev
```

## 📸 Screenshots

Add screenshots of:
- Home Page
- Login & Register
- Patient Dashboard
- Doctor Dashboard
- Appointment Booking Page

## 📌 API Features

- Authentication APIs
- Doctor Management APIs
- Patient Management APIs
- Appointment Booking APIs
- Appointment Status APIs

## 🎯 Future Enhancements

- Online payment integration
- Video consultation
- Email & SMS notifications
- Prescription management
- Medical history records
- Admin dashboard
- Doctor availability calendar
- Search & filter doctors

## 🤝 Contributing

Contributions are welcome. Feel free to fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Nitesh Sahu**

- Full Stack MERN Developer
- Passionate about building scalable web applications and AI-powered solutions.

⭐ If you found this project helpful, don't forget to give it a Star!
