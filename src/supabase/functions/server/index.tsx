import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));



const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// PayMongo Configuration (use test keys for development)
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY') || 'sk_test_your_key_here';
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// ==================== AUTH ROUTES ====================

// Customer Signup
app.post('/make-server-6d39ce5e/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'customer' },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'customer',
      balance: 0,
      createdAt: new Date().toISOString()
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Admin Signup (for initial setup)
app.post('/make-server-6d39ce5e/auth/admin-signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true
    });

    if (error) {
      console.log('Admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create admin profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Admin signup error:', error);
    return c.json({ error: 'Admin signup failed' }, 500);
  }
});

// ==================== USER ROUTES ====================

app.get('/make-server-6d39ce5e/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ profile });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// ==================== PRODUCT ROUTES ====================

app.get('/make-server-6d39ce5e/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: 'Failed to get products' }, 500);
  }
});

app.post('/make-server-6d39ce5e/products/init', async (c) => {
  try {
    const products = [
      {
        id: 'prod-001',
        name: 'Office Paper A4 (500 sheets)',
        price: 250,
        stock: 150,
        image: 'https://images.unsplash.com/photo-1690455422058-156a39f18a0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Premium quality A4 paper for office use'
      },
      {
        id: 'prod-002',
        name: 'Ballpoint Pens (Box of 12)',
        price: 120,
        stock: 200,
        image: 'https://images.unsplash.com/photo-1690455422058-156a39f18a0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Smooth writing ballpoint pens'
      },
      {
        id: 'prod-003',
        name: 'Shipping Boxes (Pack of 10)',
        price: 350,
        stock: 80,
        image: 'https://images.unsplash.com/photo-1720572742865-b57ccc2df130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Durable corrugated shipping boxes'
      },
      {
        id: 'prod-004',
        name: 'Packing Tape (6 rolls)',
        price: 180,
        stock: 120,
        image: 'https://images.unsplash.com/photo-1720572742865-b57ccc2df130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Heavy-duty packing tape'
      },
      {
        id: 'prod-005',
        name: 'Manila Folders (Box of 100)',
        price: 420,
        stock: 60,
        image: 'https://images.unsplash.com/photo-1690455422058-156a39f18a0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Legal size manila folders'
      },
      {
        id: 'prod-006',
        name: 'Stapler + Staples Set',
        price: 150,
        stock: 90,
        image: 'https://images.unsplash.com/photo-1690455422058-156a39f18a0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        description: 'Heavy duty stapler with staples'
      }
    ];

    for (const product of products) {
      await kv.set(`product:${product.id}`, product);
    }

    return c.json({ success: true, count: products.length });
  } catch (error) {
    console.log('Init products error:', error);
    return c.json({ error: 'Failed to initialize products' }, 500);
  }
});

// ==================== ORDER ROUTES ====================

app.post('/make-server-6d39ce5e/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { items, deliveryInfo, paymentMethod } = await c.req.json();
    
    const orderId = `ORD-${Date.now()}`;
    const order = {
      id: orderId,
      customerId: user.id,
      customerName: user.user_metadata.name,
      items,
      total: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      status: 'created',
      deliveryInfo,
      paymentMethod,
      milestones: [
        { status: 'created', timestamp: new Date().toISOString(), completed: true }
      ],
      createdAt: new Date().toISOString()
    };

    await kv.set(`order:${orderId}`, order);

    // Create notification
    await kv.set(`notification:${orderId}-created`, {
      id: `${orderId}-created`,
      userId: user.id,
      message: `Order ${orderId} has been created successfully`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ order });
  } catch (error) {
    console.log('Create order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.get('/make-server-6d39ce5e/orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:');
    
    // Filter orders based on role
    const userProfile = await kv.get(`user:${user.id}`);
    let orders = allOrders;
    
    if (userProfile.role === 'customer') {
      orders = allOrders.filter((order: any) => order.customerId === user.id);
    }

    // Sort by creation date descending
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ orders });
  } catch (error) {
    console.log('Get orders error:', error);
    return c.json({ error: 'Failed to get orders' }, 500);
  }
});

app.get('/make-server-6d39ce5e/orders/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('id');
    const order = await kv.get(`order:${orderId}`);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({ order });
  } catch (error) {
    console.log('Get order error:', error);
    return c.json({ error: 'Failed to get order' }, 500);
  }
});

