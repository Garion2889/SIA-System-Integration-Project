import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
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
import { Progress } from '../ui/progress';

interface InventoryManagementProps {
  accessToken: string;
}

export function InventoryManagement({ accessToken }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/inventory`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();

      if (!data.inventory || data.inventory.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/inventory/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/inventory`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );
        const retryData = await retryResponse.json();
        setInventory(retryData.inventory || []);
      } else {
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedProduct || !restockQuantity) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/inventory/${selectedProduct.productId}/restock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ quantity: parseInt(restockQuantity) })
        }
      );

      if (!response.ok) {
        toast.error('Failed to restock');
        return;
      }

      toast.success(`Successfully restocked ${selectedProduct.productName}`);
      setRestockDialogOpen(false);
      setRestockQuantity('');
      setSelectedProduct(null);
      loadInventory();
    } catch (error) {
      console.error('Restock error:', error);
      toast.error('Failed to restock');
    }
  };

  const getStockLevel = (current: number, reorder: number) => {
    const percentage = (current / (reorder * 3)) * 100;
    if (percentage <= 33) return 'critical';
    if (percentage <= 66) return 'low';
    return 'good';
  };

  const getStockColor = (level: string) => {
    const colors = {
      'critical': { badge: 'bg-red-100 text-red-800', progress: 'bg-red-600' },
      'low': { badge: 'bg-yellow-100 text-yellow-800', progress: 'bg-yellow-600' },
      'good': { badge: 'bg-green-100 text-green-800', progress: 'bg-green-600' }
    };
    return colors[level as keyof typeof colors] || colors.good;
  };

  const lowStockCount = inventory.filter(i => i.needsReorder).length;
  const totalItems = inventory.reduce((sum, i) => sum + i.currentStock, 0);
  const avgStockLevel = inventory.length > 0 
    ? (inventory.reduce((sum, i) => sum + (i.currentStock / i.reorderLevel), 0) / inventory.length * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{inventory.length} product types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{lowStockCount}</div>
            <p className="text-xs text-gray-500 mt-1">Need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Stock Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{avgStockLevel}%</div>
            <p className="text-xs text-gray-500 mt-1">Of reorder threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-yellow-900">Low Stock Alert</div>
                <div className="text-sm text-yellow-700 mt-1">
                  {lowStockCount} product(s) are below reorder level and need restocking.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const level = getStockLevel(item.currentStock, item.reorderLevel);
                  const colors = getStockColor(level);
                  const stockPercentage = Math.min((item.currentStock / (item.reorderLevel * 3)) * 100, 100);

                  return (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg">{item.currentStock}</span>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress value={stockPercentage} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{stockPercentage.toFixed(0)}%</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(item.lastRestocked).toLocaleDateString('en-PH')}
                      </TableCell>
                      <TableCell>
                        {item.needsReorder ? (
                          <Badge className={colors.badge}>
                            NEEDS REORDER
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            SUFFICIENT
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog 
                          open={restockDialogOpen && selectedProduct?.productId === item.productId}
                          onOpenChange={(open) => {
                            setRestockDialogOpen(open);
                            if (!open) {
                              setSelectedProduct(null);
                              setRestockQuantity('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(item);
                                setRestockDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Restock
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Restock {item.productName}</DialogTitle>
                              <DialogDescription>
                                Current stock: {item.currentStock} units | Recommended reorder: {item.reorderQuantity} units
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity to Add</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="1"
                                  placeholder="Enter quantity"
                                  value={restockQuantity}
                                  onChange={(e) => setRestockQuantity(e.target.value)}
                                />
                              </div>
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="flex justify-between mb-1">
                                  <span>Current Stock:</span>
                                  <span>{item.currentStock}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                  <span>Adding:</span>
                                  <span className="text-green-600">+{restockQuantity || 0}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 mt-1">
                                  <span>New Stock:</span>
                                  <span className="text-blue-600">
                                    {item.currentStock + parseInt(restockQuantity || '0')}
                                  </span>
                                </div>
                              </div>
                              <Button className="w-full" onClick={handleRestock}>
                                Confirm Restock
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
