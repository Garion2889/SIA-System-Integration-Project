import React, { useEffect, useState } from 'react';
import { Truck, User, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface DeliveryControlProps {
  accessToken: string;
}

export function DeliveryControl({ accessToken }: DeliveryControlProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load drivers
      const driversRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const driversData = await driversRes.json();
      
      if (!driversData.drivers || driversData.drivers.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryData = await retryRes.json();
        setDrivers(retryData.drivers || []);
      } else {
        setDrivers(driversData.drivers);
      }

      // Load orders ready for delivery
      const ordersRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const ordersData = await ordersRes.json();
      
      // Filter orders that are packed or in-transit
      const deliveryOrders = (ordersData.orders || []).filter(
        (o: any) => o.status === 'packed' || o.status === 'in-transit'
      );
      setOrders(deliveryOrders);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders/${orderId}/assign-driver`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ driverId })
        }
      );

      if (!response.ok) {
        toast.error('Failed to assign driver');
        return;
      }

      toast.success('Driver assigned successfully');
      loadData();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'available': 'bg-green-100 text-green-800',
      'on-delivery': 'bg-orange-100 text-orange-800',
      'off-duty': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading delivery control...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drivers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(driver.status)}>
                  {driver.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{driver.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>{driver.vehicle}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="text-2xl text-blue-600">{driver.activeDeliveries}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-gray-700">{driver.totalDeliveries}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Rating</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{driver.rating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Awaiting Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Awaiting Delivery Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No orders awaiting delivery assignment
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{order.deliveryInfo.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === 'packed' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }>
                          {order.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{order.assignedDriver.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Not assigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(driverId) => assignDriver(order.id, driverId)}
                          disabled={!!order.assignedDriver}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign Driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.filter(d => d.status === 'available').map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* GPS Integration Placeholder */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">GPS Tracking Integration</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ready for next-phase development: Real-time GPS tracking for delivery vehicles and live location updates for customers.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white">Google Maps API Ready</Badge>
                <Badge variant="outline" className="bg-white">Geolocation Services</Badge>
                <Badge variant="outline" className="bg-white">Live ETA Updates</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