app.post('/make-server-6d39ce5e/orders/:id/update-status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify admin role
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('id');
    const { status } = await c.req.json();
    
    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Update order status and milestones
    order.status = status;
    
    const milestoneMap: any = {
      'created': 0,
      'approved': 1,
      'packed': 2,
      'in-transit': 3,
      'delivered': 4
    };

    const statusOrder = ['created', 'approved', 'packed', 'in-transit', 'delivered'];
    const currentIndex = milestoneMap[status];
    
    // Update milestones up to current status
    order.milestones = statusOrder.slice(0, currentIndex + 1).map((s: string) => {
      const existing = order.milestones.find((m: any) => m.status === s);
      return existing || {
        status: s,
        timestamp: new Date().toISOString(),
        completed: true
      };
    });

    await kv.set(`order:${orderId}`, order);

    // Create notification for customer
    await kv.set(`notification:${orderId}-${status}`, {
      id: `${orderId}-${status}`,
      userId: order.customerId,
      message: `Order ${orderId} status updated to ${status.toUpperCase()}`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ order });
  } catch (error) {
    console.log('Update order status error:', error);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

// ==================== NOTIFICATIONS ====================

app.get('/make-server-6d39ce5e/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id);
    
    // Sort by creation date descending
    userNotifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ notifications: userNotifications });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

app.post('/make-server-6d39ce5e/notifications/:id/mark-read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${notificationId}`);

    if (notification && notification.userId === user.id) {
      notification.read = true;
      await kv.set(`notification:${notificationId}`, notification);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// ==================== SUPPLIERS ====================

app.get('/make-server-6d39ce5e/suppliers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const suppliers = await kv.getByPrefix('supplier:');
    return c.json({ suppliers });
  } catch (error) {
    console.log('Get suppliers error:', error);
    return c.json({ error: 'Failed to get suppliers' }, 500);
  }
});

app.post('/make-server-6d39ce5e/suppliers/init', async (c) => {
  try {
    const suppliers = [
      {
        id: 'sup-001',
        name: 'Paper Plus Corp',
        contact: '+63 2 8123 4567',
        email: 'orders@paperplus.ph',
        products: ['Office Paper', 'Manila Folders'],
        history: [
          { date: '2025-09-15', items: 'Office Paper x100', amount: 25000 },
          { date: '2025-08-22', items: 'Manila Folders x50', amount: 21000 }
        ]
      },
      {
        id: 'sup-002',
        name: 'Office Essentials Inc',
        contact: '+63 2 8234 5678',
        email: 'supply@officeessentials.ph',
        products: ['Pens', 'Staplers'],
        history: [
          { date: '2025-09-20', items: 'Ballpoint Pens x200', amount: 24000 }
        ]
      },
      {
        id: 'sup-003',
        name: 'Packaging Solutions Ltd',
        contact: '+63 2 8345 6789',
        email: 'sales@packagingsolutions.ph',
        products: ['Shipping Boxes', 'Packing Tape'],
        history: [
          { date: '2025-09-18', items: 'Shipping Boxes x80', amount: 28000 },
          { date: '2025-09-10', items: 'Packing Tape x120', amount: 21600 }
        ]
      }
    ];

    for (const supplier of suppliers) {
      await kv.set(`supplier:${supplier.id}`, supplier);
    }

    return c.json({ success: true, count: suppliers.length });
  } catch (error) {
    console.log('Init suppliers error:', error);
    return c.json({ error: 'Failed to initialize suppliers' }, 500);
  }
});

app.post('/make-server-6d39ce5e/suppliers/:id/reorder', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supplierId = c.req.param('id');
    const supplier = await kv.get(`supplier:${supplierId}`);

    if (!supplier) {
      return c.json({ error: 'Supplier not found' }, 404);
    }

    // Simulate reorder (in real app, this would send email/create PO)
    return c.json({ success: true, message: `Reorder request sent to ${supplier.name}` });
  } catch (error) {
    console.log('Reorder error:', error);
    return c.json({ error: 'Failed to process reorder' }, 500);
  }
});

// ==================== STATS ====================

