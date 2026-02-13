import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '@/utils/tokenStorage';

interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    chatwoot_id?: number;
    account_id?: number;
    whatpro_role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, refreshToken: string, user: User) => void;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(tokenStorage.getToken());
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = tokenStorage.getToken();
            if (storedToken) {
                setToken(storedToken);
                // Here we should validate the token with the backend /auth/me
                // For now, we'll optimistically assume it's valid if present.

                const storedUser = tokenStorage.getUser();
                if (storedUser) {
                    setUser(storedUser);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback((newToken: string, newRefreshToken: string, newUser: User) => {
        tokenStorage.setToken(newToken);
        tokenStorage.setRefreshToken(newRefreshToken);
        tokenStorage.setUser(newUser);
        // Legacy support
        tokenStorage.setAccountId(newUser.account_id || '');

        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        tokenStorage.clearAll();

        setToken(null);
        setUser(null);
    }, []);

    const refreshAuthToken = useCallback(async () => {
        // TODO: Implement refresh token logic using tokenStorage.getRefreshToken()
        console.log("Refreshing token...");
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout,
            refreshToken: refreshAuthToken
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
