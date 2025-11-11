import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Logo } from '../Logo';
import { TruckIcon } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface DriverLoginProps {
  onLogin: (token: string, role?: string, id?: string) => void;
}

export function DriverLogin({ onLogin }: DriverLoginProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupVehicle, setSignupVehicle] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        setLoading(false);
        return;
      }

      // Get driver profile
      const driverResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/drivers/me`,
        {
          headers: { 'Authorization': `Bearer ${data.session.access_token}` }
        }
      );

      const driverData = await driverResponse.json();

      if (!driverResponse.ok || !driverData.driver) {
        toast.error('Driver profile not found. Please contact admin.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success('Driver login successful');
      onLogin(data.session.access_token, 'driver', driverData.driver.id);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/auth/driver-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            name: signupName,
            phone: signupPhone,
            vehicle: signupVehicle
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Signup failed: ${data.error}`);
        setLoading(false);
        return;
      }

      // Auto-login after signup
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (loginError) {
        toast.success('Signup successful! Please login.');
        setLoading(false);
        return;
      }

      toast.success('Account created successfully!');
      onLogin(loginData.session.access_token, 'driver', data.driverId);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <TruckIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <Logo className="justify-center mb-2" />
          <CardTitle>Driver Portal</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to manage your deliveries
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="driver@smartstock.ph"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="driver@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+63 917 123 4567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-vehicle">Vehicle Details</Label>
                  <Input
                    id="signup-vehicle"
                    type="text"
                    placeholder="Motorcycle - ABC 1234"
                    value={signupVehicle}
                    onChange={(e) => setSignupVehicle(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Driver Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
