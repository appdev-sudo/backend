# VytalYou Backend

Node.js/Express API with MongoDB. Public endpoints serve medical services (IV drips, diagnostics, etc.); booking requires login/signup.

## Setup

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `MONGODB_URI` — MongoDB Atlas connection string (replace `<password>` with your DB user password)
   - `JWT_SECRET` — Secret for signing JWTs (use a long random string in production)
   - `PORT` — Server port (default 4000)

2. **Install and run**

   ```bash
   cd backend
   npm install
   npm run seed    # populate medical services (IV drips, diagnostics, etc.)
   npm run dev     # start with auto-reload (or npm start)
   ```

## API

### Public (no auth)

- **GET** `/api/health` — Health check
- **GET** `/api/services` — All medical services  
  - Query: `?category=iv_drips|diagnostics|red_light|hyperbaric|longevity`
- **GET** `/api/services/categories` — Category list with counts
- **GET** `/api/services/:id` — Single service by `_id` or `serviceId`

### Auth

- **POST** `/api/auth/signup`  
  Body: `{ "name", "email", "password", "phone" }`  
  Returns: `{ user, token, expiresIn }`
- **POST** `/api/auth/login`  
  Body: `{ "email", "password" }`  
  Returns: `{ user, token, expiresIn }`
- **GET** `/api/auth/me` — Current user (requires `Authorization: Bearer <token>`)

### Bookings (require login)

Send `Authorization: Bearer <token>` on all booking requests.

- **POST** `/api/bookings`  
  Body: `{ "serviceId", "preferredDate?", "preferredTimeSlot?", "notes?" }`  
  Returns: created booking
- **GET** `/api/bookings/me` — Current user’s bookings
- **GET** `/api/bookings/:id` — Single booking (own only)

## MongoDB Atlas

1. Create a cluster and add your IP in **Network Access**.
2. Create a database user (e.g. username + password).
3. Get the connection string under **Connect → Drivers**, replace `<password>` with the user password, and set it as `MONGODB_URI` in `.env`.

Do not commit `.env` or real credentials.
