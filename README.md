# ✈️ Travel Planner API

A comprehensive REST API for planning, organizing, and managing travel itineraries. Built with Node.js, Express, TypeScript, MongoDB, and integrated with Amadeus API for real-time flight and hotel data.

## 📋 Overview

Travel Planner is a full-stack web application backend designed to help users plan, organize, and manage their travel itineraries effortlessly. The API provides comprehensive endpoints for user authentication, trip management, flight/hotel search, itinerary planning, and PDF export functionality.

### 🔗 The Frontend Repository URL:

<https://github.com/doumbiasoft/travel-planner-frontend>

## ✨ Features

- 🔐 **User Authentication**: JWT-based authentication with access and refresh tokens
- 🔑 **OAuth 2.0**: Google OAuth integration
- 🗺️ **Trip Management**: Create, read, update, and delete trips with detailed itineraries
- ✈️ **Flight & Hotel Search**: Real-time flight and hotel offers via Amadeus API
- 💡 **Smart Recommendations**: Budget-based package recommendations
- ⚡ **Offer Caching**: Intelligent caching system reduces API costs by up to 90%
- 📄 **PDF Export**: Generate detailed trip itineraries as PDF documents
- 📧 **Email Notifications**: Account activation, password reset, price drop alerts, and contact support
- 💰 **Price Monitoring**: Automatic price tracking with cron jobs (every 6 hours)
- 🗺️ **Interactive Maps**: Support for map markers and location tracking
- 👥 **Collaborative Planning**: Support for trip collaborators

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **API Integration**: Amadeus API for flight/hotel data
- **PDF Generation**: PDFKit
- **Email**: Nodemailer
- **Validation**: Custom validation middleware
- **Documentation**: OpenAPI/Swagger with Scalar UI
- **Caching**: node-cache
- **Logging**: Winston & Morgan

## 🚀 Getting Started

### 📦 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Amadeus API credentials
- SMTP server for emails

### ⚙️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd travel-planner-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the project
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### 📜 Scripts

- `npm run dev` - Run development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run serve` - Build and start production server

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/travel-planner

# JWT Secrets
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
MAIL_FROM=noreply@travelplanner.com
MAIL_FROM_NAME=Travel Planner

# Amadeus API Mode (test | production)
# Controls which Amadeus credentials to use
AMADEUS_MODE=test

# Amadeus API (Development/Test)
AMADEUS_KEY=your-amadeus-dev-api-key
AMADEUS_SECRET=your-amadeus-dev-api-secret

# Amadeus API (Production)
AMADEUS_PROD_KEY=your-amadeus-prod-api-key
AMADEUS_PROD_SECRET=your-amadeus-prod-api-secret

# Contact Information
CONTACT_NAME=Your Name
CONTACT_EMAIl=contact@travelplanner.com
```

## 💾 Database Models

### 👤 User Model

```typescript
{
  _id: ObjectId,
  firstName: string,          // 3-50 characters
  lastName: string,           // 3-50 characters
  email: string,              // Unique, lowercase
  password: string,           // Hashed with bcrypt
  oauthProvider: string,      // "Google" or empty
  oauthUid: string,           // OAuth user ID
  oauthPicture: string,       // Profile picture URL
  isOauth: boolean,           // OAuth user flag
  passwordResetToken: string, // Token for password reset
  activationToken: string,    // Token for account activation
  isActive: boolean,          // Account activation status
  isAdmin: boolean,           // Admin role flag
  createdAt: Date,
  updatedAt: Date
}
```

