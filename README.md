# Smart Complaint Management System

A full-stack, AI-powered Smart Complaint Management System built with Node.js, Express, MongoDB, and Vanilla HTML/CSS/JS. It features a sleek, enterprise-grade dark mode UI.

## Features

- **Authentication & Security:** Secure user registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Complaint Lifecycle:** Users can file, track, and manage their grievances.
- **AI Intelligence:** Integrated AI logic detects the urgency of complaints, suggests the appropriate department, generates a concise summary, and auto-generates a formal response.
- **Admin Dashboard:** Role-based access allows administrators to view all complaints, filter by status (Pending, In Progress, Resolved, Rejected), and track critical AI-flagged issues.
- **Professional UI:** A highly responsive, premium dark-mode interface featuring CSS grid layouts, dynamic statistics cards, and micro-animations.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Frontend:** HTML5, CSS3 (Custom Design System), JavaScript (ES6+)
- **Security:** bcryptjs, jsonwebtoken
- **Icons:** Lucide Icons

## Prerequisites

- Node.js (v14 or higher)
- A MongoDB Atlas account (or local MongoDB instance)

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd Aifsdese
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory of the project and add the following keys:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRES_IN=7d
   ```

4. **Run the server:**
   ```bash
   npm start
   ```
   *(For active development with hot-reloading, use `npm run dev`)*

5. **Open the application:**
   Navigate to `http://localhost:5000` in your web browser.

## Deployment (Render)

This application is ready to be deployed to Render as a Web Service.

1. Push your code to GitHub.
2. In Render, create a new **Web Service** connected to your repository.
3. Use the following configuration:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add your `.env` variables (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`) in the Render Environment Variables tab.
5. Click **Deploy**.

## License

This project is licensed under the MIT License.
