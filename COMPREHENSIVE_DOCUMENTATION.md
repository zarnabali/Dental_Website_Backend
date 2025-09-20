# 🦷 Dr. Sami Ullah Dental Clinic - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Database Models](#database-models)
3. [API Routes](#api-routes)
4. [File Structure](#file-structure)
5. [Authentication System](#authentication-system)
6. [File Upload System](#file-upload-system)
7. [Frontend Development Guide](#frontend-development-guide)
8. [UI Development Tips & Tricks](#ui-development-tips--tricks)
9. [Deployment Guide](#deployment-guide)

---

## 🎯 Project Overview

This is a comprehensive dental clinic management system with:
- **Backend**: Node.js + Express.js + MongoDB + Cloudinary
- **Frontend**: Next.js + GSAP Animations
- **Authentication**: JWT-based with OTP verification
- **File Management**: Cloudinary integration for images/videos
- **Content Management**: Full CRUD operations for all content types

---

## 🗄️ Database Models

### 1. **User Model** (`User.js`)
**Purpose**: User authentication and management
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  password: String (min 6 chars, hashed),
  avatar: { public_id: String, url: String },
  isActive: Boolean (default: true),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otpCode: String,
  otpExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **ClinicInfo Model** (`ClinicInfo.js`) - **SINGLE ITEM ONLY**
**Purpose**: Clinic information and contact details
```javascript
{
  name: String (max 200 chars),
  noOfExperience: Number (min 0),
  noOfPatients: Number (min 0),
  phoneNumber: String (international format),
  location: {
    url: String (valid URL),
    description: String (max 500 chars)
  },
  socialLinks: {
    facebook: String (optional, valid URL),
    instagram: String (optional, valid URL)
  },
  email: String (valid email),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **HeroImage Model** (`HeroImage.js`)
**Purpose**: Hero section images (web + mobile)
```javascript
{
  image: { public_id: String, url: String },
  mobileImage: { public_id: String, url: String },
  title: String (max 100 chars),
  description: String (max 500 chars),
  textColor: String (HEX color code),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **HeroVideo Model** (`HeroVideo.js`) - **SINGLE ITEM ONLY**
**Purpose**: Hero section video
```javascript
{
  video: { public_id: String, url: String },
  title: String (max 100 chars),
  description: String (max 500 chars),
  textColor: String (HEX color code),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Service Model** (`Service.js`)
**Purpose**: Dental services offered
```javascript
{
  cardInfo: {
    title: String,
    description: String,
    image: { public_id: String, url: String }
  },
  serviceBlog: {
    heroImage: { public_id: String, url: String },
    title: String,
    description: String,
    paras: [String],
    pointParas: [String],
    youtubeLinks: [String]
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Blog Model** (`Blog.js`)
**Purpose**: Blog posts and articles
```javascript
{
  cardInfo: {
    title: String,
    description: String,
    image: { public_id: String, url: String }
  },
  blogContent: {
    heroImage: { public_id: String, url: String },
    title: String,
    description: String,
    paras: [String],
    pointParas: [String],
    youtubeLinks: [String]
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Team Model** (`Team.js`)
**Purpose**: Team members and staff
```javascript
{
  name: String (max 100 chars),
  position: String (max 100 chars),
  image: { public_id: String, url: String },
  bio: String (max 1000 chars),
  socialLinks: {
    facebook: String (optional),
    instagram: String (optional),
    linkedin: String (optional)
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **Partner Model** (`Partner.js`)
**Purpose**: Business partners and sponsors
```javascript
{
  name: String (max 100 chars),
  image: { public_id: String, url: String },
  website: String (optional, valid URL),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **FAQ Model** (`FAQ.js`)
**Purpose**: Frequently asked questions
```javascript
{
  question: String (max 500 chars),
  answer: String (max 2000 chars),
  category: String (max 100 chars),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 10. **Feedback Model** (`Feedback.js`)
**Purpose**: Customer testimonials and feedback
```javascript
{
  name: String (max 100 chars),
  email: String (valid email),
  rating: Number (min 1, max 5),
  message: String (max 1000 chars),
  image: { public_id: String, url: String },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛣️ API Routes

### **Authentication Routes** (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| GET | `/me` | Get current user | ✅ |
| POST | `/forgot-password` | Send OTP for password reset | ❌ |
| POST | `/verify-otp` | Verify OTP and reset password | ❌ |

### **User Management Routes** (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users (paginated) | ✅ |
| GET | `/:id` | Get single user | ✅ |
| PUT | `/:id` | Update user | ✅ |
| DELETE | `/:id` | Delete user | ✅ |
| POST | `/:id/avatar` | Upload user avatar | ✅ |
| DELETE | `/:id/avatar` | Delete user avatar | ✅ |

### **Clinic Info Routes** (`/api/clinic-info`) - **SINGLE ITEM**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get clinic info | ❌ |
| POST | `/` | Create clinic info | ✅ |
| PUT | `/update` | Update clinic info | ✅ |
| DELETE | `/` | Delete clinic info | ✅ |

### **Hero Image Routes** (`/api/hero-images`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all hero images | ❌ |
| GET | `/:id` | Get single hero image | ❌ |
| POST | `/` | Create hero image | ✅ |
| PUT | `/:id` | Update hero image | ✅ |
| DELETE | `/:id` | Delete hero image | ✅ |

### **Hero Video Routes** (`/api/hero-videos`) - **SINGLE ITEM**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get hero video | ❌ |
| POST | `/` | Create hero video | ✅ |
| PUT | `/update` | Update hero video | ✅ |
| DELETE | `/` | Delete hero video | ✅ |

### **Service Routes** (`/api/services`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all services | ❌ |
| GET | `/:id` | Get single service | ❌ |
| POST | `/` | Create service | ✅ |
| PUT | `/:id` | Update service | ✅ |
| DELETE | `/:id` | Delete service | ✅ |

### **Blog Routes** (`/api/blogs`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all blogs | ❌ |
| GET | `/:id` | Get single blog | ❌ |
| POST | `/` | Create blog | ✅ |
| PUT | `/:id` | Update blog | ✅ |
| DELETE | `/:id` | Delete blog | ✅ |

### **Team Routes** (`/api/team`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all team members | ❌ |
| GET | `/:id` | Get single team member | ❌ |
| POST | `/` | Create team member | ✅ |
| PUT | `/:id` | Update team member | ✅ |
| DELETE | `/:id` | Delete team member | ✅ |

### **Partner Routes** (`/api/partners`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all partners | ❌ |
| GET | `/:id` | Get single partner | ❌ |
| POST | `/` | Create partner | ✅ |
| PUT | `/:id` | Update partner | ✅ |
| DELETE | `/:id` | Delete partner | ✅ |

### **FAQ Routes** (`/api/faqs`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all FAQs | ❌ |
| GET | `/:id` | Get single FAQ | ❌ |
| POST | `/` | Create FAQ | ✅ |
| PUT | `/:id` | Update FAQ | ✅ |
| DELETE | `/:id` | Delete FAQ | ✅ |

### **Feedback Routes** (`/api/feedback`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all feedback | ❌ |
| GET | `/:id` | Get single feedback | ❌ |
| POST | `/` | Create feedback | ❌ |
| PUT | `/:id` | Update feedback | ✅ |
| DELETE | `/:id` | Delete feedback | ✅ |

### **File Upload Routes** (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/test` | Test upload endpoints | ❌ |
| POST | `/image` | Upload single image | ✅ |
| POST | `/images` | Upload multiple images | ✅ |
| POST | `/video` | Upload single video | ✅ |
| POST | `/videos` | Upload multiple videos | ✅ |

---

## 📁 File Structure

```
Dentist_Backend/
├── config/
│   ├── cloudinary.js          # Cloudinary configuration
│   ├── database.js            # MongoDB connection
│   └── swagger.js             # Swagger documentation setup
├── middleware/
│   ├── auth.js                # JWT authentication middleware
│   ├── errorHandler.js        # Global error handling
│   ├── uploadImage.js         # Image upload middleware
│   ├── uploadVideo.js         # Video upload middleware
│   ├── uploadMultipleImages.js # Multiple image upload
│   └── uploadHeroImages.js    # Hero image specific upload
├── models/
│   ├── User.js                # User model
│   ├── ClinicInfo.js          # Clinic information model
│   ├── HeroImage.js           # Hero image model
│   ├── HeroVideo.js           # Hero video model
│   ├── Service.js             # Service model
│   ├── Blog.js                # Blog model
│   ├── Team.js                # Team model
│   ├── Partner.js             # Partner model
│   ├── FAQ.js                 # FAQ model
│   └── Feedback.js            # Feedback model
├── routes/
│   ├── auth.js                # Authentication routes
│   ├── users.js               # User management routes
│   ├── clinicInfo.js          # Clinic info routes
│   ├── heroImage.js           # Hero image routes
│   ├── heroVideo.js           # Hero video routes
│   ├── services.js            # Service routes
│   ├── blogs.js               # Blog routes
│   ├── team.js                # Team routes
│   ├── partners.js            # Partner routes
│   ├── faqs.js                # FAQ routes
│   ├── feedback.js            # Feedback routes
│   └── upload.js              # File upload routes
├── utils/
│   └── emailService.js        # Email service utilities
├── config.env                 # Environment variables
├── server.js                  # Main server file
├── package.json               # Dependencies
└── README.md                  # Basic documentation
```

---

## 🔐 Authentication System

### **JWT Token Structure**
```javascript
{
  id: "user_id",
  iat: "issued_at_timestamp",
  exp: "expiration_timestamp"
}
```

### **Authentication Flow**
1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` → Returns JWT token
3. **Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Password Reset**: OTP-based system via email

### **Token Storage (Frontend)**
```javascript
// Store token after login
localStorage.setItem('token', response.data.token);

// Include in API requests
const token = localStorage.getItem('token');
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 📤 File Upload System

### **Supported File Types**
- **Images**: JPG, PNG, GIF, WebP, SVG
- **Videos**: MP4, AVI, MOV, WMV
- **Size Limits**: 10MB per file

### **Cloudinary Integration**
- Automatic image optimization
- Multiple format support
- CDN delivery
- Secure uploads

### **Upload Endpoints Usage**
```javascript
// Single image upload
const formData = new FormData();
formData.append('image', file);

fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## 🎨 Frontend Development Guide

### **Next.js Project Structure**
```
Dentist_Dashboard/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── clinic-info/
│   │   │   ├── hero-images/
│   │   │   ├── hero-videos/
│   │   │   ├── services/
│   │   │   ├── blogs/
│   │   │   ├── team/
│   │   │   ├── partners/
│   │   │   ├── faqs/
│   │   │   └── feedback/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── forms/
│   │   │   ├── ServiceForm.tsx
│   │   │   ├── BlogForm.tsx
│   │   │   └── TeamForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── hooks/
│       ├── useAuth.ts
│       └── useApi.ts
├── public/
│   └── images/
├── package.json
└── next.config.js
```

### **Required Dependencies**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "gsap": "^3.12.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.16.0"
  }
}
```

---

## 🎭 UI Development Tips & Tricks

### **1. GSAP Animation Setup**
```javascript
// lib/animations.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const fadeInUp = (element: string) => {
  gsap.fromTo(element, 
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
  );
};

export const staggerChildren = (parent: string, children: string) => {
  gsap.fromTo(children,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
  );
};
```

### **2. Form Handling with React Hook Form**
```javascript
// components/forms/ServiceForm.tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  cardTitle: yup.string().required('Title is required'),
  cardDescription: yup.string().required('Description is required'),
  // ... other fields
});

const ServiceForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

### **3. API Integration with Axios**
```javascript
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### **4. Dashboard Layout Structure**
```javascript
// components/dashboard/Layout.tsx
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

### **5. Sidebar Navigation**
```javascript
// components/dashboard/Sidebar.tsx
const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clinic Info', href: '/dashboard/clinic-info', icon: InfoIcon },
  { name: 'Hero Images', href: '/dashboard/hero-images', icon: ImageIcon },
  { name: 'Hero Videos', href: '/dashboard/hero-videos', icon: VideoIcon },
  { name: 'Services', href: '/dashboard/services', icon: ServiceIcon },
  { name: 'Blogs', href: '/dashboard/blogs', icon: BlogIcon },
  { name: 'Team', href: '/dashboard/team', icon: TeamIcon },
  { name: 'Partners', href: '/dashboard/partners', icon: PartnerIcon },
  { name: 'FAQs', href: '/dashboard/faqs', icon: QuestionIcon },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageIcon },
];
```

### **6. CRUD Operations Pattern**
```javascript
// hooks/useCrud.ts
const useCrud = (endpoint) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get(endpoint);
      setItems(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data) => {
    try {
      const response = await api.post(endpoint, data);
      setItems([...items, response.data.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateItem = async (id, data) => {
    try {
      const response = await api.put(`${endpoint}/${id}`, data);
      setItems(items.map(item => 
        item._id === id ? response.data.data : item
      ));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem
  };
};
```

### **7. File Upload Component**
```javascript
// components/forms/FileUpload.tsx
const FileUpload = ({ onFileSelect, accept = "image/*", multiple = false }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    if (multiple) {
      onFileSelect(Array.from(files));
    } else {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or click to select
        </p>
      </label>
    </div>
  );
};
```

---

## 🚀 Deployment Guide

### **Backend Deployment (Vercel/Netlify)**
1. Set environment variables
2. Deploy to platform
3. Configure MongoDB Atlas
4. Set up Cloudinary

### **Frontend Deployment (Vercel)**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Configure environment variables

### **Environment Variables**
```env
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 📝 Additional Notes

### **Single Item Models**
- **ClinicInfo**: Only one clinic info allowed
- **HeroVideo**: Only one hero video allowed
- Use `POST` to create, `PUT /update` to update

### **File Upload Requirements**
- Images: JPG, PNG, GIF, WebP, SVG
- Videos: MP4, AVI, MOV, WMV
- Max size: 10MB per file

### **Authentication Requirements**
- JWT token required for protected routes
- Include in headers: `Authorization: Bearer <token>`

### **Error Handling**
- All routes return consistent error format
- Check `success` field in responses
- Handle validation errors appropriately

This documentation provides a complete guide for developing and maintaining the Dr. Sami Ullah Dental Clinic management system. Use it as a reference for both backend and frontend development.
