# SmartStock Logistics - System Guide

## Overview
A complete logistics and delivery management system with three portals: Customer, Driver, and Admin.

## Features

### 🛒 Customer Portal
- **Dashboard**: View pending/delivered orders and balance
- **Product Catalog**: Browse and add items to cart
- **Checkout**: COD or GCash payment via PayMongo
- **Order Tracking**: Real-time delivery status updates
- **Request Returns**: Submit return requests with photo proof
- **Notifications**: Live updates on orders and deliveries

### 🚚 Driver Portal (Mobile-First)
- **Assigned Deliveries**: View active delivery assignments
- **Status Updates**: Mark orders as picked up, in-transit, or delivered
- **Proof of Delivery**: Upload photos and delivery notes
- **Earnings Summary**: Track COD collections
- **Navigation**: Quick links to Google Maps for addresses

### 👨‍💼 Admin Portal
- **Dashboard**: KPIs, charts, and logistics summary
- **Order Management**: Approve, update, and track all orders
- **Delivery Control**: Assign drivers to orders
- **Inventory Management**: Track stock levels and reorder alerts
- **Supplier Management**: Manage supplier relationships
- **User Management**: Create/manage users and roles

## Demo Accounts

### Customer
- Email: customer@smartstock.ph
- Password: customer123

### Driver
- Email: driver@smartstock.ph
- Password: driver123

### Admin
- Email: admin@smartstock.ph
- Password: admin123

## Payment Integration

### GCash (PayMongo)
1. Set up PayMongo account at https://paymongo.com
2. Get test/live API keys
3. Add `PAYMONGO_SECRET_KEY` as environment variable
4. Test mode uses PayMongo's sandbox

### Cash on Delivery (COD)
- Admin can verify COD payments when delivered
- Drivers mark as delivered with proof

## Real-Time Features
- Auto-refresh every 10-15 seconds for live updates
- Status changes sync across Customer, Driver, and Admin portals
- Notification system for critical updates

## Theme Support
- Modern blue-gray color scheme
- Dark mode toggle (saves to localStorage)
- Responsive design for mobile and desktop

## Architecture

### Backend (Supabase)
- **Auth**: Role-based access (customer, driver, admin)
- **Database**: Key-value store for all data
- **Edge Functions**: Hono server with API routes
- **Storage**: Ready for file uploads (POD images, return proofs)

### Frontend (React)
- **Components**: Modular design with shadcn/ui
- **State Management**: React hooks
- **Routing**: Page-based navigation
- **Forms**: Validation and error handling

## API Endpoints

### Authentication
- `POST /auth/signup` - Customer signup
- `POST /auth/admin-signup` - Admin signup
- `GET /auth/me` - Get current user info

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `PATCH /orders/:id/status` - Update status
- `POST /orders/:id/assign-driver` - Assign driver
- `POST /orders/:id/pod` - Submit proof of delivery

### Payments
- `POST /payments/gcash` - Create GCash payment
- `GET /payments/:orderId/status` - Check payment status
- `POST /payments/:orderId/verify-cod` - Verify COD payment

### Returns
- `GET /returns` - List returns
- `POST /returns` - Create return request

### Users
- `GET /users` - List all users (admin only)
- `POST /users` - Create user (admin only)
- `PATCH /users/:id/toggle` - Enable/disable user
- `POST /users/:id/reset-password` - Reset password

### Inventory
- `GET /inventory` - List inventory
- `POST /inventory/:id/restock` - Restock product

### Drivers
- `GET /drivers` - List drivers
- `POST /drivers/init` - Initialize demo drivers

## Next Steps

1. **PayMongo Setup**: Add your API keys
2. **Email Service**: Configure Supabase SMTP for notifications
3. **GPS Tracking**: Implement live location tracking
4. **Reports**: Add export functionality for orders/inventory
5. **SMS Notifications**: Integrate SMS for delivery updates
