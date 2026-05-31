# Soleviaaa - Mental Health & Wellness Platform

Soleviaaa is a comprehensive mental health and wellness platform designed to provide users with tools to track their personal growth, habits, and emotional well-being with a supportive community.

##  Features

###  User Management & Security
- **Secure Auth:** JWT-based authentication with signup, login, and email verification.
- **Privacy:** Pin lock for sensitive sections like Journal and Memory Capsules.
- **Profile:** Customizable user profiles with achievement badges and activity stats.
- **Encrypted Messaging:** Peer-to-peer messages are encrypted using AES-256 before being saved to the database.

###  Community & Support
- **Community Feed:** Share thoughts, images, and experiences. React and comment on others' posts.
- **Support Groups:** Join interest-based groups, participate in group chats, and attend group sessions.
- **Moderation:** Dedicated tools for group moderators to manage members and reports.

###  Personal Wellness Tools
- **Journaling:** A rich-text editor (TipTap) for private thoughts and reflections.
- **Mood Tracking:** Daily mood check-ins with visual trends and distribution charts.
- **Habit & Goal Tracking:** Set daily habits and long-term goals with progress visualization.
- **Memory Capsule:** Save digital memories to be "opened" at a future date.

###  Analytics & Gamification
- **Activity Insights:** Detailed charts showing mood trends and engagement levels.
- **Gamification:** Earn points and badges for staying consistent with habits and participating in challenges.

---

##  Tech Stack

### Frontend
- **Framework:** React 19
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **Charts:** Chart.js, Recharts
- **State & Data:** TanStack Query (React Query), Axios
- **Real-time:** Socket.io-client
- **Editor:** TipTap Rich Text Editor

### Backend
- **Environment:** Node.js, Express
- **Database:** MongoDB with Mongoose ODM
- **Image Storage:** Cloudinary (Images) handled via Multer
- **Encryption:** AES-256 for private messages
- **Background Jobs:** Agenda
- **Real-time:** Socket.io
- **Communication:** Brevo API (Emails)
- **Validation:** Zod

---

##  Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Cloudinary account
- Brevo account (for emails)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Soleviaaa
```

### 2. Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   BREVO_API_KEY=your_brevo_api_key
   EMAIL_FROM=your_verified_sender_email
   ENCRYPTION_KEY=your_32_char_encryption_key
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the server: `npm run dev`

### 3. Frontend Setup
1. Navigate to the frontend folder: `cd ../frontend`
2. Install dependencies: `npm install`
3. Start the application: `npm start`

---

##  License
This project is licensed under the ISC License.