### 🗺️ Trip Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to User
  tripName: string,
  origin: string,                      // City name
  originCityCode: string,              // IATA code
  destination: string,                 // City name
  destinationCityCode: string,         // IATA code
  startDate: Date,
  endDate: Date,
  budget: number,                      // Min: 0
  days: [
    {
      _id: ObjectId,
      date: Date,
      events: [
        {
          _id: ObjectId,
          kind: "flight" | "hotel" | "activity" | "dining" | "transport",
          title: string,
          startTime: Date,
          endTime: Date,
          cost: number,
          location: {
            lat: number,
            lng: number,
            address: string
          },
          meta: any                    // Flexible metadata
        }
      ]
    }
  ],
  markers: [
    {
      _id: ObjectId,
      lat: number,
      lng: number,
      label: string
    }
  ],
  preferences: {
    flexibleDates: boolean,
    adults: number,                    // Min: 1
    children: number,                  // Min: 0
    infants: number,                   // Min: 0
    travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
  },
  flightOptions: Array<any>,           // Cached Amadeus flight data
  hotelOptions: Array<any>,            // Cached Amadeus hotel data
  notifications: {
    priceDrop: boolean,
    email: boolean
  },
  validationStatus: {
    isValid: boolean,
    reason: string | null,
    lastChecked: Date | null
  },
  collaborators: [ObjectId],           // References to User
  createdAt: Date,
  updatedAt: Date
}
```

### 📧 EmailBox Model

```typescript
{
  _id: ObjectId,
  from: {
    name: string,
    email: string
  },
  to: {
    name: string,
    email: string
  } | Array<{name: string, email: string}>,
  cc?: Array<{name: string, email: string}>,
  bcc?: Array<{name: string, email: string}>,
  subject: string,
  content: string,                     // HTML content
  attachments: [
    {
      filename: string,
      path?: string,                   // File path on disk
      content?: Buffer | string,       // Inline content
      contentType?: string             // MIME type
    }
  ],
  sent: boolean,                       // Email sent status
  createdAt: Date,
  updatedAt: Date
}
```

## 📚 API Documentation

**Base URL**: `http://localhost:3001/api`

**API Version**: v1

All API endpoints are prefixed with `/api/v1/`.

### 🔒 Authentication

All authenticated endpoints require an `Authorization` header with a JWT token:

```
Authorization: Bearer <access-token>
```

**Token Expiration**:

- Access Token: 15 minutes
- Refresh Token: 7 days (HTTP-only cookie)

---

## 🔌 API Endpoints

### 🔑 Authentication

#### POST `/api/v1/auth/register`

Register a new user account.

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Sends activation email to user
- Password is hashed with bcrypt (10 rounds)
- Email must be unique
- First name and last name: 3-50 characters

---

#### POST `/api/v1/auth/login`

Sign in an existing user.

**Request Body**:

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes**:

- Sets `refreshToken` as HTTP-only cookie
- Account must be activated before login
- Returns 401 if credentials are invalid or account not activated

---

#### POST `/api/v1/auth/refresh-token`

Get a new access token using refresh token.

**Request**: Requires `refreshToken` cookie (automatically sent by browser)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Refresh token regenerated successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### POST `/api/v1/auth/logout`

Log out the current user.

**Response** (200 OK):

```json
{
  "success": true,
  "message": "User logout successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Clears the `refreshToken` cookie

---

#### PATCH `/api/v1/auth/activate`

Activate user account with token from email.

**Request Body**:

```json
{
  "accountActivationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "User account activated successfully",
  "data": {
    "ok": true
  }
}
```

---

#### POST `/api/v1/auth/forgot-password`

Request password reset email.

**Request Body**:

```json
{
  "email": "john.doe@example.com"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Reset password email has been sent successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Sends password reset email with token
- Token expires in 15 minutes

---

#### POST `/api/v1/auth/change-password-token-validation`

Validate password reset token.

**Request Body**:

```json
{
  "passwordResetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Valid Token",
  "data": {
    "ok": true
  }
}
```

---

#### PATCH `/api/v1/auth/change-password`

Change password using reset token.

**Request Body**:

```json
{
  "passwordResetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewSecurePassword123"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "ok": true
  }
}
```

---

#### GET `/api/v1/auth/me`

Get current user information.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched user info successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "isActive": true,
      "isAdmin": false,
      "isOauth": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

#### POST `/api/v1/auth/verify-current-password`

Verify the current user's password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "password": "CurrentPassword123"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Password matched",
  "data": {
    "ok": true
  }
}
```

---

#### PATCH `/api/v1/auth/update-profile`

Update user profile (first name, last name).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Both fields are optional (can update one or both)
- Must be 3-50 characters each

---

#### PATCH `/api/v1/auth/update-password`

Update user password (requires current password verification).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword456"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "ok": true
  }
}
```

