import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SkeletonProduct } from '../SkeletonCard';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductCatalogProps {
  accessToken: string;
  onCheckout: (cart: CartItem[]) => void;
}

export function ProductCatalog({ accessToken, onCheckout }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/products`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      
      // Initialize products if empty
      if (!data.products || data.products.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/products/init`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          }
        );
        // Reload products
        const retryResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/products`,
          {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          }
        );
        const retryData = await retryResponse.json();
        setProducts(retryData.products || []);
      } else {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success('Added to cart');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
          return null;
        }
        if (newQuantity > item.product.stock) {
          toast.error('Insufficient stock');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonProduct key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="sticky top-4 z-10 bg-blue-50 border-blue-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <div>{cartCount} item(s) in cart</div>
                <div className="text-sm text-gray-600">Total: ₱{cartTotal.toLocaleString()}</div>
              </div>
            </div>
            <Button onClick={() => onCheckout(cart)}>
              Proceed to Checkout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const cartItem = cart.find(item => item.product.id === product.id);
          
          return (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.stock < 20 && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    Low Stock
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-gray-600">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl text-blue-600">₱{product.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{product.stock} in stock</div>
                </div>

                {cartItem ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center">{cartItem.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
