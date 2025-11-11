import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MilestoneTracker } from '../MilestoneTracker';
import { SkeletonOrderDetail } from '../SkeletonCard';
import { Separator } from '../ui/separator';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface OrderDetailProps {
  accessToken: string;
  orderId: string;
  onBack: () => void;
}

export function OrderDetail({ accessToken, orderId, onBack }: OrderDetailProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders/${orderId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders/${orderId}/update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Update failed: ${data.error}`);
        setUpdating(false);
        return;
      }

      toast.success('Order status updated successfully');
      setOrder(data.order);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Button variant="link" onClick={onBack}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Order {order.id}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString('en-PH')}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div>{order.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-xl text-blue-600">₱{order.total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Payment Method</div>
              <div className="uppercase">{order.paymentMethod}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-gray-500 mb-2">Order Items</div>
            <div className="space-y-2">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div>₱{item.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      Total: ₱{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-gray-500 mb-2">Delivery Address</div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div>{order.deliveryInfo.name}</div>
              <div className="text-sm text-gray-600 mt-1">{order.deliveryInfo.phone}</div>
              <div className="text-sm text-gray-600 mt-1">
                {order.deliveryInfo.address}, {order.deliveryInfo.city}, {order.deliveryInfo.postalCode}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select 
                value={order.status} 
                onValueChange={updateStatus}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              {updating ? 'Updating...' : 'Select status to update'}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="text-blue-900">Real-time Sync</div>
                <div className="text-blue-700">
                  Status updates will instantly sync to the customer's view
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-gray-500 mb-4">Current Progress</div>
            <MilestoneTracker 
              milestones={order.milestones}
              currentStatus={order.status}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {order.status === 'created' && (
          <Button
            className="w-full"
            onClick={() => updateStatus('approved')}
            disabled={updating}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Order
          </Button>
        )}
        {order.status === 'approved' && (
          <Button
            className="w-full"
            onClick={() => updateStatus('packed')}
            disabled={updating}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Packed
          </Button>
        )}
        {order.status === 'packed' && (
          <Button
            className="w-full"
            onClick={() => updateStatus('in-transit')}
            disabled={updating}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as In Transit
          </Button>
        )}
        {order.status === 'in-transit' && (
          <Button
            className="w-full"
            onClick={() => updateStatus('delivered')}
            disabled={updating}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        )}
      </div>
    </div>
  );
}