app.get('/make-server-6d39ce5e/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:');
    const userProfile = await kv.get(`user:${user.id}`);
    
    let stats: any = {};
    
    if (userProfile.role === 'customer') {
      const userOrders = allOrders.filter((o: any) => o.customerId === user.id);
      stats = {
        pendingOrders: userOrders.filter((o: any) => o.status !== 'delivered').length,
        deliveredOrders: userOrders.filter((o: any) => o.status === 'delivered').length,
        balance: userProfile.balance || 0,
        totalOrders: userOrders.length
      };
    } else {
      const pending = allOrders.filter((o: any) => o.status === 'created').length;
      const approved = allOrders.filter((o: any) => o.status === 'approved' || o.status === 'packed' || o.status === 'in-transit').length;
      const delivered = allOrders.filter((o: any) => o.status === 'delivered').length;
      const revenue = allOrders.filter((o: any) => o.status === 'delivered').reduce((sum: number, o: any) => sum + o.total, 0);
      
      stats = {
        pendingOrders: pending,
        approvedOrders: approved,
        deliveredOrders: delivered,
        totalRevenue: revenue,
        totalOrders: allOrders.length
      };
    }

    return c.json({ stats });
  } catch (error) {
    console.log('Get stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// ==================== PAYMENT ROUTES (PayMongo) ====================

// Create GCash Payment
app.post('/make-server-6d39ce5e/payments/gcash', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount, orderId, description } = await c.req.json();

    // Create PayMongo Source for GCash
    const sourceResponse = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'gcash',
            amount: amount * 100, // Convert to centavos
            currency: 'PHP',
            redirect: {
              success: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-6d39ce5e/payments/success`,
              failed: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-6d39ce5e/payments/failed`
            },
            billing: {
              name: user.user_metadata.name,
              email: user.email
            }
          }
        }
      })
    });

    const sourceData = await sourceResponse.json();

    if (!sourceResponse.ok) {
      console.log('PayMongo source creation error:', sourceData);
      return c.json({ error: 'Failed to create payment source', details: sourceData }, 400);
    }

    // Store payment info
    await kv.set(`payment:${orderId}`, {
      orderId,
      sourceId: sourceData.data.id,
      amount,
      status: 'pending',
      type: 'gcash',
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      checkoutUrl: sourceData.data.attributes.redirect.checkout_url,
      sourceId: sourceData.data.id 
    });
  } catch (error) {
    console.log('GCash payment error:', error);
    return c.json({ error: 'Payment processing failed' }, 500);
  }
});

// Verify Payment Status
app.get('/make-server-6d39ce5e/payments/:orderId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('orderId');
    const payment = await kv.get(`payment:${orderId}`);

    if (!payment) {
      return c.json({ status: 'not_found' });
    }

    // Query PayMongo for source status
    if (payment.sourceId) {
      const sourceResponse = await fetch(`${PAYMONGO_API_URL}/sources/${payment.sourceId}`, {
        headers: {
          'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
        }
      });

      const sourceData = await sourceResponse.json();
      
      if (sourceResponse.ok) {
        payment.status = sourceData.data.attributes.status;
        await kv.set(`payment:${orderId}`, payment);
      }
    }

    return c.json({ payment });
  } catch (error) {
    console.log('Payment status check error:', error);
    return c.json({ error: 'Failed to check payment status' }, 500);
  }
});

// Mark COD Payment as Verified (Admin only)
app.post('/make-server-6d39ce5e/payments/:orderId/verify-cod', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('orderId');
    const payment = await kv.get(`payment:${orderId}`);

    if (payment) {
      payment.status = 'verified';
      payment.verifiedBy = user.id;
      payment.verifiedAt = new Date().toISOString();
      await kv.set(`payment:${orderId}`, payment);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('COD verification error:', error);
    return c.json({ error: 'Failed to verify COD payment' }, 500);
  }
});

// ==================== DRIVERS / RIDERS ====================

// Driver Signup
app.post('/make-server-6d39ce5e/auth/driver-signup', async (c) => {
  try {
    const { email, password, name, phone, vehicle } = await c.req.json();
    
    // Create user account with driver role
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'driver' },
      email_confirm: true
    });

    if (error) {
      console.log('Driver signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create driver record
    const driverId = `drv-${Date.now()}`;
    await kv.set(`driver:${driverId}`, {
      id: driverId,
      userId: data.user.id, // Link to auth user
      name,
      phone,
      vehicle,
      status: 'available',
      activeDeliveries: 0,
      totalDeliveries: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    });

    // Create user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'driver',
      driverId, // Link to driver record
      createdAt: new Date().toISOString()
    });

    return c.json({ user: data.user, driverId });
  } catch (error) {
    console.log('Driver signup error:', error);
    return c.json({ error: 'Driver signup failed' }, 500);
  }
});

app.get('/make-server-6d39ce5e/drivers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const drivers = await kv.getByPrefix('driver:');
    return c.json({ drivers });
  } catch (error) {
    console.log('Get drivers error:', error);
    return c.json({ error: 'Failed to get drivers' }, 500);
  }
});

