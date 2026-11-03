# Smart Civic Issue Reporting Platform

Full-stack MERN application for citizen civic complaints and administrator dispatch. Citizens register, submit categorized complaints with typed addresses, optional browser coordinates, and an image. Administrators segregate complaints by category, assign departments, set priority, update status, and leave remarks. Citizens see the complete status history.

## Stack

- React 18, Vite, React Router, Axios, React Toastify
- Node.js, Express, Mongoose, MongoDB
- bcryptjs password hashing, JWT access tokens, revocable MongoDB sessions, and separate citizen/admin/Gov. Officer roles
- Multer memory uploads with complaint image buffers stored in MongoDB

## Setup

Prerequisites: Node.js 16+ and MongoDB local or Atlas.

1. Install dependencies:

   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. Create `server/.env` from `server/.env.example`:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/civic_issues
   JWT_SECRET=replace-with-a-long-random-secret
   SESSION_DAYS=7
   CLIENT_ORIGIN=http://localhost:3000
   MAX_IMAGE_SIZE_BYTES=5242880
   ```

   `MONGO_URI` may be a MongoDB Atlas `mongodb+srv://...` URI. Never commit secrets.

3. Seed the administrator account:

   ```bash
   npm run seed
   ```

   The seed command is the only admin and Gov. Officer creation path. Public registration creates citizen accounts only. Development seed credentials are:

   - Admin: `admin@civic.com` / `admin123`
   - Gov. Officer: `officer@civic.com` / `officer123`

   Change these before deployment.

4. Start the API and client in separate terminals:

   ```bash
   npm run dev:server
   npm run dev:client
   ```

   The API runs on `http://localhost:5000`; Vite runs on its configured local port.

## Environment

The client supports `client/.env` with:

```env
VITE_API_URL=/api
```

Use an absolute API URL when the client and API are hosted separately, for example `VITE_API_URL=https://api.example.com/api`.

## API lifecycle

Authentication:

- `POST /api/auth/register` — create a citizen and session
- `POST /api/auth/login` — authenticate a citizen or seeded admin
- `GET /api/auth/me` — load the current session user
- `POST /api/auth/logout` — revoke the current MongoDB session

Complaints:

- `POST /api/issues` — authenticated citizen multipart complaint submission
- `GET /api/issues/my` — citizen complaints
- `GET /api/issues/:id` — authorized complaint detail and history
- `GET /api/issues/:id/image` — authorized MongoDB-backed image stream
- `GET /api/issues` and `GET /api/issues/stats` — admin management and dashboard data
- `PUT /api/issues/:id` — admin status, department, priority, and remarks update
- `DELETE /api/issues/:id` — admin deletion
- `GET /api/issues/officer/queue` — Gov. Officer queue for high-priority complaints and pending approval requests
- `PUT /api/issues/officer/:id` — Gov. Officer approval, rejection, supervisor assignment, status, and citizen response
- `GET /api/supervisors` — active supervisors for assignment; admins can include inactive records
- `POST /api/supervisors` — admin-only supervisor creation
- `PUT /api/supervisors/:id` — admin-only supervisor update
- `DELETE /api/supervisors/:id` — admin-only supervisor removal

## Complaint routing workflow

- Citizens choose Low, Medium, or High priority when submitting a complaint.
- High-priority complaints enter the Gov. Officer queue immediately and are hidden from the admin list, dashboard statistics, detail route, and delete/update actions. The officer assigns exactly two active supervisors from the admin-managed supervisor list and sends status/response updates directly to the citizen.
- Low- and medium-priority complaints remain with the admin. After Gov. Officer approval, the admin assigns exactly one active supervisor and continues status handling.
- Admins manage the available supervisor list from `/admin/supervisors`; removing or deactivating a supervisor prevents new assignments without changing existing complaint history.
- Approval, rejection, assignment, status, and responses are recorded in the MongoDB complaint history.

Images are validated as JPEG, PNG, GIF, or WebP and limited to 5 MB by default. Complaint location always requires address, city, state, and six-digit pincode; browser latitude/longitude is optional.