---

#### DELETE `/api/v1/auth/delete-account`

Delete user account and all associated data.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "email": "john.doe@example.com"
}
```

**Response** (204 No Content):

```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Permanently deletes user account and all trips
- Email must match authenticated user's email

---

#### POST `/api/v1/auth/oauth-google`

Sign in or sign up using Google OAuth.

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@gmail.com",
  "oauthUid": "google-user-id-12345",
  "oauthProvider": "Google",
  "oauthPicture": "https://example.com/photo.jpg"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes**:

- Creates new user if email doesn't exist
- Updates existing user info if email exists
- Account is automatically activated
- Sets `refreshToken` cookie

---

### 🗺️ Trip Management

#### GET `/api/v1/trips`

Get all trips for the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched all trips for a user successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "tripName": "Summer Vacation to Paris",
      "origin": "New York",
      "originCityCode": "NYC",
      "destination": "Paris",
      "destinationCityCode": "PAR",
      "startDate": "2024-07-01T00:00:00.000Z",
      "endDate": "2024-07-10T00:00:00.000Z",
      "budget": 5000,
      "days": [],
      "markers": [],
      "preferences": {
        "flexibleDates": false,
        "adults": 2,
        "children": 0,
        "infants": 0,
        "travelClass": "ECONOMY"
      },
      "flightOptions": [],
      "hotelOptions": [],
      "notifications": {
        "priceDrop": true,
        "email": true
      },
      "validationStatus": {
        "isValid": true,
        "reason": null,
        "lastChecked": "2024-01-15T10:30:00.000Z"
      },
      "collaborators": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Notes**:

- Returns trips sorted in descending order by creation date

---

#### GET `/api/v1/trips/:id`

Get a single trip by ID.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `id` - Trip ID (MongoDB ObjectId)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched a trip successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "tripName": "Summer Vacation to Paris",
    "origin": "New York",
    "originCityCode": "NYC",
    "destination": "Paris",
    "destinationCityCode": "PAR",
    "startDate": "2024-07-01T00:00:00.000Z",
    "endDate": "2024-07-10T00:00:00.000Z",
    "budget": 5000,
    "days": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "date": "2024-07-01T00:00:00.000Z",
        "events": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "kind": "flight",
            "title": "Flight to Paris",
            "startTime": "2024-07-01T08:00:00.000Z",
            "endTime": "2024-07-01T20:00:00.000Z",
            "cost": 800,
            "location": {
              "lat": 48.8566,
              "lng": 2.3522,
              "address": "Charles de Gaulle Airport"
            },
            "meta": {}
          }
        ]
      }
    ],
    "markers": [],
    "preferences": {
      "flexibleDates": false,
      "adults": 2,
      "children": 0,
      "infants": 0,
      "travelClass": "ECONOMY"
    },
    "flightOptions": [],
    "hotelOptions": [],
    "notifications": {
      "priceDrop": true,
      "email": true
    },
    "validationStatus": {
      "isValid": true,
      "reason": null,
      "lastChecked": "2024-01-15T10:30:00.000Z"
    },
    "collaborators": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### POST `/api/v1/trips`