// Get driver profile for logged-in driver
app.get('/make-server-6d39ce5e/drivers/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile to find linked driver ID
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'driver') {
      return c.json({ error: 'Not a driver account' }, 403);
    }

    // Get driver record
    const driver = await kv.get(`driver:${userProfile.driverId}`);
    if (!driver) {
      return c.json({ error: 'Driver record not found' }, 404);
    }

    return c.json({ driver });
  } catch (error) {
    console.log('Get driver profile error:', error);
    return c.json({ error: 'Failed to get driver profile' }, 500);
  }
});

app.post('/make-server-6d39ce5e/drivers/init', async (c) => {
  try {
    const drivers = [
      {
        id: 'drv-001',
        name: 'Juan Cruz',
        phone: '+63 917 123 4567',
        vehicle: 'Motorcycle - ABC 1234',
        status: 'available',
        activeDeliveries: 0,
        totalDeliveries: 156,
        rating: 4.8
      },
      {
        id: 'drv-002',
        name: 'Maria Santos',
        phone: '+63 918 234 5678',
        vehicle: 'Van - XYZ 5678',
        status: 'available',
        activeDeliveries: 0,
        totalDeliveries: 203,
        rating: 4.9
      },
      {
        id: 'drv-003',
        name: 'Pedro Reyes',
        phone: '+63 919 345 6789',
        vehicle: 'Motorcycle - DEF 9012',
        status: 'on-delivery',
        activeDeliveries: 2,
        totalDeliveries: 98,
        rating: 4.7
      }
    ];

    for (const driver of drivers) {
      await kv.set(`driver:${driver.id}`, driver);
    }

    return c.json({ success: true, count: drivers.length });
  } catch (error) {
    console.log('Init drivers error:', error);
    return c.json({ error: 'Failed to initialize drivers' }, 500);
  }
});

// Assign Driver to Order
app.post('/make-server-6d39ce5e/orders/:orderId/assign-driver', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orderId = c.req.param('orderId');
    const { driverId } = await c.req.json();

    const order = await kv.get(`order:${orderId}`);
    const driver = await kv.get(`driver:${driverId}`);

    if (!order || !driver) {
      return c.json({ error: 'Order or driver not found' }, 404);
    }

    order.assignedDriver = {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle
    };
    order.assignedAt = new Date().toISOString();

    await kv.set(`order:${orderId}`, order);

    // Update driver status
    driver.activeDeliveries = (driver.activeDeliveries || 0) + 1;
    driver.status = 'on-delivery';
    await kv.set(`driver:${driverId}`, driver);

    // Create notification for customer
    await kv.set(`notification:${orderId}-driver-assigned`, {
      id: `${orderId}-driver-assigned`,
      userId: order.customerId,
      message: `Driver ${driver.name} has been assigned to your order ${orderId}`,
      type: 'delivery',
      read: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ order });
  } catch (error) {
    console.log('Assign driver error:', error);
    return c.json({ error: 'Failed to assign driver' }, 500);
  }
});

// ==================== POD (Proof of Delivery) ====================

app.post('/make-server-6d39ce5e/orders/:orderId/pod', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('orderId');
    const { notes, hasImage, deliveredAt } = await c.req.json();

    const order = await kv.get(`order:${orderId}`);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    order.proofOfDelivery = {
      notes,
      hasImage,
      deliveredBy: user.id,
      deliveredAt
    };

    await kv.set(`order:${orderId}`, order);

    return c.json({ success: true });
  } catch (error) {
    console.log('POD submission error:', error);
    return c.json({ error: 'Failed to submit proof of delivery' }, 500);
  }
});

// ==================== RETURNS ====================

app.get('/make-server-6d39ce5e/returns', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const returns = await kv.getByPrefix('return:');
    return c.json({ returns });
  } catch (error) {
    console.log('Get returns error:', error);
    return c.json({ error: 'Failed to get returns' }, 500);
  }
});

app.post('/make-server-6d39ce5e/returns', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { orderId, reason, description, refundMethod, hasProof } = await c.req.json();

    const returnId = `RET-${Date.now()}`;
    const returnRequest = {
      id: returnId,
      orderId,
      customerId: user.id,
      reason,
      description,
      refundMethod,
      hasProof,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(`return:${returnId}`, returnRequest);

    // Create notification for admin
    await kv.set(`notification:${returnId}`, {
      id: returnId,
      userId: 'admin',
      message: `New return request for order ${orderId}`,
      type: 'return',
      read: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ return: returnRequest });
  } catch (error) {
    console.log('Create return error:', error);
    return c.json({ error: 'Failed to create return request' }, 500);
  }
});

