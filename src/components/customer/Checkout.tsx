import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface CheckoutProps {
  cart: CartItem[];
  accessToken: string;
  onBack: () => void;
  onSuccess: (order: any) => void;
}

export function Checkout({ cart, accessToken, onBack, onSuccess }: CheckoutProps) {
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = 100;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order first
      const orderResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity
            })),
            deliveryInfo,
            paymentMethod
          })
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        toast.error(`Order failed: ${orderData.error}`);
        setLoading(false);
        return;
      }

      // If GCash payment, create payment link
      if (paymentMethod === 'gcash') {
        const paymentResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/payments/gcash`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              amount: total,
              orderId: orderData.order.id,
              description: `Payment for Order ${orderData.order.id}`
            })
          }
        );

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          toast.error('Payment processing failed. Please contact support.');
          setLoading(false);
          return;
        }

        // Redirect to GCash checkout
        toast.success('Redirecting to GCash payment...');
        window.open(paymentData.checkoutUrl, '_blank');
        
        // Mark order with payment pending
        orderData.order.paymentStatus = 'pending';
      }

      toast.success('Order placed successfully!');
      onSuccess(orderData.order);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Catalog
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={deliveryInfo.city}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">Postal Code *</Label>
                    <Input
                      id="postal"
                      value={deliveryInfo.postalCode}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div>Cash on Delivery (COD)</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="gcash" id="gcash" />
                  <Label htmlFor="gcash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span>GCash Payment</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Secure</span>
                    </div>
                    <div className="text-sm text-gray-500">Pay online via GCash (PayMongo)</div>
                  </Label>
                </div>
              </RadioGroup>
              
              {paymentMethod === 'gcash' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-900">
                    You will be redirected to GCash payment page after placing your order.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>₱{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>₱{deliveryFee.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-xl text-blue-600">₱{total.toLocaleString()}</span>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
