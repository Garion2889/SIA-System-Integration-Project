import React, { useEffect, useState } from 'react';
import { Building2, Phone, Mail, Package, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface SupplierManagementProps {
  accessToken: string;
}

export function SupplierManagement({ accessToken }: SupplierManagementProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/suppliers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      
      // Initialize suppliers if empty
      if (!data.suppliers || data.suppliers.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/suppliers/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          }
        );
        // Reload suppliers
        const retryResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/suppliers`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryData = await retryResponse.json();
        setSuppliers(retryData.suppliers || []);
      } else {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (supplierId: string, supplierName: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/suppliers/${supplierId}/reorder`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error processing reorder:', error);
      toast.error('Failed to process reorder');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{supplier.email}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Products</div>
                <div className="flex flex-wrap gap-1">
                  {supplier.products.map((product: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full"
                variant="outline"
                onClick={() => handleReorder(supplier.id, supplier.name)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reorder
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Supplier Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.flatMap(supplier => 
                  supplier.history.map((order: any, index: number) => (
                    <TableRow key={`${supplier.id}-${index}`}>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.date).toLocaleDateString('en-PH')}
                      </TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell className="text-blue-600">
                        ₱{order.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ).sort((a: any, b: any) => 
                  new Date(b.key.split('-')[2]).getTime() - new Date(a.key.split('-')[2]).getTime()
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