// ==================== USER MANAGEMENT ====================

app.get('/make-server-6d39ce5e/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

app.post('/make-server-6d39ce5e/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { email, password, name, role } = await c.req.json();

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    });

    if (createError) {
      return c.json({ error: createError.message }, 400);
    }

    await kv.set(`user:${newUser.user.id}`, {
      id: newUser.user.id,
      email,
      name,
      role,
      active: true,
      createdAt: new Date().toISOString()
    });

    return c.json({ user: newUser.user });
  } catch (error) {
    console.log('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.patch('/make-server-6d39ce5e/users/:userId/toggle', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const { active } = await c.req.json();

    const targetUser = await kv.get(`user:${userId}`);
    if (targetUser) {
      targetUser.active = active;
      await kv.set(`user:${userId}`, targetUser);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Toggle user error:', error);
    return c.json({ error: 'Failed to toggle user status' }, 500);
  }
});

app.post('/make-server-6d39ce5e/users/:userId/reset-password', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const tempPassword = `temp${Math.random().toString(36).substring(2, 10)}`;

    await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword
    });

    return c.json({ tempPassword });
  } catch (error) {
    console.log('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Get current user info
app.get('/make-server-6d39ce5e/auth/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    return c.json({ user: userProfile });
  } catch (error) {
    console.log('Get me error:', error);
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

// ==================== INVENTORY ====================

app.get('/make-server-6d39ce5e/inventory', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const inventory = await kv.getByPrefix('inventory:');
    return c.json({ inventory });
  } catch (error) {
    console.log('Get inventory error:', error);
    return c.json({ error: 'Failed to get inventory' }, 500);
  }
});

app.post('/make-server-6d39ce5e/inventory/init', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    
    for (const product of products) {
      await kv.set(`inventory:${product.id}`, {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        reorderLevel: 20,
        reorderQuantity: 50,
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        needsReorder: product.stock < 20
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Init inventory error:', error);
    return c.json({ error: 'Failed to initialize inventory' }, 500);
  }
});

app.post('/make-server-6d39ce5e/inventory/:productId/restock', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const productId = c.req.param('productId');
    const { quantity } = await c.req.json();

    const product = await kv.get(`product:${productId}`);
    const inventory = await kv.get(`inventory:${productId}`);

    if (!product || !inventory) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Update stock
    product.stock += quantity;
    inventory.currentStock = product.stock;
    inventory.lastRestocked = new Date().toISOString();
    inventory.needsReorder = product.stock < inventory.reorderLevel;

    await kv.set(`product:${productId}`, product);
    await kv.set(`inventory:${productId}`, inventory);

    return c.json({ success: true, newStock: product.stock });
  } catch (error) {
    console.log('Restock error:', error);
    return c.json({ error: 'Failed to restock' }, 500);
  }
});

// ==================== PUBLIC TRACKING ====================

// Public tracking - no auth required
app.get('/make-server-6d39ce5e/track/:refNumber', async (c) => {
  try {
    const refNumber = c.req.param('refNumber');
    
    // Search for delivery by reference number
    const deliveries = await kv.getByPrefix('delivery:');
    const delivery = deliveries.find((d: any) => d.referenceNumber === refNumber);

    if (!delivery) {
      return c.json({ error: 'Delivery not found' }, 404);
    }

    // Return public-safe delivery info (no sensitive data)
    return c.json({
      delivery: {
        referenceNumber: delivery.referenceNumber,
        status: delivery.status,
        customerName: delivery.customerName,
        customerPhone: delivery.customerPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask phone
        address: delivery.address,
        estimatedDelivery: delivery.estimatedDelivery,
        driverName: delivery.assignedDriver?.name || null,
        lastUpdate: delivery.updatedAt,
        createdAt: delivery.createdAt
      }
    });
  } catch (error) {
    console.log('Public tracking error:', error);
    return c.json({ error: 'Failed to track delivery' }, 500);
  }
});

