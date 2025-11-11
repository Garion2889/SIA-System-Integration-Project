import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, TruckIcon, DollarSign, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SkeletonCard } from '../SkeletonCard';
import { projectId } from '../../utils/supabase/info';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/badge';

interface AdminDashboardProps {
  accessToken: string;
}

export function AdminDashboard({ accessToken }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/stats`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch orders for charts
      const ordersRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/orders`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Pending', value: stats?.pendingOrders || 0 },
    { name: 'Approved', value: stats?.approvedOrders || 0 },
    { name: 'Delivered', value: stats?.deliveredOrders || 0 }
  ];

  // Revenue over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const revenueData = last7Days.map(date => {
    const dayOrders = orders.filter(o => 
      o.createdAt.split('T')[0] === date && o.status === 'delivered'
    );
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      date: new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      revenue
    };
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Approved Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.approvedOrders || 0}</div>
            <p className="text-xs text-gray-500 mt-1">In processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Delivered Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.deliveredOrders || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₱{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">From delivered orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Logistics Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-blue-600" />
            Logistics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl">{orders.filter(o => o.status === 'in-transit').length}</div>
                <div className="text-sm text-gray-600">Active Deliveries</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl">0</div>
                <div className="text-sm text-gray-600">Failed Attempts</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl">{stats?.totalOrders || 0}</div>
                <div className="text-sm text-gray-600">Total Shipments</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
