# ShopNet

ShopNet is a Next.js ecommerce web app scaffold with:

- account creation and login
- strong password validation with confirmation
- location capture for delivery-aware checkout totals
- product creation with category, size, rating, stock, and front/side/back image URLs
- cart totals with cash on delivery, Airtel Money, and MTN Mobile Money
- guest-to-seller chat
- MongoDB Atlas-ready models and API routes

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example and add your MongoDB Atlas URL:

```bash
cp .env.example .env.local
```

Add:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=replace-this-with-a-long-random-secret
```

3. Start the development server:

```bash
npm run dev
```

If `MONGODB_URI` is empty, ShopNet falls back to a temporary in-memory demo store so you can still explore the interface.
# The-ShopNet
