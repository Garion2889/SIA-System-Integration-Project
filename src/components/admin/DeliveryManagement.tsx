import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, MapPin, Calendar, User, Phone, TruckIcon, UserPlus, Eye } from 'lucide-react';
import { DeliveryDetailView } from './DeliveryDetailView';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface DeliveryManagementProps {
  accessToken: string;
}

export function DeliveryManagement({ accessToken }: DeliveryManagementProps) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [detailDelivery, setDetailDelivery] = useState<any>(null);
  const [newDelivery, setNewDelivery] = useState({
    customerName: '',
    customerPhone: '',
    street: '',
    city: '',
    postalCode: '',
    estimatedDelivery: '',
    assignedDriverId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load deliveries
      const deliveriesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/stats`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const deliveriesData = await deliveriesRes.json();
      
      if (!deliveriesData.recentDeliveries || deliveriesData.recentDeliveries.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/stats`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryData = await retryRes.json();
        setDeliveries(retryData.recentDeliveries || []);
      } else {
        setDeliveries(deliveriesData.recentDeliveries);
      }

      // Load drivers
      const driversRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const driversData = await driversRes.json();
      setDrivers(driversData.drivers || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    try {
      const referenceNumber = `RMT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            ...newDelivery,
            referenceNumber
          })
        }
      );

      if (!response.ok) {
        toast.error('Failed to create delivery');
        return;
      }

      toast.success(`Delivery created: ${referenceNumber}`);
      setCreateDialogOpen(false);
      setNewDelivery({
        customerName: '',
        customerPhone: '',
        street: '',
        city: '',
        postalCode: '',
        estimatedDelivery: '',
        assignedDriverId: ''
      });
      loadData();
    } catch (error) {
      console.error('Create delivery error:', error);
      toast.error('Failed to create delivery');
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/${deliveryId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        toast.error('Failed to update status');
        return;
      }

      toast.success('Status updated');
      loadData();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };

  const assignDriver = async (deliveryId: string, driverId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/${deliveryId}/assign`,
        {
          method: 'PATCH',
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
      setAssignDriverDialogOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (error) {
      console.error('Assign driver error:', error);
      toast.error('Failed to assign driver');
    }
  };

  const openAssignDriverDialog = (delivery: any) => {
    setSelectedDelivery(delivery);
    setAssignDriverDialogOpen(true);
  };

  const openDetailView = (delivery: any) => {
    setDetailDelivery(delivery);
    setShowDetailView(true);
  };

  const closeDetailView = () => {
    setShowDetailView(false);
    setDetailDelivery(null);
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDeliveries = deliveries.filter(d => 
    d.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading deliveries...</div>
      </div>
    );
  }

  // Show detail view if selected
  if (showDetailView && detailDelivery) {
    return (
      <DeliveryDetailView 
        delivery={detailDelivery} 
        onBack={closeDetailView} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Delivery Management</h1>
          <p className="text-gray-600">View and manage all deliveries</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Delivery</DialogTitle>
              <DialogDescription>
                Enter delivery details and assign a driver
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={newDelivery.customerName}
                  onChange={(e) => setNewDelivery({ ...newDelivery, customerName: e.target.value })}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  value={newDelivery.customerPhone}
                  onChange={(e) => setNewDelivery({ ...newDelivery, customerPhone: e.target.value })}
                  placeholder="+63 917 123 4567"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Street Address</Label>
                <Input
                  value={newDelivery.street}
                  onChange={(e) => setNewDelivery({ ...newDelivery, street: e.target.value })}
                  placeholder="123 Main Street, Brgy. Poblacion"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newDelivery.city}
                  onChange={(e) => setNewDelivery({ ...newDelivery, city: e.target.value })}
                  placeholder="Manila"
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={newDelivery.postalCode}
                  onChange={(e) => setNewDelivery({ ...newDelivery, postalCode: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Date</Label>
                <Input
                  type="date"
                  value={newDelivery.estimatedDelivery}
                  onChange={(e) => setNewDelivery({ ...newDelivery, estimatedDelivery: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Driver (Optional)</Label>
                <Select 
                  value={newDelivery.assignedDriverId} 
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, assignedDriverId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.vehicle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateDelivery} className="w-full">
              Create Delivery
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by reference number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deliveries ({filteredDeliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Est. Delivery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono text-sm">
                        {delivery.referenceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{delivery.customerName}</div>
                          <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                          <span className="text-sm truncate">{delivery.address?.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {delivery.assignedDriver ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <TruckIcon className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-sm">{delivery.assignedDriver.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Not assigned</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openAssignDriverDialog(delivery)}
                                className="h-6 px-2 text-xs"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(delivery.status)}>
                          {delivery.status.toUpperCase().replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {delivery.estimatedDelivery || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailView(delivery)}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Select 
                            value={delivery.status} 
                            onValueChange={(value) => updateDeliveryStatus(delivery.id, value)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="in-transit">In Transit</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Driver Modal */}
      <Dialog open={assignDriverDialogOpen} onOpenChange={setAssignDriverDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to delivery: {selectedDelivery?.referenceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Delivery Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Customer</div>
                <div className="font-medium">{selectedDelivery.customerName}</div>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedDelivery.address?.city}
                </div>
              </div>

              {/* Driver Selection */}
              <div className="space-y-2">
                <Label>Select Available Driver</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {drivers.filter(driver => driver.status === 'active').map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => assignDriver(selectedDelivery.id, driver.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{driver.name}</div>
                          <div className="text-xs text-gray-500">{driver.vehicle} • Available</div>
                        </div>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                  
                  {drivers.filter(driver => driver.status === 'busy').map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <TruckIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{driver.name}</div>
                          <div className="text-xs text-gray-500">{driver.vehicle} • Busy</div>
                        </div>
                      </div>
                      <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
                
                {drivers.filter(driver => driver.status === 'active').length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No available drivers at the moment
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAssignDriverDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
