import React, { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId } from '../utils/supabase/info';
import { MilestoneTracker } from './MilestoneTracker';

type TrackingState = 'initial' | 'valid' | 'invalid';

interface DeliveryData {
  referenceNumber: string;
  customerName: string;
  customerPhone?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'failed';
  estimatedDelivery?: string;
  assignedDriver?: {
    name: string;
    phone?: string;
  };
}

interface PublicTrackingProps {
  onBackToLogin: () => void;
}

export function PublicTracking({ onBackToLogin }: PublicTrackingProps) {
  const [trackingState, setTrackingState] = useState<TrackingState>('initial');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackDelivery = async () => {
    if (!referenceNumber.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/track/${referenceNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDeliveryData(data);
        setTrackingState('valid');
      } else {
        setTrackingState('invalid');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setTrackingState('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    onBackToLogin();
  };

  const handleBackToSearch = () => {
    setTrackingState('initial');
    setReferenceNumber('');
    setDeliveryData(null);
  };

  // Valid delivery result page
  if (trackingState === 'valid' && deliveryData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back to Search */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={handleBackToSearch}
              className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Search Another Delivery
            </Button>
          </div>

          {/* Delivery Details Card */}
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-medium text-gray-900 mb-2">Delivery Details</h1>
                <p className="text-lg text-gray-600">Reference: <span className="font-mono font-medium">{deliveryData.referenceNumber}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">RECIPIENT</h3>
                    <p className="text-lg text-gray-900">{deliveryData.customerName}</p>
                    {deliveryData.customerPhone && (
                      <p className="text-sm text-gray-600">{deliveryData.customerPhone}</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">DELIVERY ADDRESS</h3>
                    <p className="text-lg text-gray-900">
                      {deliveryData.address.street}, {deliveryData.address.city}, {deliveryData.address.postalCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">STATUS</h3>
                    <p className="text-lg font-medium capitalize">
                      {deliveryData.status.replace('-', ' ')}
                    </p>
                  </div>

                  {deliveryData.estimatedDelivery && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">ESTIMATED DELIVERY</h3>
                      <p className="text-lg text-gray-900">
                        {new Date(deliveryData.estimatedDelivery).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {deliveryData.assignedDriver && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">ASSIGNED DRIVER</h3>
                      <p className="text-lg text-gray-900">{deliveryData.assignedDriver.name}</p>
                      {deliveryData.assignedDriver.phone && (
                        <p className="text-sm text-gray-600">{deliveryData.assignedDriver.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Status Tracker */}
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Delivery Progress</h2>
              <MilestoneTracker status={deliveryData.status} />
            </CardContent>
          </Card>

          {/* Google Map Placeholder */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                    <Search className="h-10 w-10 text-emerald-600" />
                  </div>
                  <p className="text-xl font-medium">Driver Location</p>
                  <p className="text-sm mt-2 text-gray-500">(Google Maps Integration)</p>
                  <p className="text-xs mt-2 text-gray-400">Real-time tracking will be shown here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Login */}
          <div className="text-center mt-8">
            <Button 
              variant="ghost" 
              onClick={handleBackToLogin}
              className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Invalid reference number page
  if (trackingState === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <Search className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Delivery Not Found</h1>
            <p className="text-gray-600 mb-2">
              We couldn't find a delivery with reference number:
            </p>
            <p className="font-mono text-lg text-gray-900 bg-gray-100 px-4 py-2 rounded-lg mb-6">
              {referenceNumber}
            </p>
            <p className="text-sm text-gray-500">
              Please double-check your reference number and try again.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleBackToSearch}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Search className="h-4 w-4" />
              Try Another Reference
            </Button>

            <Button 
              variant="ghost" 
              onClick={handleBackToLogin}
              className="w-full gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Initial search page (matches the design exactly)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Main Content */}
        <div className="text-center">
          <h1 className="text-4xl font-normal text-gray-900 mb-4">Track Your Delivery</h1>
          <p className="text-lg text-gray-600 mb-12">
            Enter your reference number to track your delivery status
          </p>

          {/* Tracking Card */}
          <Card className="shadow-xl border-0 mb-12">
            <CardContent className="p-8">
              <div className="space-y-6">
                <Input
                  type="text"
                  placeholder="Enter Reference Number (e.g., REF-2025-12345)"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrackDelivery()}
                  className="h-14 text-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={loading}
                />

                <Button 
                  onClick={handleTrackDelivery}
                  disabled={!referenceNumber.trim() || loading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg gap-2"
                >
                  <Search className="h-5 w-5" />
                  {loading ? 'Tracking...' : 'Track Delivery'}
                </Button>

                <p className="text-sm text-gray-500">
                  You can use the Ref No. from your POS receipt
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Icon and Description */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
              <Search className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-3">
              Enter your Reference Number to track your delivery
            </h2>
            <p className="text-gray-600">
              Get real-time updates on your package status
            </p>
          </div>

          {/* Back to Login */}
          <Button 
            variant="ghost" 
            onClick={handleBackToLogin}
            className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}