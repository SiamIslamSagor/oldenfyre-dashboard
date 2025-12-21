# OldenFyre Inventory Dashboard - Development Setup

This document explains how to set up and run the OldenFyre Inventory Dashboard with the backend API.

## Prerequisites

1. **Backend Server**: The OldenFyre Inventory API server must be running
2. **Database**: MongoDB must be accessible and connected
3. **Node.js**: Version 18 or higher
4. **npm**: Version 8 or higher

## Backend Setup

### 1. Start the Backend Server

The backend API should be running on `http://localhost:3000/api` by default.

```bash
# Navigate to the backend directory
cd /path/to/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start the development server
npm run dev
```

### 2. Verify Backend is Running

Open your browser and navigate to:

- `http://localhost:3000/api/products` - Should return a list of products
- `http://localhost:3000/api/orders` - Should return a list of orders
- `http://localhost:3000/api/dashboard/stats` - Should return dashboard statistics

## Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to the frontend directory
cd /path/to/oldenfyre_dashboard

# Install dependencies
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The dashboard will be available at: `http://localhost:3001`

## Authentication

The dashboard is password-protected. Use the following credentials:

- **Password**: `admin123`

## Troubleshooting

### Connection Errors

If you see "Connection Error" or "timeout" messages:

1. **Check Backend Server**:

   ```bash
   # Verify the backend is running
   curl http://localhost:3000/api/products
   ```

2. **Check MongoDB Connection**:

   - Ensure MongoDB is running
   - Verify the connection string in `.env`
   - Check for database authentication issues

3. **Port Conflicts**:
   - Backend: `localhost:3000`
   - Frontend: `localhost:3001`
   - Ensure no other services are using these ports

### Duplicate API Requests

If you notice API calls being made multiple times in the browser's Network tab:

- **React Strict Mode**: This is normal behavior in development and helps catch potential issues
- **Automatic Prevention**: The dashboard has built-in protection against duplicate requests
- **No Impact**: Multiple requests won't cause issues with the backend
- **Expected Behavior**: You may see 2 requests to `/dashboard/stats` - one succeeds (200), one may be cancelled

### Inventory Display Issues

If you see the same product appearing multiple times in the inventory table:

- **Deduplication**: Products may appear in multiple alert categories (low stock, out of stock, etc.)
- **Status Priority**: Items are now sorted by priority (out of stock → low stock → in stock)
- **Unique Display**: Each product code now appears only once in the inventory table
- **Complete Data**: Uses `/products` endpoint for full product information including quantities

### Common Error Messages

#### "Connection timeout. The server is taking too long to respond."

- Backend server is not running
- Server is overloaded
- Network connectivity issues

#### "Unable to connect to the server"

- Backend server is not accessible
- Wrong port configuration
- Firewall blocking the connection

#### "Server Error"

- Backend has an internal error
- Database connection issues
- Invalid API endpoints

## API Configuration

The frontend is configured to connect to the backend at:

```typescript
// Development
const BASE_URL = "http://localhost:3000/api";

// Production (when deployed)
const BASE_URL = "https://your-app.vercel.app/api";
```

To change the backend URL, modify `app/lib/api.ts`:

```typescript
const BASE_URL = "http://your-backend-url:port/api";
```

## Features

### Dashboard

- Real-time statistics
- Inventory alerts
- Recent orders
- Quick actions

### Product Management

- View all products
- Search and filter
- Stock status indicators
- Product details

### Order Management

- View all orders
- Order status tracking
- Customer information
- Financial data

### Inventory Management

- Stock level monitoring
- Low stock alerts
- Out of stock notifications
- Search and filter capabilities

## Development Notes

- The dashboard automatically handles connection errors gracefully
- When the backend is unavailable, helpful error messages are displayed
- All API calls include proper error handling and timeout management
- The frontend is fully responsive and works on all device sizes

## Production Deployment

### Vercel Deployment

1. **Backend**: Deploy to Vercel with environment variables
2. **Frontend**: Update `BASE_URL` in `app/lib/api.ts` to the production URL
3. **Environment Variables**: Set all required environment variables in Vercel dashboard

### Environment Variables Required

```
NODE_ENV=production
DATABASE_URL=mongodb://your-connection-string
```

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify the backend server logs
3. Ensure all prerequisites are met
4. Check this troubleshooting guide

The dashboard is designed to be user-friendly and will provide clear error messages when the backend is not available.
