const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dentist Website API',
      version: '1.0.0',
      description: 'A comprehensive API for dentist website with user management, file uploads, and authentication',
      contact: {
        name: 'API Support',
        email: 'support@dentistwebsite.com'
      }
    },
    servers: [
      // Use relative URL so Swagger targets the current deployment host by default
      {
        url: '/',
        description: 'Current host'
      },
      ...(process.env.VERCEL_URL
        ? [
            {
              url: `https://${process.env.VERCEL_URL}`,
              description: 'Vercel production'
            }
          ]
        : []),
      ...(process.env.RAILWAY_PUBLIC_DOMAIN
        ? [
            {
              url: `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
              description: 'Railway production'
            }
          ]
        : []),
      ...(process.env.RAILWAY_PUBLIC_URL
        ? [
            {
              url: process.env.RAILWAY_PUBLIC_URL,
              description: 'Railway public URL'
            }
          ]
        : []),
      ...(process.env.BASE_URL
        ? [
            {
              url: process.env.BASE_URL,
              description: 'Configured BASE_URL'
            }
          ]
        : []),
      ...(process.env.PRODUCTION_API_URL
        ? [
            {
              url: process.env.PRODUCTION_API_URL,
              description: 'Production API URL'
            }
          ]
        : []),
      // Local development fallback with dynamic port
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
              maxLength: 30,
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            avatar: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  description: 'Cloudinary public ID',
                  example: 'avatars/user_123_abc'
                },
                url: {
                  type: 'string',
                  description: 'Avatar URL',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/user_123_abc.jpg'
                }
              }
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update date',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            token: {
              type: 'string',
              description: 'JWT token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZjdiM2IzYjNiM2IzYjNiM2IzYjMiLCJpYXQiOjE2MjY3MjQwMDAsImV4cCI6MTYyNzMzODgwMH0.example_signature'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: {
                    type: 'string'
                  },
                  param: {
                    type: 'string'
                  },
                  location: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        UploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'File uploaded successfully'
            },
            data: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  description: 'Cloudinary public ID',
                  example: 'images/file_123_abc'
                },
                url: {
                  type: 'string',
                  description: 'File URL',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/images/file_123_abc.jpg'
                },
                width: {
                  type: 'number',
                  description: 'File width',
                  example: 1920
                },
                height: {
                  type: 'number',
                  description: 'File height',
                  example: 1080
                },
                format: {
                  type: 'string',
                  description: 'File format',
                  example: 'jpg'
                },
                bytes: {
                  type: 'number',
                  description: 'File size in bytes',
                  example: 1048576
                },
                duration: {
                  type: 'number',
                  description: 'Video duration (for videos only)',
                  example: 120.5
                }
              }
            }
          }
        },
        PaginatedUsers: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              example: 10
            },
            total: {
              type: 'integer',
              example: 50
            },
            page: {
              type: 'integer',
              example: 1
            },
            pages: {
              type: 'integer',
              example: 5
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        HeroImage: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            image: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'hero-images/hero_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/hero-images/hero_123_abc.jpg'
                }
              }
            },
            mobileImage: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'hero-images/hero_mobile_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/hero-images/hero_mobile_123_abc.jpg'
                }
              }
            },
            title: {
              type: 'string',
              example: 'Welcome to Our Dental Clinic'
            },
            description: {
              type: 'string',
              example: 'Professional dental care for your family'
            },
            textColor: {
              type: 'string',
              example: '#FFFFFF'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        HeroVideo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            video: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'hero-videos/hero_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/video/upload/v1234567890/hero-videos/hero_123_abc.mp4'
                }
              }
            },
            title: {
              type: 'string',
              example: 'Our Dental Services'
            },
            description: {
              type: 'string',
              example: 'Watch our comprehensive dental care services'
            },
            textColor: {
              type: 'string',
              example: '#FFFFFF'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Partner: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            image: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'partners/partner_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/partners/partner_123_abc.png'
                }
              }
            },
            partnerName: {
              type: 'string',
              example: 'Dental Equipment Co.'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Team: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            name: {
              type: 'string',
              example: 'Dr. John Smith'
            },
            designation: {
              type: 'string',
              example: 'Chief Dental Surgeon'
            },
            speciality: {
              type: 'string',
              example: 'Orthodontics and Cosmetic Dentistry'
            },
            image: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'team/team_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/team/team_123_abc.jpg'
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        FAQ: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            question: {
              type: 'string',
              example: 'What are your office hours?'
            },
            answer: {
              type: 'string',
              example: 'Our office is open Monday through Friday from 9 AM to 6 PM, and Saturday from 9 AM to 2 PM.'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Feedback: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            username: {
              type: 'string',
              example: 'John Doe'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5
            },
            title: {
              type: 'string',
              example: 'Excellent Service!'
            },
            description: {
              type: 'string',
              example: 'The dental care was outstanding. Highly recommended!'
            },
            status: {
              type: 'string',
              enum: ['enable', 'disable'],
              example: 'enable'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            cardInfo: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  example: 'Dental Implants'
                },
                description: {
                  type: 'string',
                  example: 'Professional dental implant services'
                },
                image: {
                  type: 'object',
                  properties: {
                    public_id: {
                      type: 'string',
                      example: 'services/service_123_abc'
                    },
                    url: {
                      type: 'string',
                      example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/services/service_123_abc.jpg'
                    }
                  }
                }
              }
            },
            serviceBlog: {
              type: 'object',
              properties: {
                heroImage: {
                  type: 'object',
                  properties: {
                    public_id: {
                      type: 'string',
                      example: 'services/hero_123_abc'
                    },
                    url: {
                      type: 'string',
                      example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/services/hero_123_abc.jpg'
                    }
                  }
                },
                title: {
                  type: 'string',
                  example: 'Complete Guide to Dental Implants'
                },
                description: {
                  type: 'string',
                  example: 'Everything you need to know about dental implants'
                },
                paras: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      heading: {
                        type: 'string',
                        example: 'What are Dental Implants?'
                      },
                      content: {
                        type: 'string',
                        example: 'Dental implants are artificial tooth roots...'
                      }
                    }
                  }
                },
                pointParas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      heading: {
                        type: 'string',
                        example: 'Benefits'
                      },
                      sentences: {
                        type: 'array',
                        items: {
                          type: 'string',
                          example: 'Painless procedure'
                        }
                      }
                    }
                  }
                },
                youtubeLinks: {
                  type: 'array',
                  items: {
                    type: 'string',
                    example: 'https://youtube.com/watch?v=abc123'
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Blog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            cardInfo: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  example: 'Dental Care Tips'
                },
                description: {
                  type: 'string',
                  example: 'Essential tips for maintaining oral health'
                },
                image: {
                  type: 'object',
                  properties: {
                    public_id: {
                      type: 'string',
                      example: 'blogs/blog_123_abc'
                    },
                    url: {
                      type: 'string',
                      example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/blogs/blog_123_abc.jpg'
                    }
                  }
                }
              }
            },
            blogContent: {
              type: 'object',
              properties: {
                heroImage: {
                  type: 'object',
                  properties: {
                    public_id: {
                      type: 'string',
                      example: 'blogs/hero_123_abc'
                    },
                    url: {
                      type: 'string',
                      example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/blogs/hero_123_abc.jpg'
                    }
                  }
                },
                title: {
                  type: 'string',
                  example: 'Complete Guide to Oral Hygiene'
                },
                description: {
                  type: 'string',
                  example: 'Everything you need to know about maintaining good oral health'
                },
                paras: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      heading: {
                        type: 'string',
                        example: 'Brushing Techniques'
                      },
                      content: {
                        type: 'string',
                        example: 'Proper brushing is essential...'
                      }
                    }
                  }
                },
                pointParas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      heading: {
                        type: 'string',
                        example: 'Daily Routine'
                      },
                      sentences: {
                        type: 'array',
                        items: {
                          type: 'string',
                          example: 'Brush twice daily'
                        }
                      }
                    }
                  }
                },
                youtubeLinks: {
                  type: 'array',
                  items: {
                    type: 'string',
                    example: 'https://youtube.com/watch?v=abc123'
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        ClinicInfo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            name: {
              type: 'string',
              example: 'Dr. Samiullah Dental Clinic'
            },
            noOfExperience: {
              type: 'integer',
              example: 15
            },
            noOfPatients: {
              type: 'integer',
              example: 5000
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890'
            },
            location1: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  example: 'https://maps.google.com/...'
                },
                description: {
                  type: 'string',
                  example: '123 Main Street, City, State 12345'
                }
              }
            },
            location2: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  example: 'https://maps.google.com/...'
                },
                description: {
                  type: 'string',
                  example: '456 Second Street, City, State 12345'
                }
              }
            },
            socialLinks: {
              type: 'object',
              properties: {
                facebook: {
                  type: 'string',
                  example: 'https://facebook.com/dentalclinic'
                },
                instagram: {
                  type: 'string',
                  example: 'https://instagram.com/dentalclinic'
                }
              }
            },
            email: {
              type: 'string',
              example: 'info@dentalclinic.com'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        TeamPicture: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60f7b3b3b3b3b3b3b3b3b3b3'
            },
            teamName: {
              type: 'string',
              example: 'Our Amazing Team'
            },
            description: {
              type: 'string',
              example: 'Meet our dedicated team of dental professionals'
            },
            picture: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                  example: 'team-pictures/team_123_abc'
                },
                url: {
                  type: 'string',
                  example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/team-pictures/team_123_abc.jpg'
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-07-20T15:45:00.000Z'
            }
          }
        },
        Feature: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            featureName: {
              type: 'string',
              maxLength: 100,
              example: 'Innovative Equipment'
            },
            featureDescription: {
              type: 'string',
              maxLength: 100,
              example: 'We use cutting-edge technology for diagnosis and treatment'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
