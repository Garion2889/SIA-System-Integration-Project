import React, { useEffect, useState } from 'react';
import { Package, TruckIcon, CheckCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { projectId } from '../../utils/supabase/info';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LogisticsDashboardProps {
  accessToken: string;
}

export function LogisticsDashboard({ accessToken }: LogisticsDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/stats`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setStats(data.stats);
      setDeliveries(data.recentDeliveries || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const total = stats?.total || 0;
  const pending = stats?.pending || 0;
  const active = stats?.inTransit || 0;
  const completed = stats?.delivered || 0;
  const failed = stats?.failed || 0;

  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Active', value: active, color: '#3b82f6' },
    { name: 'Completed', value: completed, color: '#27AE60' },
    { name: 'Failed', value: failed, color: '#ef4444' }
  ];

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-3xl mt-1">{total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deliveries</p>
                <p className="text-3xl mt-1">{active}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl mt-1">{completed}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl mt-1">{pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{successRate}%</span>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <Progress value={Number(successRate)} className="h-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Successful</div>
                  <div className="text-lg text-blue-600">{completed}</div>
                </div>
                <div>
                  <div className="text-gray-600">Failed</div>
                  <div className="text-lg text-red-600">{failed}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: pending, color: '#f59e0b' },
                      { name: 'Active', value: active, color: '#3b82f6' },
                      { name: 'Completed', value: completed, color: '#10b981' },
                      { name: 'Failed', value: failed, color: '#ef4444' }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {[
                      { name: 'Pending', value: pending, color: '#f59e0b' },
                      { name: 'Active', value: active, color: '#3b82f6' },
                      { name: 'Completed', value: completed, color: '#10b981' },
                      { name: 'Failed', value: failed, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Map Preview Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Live Delivery Tracking Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Google Maps Integration</p>
              <p className="text-sm mt-2">Real-time driver locations will be displayed here</p>
              <p className="text-xs mt-1 text-gray-400">Requires Google Maps API key</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveries.filter(d => d.status !== 'delivered').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TruckIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No active deliveries</p>
              </div>
            ) : (
              deliveries
                .filter(d => d.status !== 'delivered')
                .slice(0, 5)
                .map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-medium">
                          {delivery.referenceNumber}
                        </span>
                        <Badge className={getStatusBadge(delivery.status)}>
                          {delivery.status.toUpperCase().replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {delivery.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {delivery.address?.city}
                      </div>
                    </div>
                    <div className="text-right">
                      {delivery.assignedDriver ? (
                        <div className="flex items-center gap-2 text-sm">
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                          <span>{delivery.assignedDriver.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pending > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{pending} deliveries awaiting assignment</p>
                  <p className="text-xs text-gray-600 mt-1">Assign drivers to process orders</p>
                </div>
              </div>
            )}
            {active > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <TruckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{active} deliveries in transit</p>
                  <p className="text-xs text-gray-600 mt-1">Track active routes on map</p>
                </div>
              </div>
            )}
            {completed > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{completed} deliveries completed today</p>
                  <p className="text-xs text-gray-600 mt-1">Great job team!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
