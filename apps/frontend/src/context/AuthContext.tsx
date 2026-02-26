import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '@/utils/tokenStorage';
import api from '@/services/api';
import { toast } from 'sonner';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    chatwoot_id?: number;
    account_id: number; // Required — never fallback to hardcoded value
    whatpro_role?: 'agent' | 'supervisor' | 'admin' | 'super_admin';
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, refreshToken: string, user: AuthUser) => void;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(tokenStorage.getToken());
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from stored token
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = tokenStorage.getToken();
            if (storedToken) {
                setToken(storedToken);
                const storedUser = tokenStorage.getUser() as AuthUser | null;
                if (storedUser) {
                    setUser(storedUser);
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback((newToken: string, newRefreshToken: string, newUser: AuthUser) => {
        tokenStorage.setToken(newToken);
        tokenStorage.setRefreshToken(newRefreshToken);
        tokenStorage.setUser(newUser);
        tokenStorage.setAccountId(newUser.account_id);

        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            // Notify backend to invalidate session (fire-and-forget)
            await api.post('/auth/logout').catch(() => {/* ignore errors on logout */});
        } finally {
            tokenStorage.clearAll();
            setToken(null);
            setUser(null);
        }
    }, []);

    // refreshToken: calls POST /auth/refresh, returns new access token or null
    const refreshToken = useCallback(async (): Promise<string | null> => {
        const storedRefresh = tokenStorage.getRefreshToken();
        if (!storedRefresh) return null;

        try {
            const response = await api.post<{ success: boolean; data: { access_token: string } }>(
                '/auth/refresh',
                { refresh_token: storedRefresh }
            );

            const newToken = response.data?.data?.access_token;
            if (!newToken) return null;

            tokenStorage.setToken(newToken);
            setToken(newToken);
            return newToken;
        } catch {
            // Refresh failed — force logout
            toast.error('Sessão expirada. Faça login novamente.');
            tokenStorage.clearAll();
            setToken(null);
            setUser(null);
            window.location.href = '/login';
            return null;
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout,
            refreshToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
