# Haven — Smart Hostel Management System

A React + Bootstrap 5 frontend with a Node.js/Express REST API and MongoDB. Student and hostel staff accounts now receive different dashboards and different navigation.

## Role-specific dashboards

### Student
- Personal fee records and outstanding balance (no payment gateway or Pay Now button)
- Raise and track complaints
- Message the warden/administrator
- Request home visits and submit a private arrival photo after approval
- View personal attendance, weekly mess menu, notifications, announcements, meetings and events
- View assigned hostel and room details when allocated

### Warden / administrator
- Student directory and pending account approval
- Room and bed inventory, vacancy counts, room creation and bed allocation
- Complaint review and resolution
- Home visit review and private family-photo viewing
- Attendance entry and attendance records
- Weekly mess menu publishing
- Fee records and offline payment records
- Direct messages, student notifications, announcements, meetings and events

## Requirements
- Node.js 20+ recommended
- MongoDB local instance or MongoDB connection URI

## Run locally

1. Extract the ZIP and open the project folder in VS Code.
2. Install root dependencies:

   ```bash
   npm install
   npm run install:all
   ```

3. Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a long random `JWT_SECRET`.
4. Copy `client/.env.example` to `client/.env` if the API is not at `http://localhost:5000/api`; set `VITE_API_URL` accordingly.
5. Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` and the optional `SMTP_PORT`, `SMTP_SECURE` and `SMTP_FROM` values in `server/.env` to enable password-reset emails.
6. Create the first administrator using the documented `server/.env.example` seed settings, then run:

   ```bash
   npm run seed:admin --prefix server
   ```

7. Start the frontend and backend from the project root:

   ```bash
   npm run dev
   ```

8. Open `http://localhost:5173`.

New student accounts remain pending until an administrator/warden approves them. A student cannot assign their own role or allocate their own bed.

## Security and implementation notes
- Home-arrival photos accept JPG, PNG or WEBP up to 5 MB. Files are stored in the server uploads directory and are served only through an authenticated, authorization-checked endpoint; they are not exposed as a public static folder.
- The meeting module schedules meetings and can store an HTTPS meeting link. Actual video calling depends on the configured external meeting provider.
- Fee payments are recorded by staff for payments made outside this application. No payment gateway is integrated.
- Nearby hostel discovery via Google Maps is not configured in this build.
- Photo attachments for ordinary complaints, automatic email/SMS/push delivery, advanced analytics charts, and automated end-to-end tests remain future work. Notifications currently appear inside the application.

## Technology
React, JSX, Bootstrap 5, React Router, Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Multer.
