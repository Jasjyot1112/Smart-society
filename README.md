# Smart Society ERP - All-in-One Community Management System

A premium, production-level Society Management Software built with the MERN stack. Designed to streamline residential operations, enhance security, and foster community engagement.

![Smart Society Banner](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)

## 🌟 Key Modules

### 🏢 Community Hub
*   **Marketplace**: A mini-OLX within the society where residents can buy and sell items (Furniture, Electronics, etc.).
*   **Services Directory**: Peer-to-peer service listings (Maids, Plumbers, Electricians) with resident feedback.
*   **Announcements**: Real-time society-wide broadcasts with push notifications via Socket.io.
*   **Events**: Management of society events with calendar integration.

### 📅 Facility Management
*   **Smart Booking**: Real-time slot availability engine for society facilities (Turf, Lawn, Gym, Table Tennis).
*   **Multi-Slot Support**: Residents can book multiple consecutive hours for events like lawn parties.
*   **Waitlist System**: Automated queueing for popular slots.

### 💳 Financial & Operations
*   **Payments**: Maintenance fee tracking and online payment history.
*   **Expense Tracker**: Transparent society expense logging for admins.
*   **Invoice Generator**: Automated PDF generation for receipts and bills.

### 🛡️ Security & Visitors
*   **Visitor Management**: Digital entry/exit logs with approval workflow.
*   **Role-Based Access**: Specialized portals for Security Staff, Residents, and Admins.

---

## 🚀 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide Icons, Vite.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Real-time**: Socket.io for instant notifications and updates.
- **Storage**: Local Disk Storage (with Cloudinary Support fallback).
- **Authentication**: JWT (JSON Web Tokens) with Secure HTTP-Only Cookies.

---

## 🛠️ Installation & Setup

### 1. Pre-requisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure .env
# Create a .env file and add the following:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔒 Environment Variables Reference

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Secret key for generating auth tokens |
| `FRONTEND_URL` | The URL where your React app is running |
| `CLOUDINARY_CLOUD_NAME` | (Optional) Cloudinary credentials for cloud storage |

---

## 👥 User Roles

- **Admin**: Full control over residents, finances, and society facilities.
- **Resident**: Access to Community Hub, Facility Booking, and Personal Payments.
- **Security**: Simplified tablet-friendly interface for visitor entries and gate logs.

---

## 🤝 Contributing
Feel free to fork this repository, contribute new features, or report bugs. 

## 📄 License
MIT License - created by the Smart Society ERP Team.
