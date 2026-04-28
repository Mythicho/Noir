# NOIR — Luxury Imported Snacks E-Commerce Platform

**Status: ✅ Production Ready (v2.0)**

A fully secure, production-grade e-commerce application built with React, Vite, Tailwind CSS, and Node.js. Features a stunning iOS-style "liquid glass" design, custom smooth scrolling, built-in admin dashboard, recurring subscription system, and Stripe-ready payment architecture.

## 🔒 Security Features

- **PBKDF2 Password Hashing**: Passwords salted with 1000 iterations (SHA-512)
- **Token-Based Authentication**: Secure JWT-compatible tokens with 30-day expiry
- **Input Validation**: Email, password, and SQL injection prevention
- **Rate Limiting**: 100 requests/minute per IP
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-XSS-Protection
- **Encrypted Sessions**: Token stored securely, never plaintext passwords in localStorage
- **Admin Role-Based Access**: Verified via authentication layer

## 🚀 Architecture

- **Frontend**: Single-page application (SPA) compiled into a single-file `index.html` via Vite. Deploys on Vercel, Netlify, or any static CDN.
- **Backend**: Node.js Express server with SQLite (`better-sqlite3`) database. Deploys on Render, Railway, or any Node.js host.
- **Communication**: RESTful API with Bearer token authentication. No localStorage data transfer.

## 📦 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| Frontend Build | Vite 7 + vite-plugin-singlefile |
| Backend | Node.js + Express 4 + better-sqlite3 |
| Database | SQLite with WAL mode (concurrent access) |
| Payments | Stripe (webhooks integrated) |
| Deployment | Vercel (frontend) + Render (backend) |

## 🛠️ Quick Start

### Local Development

**Terminal 1 - Backend:**
```bash
cd "Noir v2/server"
npm install
npm run dev
# Runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd "Noir v2"
npm install
npm run dev
# Runs on http://localhost:5173
```

**Test Account:**
- Email: `any@example.com`
- Password: `any password (4+ chars)`

**Admin Panel:**
- Email: `mythicho`
- Password: `noiradmin`
- Access: http://localhost:5173/#/admin

### Environment Variables

Create `.env.local` in the frontend:
```
VITE_API_URL=http://localhost:4000
```

## 📋 Deployment to Production

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete 5-step guide:

1. **Push to GitHub** - Version control
2. **Deploy Backend** - Render.com (auto-generates secrets)
3. **Deploy Frontend** - Vercel (add `VITE_API_URL` env var)
4. **Link Stripe Webhook** - Connect payment processor
5. **Security Hardening** - Restrict CORS to frontend domain

**Estimated Time**: 15 minutes end-to-end  
**Cost**: Free tier available (Render free 0.5GB RAM, Vercel free)

## 🎯 What's Different from v1

| Feature | v1 (Demo) | v2 (Production) |
|---------|-----------|-----------------|
| Password Storage | Plain-text localStorage | PBKDF2 hashed on backend |
| Authentication | Local only (no server) | Backend-verified tokens |
| Data Persistence | Browser localStorage | SQLite with persistent disk |
| Admin Access | Local check | Role-based via backend |
| Stripe Integration | Stub/mock | Full webhook support |
| Security Headers | None | HSTS, CSP, X-Frame |
| Rate Limiting | None | 100 req/min per IP |
| Input Validation | Basic | Strict email/password rules |
| HTTPS | Not enforced | Auto on Vercel + Render |

## 📊 Key APIs
Create a private repository on GitHub (e.g., `noir-snacks`) and push the entire codebase:
```bash
git init
git add .
git commit -m "feat: production e-commerce release"
git remote add origin https://github.com/YOUR_USERNAME/noir-snacks.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy the Backend (Render.com)
The repository contains a `render.yaml` file that automates the deployment.
1. Sign in to **Render.com** and click **New +** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically read `render.yaml` and configure:
   - A Node.js Web Service running from the `/server` directory.
   - A 1GB Persistent SSD drive mounted at `/data` to store `noir.db` safely across restarts.
   - Generate a secure `JWT_SECRET` for customer sessions.
4. Render will ask for two keys from your **Stripe Dashboard** (Developers -> API Keys):
   - `STRIPE_SECRET_KEY`: Your secret key (`sk_test_...` or `sk_live_...`).
   - `WEBHOOK_SECRET`: Your Stripe webhook signing secret (`whsec_...`).
5. Click **Apply** and wait 2 minutes. Your backend will be live at a URL like `https://noir-backend.onrender.com`.

