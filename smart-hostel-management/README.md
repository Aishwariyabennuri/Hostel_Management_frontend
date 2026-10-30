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
6. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `server/.env` for private home-visit photo storage.
7. Create the first administrator using the documented `server/.env.example` seed settings, then run:

   ```bash
   npm run seed:admin --prefix server
   ```

8. Start the frontend and backend from the project root:

   ```bash
   npm run dev
   ```

9. Open `http://localhost:5173`.

For Vercel, configure `MONGO_URI` with the complete MongoDB Atlas SRV connection string. The username and password must belong to an Atlas database user, not an Atlas website login. If the password contains reserved URI characters such as `@`, `:`, `/`, `?`, `#` or `%`, URL-encode them before placing the value in the URI. Also add the Vercel deployment IP range (`0.0.0.0/0`, or a restricted range suitable for your deployment) to Atlas Network Access.

### Deploy frontend and backend to Vercel

Create two Vercel projects from this repository:

1. **Backend:** set the project root directory to `server`. Add `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables. Add the optional SMTP and Cloudinary variables when those services are configured.
2. **Frontend:** set the project root directory to `client`. Add `VITE_API_URL` with the backend URL followed by `/api`, for example `https://your-backend.vercel.app/api`.
3. Deploy the backend first, then set the frontend `VITE_API_URL` and `CLIENT_ORIGIN` to the final deployed URLs and redeploy the frontend.
4. After the backend deploys, run `npm run seed:admin --prefix server` locally with the production `MONGO_URI`, or create the first administrator through the supported seed workflow before logging in.

New student accounts remain pending until an administrator/warden approves them. A student cannot assign their own role or allocate their own bed.

## Security and implementation notes
- Home-arrival photos accept JPG, PNG or WEBP up to 5 MB. Files are stored in the server uploads directory and are served only through an authenticated, authorization-checked endpoint; they are not exposed as a public static folder.
- The meeting module schedules meetings and can store an HTTPS meeting link. Actual video calling depends on the configured external meeting provider.
- Fee payments are recorded by staff for payments made outside this application. No payment gateway is integrated.
- Nearby hostel discovery via Google Maps is not configured in this build.
- Photo attachments for ordinary complaints, automatic email/SMS/push delivery, advanced analytics charts, and automated end-to-end tests remain future work. Notifications currently appear inside the application.

## Technology
React, JSX, Bootstrap 5, React Router, Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Multer.
