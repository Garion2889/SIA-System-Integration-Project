import React, { useEffect, useState } from 'react';
import { TruckIcon, UserPlus, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface DriverManagementProps {
  accessToken: string;
}

export function DriverManagement({ accessToken }: DriverManagementProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle: ''
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();

      if (!data.drivers || data.drivers.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryData = await retryResponse.json();
        setDrivers(retryData.drivers || []);
      } else {
        setDrivers(data.drivers);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/auth/driver-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(newDriver)
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(`Failed to create driver: ${data.error}`);
        return;
      }

      toast.success('Driver account created successfully');
      setCreateDialogOpen(false);
      setNewDriver({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicle: ''
      });
      loadDrivers();
    } catch (error) {
      console.error('Create driver error:', error);
      toast.error('Failed to create driver');
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
        <div className="text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Driver Management</h1>
          <p className="text-gray-600">Manage delivery drivers and create accounts</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Driver Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Driver Account</DialogTitle>
              <DialogDescription>
                Enter driver information to create a new account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  placeholder="driver@rmt.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newDriver.password}
                  onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  type="tel"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  placeholder="+63 917 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Input
                  value={newDriver.vehicle}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                  placeholder="Motorcycle - ABC 1234"
                />
              </div>
              <Button onClick={handleCreateDriver} className="w-full">
                Create Driver Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Drivers</div>
                <div className="text-3xl">{drivers.length}</div>
              </div>
              <TruckIcon className="h-10 w-10 text-[#2E6AF7]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Available</div>
                <div className="text-3xl text-green-600">
                  {drivers.filter(d => d.status === 'available').length}
                </div>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">On Delivery</div>
                <div className="text-3xl text-orange-600">
                  {drivers.filter(d => d.status === 'on-delivery').length}
                </div>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-[#2E6AF7] bg-opacity-10 rounded-full flex items-center justify-center">
                    <TruckIcon className="h-6 w-6 text-[#2E6AF7]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                    <p className="text-sm text-gray-500">{driver.vehicle}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(driver.status)}>
                  {driver.status.toUpperCase().replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{driver.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="text-2xl">{driver.activeDeliveries}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">{driver.totalDeliveries}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              {driver.rating && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-500">Rating</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