### Step 3: Deploy the Frontend (Vercel or Netlify)
1. Sign in to **Vercel.com** and click **Add New** -> **Project**.
2. Import your `noir-snacks` GitHub repository.
3. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://noir-backend.onrender.com` (Your live Render URL without a trailing slash)
4. Click **Deploy**. Vercel will compile the project.
5. Vercel will give you your public storefront URL, e.g., `https://noir-snacks.vercel.app`.

### Step 4: Link the Stripe Webhook
1. Go to your **Stripe Dashboard** -> **Developers** -> **Webhooks**.
2. Click **Add Endpoint**.
3. Set **Endpoint URL** to: `https://noir-backend.onrender.com/api/payments/webhook`
4. Click **Select Events** and choose `payment_intent.succeeded`.
5. Click **Add Endpoint**. 
6. (If you didn't do it in Step 2) Copy the **Signing Secret** (`whsec_...`), go to your Render dashboard, add it as `WEBHOOK_SECRET` in Environment variables, and trigger a re-deploy.

---

## 🔒 Security & Payment Enforcement

### Password Protection
We never store passwords in plain text. When a user registers, we use Node's `crypto` library:
1. Generate a cryptographically secure 16-byte random salt.
2. Run the password and salt through `PBKDF2` with 1000 iterations of `SHA-512` to create a 64-byte hash.
3. Save *only* the hash and salt. During login, we re-hash the input and compare the result.

### Anti-Fraud Payment Flow
To remain PCI-DSS compliant and prevent frontend tampering, the payment architecture operates strictly server-to-server:
1. **Intent:** When a customer clicks "Place Order", the frontend sends the cart items to the server.
2. **Verification:** The backend ignores frontend prices. It looks up the products directly in the secure database, calculates the real total in paise (INR × 100), and requests a session from Stripe.
3. **Checkout:** Stripe returns a `client_secret`. The frontend uses the Stripe SDK to mount an encrypted iframe for card/UPI data. **Your servers never touch credit card numbers.**
4. **Fulfillment:** When the payment clears, Stripe's bank servers send a signed **Webhook** directly to the backend. The backend verifies the cryptographic signature, matches the Order ID, and *only then* upgrades the order status to `Placed` and generates a real tracking number.

---

## 👥 Administrative Management

### Default Administrator Account
- **Login URL:** Your public site + `#/admin` (or click "Admin" in the navbar after logging in)
- **Username:** `mythicho`
- **Password:** `noiradmin`

*Note: In production, the backend auto-provisions this administrative account on first use. You can change these credentials in `server/index.js`.*

### Management Capabilities
- **Overview Dashboard:** Revenue analytics, active subscribers, MRR, pending orders, and 14-day trailing revenue chart.
- **Order Processing:** Update order tracking statuses (Placed -> Sourcing -> Imported -> Out for Delivery -> Delivered). View customer payment methods and timestamps.
- **Customer CRM:** Track lifetime value (LTV), order counts, addresses, and profiles.
- **Inventory Control:** Modify product names, pricing, and origin directly. Toggle products to "Out of Stock" (instantly hides them from the storefront), or create completely new products with rich text descriptions, tasting notes, and multi-image galleries.
- **Data Integrity:** Export individual datasets as CSV or download a master JSON backup.

## 👨‍💻 Local Development

To run the full stack locally on your machine:

1. **Start the Backend:**
   ```bash
   cd server
   npm install
   npm start
   ```
   The backend will run on `http://localhost:4000`.

2. **Start the Frontend:**
   Open a second terminal in the project root:
   ```bash
   # Add local environment variable
   echo "VITE_API_URL=http://localhost:4000" > .env
   
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`. 
   
   *Note: If you delete the `.env` file, the frontend will automatically revert to "Simulated Mode" using browser `localStorage` — allowing you to design and test without a running server.*
