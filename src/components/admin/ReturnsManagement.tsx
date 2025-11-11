import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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

interface ReturnsManagementProps {
  accessToken: string;
}

export function ReturnsManagement({ accessToken }: ReturnsManagementProps) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/returns`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setReturns(data.returns || []);
    } catch (error) {
      console.error('Error loading returns:', error);
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/returns/${returnId}/status`,
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
        toast.error('Failed to update return status');
        return;
      }

      toast.success('Return status updated');
      loadReturns();
    } catch (error) {
      console.error('Update return status error:', error);
      toast.error('Failed to update return status');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingCount = returns.filter(r => r.status === 'pending').length;
  const approvedCount = returns.filter(r => r.status === 'approved').length;
  const completedCount = returns.filter(r => r.status === 'completed').length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading returns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Returns Management</h1>
        <p className="text-gray-600">View and manage customer return requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Returns</div>
                <div className="text-3xl">{returns.length}</div>
              </div>
              <RotateCcw className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-3xl text-yellow-600">{pendingCount}</div>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Approved</div>
                <div className="text-3xl text-green-600">{approvedCount}</div>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-3xl text-blue-600">{completedCount}</div>
              </div>
              <CheckCircle className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Order Ref No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Refund Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No return requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnReq) => (
                    <TableRow key={returnReq.id}>
                      <TableCell className="font-mono text-sm">{returnReq.id}</TableCell>
                      <TableCell className="font-mono text-sm">{returnReq.orderId}</TableCell>
                      <TableCell>Customer #{returnReq.customerId?.slice(-6)}</TableCell>
                      <TableCell className="max-w-xs truncate">{returnReq.reason}</TableCell>
                      <TableCell className="uppercase text-sm">{returnReq.refundMethod}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(returnReq.status)}>
                          {returnReq.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(returnReq.createdAt).toLocaleDateString('en-PH')}
                      </TableCell>
                      <TableCell>
                        {returnReq.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => updateReturnStatus(returnReq.id, 'approved')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateReturnStatus(returnReq.id, 'rejected')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {returnReq.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => updateReturnStatus(returnReq.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
