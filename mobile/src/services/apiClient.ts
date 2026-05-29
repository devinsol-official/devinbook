import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppContext } from '../contexts/AppContext';

const CACHE_PREFIX = 'offline_cache_';
const QUEUE_KEY = 'offline_queue';

export type SyncStatus = 'offline' | 'syncing' | 'live';

let currentSyncStatus: SyncStatus = 'live';
let statusListeners: ((status: SyncStatus) => void)[] = [];

export const onSyncStatusChange = (listener: (status: SyncStatus) => void) => {
    statusListeners.push(listener);
    return () => {
        statusListeners = statusListeners.filter((l) => l !== listener);
    };
};

const notifyStatus = (status: SyncStatus) => {
    if (currentSyncStatus !== status) {
        currentSyncStatus = status;
        statusListeners.forEach((l) => l(status));
    }
};

const getCacheKey = (url: string, config?: AxiosRequestConfig) => {
    let key = url;
    if (config?.params) {
        key += '?' + new URLSearchParams(config.params as any).toString();
    }
    return CACHE_PREFIX + key;
};

// Start a background interval for syncing
setInterval(async () => {
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected;
    if (!isOnline) {
        notifyStatus('offline');
        return;
    }

    // Check queue
    try {
        const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
        if (queueStr) {
            const queue = JSON.parse(queueStr);
            if (queue.length > 0) {
                notifyStatus('syncing');
                const token = await AsyncStorage.getItem('authToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                let hasErrors = false;
                const newQueue = [];
                for (const item of queue) {
                    try {
                        const axiosConfig: any = {
                            method: item.method,
                            url: item.url,
                            headers: { ...item.headers, ...headers }
                        };
                        if (item.method !== 'delete') {
                            axiosConfig.data = item.data;
                        }

                        await axios(axiosConfig);
                    } catch (e: any) {
                        const status = e.response?.status;
                        if (item.method === 'delete' && (status === 404 || status === 400)) {
                            console.warn(`Target un-deletable (Status ${status}), removing from queue`, item.url);
                        } else {
                            item.retries = (item.retries || 0) + 1;
                            if (item.retries > 3) {
                                console.warn(`Item failed 3 times, dropping from queue completely: ${item.url}`);
                            } else {
                                hasErrors = true;
                                newQueue.push(item);
                                console.error('Failed to sync item, remaining retries:', 3 - item.retries, item.url, e.message);
                            }
                        }
                    }
                }

                await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
            }
        }
    } catch (e) {
        console.error('Sync error', e);
    }

    // We are live if queue is empty
    const remainingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!remainingQueueStr || JSON.parse(remainingQueueStr).length === 0) {
        notifyStatus('live');
    }
}, 20000); // Check every 20 seconds as requested

