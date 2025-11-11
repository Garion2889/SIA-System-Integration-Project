import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface RequestReturnProps {
  accessToken: string;
  onBack: () => void;
}

export function RequestReturn({ accessToken, onBack }: RequestReturnProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [refundMethod, setRefundMethod] = useState('gcash');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    loadDeliveredOrders();
  }, []);

  const loadDeliveredOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();

      // Only show delivered orders from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const eligibleOrders = (data.orders || []).filter((order: any) => 
        order.status === 'delivered' && 
        new Date(order.createdAt) > thirtyDaysAgo
      );

      setOrders(eligibleOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you'd upload the image to Supabase Storage first
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/returns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            orderId: selectedOrderId,
            reason,
            description,
            refundMethod,
            hasProof: !!proofImage
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(`Return request failed: ${data.error}`);
        setLoading(false);
        return;
      }

      toast.success('Return request submitted successfully');
      onBack();
    } catch (error) {
      console.error('Return request error:', error);
      toast.error('Failed to submit return request');
      setLoading(false);
    }
  };

  const returnReasons = [
    'Defective/Damaged Product',
    'Wrong Item Received',
    'Item Not As Described',
    'Changed Mind',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl mb-2">Request Return</h1>
        <p className="text-gray-600">
          Submit a return request for delivered orders within 30 days
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>Return Policy:</strong> Items must be in original condition with tags attached. 
              Returns are accepted within 30 days of delivery. Processing time: 5-7 business days.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Return Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="text-center py-8 text-gray-500">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">No Eligible Orders</h3>
              <p className="text-sm text-gray-500">
                You don't have any delivered orders eligible for return.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Select Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Select Order *</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.id} - ₱{order.total.toLocaleString()} 
                        ({new Date(order.createdAt).toLocaleDateString('en-PH')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Return *</Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Proof Upload */}
              <div className="space-y-2">
                <Label htmlFor="proof">Upload Proof (Photo of defect/damage) *</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Please upload a clear photo showing the issue (max 5MB)
                </p>
              </div>

              {/* Refund Method */}
              <div className="space-y-3">
                <Label>Preferred Refund Method *</Label>
                <RadioGroup value={refundMethod} onValueChange={setRefundMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-blue-300 transition-colors">
                    <RadioGroupItem value="gcash" id="gcash-refund" />
                    <Label htmlFor="gcash-refund" className="flex-1 cursor-pointer">
                      <div>GCash Refund</div>
                      <div className="text-sm text-gray-500">Receive refund to your GCash account</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-blue-300 transition-colors">
                    <RadioGroupItem value="store-credit" id="store-credit" />
                    <Label htmlFor="store-credit" className="flex-1 cursor-pointer">
                      <div>Store Credit</div>
                      <div className="text-sm text-gray-500">Faster processing, use for future purchases</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Return Request'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
