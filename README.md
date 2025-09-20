# Dentist Website Backend API

A comprehensive Node.js Express.js backend API with user management, file uploads, and authentication features.

## Features

- 🔐 User Authentication (JWT)
- 👤 User Management (CRUD operations)
- 🔑 Forgot Password with OTP system
- 🖼️ Image Upload to Cloudinary
- 🎥 Video Upload to Cloudinary
- 📧 Email notifications (OTP, Welcome emails)
- 🛡️ Security Middleware (Helmet, CORS, Rate Limiting)
- 📊 Input Validation
- 📚 Swagger API Documentation
- 🗄️ MongoDB Database

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Cloudinary** - Image and video storage
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **Swagger** - API documentation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for email service)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dentist_Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `config.env` to `.env`
   - Update the environment variables with your actual values:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/dentist_website
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dentist_website

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_secure
   JWT_EXPIRE=7d

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email Configuration (for OTP and notifications)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Gmail Setup (for email service)**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Generate an App Password for this application
   - Use your Gmail address and the App Password in the environment variables

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/forgot-password` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP and reset password

### User Management
- `GET /api/users` - Get all users (Protected)
- `GET /api/users/:id` - Get single user (Protected)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Protected)
- `POST /api/users/:id/avatar` - Upload user avatar (Protected)
- `DELETE /api/users/:id/avatar` - Delete user avatar (Protected)

### File Uploads
- `POST /api/upload/image` - Upload single image (Protected)
- `POST /api/upload/images` - Upload multiple images (Protected)
- `POST /api/upload/video` - Upload single video (Protected)
- `POST /api/upload/videos` - Upload multiple videos (Protected)

## Database Models

### User
- username, email, password, avatar, isActive, resetPasswordToken, resetPasswordExpire, otpCode, otpExpire

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- File upload restrictions

## Development

The server runs on `http://localhost:5000` by default.

### Health Check
Visit `http://localhost:5000/health` to check if the server is running.

### API Documentation
Visit `http://localhost:5000/api-docs` to see the interactive Swagger documentation.

### API Base URL
Visit `http://localhost:5000` to see available endpoints.

## Environment Variables

Make sure to set up all required environment variables in your `.env` file:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password
- `FRONTEND_URL` - Frontend URL for CORS

## License

ISC