const injectOfflineTransactions = async (url: string, dataToReturn: any) => {
    try {
        if (url.includes('/transactions') && Array.isArray(dataToReturn)) {
            const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
            const queue = queueStr ? JSON.parse(queueStr) : [];

            const unSyncedTxs = queue
                .filter((q: any) => q.url.includes('/transactions') && q.method === 'post')
                .map((q: any) => ({
                    ...q.data,
                    id: 'offline_' + q.timestamp,
                    _id: 'offline_' + q.timestamp,
                    date: q.data.date || new Date().toISOString(),
                    isOffline: true,
                }));

            const deletedIds = queue
                .filter((q: any) => q.url.includes('/transactions') && q.method === 'delete')
                .map((q: any) => {
                    const parts = q.url.split('/');
                    return parts[parts.length - 1];
                });

            let finalData = dataToReturn.filter((t: any) => !deletedIds.includes(t.id) && !deletedIds.includes(t._id));
            finalData = [...unSyncedTxs, ...finalData];

            return finalData;
        }

        if (url.includes('/dashboard/stats') && dataToReturn) {
            const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
            const queue = queueStr ? JSON.parse(queueStr) : [];
            const unSyncedTxs = queue
                .filter((q: any) => q.url.includes('/transactions') && q.method === 'post');

            let extraIncome = 0;
            let extraExpense = 0;

            unSyncedTxs.forEach((q: any) => {
                if (q.data.type === 'income') extraIncome += Number(q.data.amount) || 0;
                if (q.data.type === 'expense') extraExpense += Number(q.data.amount) || 0;
            });

            const stats = { ...dataToReturn };
            if (stats.monthly) {
                stats.monthly = {
                    ...stats.monthly,
                    income: stats.monthly.income + extraIncome,
                    expenses: stats.monthly.expenses + extraExpense,
                    balance: stats.monthly.balance + extraIncome - extraExpense
                };
            }
            return stats;
        }

        if (url.includes('/accounts') && Array.isArray(dataToReturn)) {
            const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
            const queue = queueStr ? JSON.parse(queueStr) : [];

            // Apply pending transactions to account balances
            const unSyncedTxs = queue
                .filter((q: any) => q.url.includes('/transactions') && q.method === 'post');

            let accounts = [...dataToReturn];
            unSyncedTxs.forEach((q: any) => {
                const accIndex = accounts.findIndex(a => a.id === q.data.accountId || a._id === q.data.accountId);
                if (accIndex !== -1) {
                    const amount = Number(q.data.amount) || 0;
                    if (q.data.type === 'income') accounts[accIndex].balance += amount;
                    if (q.data.type === 'expense') accounts[accIndex].balance -= amount;
                } else {
                    // If no account ID provided, maybe apply to the first account (default behavior if user just has one general account)
                    if (accounts.length > 0 && !q.data.accountId) {
                        const amount = Number(q.data.amount) || 0;
                        if (q.data.type === 'income') accounts[0].balance += amount;
                        if (q.data.type === 'expense') accounts[0].balance -= amount;
                    }
                }
            });

            return accounts;
        }
    } catch (e) {
        console.error('Failed to inject offline data', e);
    }
    return dataToReturn;
};

export const apiClient = {
    get: async (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
        const isOnline = (await NetInfo.fetch()).isConnected;
        const cacheKey = getCacheKey(url, config);

        if (isOnline) {
            notifyStatus('live');
            try {
                const response = await axios.get(url, config);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
                const finalData = await injectOfflineTransactions(url, response.data);
                return { ...response, data: finalData };
            } catch (error) {
                console.warn('Network request failed, falling back to cache');
                notifyStatus('offline');
            }
        } else {
            notifyStatus('offline');
        }

        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            let parsedData = JSON.parse(cached);
            parsedData = await injectOfflineTransactions(url, parsedData);
            return {
                data: parsedData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config as any,
            };
        }

        throw new Error('No internet connection and no cached data available');
    },

    post: async (url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
        return handleMutation('post', url, data, config);
    },

    put: async (url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
        return handleMutation('put', url, data, config);
    },

    delete: async (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
        return handleMutation('delete', url, null, config);
    }
};

const handleMutation = async (method: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
    // Intercept deletes for offline-created items
    if (method.toLowerCase() === 'delete' && url.includes('offline_')) {
        const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
        let queue = queueStr ? JSON.parse(queueStr) : [];
        const offlineId = url.split('offline_')[1];

        // Remove the pending POST request from the queue completely
        queue = queue.filter((q: any) => !(q.method === 'post' && q.timestamp == offlineId));
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        return {
            data: { success: true, offlineDeleted: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as any,
        };
    }

    const isOnline = (await NetInfo.fetch()).isConnected;

    if (isOnline) {
        notifyStatus('live');
        try {
            return await axios({ method, url, data, ...config });
        } catch (error) {
            console.warn('Network request failed, queuing mutation');
            notifyStatus('offline');
        }
    } else {
        notifyStatus('offline');
    }

    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    queue.push({ method, url, data, headers: config?.headers, timestamp: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    return {
        data: { offlineQueued: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as any,
    };
};

export default apiClient;