Create a new trip.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "tripName": "Summer Vacation to Paris",
  "origin": "New York",
  "originCityCode": "NYC",
  "destination": "Paris",
  "destinationCityCode": "PAR",
  "startDate": "2024-07-01",
  "endDate": "2024-07-10",
  "budget": 5000,
  "preferences": {
    "flexibleDates": false,
    "adults": 2,
    "children": 0,
    "infants": 0,
    "travelClass": "ECONOMY"
  },
  "notifications": {
    "priceDrop": true,
    "email": true
  }
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Added a trip successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- All fields except `markers`, `preferences`, and `notifications` are required
- Budget must be >= 0
- User ID is automatically set from authenticated user

---

#### PATCH `/api/v1/trips/:id`

Update an existing trip.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `id` - Trip ID (MongoDB ObjectId)

**Request Body**:

```json
{
  "tripId": "507f1f77bcf86cd799439011",
  "tripName": "Updated Summer Vacation to Paris",
  "origin": "New York",
  "originCityCode": "NYC",
  "destination": "Paris",
  "destinationCityCode": "PAR",
  "startDate": "2024-07-05",
  "endDate": "2024-07-15",
  "budget": 6000,
  "preferences": {
    "flexibleDates": true,
    "adults": 2,
    "children": 1,
    "infants": 0,
    "travelClass": "BUSINESS"
  }
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Updated a trip successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- `tripId` in body must match `:id` in URL
- Automatically validates flight/hotel offers if dates change
- All trip fields are required

---

#### DELETE `/api/v1/trips/:id`

Delete a trip.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `id` - Trip ID (MongoDB ObjectId)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Updated a trip successfully",
  "data": {
    "ok": true
  }
}
```

---

#### GET `/api/v1/trips/:tripId/markers`

Get all markers for a specific trip.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `tripId` - Trip ID (MongoDB ObjectId)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched all trips for a user successfully",
  "data": {
    "markers": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "lat": 48.8566,
        "lng": 2.3522,
        "label": "Eiffel Tower"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "lat": 48.8606,
        "lng": 2.3376,
        "label": "Louvre Museum"
      }
    ]
  }
}
```

---

#### POST `/api/v1/trips/:tripId/markers/add`

Add a marker to a trip.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `tripId` - Trip ID (MongoDB ObjectId)

**Request Body**:

```json
{
  "lat": 48.8566,
  "lng": 2.3522,
  "label": "Eiffel Tower"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Added a trip successfully",
  "data": {
    "ok": true
  }
}
```

---

### ✈️ Amadeus Integration

#### GET `/api/v1/amadeus/city-code`

Search for cities and airports by keyword.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `keyword` (required) - Search keyword (e.g., "Paris", "New York")

**Example**: `/api/v1/amadeus/city-code?keyword=Paris`

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched all cities successfully",
  "data": [
    {
      "name": "Paris",
      "iataCode": "PAR"
    },
    {
      "name": "Paris Charles de Gaulle Airport",
      "iataCode": "CDG"
    },
    {
      "name": "Paris Orly Airport",
      "iataCode": "ORY"
    }
  ]
}
```

**Notes**:

- Results are cached for 1 hour
- Searches both cities and airports
- Returns name and IATA code

---

#### GET `/api/v1/amadeus/search`

Search for flight and hotel offers with smart recommendations and caching support.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `originCityCode` (required) - Origin IATA code (e.g., "NYC")
- `destinationCityCode` (required) - Destination IATA code (e.g., "PAR")
- `startDate` (required) - Departure date (YYYY-MM-DD)
- `endDate` (required) - Return date (YYYY-MM-DD)
- `budget` (required) - Maximum budget in USD
- `tripId` (optional) - Trip ID to save results to
- `adults` (optional) - Number of adults (default: 1)
- `children` (optional) - Number of children (default: 0)
- `infants` (optional) - Number of infants (default: 0)
- `travelClass` (optional) - Travel class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
- `refreshOffers` (optional) - Boolean to force refresh from Amadeus API (default: false)

**Example**:

