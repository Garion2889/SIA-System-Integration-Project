import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Logo } from '../Logo';
import { Shield } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AdminLoginProps {
  onLogin: (accessToken: string, role?: string, id?: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
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

      if (data.session) {
        // Verify admin role
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/user/profile`,
          {
            headers: { 'Authorization': `Bearer ${data.session.access_token}` }
          }
        );
        const profileData = await response.json();

        if (profileData.profile?.role !== 'admin') {
          toast.error('Access denied. Admin access required.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        toast.success('Login successful!');
        onLogin(data.session.access_token);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d39ce5e/auth/admin-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            name: signupName
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Signup failed: ${data.error}`);
        setLoading(false);
        return;
      }

      toast.success('Admin account created! Please login.');
      setLoading(false);
      
      // Switch to login tab
      document.querySelector('[value="login"]')?.dispatchEvent(new Event('click', { bubbles: true }));
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="justify-center mb-4" />
          <div className="flex items-center justify-center gap-2 text-white">
            <Shield className="h-5 w-5" />
            <span>Admin Portal</span>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
                <CardDescription>Login with admin credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-login-email">Email</Label>
                    <Input
                      id="admin-login-email"
                      type="email"
                      placeholder="admin@smartstock.ph"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-login-password">Password</Label>
                    <Input
                      id="admin-login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>Register a new admin user</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-name">Full Name</Label>
                    <Input
                      id="admin-signup-name"
                      type="text"
                      placeholder="Admin Name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-email">Email</Label>
                    <Input
                      id="admin-signup-email"
                      type="email"
                      placeholder="admin@smartstock.ph"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-signup-password">Password</Label>
                    <Input
                      id="admin-signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Admin Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
