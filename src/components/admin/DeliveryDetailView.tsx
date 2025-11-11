import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, TruckIcon, User, Phone, Calendar, Package, ArrowLeft } from 'lucide-react';

interface DeliveryDetailViewProps {
  delivery: any;
  onBack: () => void;
}

export function DeliveryDetailView({ delivery, onBack }: DeliveryDetailViewProps) {
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

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    return `${address.street || ''}, ${address.city || ''}, ${address.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deliveries
        </Button>
        <div>
          <h1 className="text-3xl">Delivery Details</h1>
          <p className="text-gray-600">Reference: {delivery?.referenceNumber || 'N/A'}</p>
        </div>
      </div>

      {/* Main Details Card */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Delivery Information
            </CardTitle>
            <Badge className={getStatusBadge(delivery?.status || 'pending')} style={{ fontSize: '14px', padding: '8px 16px' }}>
              {(delivery?.status || 'pending').toUpperCase().replace('-', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Reference & Status */}
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">Reference Number</div>
                <div className="text-lg font-mono font-medium bg-gray-50 px-3 py-2 rounded border">
                  {delivery?.referenceNumber || 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Status</div>
                <Badge className={getStatusBadge(delivery?.status || 'pending')} style={{ fontSize: '16px', padding: '10px 20px' }}>
                  {(delivery?.status || 'pending').toUpperCase().replace('-', ' ')}
                </Badge>
              </div>

              {delivery?.estimatedDelivery && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Estimated Delivery</div>
                  <div className="flex items-center gap-2 text-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    {new Date(delivery.estimatedDelivery).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">Customer</div>
                <div className="text-lg font-medium">{delivery?.customerName || 'N/A'}</div>
              </div>

              {delivery?.customerPhone && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Contact Number</div>
                  <div className="flex items-center gap-2 text-lg">
                    <Phone className="h-4 w-4 text-blue-600" />
                    {delivery.customerPhone}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-600 mb-2">Delivery Address</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-lg">
                    {formatAddress(delivery?.address)}
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            <div className="md:col-span-2 mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 mb-4">Assigned Driver</div>
              {delivery?.assignedDriver ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TruckIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-medium">{delivery.assignedDriver.name}</div>
                      <div className="text-sm text-gray-600">{delivery.assignedDriver.vehicle || 'Vehicle not specified'}</div>
                      {delivery.assignedDriver.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <Phone className="h-3 w-3" />
                          {delivery.assignedDriver.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="text-gray-600">No driver assigned yet</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Click "Assign" in the delivery table to assign a driver
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Placeholder */}
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Delivery Route Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-200 flex items-center justify-center border-b-4 border-gray-300">
            <div className="text-center text-gray-600">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-xl font-medium">Google Maps Integration</p>
              <p className="text-sm mt-2 text-gray-500">(via Google Maps API)</p>
              <p className="text-xs mt-2 text-gray-400">
                {delivery?.assignedDriver 
                  ? "Track driver's real-time location" 
                  : "Map will show route once driver is assigned"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline/Activity Log */}
      <Card className="shadow-lg border-2">
        <CardHeader className="border-b-2">
          <CardTitle>Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Delivery Created</div>
                <div className="text-sm text-gray-500">
                  {delivery?.createdAt 
                    ? new Date(delivery.createdAt).toLocaleString('en-PH')
                    : 'Recently created'
                  }
                </div>
              </div>
            </div>
            
            {delivery?.assignedDriver && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TruckIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Driver Assigned</div>
                  <div className="text-sm text-gray-500">
                    {delivery.assignedDriver.name} - {delivery.assignedDriver.vehicle || 'Vehicle not specified'}
                  </div>
                </div>
              </div>
            )}
            
            {delivery?.status && delivery.status !== 'pending' && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TruckIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Status Updated</div>
                  <div className="text-sm text-gray-500">
                    Currently: {delivery.status.replace('-', ' ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}