```
/api/v1/amadeus/search?originCityCode=NYC&destinationCityCode=PAR&startDate=2024-07-01&endDate=2024-07-10&budget=5000&adults=2&travelClass=ECONOMY
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Fetched recommended offers successfully",
  "data": {
    "tip": "Recommended: flight $850.00 USD + hotel $1,200.00 USD",
    "recommended": {
      "flight": {
        "id": "1",
        "price": {
          "total": "850.00",
          "currency": "USD"
        },
        "itineraries": [
          {
            "segments": [
              {
                "departure": {
                  "iataCode": "JFK",
                  "at": "2024-07-01T08:00:00"
                },
                "arrival": {
                  "iataCode": "CDG",
                  "at": "2024-07-01T20:00:00"
                },
                "carrierCode": "AF",
                "number": "007"
              }
            ]
          }
        ]
      },
      "hotel": {
        "name": "Hotel Example Paris",
        "hotelId": "HOTEL123",
        "geoCode": {
          "latitude": 48.8566,
          "longitude": 2.3522
        },
        "address": {
          "lines": ["123 Rue de Example"],
          "cityName": "Paris"
        },
        "offers": [
          {
            "price": {
              "total": "1200.00",
              "currency": "USD"
            }
          }
        ]
      },
      "currency": "USD",
      "flightPrice": "850.00",
      "hotelPrice": "1200.00",
      "combinedPrice": 2050.0,
      "fitsBudget": true
    },
    "flights": [
      // Array of up to 6 flight offers
    ],
    "hotels": [
      // Array of up to 6 hotel offers
    ],
    "currency": "USD"
  }
}
```

**Notes**:

- Returns up to 6 flight offers and 6 hotel offers
- Provides smart package recommendation based on budget
- If `tripId` is provided, saves results to trip and updates validation status
- Validates trip dates are in the future
- Uses scoring algorithm to find best flight+hotel combination within budget
- **Caching Behavior**:
  - When `refreshOffers=false` (default) and `tripId` is provided: Returns cached `flightOptions` and `hotelOptions` from the Trip collection (no Amadeus API call)
  - When `refreshOffers=true`: Fetches fresh data from Amadeus API and updates the Trip collection cache
  - Response includes `cached: true/false` field indicating data source
  - Significantly reduces API costs and improves response times
  - Price monitoring cron job automatically updates cached offers every 6 hours for trips with price drop notifications enabled

---

### 📄 PDF Export

#### GET `/api/v1/pdf/export/:tripId`

Export a trip itinerary as a PDF document.

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:

- `tripId` - Trip ID (MongoDB ObjectId)

**Response**: PDF file download

**Response Headers**:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename=Summer Vacation to Paris.pdf
```

**PDF Contents**:

- Trip title
- Trip information (destination, dates, budget)
- Recommended travel package (flight and hotel details)
- Package summary with pricing
- Daily itinerary with events
- Map markers list

**Notes**:

- Generates a professionally formatted PDF with PDFKit
- Includes flight details (outbound/return flights, stops, times)
- Includes hotel details (name, address, price, location)
- Shows budget compliance status
- Lists all daily events with costs
- Displays map markers with coordinates

---

### 📧 Email/Mailbox

#### POST `/api/v1/mailbox`

Send a contact/support email to the Travel Planner team.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "subject": "Question about my trip",
  "content": "I have a question about updating my trip dates...",
  "filePaths": ["/path/to/attachment1.pdf", "/path/to/attachment2.jpg"]
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "ok": true
  }
}
```

**Notes**:

- Sends email to configured contact email address
- Uses HTML template with user information
- Supports file attachments via `filePaths` array
- `filePaths` is optional
- Email includes user's name and email for easy reply
- Email is queued in EmailBox collection for processing by cron job

---

## ⚠️ Error Handling

All API errors follow a consistent format:

### 🚫 Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### 📊 HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data or missing required fields
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., duplicate email)
- `500 Internal Server Error` - Server error

### Common Error Messages

**Authentication Errors**:

- `"No token"` - Missing Authorization header
- `"Invalid token"` - Expired or malformed JWT token
- `"Unauthorized"` - User not authenticated
- `"Invalid credentials"` - Wrong email or password
- `"Account not activated. Please check your email for activation link."` - Account pending activation

