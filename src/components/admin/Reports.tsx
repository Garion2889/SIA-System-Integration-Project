import React, { useEffect, useState } from 'react';
import { FileText, Download, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { projectId } from '../../utils/supabase/info';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportsProps {
  accessToken: string;
}

export function Reports({ accessToken }: ReportsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/deliveries/stats`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    // Placeholder for export functionality
    alert(`Exporting report as ${format.toUpperCase()}...\nThis feature will integrate with your backend export service.`);
  };

  const performanceData = [
    { name: 'Mon', deliveries: 24, success: 22 },
    { name: 'Tue', deliveries: 31, success: 29 },
    { name: 'Wed', deliveries: 28, success: 26 },
    { name: 'Thu', deliveries: 35, success: 33 },
    { name: 'Fri', deliveries: 29, success: 28 },
    { name: 'Sat', deliveries: 18, success: 17 },
    { name: 'Sun', deliveries: 12, success: 12 }
  ];

  const driverActivity = [
    { name: 'Juan Cruz', deliveries: 45, efficiency: 96 },
    { name: 'Maria Santos', deliveries: 52, efficiency: 98 },
    { name: 'Pedro Reyes', deliveries: 38, efficiency: 92 }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Auto-generated delivery and driver performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => exportReport('pdf')} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl mt-1">
                  {stats?.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Delivery Time</p>
                <p className="text-3xl mt-1">2.3h</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Route Efficiency</p>
                <p className="text-3xl mt-1">94%</p>
              </div>
              <FileText className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Delivery Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deliveries" fill="#3b82f6" name="Total Deliveries" />
                <Bar dataKey="success" fill="#10b981" name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Driver Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Activity Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {driverActivity.map((driver) => (
              <div key={driver.name} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{driver.name}</span>
                  <span className="text-sm text-gray-600">{driver.deliveries} deliveries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${driver.efficiency}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-600">{driver.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>Route Efficiency Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Successful Deliveries"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
