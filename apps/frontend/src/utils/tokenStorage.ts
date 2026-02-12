export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_DATA_KEY = 'user_data';
export const ACCOUNT_ID_KEY = 'account_id';

export const tokenStorage = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    removeToken: () => localStorage.removeItem(TOKEN_KEY),

    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),

    getUser: () => {
        const userStr = localStorage.getItem(USER_DATA_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },
    setUser: (user: any) => localStorage.setItem(USER_DATA_KEY, JSON.stringify(user)),
    removeUser: () => localStorage.removeItem(USER_DATA_KEY),

    getAccountId: () => localStorage.getItem(ACCOUNT_ID_KEY),
    setAccountId: (id: string | number) => localStorage.setItem(ACCOUNT_ID_KEY, String(id)),
    removeAccountId: () => localStorage.removeItem(ACCOUNT_ID_KEY),

    clearAll: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(ACCOUNT_ID_KEY);
    }
};
