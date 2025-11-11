import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, TruckIcon } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/d9fa69601ec1c965a0d1dc8bba0e81e031481fa6.png';

interface LoginPageProps {
  onLogin: (token: string, role: string, id: string) => void;
  onShowTracking: () => void;
}

export function LoginPage({ onLogin, onShowTracking }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');

  const supabase = getSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        setLoading(false);
        return;
      }

      // Get user profile to verify role
      const userResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/auth/me`,
        {
          headers: { 'Authorization': `Bearer ${data.session.access_token}` }
        }
      );

      const userData = await userResponse.json();

      if (!userData.user) {
        toast.error('User profile not found');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Verify role matches selected tab
      if (activeTab === 'admin' && userData.user.role !== 'admin') {
        toast.error('This account is not an admin account');
        console.log('Active tab:', activeTab);
console.log('User role from DB:', userData.user.role);

        await supabase.auth.signOut();
        setLoading(false);
        console.log('Active tab:', activeTab);
console.log('User role from DB:', userData.user.role);

        return;
      }

      if (activeTab === 'driver' && userData.user.role !== 'driver') {
        toast.error('This account is not a driver account');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // For drivers, get their driver profile
      if (userData.user.role === 'driver') {
        const driverResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/auth/me`,
          {
            headers: { 'Authorization': `Bearer ${data.session.access_token}` }
          }
        );

        const driverData = await driverResponse.json();

        if (!driverResponse.ok || !driverData.driver) {
          toast.error('Driver profile not found');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast.success('Login successful');
        onLogin(data.session.access_token, 'driver', driverData.driver.id);
      } else {
        toast.success('Login successful');
        onLogin(data.session.access_token, 'admin', userData.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={logoImage}
              alt="SmartStock Logistics Logo" 
              className="h-20 w-20 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-medium text-emerald-600">SmartStock Logistics</span>
              <span className="text-xs text-gray-500">RMT Marketing Solutions Inc.</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Logistics Management System</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              RMT Marketing Solutions Inc.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="driver" className="gap-2">
                <TruckIcon className="h-4 w-4" />
                Driver
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Address</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@rmt.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In as Admin'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="driver">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver-email">Email Address</Label>
                  <Input
                    id="driver-email"
                    type="email"
                    placeholder="driver@rmt.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver-password">Password</Label>
                  <Input
                    id="driver-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In as Driver'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <button 
              onClick={onShowTracking}
              className="text-sm text-emerald-600 hover:underline hover:text-emerald-700"
            >
              Track a delivery →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
