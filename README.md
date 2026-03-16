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

`MONGODB_URI` is required in all environments. Demo/mock fallback is disabled, so the app reads and writes only real database data.

When MongoDB is unreachable (for example DNS/Atlas network issues), the app briefly cools down before retrying so pages do not stall on every request.

## Clerk in local development

By default, Clerk is disabled in local development to avoid hard failures when external auth scripts are blocked or timing out.

To enable Clerk locally, set:

```env
NEXT_PUBLIC_ENABLE_CLERK_IN_DEV=true
```
