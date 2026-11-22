# LoanPoint – Loan Management Mobile Application

<p align="center">
  <img src="assets/images/loanpoint-logo.png" alt="LoanPoint Logo" width="180"/>
</p>

<h3 align="center">Your Trusted Partner for Loan Solutions</h3>

<p align="center">
  A modern, user-friendly mobile application designed to simplify loan discovery, application management, and customer services.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-2026-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Expo-58-black?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/TypeScript-Language-blue?style=for-the-badge&logo=typescript" />
</p>

---

## 📱 About LoanPoint

**LoanPoint V3** is a mobile application developed to make loan-related services more accessible and convenient for customers.

The application provides an intuitive interface where users can explore different loan products, access loan-related information, register their accounts, and interact with the platform.

The project follows a modern mobile application architecture with a React Native frontend and a Node.js backend, supported by PostgreSQL database services.

### 🎯 Project Objectives

- Simplify the loan discovery process.
- Provide an easy-to-use mobile experience.
- Organize different loan products in one application.
- Provide secure user authentication.
- Manage customer information and application data.
- Build a scalable backend architecture.

---

## ✨ Key Features

### 🏠 Home Dashboard
- Modern and attractive home screen.
- Featured loan product banners.
- Easy navigation and user-friendly interface.
- Quick access to important application sections.

### 💰 Loan Products

Explore different loan categories:

- Agriculture Loan
- Business Loan
- Car Loan
- Education Loan
- Home Loan
- Mortgage Loan
- Mudra Loan
- Personal Loan

### 👤 User Authentication
- User registration.
- Login functionality.
- OTP-based authentication workflow.
- Admin login functionality.
- User authentication through backend APIs.

### 📄 Customer Services
- Loan-related information.
- Customer-focused application workflows.
- User-friendly navigation.
- Document and image upload integration.

### 🛠️ Backend & API Integration
- RESTful API architecture.
- Node.js and Express.js backend.
- PostgreSQL database integration.
- Authentication and application APIs.
- Centralized API communication.

### 🖼️ Image Management
- ImageKit integration.
- Cloud-based image storage.
- Image upload and delivery support.

---

## 🛠️ Technology Stack

### Mobile Application – Frontend

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile development |
| Expo SDK 58 | Mobile application framework |
| TypeScript | Type-safe development |
| JavaScript | Application programming |
| React | UI component architecture |
| Expo Router / Navigation | Application navigation |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API development |
| TypeScript | Backend development |
| REST APIs | Frontend and backend communication |
| JWT | Authentication support |

### Database & Storage

| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Neon | Cloud PostgreSQL hosting |
| ImageKit | Image storage and delivery |

### Development & Deployment Tools

| Tool | Purpose |
|---|---|
| Git & GitHub | Version control |
| Visual Studio Code | Development environment |
| Postman | API testing |
| Expo EAS | Android application builds |
| Render | Backend deployment |

---

## 🏗️ Project Architecture

```text
LoanPoint V3
│
├── Mobile Application
│   │
│   ├── React Native
│   ├── Expo
│   ├── TypeScript
│   ├── UI Components
│   ├── Navigation
│   └── API Integration
│
├── Backend
│   │
│   ├── Node.js
│   ├── Express.js
│   ├── REST APIs
│   ├── Authentication
│   └── Business Logic
│
├── Database
│   │
│   └── PostgreSQL (Neon)
│
└── Cloud Services
    │
    └── ImageKit
```

---

## 📂 Project Structure

```text
LoanPointMobile/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── constants/
│
├── backend/
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

*Note: The structure above represents the project architecture; actual folders may differ.*

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AtharvaPatharkar/LoanPointApp.git
```

### 2. Navigate to the Project

```bash
cd LoanPointApp
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url/api/v1

EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key
EXPO_PUBLIC_IMAGEKIT_ID=your_imagekit_id
```

Use the actual environment variables required by your project.

**Security:** Never expose database credentials, ImageKit private keys, JWT secrets, or other server-side secrets in the mobile application.

### 5. Start the Application

```bash
npx expo start --clear
```

### 6. Run on Android

```bash
npx expo start --android
```

---

## 🖥️ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install backend dependencies:

```bash
npm install
```

Configure backend environment variables using your backend environment configuration.

Build the TypeScript project:

```bash
npm run build
```

Start the backend server:

```bash
npm start
```

Backend development server:

```text
http://localhost:4000
```

Health check endpoint:

```text
/api/v1/health
```

---

## 📦 Android APK Build

LoanPoint uses Expo Application Services (EAS) for Android builds.

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login to Expo:

```bash
eas login
```

Configure the project:

```bash
eas build:configure
```

Create an Android APK:

```bash
eas build --platform android --profile preview
```

For a production build:

```bash
eas build --platform android --profile production
```

---

## 🔐 Security & Authentication

The application uses a backend-based architecture for authentication and data communication.

Security considerations:

- Server-side database access.
- Backend-managed authentication workflows.
- Protected server-side environment variables.
- Secure API communication over HTTPS.
- Input validation and error handling.

OTP delivery depends on the configured OTP provider. Development or demo OTP mode may be used during testing.

---

## 🚀 Future Enhancements

- Real SMS OTP provider integration.
- Advanced loan application tracking.
- Push notifications.
- Enhanced customer dashboard.
- Additional loan services.
- Improved document management.
- Advanced admin dashboard.
- Application performance optimization.

---

## 👨‍💻 Developer

**Atharva Patharkar**

Software Developer | Full Stack Developer | Mobile Application Developer

Currently working at **Jisnu Digital Solutions Pvt. Ltd.**

Interested in building modern web applications, mobile applications, and scalable backend systems.

<p align="left">
  <a href="https://github.com/AtharvaPatharkar">
    <img src="https://img.shields.io/badge/GitHub-AtharvaPatharkar-181717?style=for-the-badge&logo=github"/>
  </a>
  <a href="https://www.linkedin.com/in/atharva-patharkar-6a462b260/">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin"/>
  </a>
  <a href="mailto:atharvapatharkar6@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail"/>
  </a>
</p>

---

<p align="center">
  <b>LoanPoint – Making Loan Services Simpler and More Accessible.</b>
</p>

<p align="center">
  ⭐ If you find this project interesting, consider giving it a star!
</p>
