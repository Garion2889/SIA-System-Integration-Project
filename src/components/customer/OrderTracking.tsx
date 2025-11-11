import React, { useEffect, useState } from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MilestoneTracker } from '../MilestoneTracker';
import { SkeletonOrderDetail } from '../SkeletonCard';
import { projectId } from '../../utils/supabase/info';
import { Separator } from '../ui/separator';

interface OrderTrackingProps {
  accessToken: string;
  orderId?: string;
  onBack?: () => void;
}

export function OrderTracking({ accessToken, orderId, onBack }: OrderTrackingProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [orderId, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'created': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'packed': 'bg-purple-100 text-purple-800',
      'in-transit': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <SkeletonOrderDetail />;
  }

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        {onBack && (
          <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details</CardTitle>
              <Badge className={getStatusColor(selectedOrder.status)}>
                {selectedOrder.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Order ID</div>
                <div>{selectedOrder.id}</div>
              </div>
              <div>
                <div className="text-gray-500">Order Date</div>
                <div>{new Date(selectedOrder.createdAt).toLocaleDateString('en-PH')}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Amount</div>
                <div className="text-blue-600">₱{selectedOrder.total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Payment Method</div>
                <div className="uppercase">{selectedOrder.paymentMethod}</div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-gray-500 text-sm mb-2">Items</div>
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-gray-500 text-sm mb-2">Delivery Address</div>
              <div className="text-sm">
                <div>{selectedOrder.deliveryInfo.name}</div>
                <div>{selectedOrder.deliveryInfo.phone}</div>
                <div>{selectedOrder.deliveryInfo.address}</div>
                <div>{selectedOrder.deliveryInfo.city}, {selectedOrder.deliveryInfo.postalCode}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <MilestoneTracker 
              milestones={selectedOrder.milestones}
              currentStatus={selectedOrder.status}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{order.id}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {order.items.length} item(s) • ₱{order.total.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-PH')}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Track
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