**Validation Errors**:

- `"Missing fields"` - Required fields not provided
- `"Email not found"` - Email doesn't exist in database
- `"This email address is already in use. Please choose a different email"` - Duplicate email on registration
- `"Keyword is required"` - Missing search keyword
- `"Param id field missing"` - Missing URL parameter
- `"Resource not found"` - Trip ID mismatch

**Token Errors**:

- `"No refresh token"` - Refresh token cookie missing
- `"Invalid/expired refresh token"` - Refresh token invalid
- `"Token expired"` - Password reset token expired
- `"Expired link"` - Activation or reset link expired

---

## 📖 API Documentation UI

The API includes interactive documentation powered by OpenAPI/Swagger:

### Scalar UI (Modern)

```
http://localhost:3001/docs
```

### Swagger UI (Traditional)

```
http://localhost:3001/swagger
```

### OpenAPI Spec (JSON)

```
http://localhost:3001/api-docs
```

---

## 🎯 Additional Features

### ⚡ Caching

**City Search Caching:**

- City search results are cached for 1 hour using `node-cache`
- Reduces API calls to Amadeus
- Improves response times for repeated searches

**Offer Caching:**

- Flight and hotel offers are cached in the Trip collection (`flightOptions` and `hotelOptions` fields)
- By default, the `/api/v1/amadeus/search` endpoint returns cached offers when available
- Use `refreshOffers=true` query parameter to fetch fresh data from Amadeus API
- Cache is automatically updated by:
  - Manual refresh requests from users
  - Trip updates that change search parameters (dates, origin, destination, budget, preferences)
  - Price monitoring cron job (every 6 hours for trips with notifications enabled)
- Reduces Amadeus API costs by up to 90%
- Provides instant load times for trip detail pages

### 📧 Email Templates

Email templates are stored in the file system and support variable replacement:

- Account activation email
- Password reset email
- Contact support email

Template variables:

- `%Name%` - User's first name
- `%Link%` - Action link (activation, password reset)
- `%firstName%`, `%lastName%`, `%email%` - User details
- `%Message%` - User message content

### 💰 Price Monitoring (Cron Jobs)

The application includes background cron jobs for:

**Email Processing Cron** (runs every 5 seconds):

- Processes queued emails from EmailBox collection
- Sends emails via SMTP with transaction support
- Marks emails as sent on success

**Email Cleanup Cron** (runs every weekday at 9 AM):

- Deletes sent emails to prevent database bloat

**Price Check Cron** (runs every 6 hours):

- Fetches current flight and hotel prices from Amadeus API for trips with `notifications.priceDrop: true`
- Compares with cached prices in `flightOptions` and `hotelOptions`
- Sends email notification if price drops ≥ 5%
- Updates trip cache with fresh offers (`flightOptions` and `hotelOptions`)
- Updates trip `validationStatus` field
- Respects user notification preferences (`notifications.email` must also be true)
- Only checks trips with future dates

### 📝 Logging

- Request logging via Morgan (development mode)
- Application logging via Winston
- Logs include timestamps, request details, and errors

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-only Cookies**: Refresh tokens stored securely
- **CORS**: Configured to allow only specific client origin
- **Input Validation**: Custom validation middleware for all endpoints
- **Email Validation**: Pattern matching and uniqueness checks
- **Secure Cookies**: Enabled in production environment

---

## 👨‍💻 Development

### 📁 Project Structure

```
src/
├── config/           # Configuration files (env, amadeus, api prefix)
├── controllers/      # Route controllers (v1)
│   └── v1/          # API version 1 controllers
├── cron/            # Cron job definitions
├── db/              # Database configuration
├── middlewares/     # Custom middleware (auth, validation, logging)
├── models/          # Mongoose models
├── routes/          # Route registration
│   └── v1/         # API version 1 routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Helper utilities
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```
