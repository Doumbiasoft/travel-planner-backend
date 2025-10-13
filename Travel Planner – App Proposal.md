# ✈️ **Travel Planner – App Proposal**

### 📘 Overview

**Travel Planner** is a full-stack web application designed to help users plan, organize, and manage their travel itineraries effortlessly.
Users can create personalized trip plans with destinations, budgets, and schedules; visualize locations on interactive maps; receive recommendations for flights, hotels, and activities; and export their final itineraries as shareable PDFs.

The platform includes secure authentication, real-time notifications, and budget-aware smart suggestions.

---

## 🎯 **Objectives**

- Simplify the trip-planning process through automation and intelligent suggestions.
- Provide an all-in-one dashboard to manage travel logistics—flights, hotels, activities.
- Integrate third-party travel APIs for real-time data.
- Deliver a modern, responsive experience for users on web and mobile.
- Enable collaboration by allowing trip sharing and export.

---

## 💡 **Key Features**

| Feature                         | Description                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| **User Authentication**         | JWT-based access & refresh tokens with secure cookies, register/login/logout flow.    |
| **Profile Management**          | Store and manage user data, preferences, and saved itineraries.                       |
| **Itinerary Builder**           | CRUD operations for trips, days, events, and budgets stored in MongoDB.               |
| **Interactive Map Integration** | Google Maps API to visualize destinations, add markers, and drag-and-drop activities. |
| **Travel Assistant**            | Uses Amadeus API + logic to suggest flight/hotel options within user budget.          |
| **PDF Export**                  | Generates downloadable trip itineraries via PDF.                                      |
| **Notifications**               | Node.js scheduled jobs notify users of flight price drops or hotel availability.      |
| **Collaboration & Sharing**     | Share trip itineraries via invite links or export as PDFs.                            |

---

## 🏗️ **System Architecture**

```
Frontend (React + TypeScript + Tailwind)
        │
        ▼
Backend (Node.js + Express)
        │
        ▼
Database (MongoDB Atlas)
        │
        ▼
External APIs (Amadeus, Google Maps)
```

---

### **1️⃣ Frontend Layer**

- **Framework:** React.js + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State Management:** Context API (global user context)
- **Libraries:**

  - axios → API calls
  - react-google-maps/api → map rendering
  - jsPDF → PDF generation
  - react-hook-form → form handling
  - zod for form validation

**Key Pages**

- Register
- Login
- Reset password Page
- Dashboard (list trips)
- Trip Editor (map, daily events)
- Recommendations Page
- PDF Preview / Export

---

### **2️⃣ Backend Layer**

- **Runtime:** Node.js (v22+)
- **Framework:** Express.js
- **Authentication:** bcryptjs + JWT + HTTP-only cookies
- **Database:** MongoDB Atlas with Mongoose ODM
- **External Integrations:**

  - Amadeus API – Flights & Hotels data
  - Google Maps API – Places & Geolocation

- **Utilities:** nodemailer, node-cron (notifications)

**Routes(Not Comprehensive Routes)**

| Route                      | Method                | Description                           |
| -------------------------- | --------------------- | ------------------------------------- |
| `/api/auth/register`       | POST                  | Create account, return tokens         |
| `/api/auth/login`          | POST                  | Authenticate user                     |
| `/api/auth/oauth-google`   | POST                  | Authenticate user with Google account |
| `/api/auth/reset-password` | POST                  | Reset the account password            |
| `/api/auth/activate`       | POST                  | Account verification                  |
| `/api/auth/refresh-token`  | POST                  | Refresh access token                  |
| `/api/auth/me`             | GET                   | Get user info                                         |
| `/api/trips`               | POST GET PATCH DELETE | Full CRUD endpoint                    |
| `/api/amadeus/search`      | GET                   | Fetch flights under budget            |
| `/api/pdf/export/:tripId`  | GET                   | Generate trip PDF                     |

---

### **3️⃣ Database Design (MongoDB Not Comprehensive)**

#### **User Collection**

```js
{
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  oauthProvider: string;
  oauthUid: string;
  oauthPicture: string;
  isOauth: boolean;
  passwordResetToken: string;
  activationToken: string;
  isActive: boolean;
  isAdmin: false;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Trip Collection**

```js
 Event {
  _id: string;
  kind: ["flight", "hotel", "activity", "dining", "transport"];
  title: string;
  startTime: Date;
  endTime: Date;
  cost: number;
  location: {
    lat: number,
    lng: number,
    address: string,
  };
  meta: unknown;
}
 Day  {
  _id: string;
  date: Date;
  events: [Event];
}

Marker {
  _id: string;
  lat: number;
  lng: number;
  label: string;
}

 Trip  {
  _id: string;
  userId: string;
  tripName: string;
  origin: string;
  originCityCode: String;
  destination: String;
  destinationCityCode: String;
  startDate: Date;
  endDate: Date;
  budget: number;
  days: [Day];
  markers: [Marker];
  preferences: {
    flexibleDates: boolean,
    maxStops: number,
  };
  flightOptions: [unknown];
  hotelOptions: [unknown];
  notifications: {
    priceDrop: boolean,
    email: boolean,
  };
  collaborators: [string];
  createdAt: Date;
}
```

#### **Mailing Collection**

```js
EmailAddress{
  name: string;
  email: string;
}
Attachment{
  filename: string;
  path?: string; // file path on disk
  content?: Buffer | string; // inline file content
  contentType?: string; // optional MIME type
}
EmailBox{
  _id: string;
  from?: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  content: string;
  attachments?: Attachment[];
  sent?: boolean;
}
```

---

## 🧠 **Recommendation Logic**

**Inputs:**

- Destination
- Dates
- Budget
- Origin

**Process:**

1. Query **Amadeus Flight Offers API** for round-trip flights under budget.
2. Query **Amadeus Hotel Offers API** for matching accommodation dates.
3. Calculate combined cost → filter under total budget.
4. Filtered results to summarize best option textually.
5. Store summary (`flightTip`) in itinerary.

**Sample Output:**

```
Found 3 round-trip flights to Paris under $900. Cheapest: $520 with Delta + Hotel de la Ville ($330 total). You’ll stay within your $1,000 budget.
```

---

## 🗺️ **Map Integration**

**Library:** `@react-google-maps/api`

- Displays trip destination and activity markers.
- Allows users to drag, drop, and save custom pins (latitude, longitude, label).
- Data stored in itinerary document under `markers`.

---

## 🧾 **PDF Export Feature**

- Fetch itinerary data from `/api/itineraries/:id`.
- Generate formatted PDF including trip title, daily plans, markers summary, and tips.
- Allow export/share.

---

## 🔐 **Security Highlights**

- JWT + Refresh tokens (HTTP-only cookies)
- Encrypted passwords with bcrypt
- CORS protection
- Input validation with Mongoose schemas
- Secure API keys via `.env`

---

## 🚀 **Deployment Plan**

- **Frontend:** Netlify
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Environment variables:** managed via `.env` in both environments
- **Domain:** `travel-planner` (example)

---

## 📊 **Future Enhancements**

- Group trip collaboration
- Calendar sync (Google Calendar)
- In-app messaging between co-travelers
- Mobile app (Flutter / .NET MAUI)