// Create new delivery
app.post('/make-server-6d39ce5e/deliveries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { referenceNumber, customerName, customerPhone, street, city, postalCode, estimatedDelivery, assignedDriverId } = await c.req.json();

    const deliveryId = `del-${Date.now()}`;
    const delivery = {
      id: deliveryId,
      referenceNumber,
      customerName,
      customerPhone,
      address: {
        street,
        city,
        postalCode
      },
      status: assignedDriverId ? 'assigned' : 'pending',
      assignedDriver: null,
      estimatedDelivery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If driver assigned, get driver info
    if (assignedDriverId) {
      const driver = await kv.get(`driver:${assignedDriverId}`);
      if (driver) {
        delivery.assignedDriver = {
          id: driver.id,
          name: driver.name
        };
      }
    }

    await kv.set(`delivery:${deliveryId}`, delivery);

    return c.json({ delivery });
  } catch (error) {
    console.log('Create delivery error:', error);
    return c.json({ error: 'Failed to create delivery' }, 500);
  }
});

// Update delivery status
app.patch('/make-server-6d39ce5e/deliveries/:deliveryId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deliveryId = c.req.param('deliveryId');
    const { status } = await c.req.json();

    const delivery = await kv.get(`delivery:${deliveryId}`);
    if (!delivery) {
      return c.json({ error: 'Delivery not found' }, 404);
    }

    delivery.status = status;
    delivery.updatedAt = new Date().toISOString();

    await kv.set(`delivery:${deliveryId}`, delivery);

    return c.json({ delivery });
  } catch (error) {
    console.log('Update delivery status error:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// Update return status
app.patch('/make-server-6d39ce5e/returns/:returnId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const returnId = c.req.param('returnId');
    const { status } = await c.req.json();

    const returnReq = await kv.get(`return:${returnId}`);
    if (!returnReq) {
      return c.json({ error: 'Return not found' }, 404);
    }

    returnReq.status = status;
    returnReq.updatedAt = new Date().toISOString();

    await kv.set(`return:${returnId}`, returnReq);

    return c.json({ return: returnReq });
  } catch (error) {
    console.log('Update return status error:', error);
    return c.json({ error: 'Failed to update return status' }, 500);
  }
});

// ==================== DELIVERY STATS (for dashboard) ====================

app.get('/make-server-6d39ce5e/deliveries/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deliveries = await kv.getByPrefix('delivery:');
    
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter((d: any) => d.status === 'pending').length,
      assigned: deliveries.filter((d: any) => d.status === 'assigned').length,
      inTransit: deliveries.filter((d: any) => d.status === 'in-transit').length,
      delivered: deliveries.filter((d: any) => d.status === 'delivered').length,
      failed: deliveries.filter((d: any) => d.status === 'failed').length
    };

    // Get recent deliveries
    const recentDeliveries = deliveries
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return c.json({ stats, recentDeliveries });
  } catch (error) {
    console.log('Get delivery stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// Initialize sample deliveries (for testing)
app.post('/make-server-6d39ce5e/deliveries/init', async (c) => {
  try {
    const sampleDeliveries = [
      {
        id: 'del-001',
        referenceNumber: 'RMT-2024-10001',
        customerName: 'Maria Santos',
        customerPhone: '+63 917 123 4567',
        address: {
          street: '123 Main Street, Brgy. San Antonio',
          city: 'Makati City',
          postalCode: '1203'
        },
        status: 'delivered',
        assignedDriver: {
          id: 'drv-001',
          name: 'Juan Cruz'
        },
        estimatedDelivery: '2024-01-15',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'del-002',
        referenceNumber: 'RMT-2024-10002',
        customerName: 'Pedro Reyes',
        customerPhone: '+63 918 234 5678',
        address: {
          street: '456 Rizal Avenue, Brgy. Poblacion',
          city: 'Quezon City',
          postalCode: '1100'
        },
        status: 'in-transit',
        assignedDriver: {
          id: 'drv-002',
          name: 'Maria Santos'
        },
        estimatedDelivery: '2024-01-16',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'del-003',
        referenceNumber: 'RMT-2024-10003',
        customerName: 'Ana Garcia',
        customerPhone: '+63 919 345 6789',
        address: {
          street: '789 Del Pilar Street',
          city: 'Manila',
          postalCode: '1000'
        },
        status: 'pending',
        assignedDriver: null,
        estimatedDelivery: '2024-01-17',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const delivery of sampleDeliveries) {
      await kv.set(`delivery:${delivery.id}`, delivery);
    }

    return c.json({ success: true, count: sampleDeliveries.length });
  } catch (error) {
    console.log('Init deliveries error:', error);
    return c.json({ error: 'Failed to initialize deliveries' }, 500);
  }
});

Deno.serve(app.fetch);
