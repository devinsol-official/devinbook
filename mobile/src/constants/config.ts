export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_TOKEN: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    TRANSACTIONS: '/transactions',
    TRANSACTION_BY_ID: (id: string) => `/transactions/${id}`,
    CATEGORIES: '/categories',
    CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
    ITEMS: '/items',
    ITEM_BY_ID: (id: string) => `/items/${id}`,
    ACCOUNTS: '/accounts',
    ACCOUNT_BY_ID: (id: string) => `/accounts/${id}`,
    DASHBOARD_STATS: '/dashboard/stats',
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
};

export const CONFIG = {
    API_URL,
    VERSION: '1.3.4',
    DEVELOPER: {
        NAME: 'Team Devinsol',
        WEBSITE: 'https://devinsol.com',
        SUPPORT_URL: 'https://devinsol.com/contact-us/?query-type=Product%20Inquiry&product=Devinbook',
    }
};
