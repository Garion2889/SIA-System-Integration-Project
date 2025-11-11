import React, { useEffect, useState } from 'react';
import { MapPin, Phone, User, Package, CheckCircle, Clock, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface AssignedDeliveriesProps {
  accessToken: string;
  driverId: string;
}

export function AssignedDeliveries({ accessToken, driverId }: AssignedDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [podNotes, setPodNotes] = useState('');
  const [podImage, setPodImage] = useState<File | null>(null);

  useEffect(() => {
    loadDeliveries();

    // Auto-refresh every 15 seconds
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();

      // Filter orders assigned to this driver
      const myDeliveries = (data.orders || []).filter(
        (order: any) => order.assignedDriver?.id === driverId && 
        ['packed', 'in-transit'].includes(order.status)
      );

      setDeliveries(myDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        toast.error('Failed to update status');
        return;
      }

      toast.success(`Order marked as ${newStatus}`);
      loadDeliveries();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const submitPOD = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      // In a real app, you'd upload the image to Supabase Storage
      // For now, we'll just update the order with POD info

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders/${selectedOrder.id}/pod`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            notes: podNotes,
            hasImage: !!podImage,
            deliveredAt: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        toast.error('Failed to submit proof of delivery');
        return;
      }

      // Update status to delivered
      await updateStatus(selectedOrder.id, 'delivered');

      toast.success('Delivery confirmed successfully');
      setPodDialogOpen(false);
      setPodNotes('');
      setPodImage(null);
      setSelectedOrder(null);
      loadDeliveries();
    } catch (error) {
      console.error('Error submitting POD:', error);
      toast.error('Failed to submit proof of delivery');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'packed': 'bg-purple-100 text-purple-800',
      'in-transit': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const activeCount = deliveries.filter(d => d.status === 'in-transit').length;
  const pendingCount = deliveries.filter(d => d.status === 'packed').length;
  const totalEarnings = deliveries.filter(d => d.paymentMethod === 'cod').reduce((sum, d) => sum + d.total, 0);

  if (loading && deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-700">Active</div>
                <div className="text-2xl text-orange-900">{activeCount}</div>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-700">Pending Pickup</div>
                <div className="text-2xl text-purple-900">{pendingCount}</div>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700">COD to Collect</div>
                <div className="text-2xl text-green-900">₱{totalEarnings.toLocaleString()}</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries List */}
      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">No Active Deliveries</h3>
              <p className="text-sm text-gray-500">
                You don't have any assigned deliveries at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Order #{delivery.id}
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status.toUpperCase().replace('-', ' ')}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed {new Date(delivery.createdAt).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-blue-600">₱{delivery.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 uppercase">
                      {delivery.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{delivery.deliveryInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${delivery.deliveryInfo.phone}`} className="text-blue-600 hover:underline">
                      {delivery.deliveryInfo.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div>{delivery.deliveryInfo.address}</div>
                      <div className="text-gray-500">
                        {delivery.deliveryInfo.city}, {delivery.deliveryInfo.postalCode}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Items:</div>
                  {delivery.items.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {delivery.status === 'packed' && (
                    <>
                      <Button
                        onClick={() => updateStatus(delivery.id, 'in-transit')}
                        disabled={updating}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Pick Up
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.deliveryInfo.address)}`, '_blank')}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                    </>
                  )}

                  {delivery.status === 'in-transit' && (
                    <>
                      <Dialog 
                        open={podDialogOpen && selectedOrder?.id === delivery.id}
                        onOpenChange={(open) => {
                          setPodDialogOpen(open);
                          if (!open) {
                            setSelectedOrder(null);
                            setPodNotes('');
                            setPodImage(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setSelectedOrder(delivery);
                              setPodDialogOpen(true);
                            }}
                            className="w-full col-span-2"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Mark as Delivered
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Proof of Delivery</DialogTitle>
                            <DialogDescription>
                              Upload proof of delivery for Order #{delivery.id}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="pod-image">Upload Photo (Optional)</Label>
                              <Input
                                id="pod-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPodImage(e.target.files?.[0] || null)}
                              />
                              <p className="text-xs text-gray-500">
                                Take a photo of the delivered package or customer signature
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pod-notes">Delivery Notes</Label>
                              <Textarea
                                id="pod-notes"
                                placeholder="Any additional notes about the delivery..."
                                value={podNotes}
                                onChange={(e) => setPodNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <Button className="w-full" onClick={submitPOD} disabled={updating}>
                              {updating ? 'Submitting...' : 'Confirm Delivery'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
