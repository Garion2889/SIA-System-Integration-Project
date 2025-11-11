import React from 'react';
import { CheckCircle, Package, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface OrderConfirmationProps {
  order: any;
  onTrackOrder: () => void;
  onBackToHome: () => void;
}

export function OrderConfirmation({ order, onTrackOrder, onBackToHome }: OrderConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600">
          Thank you for your order. We've sent a confirmation to your email.
        </p>
      </div>

      {/* Order Details Card */}
      <Card>
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle>Order Confirmation</CardTitle>
            <div className="text-right">
              <div className="text-sm text-gray-600">Order ID</div>
              <div className="font-mono">{order.id}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Order Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Order Items</span>
            </div>
            <div className="space-y-2">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div>₱{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Delivery Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Delivery Address</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div>{order.deliveryInfo.name}</div>
              <div className="text-sm text-gray-600 mt-1">{order.deliveryInfo.phone}</div>
              <div className="text-sm text-gray-600 mt-1">
                {order.deliveryInfo.address}
              </div>
              <div className="text-sm text-gray-600">
                {order.deliveryInfo.city}, {order.deliveryInfo.postalCode}
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment Method</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="uppercase">
                {order.paymentMethod === 'gcash' ? 'GCash Payment' : 'Cash on Delivery (COD)'}
              </div>
              {order.paymentMethod === 'gcash' && order.paymentStatus && (
                <div className="text-sm text-green-600 mt-1">
                  Payment {order.paymentStatus}
                </div>
              )}
              {order.paymentMethod === 'cod' && (
                <div className="text-sm text-gray-600 mt-1">
                  Pay when you receive your order
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg">Total Amount</span>
            <span className="text-2xl text-blue-600">₱{order.total.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-blue-900">Track Your Order</div>
              <div className="text-sm text-blue-700 mt-1">
                You can track your order status in real-time using the tracking number: <span className="font-mono">{order.id}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1" size="lg" onClick={onTrackOrder}>
          Track My Order
        </Button>
        <Button variant="outline" className="flex-1" size="lg" onClick={onBackToHome}>
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
