# Setup Guide for Dentist Website Backend

## 🎉 Project Setup Complete!

Your Node.js Express.js backend with MongoDB and Cloudinary integration is now ready! Here's what has been implemented:

## ✅ Features Implemented

### 1. User Management
- ✅ User model with username, email, password (no roles)
- ✅ JWT authentication system
- ✅ User CRUD operations (Create, Read, Update, Delete)
- ✅ Password hashing with bcrypt

### 2. Authentication System
- ✅ User registration
- ✅ User login
- ✅ JWT token generation
- ✅ Protected routes middleware
- ✅ Forgot password with OTP system
- ✅ Email verification for password reset

### 3. File Upload System
- ✅ Image upload middleware (Cloudinary)
- ✅ Video upload middleware (Cloudinary)
- ✅ Single and multiple file uploads
- ✅ File validation and size limits
- ✅ Cloudinary integration

### 4. Email Service
- ✅ OTP generation and validation
- ✅ Welcome email on registration
- ✅ Password reset email with OTP
- ✅ Nodemailer integration

### 5. API Documentation
- ✅ Swagger UI integration
- ✅ Complete API documentation
- ✅ Interactive API testing interface

### 6. Security Features
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ File upload restrictions

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   - Copy `config.env` to `.env`
   - Update all the placeholder values with your actual credentials

3. **Start the Server**
   ```bash
   npm run dev
   ```

4. **Access the API**
   - API Base: `http://localhost:5000`
   - Swagger Docs: `http://localhost:5000/api-docs`
   - Health Check: `http://localhost:5000/health`

## 📋 Environment Variables to Configure

### Required Variables:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dentist_website

# JWT
JWT_SECRET=your_very_long_and_secure_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🔧 Setup Instructions

### 1. MongoDB Setup
- **Local MongoDB**: Install MongoDB locally and start the service
- **MongoDB Atlas**: Create a free cluster and get the connection string

### 2. Cloudinary Setup
- Sign up at [cloudinary.com](https://cloudinary.com)
- Get your cloud name, API key, and API secret from the dashboard

### 3. Gmail Setup (for email service)
- Enable 2-Factor Authentication on your Google account
- Generate an App Password for this application
- Use your Gmail address and the App Password

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and reset password

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/avatar` - Upload avatar
- `DELETE /api/users/:id/avatar` - Delete avatar

### File Uploads
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/video` - Upload single video
- `POST /api/upload/videos` - Upload multiple videos

## 🧪 Testing the API

1. **Start the server**: `npm run dev`
2. **Visit Swagger UI**: `http://localhost:5000/api-docs`
3. **Test endpoints** using the interactive documentation

## 📁 Project Structure

```
Dentist_Backend/
├── config/
│   ├── database.js
│   ├── cloudinary.js
│   └── swagger.js
├── middleware/
│   ├── auth.js
│   ├── uploadImage.js
│   ├── uploadVideo.js
│   └── errorHandler.js
├── models/
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   └── upload.js
├── utils/
│   └── emailService.js
├── server.js
├── package.json
├── config.env
└── README.md
```

## 🎯 Next Steps

1. Configure your environment variables
2. Set up MongoDB (local or Atlas)
3. Set up Cloudinary account
4. Configure Gmail for email service
5. Start the server and test the API
6. Integrate with your frontend application

## 🆘 Troubleshooting

- **MongoDB Connection Error**: Make sure MongoDB is running locally or use Atlas
- **Cloudinary Upload Error**: Check your Cloudinary credentials
- **Email Not Sending**: Verify Gmail app password and 2FA setup
- **JWT Token Error**: Check your JWT_SECRET is set correctly

## 📞 Support

If you encounter any issues, check the console logs for detailed error messages. The API includes comprehensive error handling and validation.

---

**Happy Coding! 🚀**
