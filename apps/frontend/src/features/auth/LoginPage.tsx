import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

// Simple fetch wrapper for SSO login
async function loginWithSSO(accountId: number, token: string) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/sso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account_id: accountId, sso_token: token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const accId = parseInt(accountId, 10);
      if (isNaN(accId)) throw new Error('Account ID must be a number');

      const data = await loginWithSSO(accId, token);

      // Data expected: { token, refresh_token, user: {...} }
      login(data.token, data.refresh_token, data.user);

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to WhatPro Hub</CardTitle>
          <CardDescription>Enter your Chatwoot Account ID and SSO Token</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="accountId" className="text-sm font-medium">Account ID</label>
              <Input
                id="accountId"
                placeholder="e.g. 1"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">SSO Token</label>
              <Input
                id="token"
                type="password"
                placeholder="Paste your SSO token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          If you don't have a token, ask your administrator.
        </CardFooter>
      </Card>
    </div>
  );
}
