import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../contexts/AppContext';
import { BottomNav } from '../components/BottomNav';
import { CONFIG } from '../constants/config';
import { TransactionItem } from '../components/TransactionItem';
import Logo from '../../assets/logo.svg';
import { Skeleton } from '../components/Skeleton';

const API_URL = CONFIG.API_URL;

interface Stats {
    balance: number;
    income: number;
    expenses: number;
}

interface Account {
    id: string;
    _id?: string;
    name: string;
    balance: number;
    isFeatured?: boolean;
}

interface Transaction {
    id: string;
    _id?: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    date: string;
    categoryId?: any;
    accountId?: any;
}

interface CategoryStat {
    id: string;
    name: string;
    value: number;
    color: string;
    percentage: number;
    icon?: string;
}

export function DashboardScreen() {
    const { user, navigateTo, logout, refreshData, openEditModal, openAddModal, isDarkMode } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('month');
    const [stats, setStats] = useState<any>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [viewType, setViewType] = useState<'income' | 'expense'>('expense');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                logout();
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const [statsRes, accountsRes, transactionsRes] = await Promise.all([
                axios.get(`${API_URL}/dashboard/stats`, config),
                axios.get(`${API_URL}/accounts`, config),
                axios.get(`${API_URL}/transactions`, config),
            ]);

            setStats(statsRes.data);
            setAccounts(accountsRes.data);
            setTransactions(transactionsRes.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                logout();
            } else {
                Alert.alert('Error', 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_URL}/transactions/${id}`, config);
            loadData();
            refreshData();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete transaction');
        }
    };

    const handleEditTransaction = (tx: any) => {
        openEditModal(tx);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getFilteredStats = (): Stats => {
        if (!stats) return { income: 0, expenses: 0, balance: 0 };

        switch (filter) {
            case 'week':
                return stats.weekly || { income: 0, expenses: 0, balance: 0 };
            case 'month':
                return stats.monthly || { income: 0, expenses: 0, balance: 0 };
            default:
                const monthsToLookBack = filter === '3months' ? 3 : filter === '6months' ? 6 : 12;
                const periodData = stats.monthWise?.slice(-monthsToLookBack) || [];
                const income = periodData.reduce((sum: number, d: any) => sum + (d.income || 0), 0);
                const expenses = periodData.reduce((sum: number, d: any) => sum + (d.expenses || 0), 0);
                return { income, expenses, balance: income - expenses };
        }
    };

    const getCategoryStats = (): CategoryStat[] => {
        const filteredTransactions = transactions.filter(t => t.type === viewType);
        const groups: Record<string, { total: number; name: string; icon: string }> = {};

        filteredTransactions.forEach(t => {
            const catName = t.categoryId?.name || 'Other';
            if (!groups[catName]) {
                groups[catName] = {
                    total: 0,
                    name: catName,
                    icon: t.categoryId?.icon || '📊'
                };
            }
            groups[catName].total += t.amount;
        });

        const total = Object.values(groups).reduce((sum, g) => sum + g.total, 0);
        const colors = ['#EF4444', '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

        return Object.entries(groups)
            .map(([id, data], index) => ({
                id,
                name: data.name,
                value: data.total,
                color: colors[index % colors.length],
                percentage: total > 0 ? (data.total / total) * 100 : 0,
                icon: data.icon,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    };

    if (loading) {
        return (
            <View style={[styles.container, isDarkMode && styles.containerDark]}>
                <LinearGradient
                    colors={['#8B5CF6', '#A855F7', '#D946EF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.header}
                >
                    <View style={styles.headerTitleContainer}>
                        <Skeleton width={40} height={40} borderRadius={20} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        <View style={{ marginLeft: 12 }}>
                            <Skeleton width={100} height={20} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <Skeleton width={140} height={14} isDarkMode={isDarkMode} style={{ marginTop: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        </View>
                    </View>
                    <Skeleton width={48} height={48} borderRadius={24} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </LinearGradient>
                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', marginBottom: 24, paddingHorizontal: 16 }}>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} width={70} height={36} borderRadius={20} isDarkMode={isDarkMode} style={{ marginRight: 8 }} />
                        ))}
                    </View>
                    <View style={{ paddingHorizontal: 16 }}>
                        <Skeleton width="100%" height={140} borderRadius={24} isDarkMode={isDarkMode} style={{ marginBottom: 24 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Skeleton width="48%" height={100} borderRadius={24} isDarkMode={isDarkMode} />
                            <Skeleton width="48%" height={100} borderRadius={24} isDarkMode={isDarkMode} />
                        </View>
                        <Skeleton width={150} height={24} isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} width="100%" height={80} borderRadius={16} isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    const currentStats = getFilteredStats();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const categoryStats = getCategoryStats();
    const recentTransactions = transactions.slice(0, 5);

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#A855F7" : "#8B5CF6"} />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#8B5CF6', '#A855F7', '#D946EF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.header}
                >
                    <View style={styles.headerTitleContainer}>
                        <Logo width={40} height={40} style={styles.headerLogo} />
                        <View>
                            <Text style={styles.headerTitle}>DevinBook</Text>
                            <Text style={styles.headerSubtitle}>Welcome, {user?.name}!</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigateTo('profile')} style={styles.profileButton}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || 'User Name'}&backgroundColor=8B5CF6&mood[]=happy` }}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Filter Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {(['week', 'month', '3months', '6months', 'year'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFilter(f)}
                                style={[
                                    styles.filterPill,
                                    isDarkMode && styles.filterPillDark,
                                    filter === f && styles.filterPillActive,
                                    filter === f && isDarkMode && styles.filterPillActiveDark
                                ]}
                            >
                                <Text style={[
                                    styles.filterPillText,
                                    isDarkMode && styles.textGray,
                                    filter === f && styles.filterPillTextActive,
                                    filter === f && isDarkMode && styles.textWhite
                                ]}>
                                    {f === 'week' ? 'Week' : f === 'month' ? 'Month' : f === '3months' ? '3M' : f === '6months' ? '6M' : 'Year'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <LinearGradient
                            colors={['#1E293B', '#334155']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.balanceGradient}
                        >
                            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
                            <Text style={styles.balanceAmount}>{totalBalance.toLocaleString()} Rs</Text>

                            {/* Featured Accounts */}
                            {accounts.filter(a => a.isFeatured).length > 0 && (
                                <View style={styles.featuredAccounts}>
                                    {accounts.filter(a => a.isFeatured).map(acc => (
                                        <View key={acc.id} style={styles.featuredAccount}>
                                            <Text style={styles.featuredAccountName}>{acc.name}</Text>
                                            <Text style={styles.featuredAccountBalance}>{acc.balance.toLocaleString()} Rs</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Income/Expense Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                                        <Text style={styles.statIconText}>↓</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>INCOME</Text>
                                        <Text style={styles.statValue}>+{currentStats.income.toLocaleString()} Rs</Text>
                                    </View>
                                </View>
                                <View style={styles.statItem}>
                                    <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                        <Text style={styles.statIconText}>↑</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.statLabel}>SPENT</Text>
                                        <Text style={styles.statValue}>-{currentStats.expenses.toLocaleString()} Rs</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Add Transaction Buttons */}
                    <View style={styles.addButtonsRow}>
                        <TouchableOpacity
                            onPress={() => openAddModal('income')}
                            style={styles.addIncomeButton}
                        >
                            <Text style={styles.addButtonText}>↓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => openAddModal('expense')}
                            style={styles.addExpenseButton}
                        >
                            <Text style={styles.addButtonIcon}>↑</Text>
                            <Text style={styles.addExpenseButtonText}>Add Spent</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Distribution */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Category Distribution</Text>
                            <View style={[styles.viewTypeToggle, isDarkMode && styles.borderDark]}>
                                <TouchableOpacity
                                    onPress={() => setViewType('expense')}
                                    style={[styles.viewTypeButton, viewType === 'expense' && styles.viewTypeButtonActive]}
                                >
                                    <Text style={[styles.viewTypeButtonText, viewType === 'expense' && styles.viewTypeButtonTextActive]}>
                                        SPENT
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setViewType('income')}
                                    style={[styles.viewTypeButton, viewType === 'income' && styles.viewTypeButtonActiveIncome]}
                                >
                                    <Text style={[styles.viewTypeButtonText, viewType === 'income' && styles.viewTypeButtonTextActive]}>
                                        INCOME
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.categoryList, isDarkMode && styles.categoryListDark]}>
                            {categoryStats.length === 0 ? (
                                <Text style={[styles.emptyText, isDarkMode && styles.textGray]}>No {viewType} data</Text>
                            ) : (
                                categoryStats.map((cat) => (
                                    <View key={cat.id} style={[styles.categoryItem, isDarkMode && styles.borderDark]}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                                                {cat.icon && cat.icon.length > 2 ? (
                                                    <Ionicons
                                                        name={(cat.icon as any)}
                                                        size={18}
                                                        color="#FFFFFF"
                                                    />
                                                ) : (
                                                    <Text style={styles.categoryIconText}>{cat.icon || '📊'}</Text>
                                                )}
                                            </View>
                                            <View>
                                                <Text style={[styles.categoryName, isDarkMode && styles.textWhite]}>{cat.name}</Text>
                                                <Text style={[styles.categoryPercentage, isDarkMode && styles.textGray]}>{cat.percentage.toFixed(0)}% of total</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.categoryValue, isDarkMode && styles.textWhite]}>{cat.value.toLocaleString()} Rs</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    {/* Recent Activity */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Recent Activity</Text>
                            <TouchableOpacity onPress={() => navigateTo('transactions')}>
                                <Text style={styles.viewAllButton}>View All →</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.transactionsList, isDarkMode && styles.categoryListDark]}>
                            {recentTransactions.length === 0 ? (
                                <Text style={[styles.emptyText, isDarkMode && styles.textGray]}>No transactions yet</Text>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <TransactionItem
                                        key={tx.id || tx._id}
                                        transaction={tx}
                                        onDelete={handleDeleteTransaction}
                                        onEdit={handleEditTransaction}
                                    />
                                ))
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNav activeScreen="dashboard" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 40,
        height: 40,
        borderRadius: 12,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButtonText: {
        fontSize: 20,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    filterScroll: {
        marginBottom: 16,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        marginRight: 8,
    },
    filterPillActive: {
        backgroundColor: '#8B5CF6',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
    },
    balanceCard: {
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    balanceGradient: {
        padding: 24,
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 8,
    },
    featuredAccounts: {
        flexDirection: 'row',
        gap: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 16,
    },
    featuredAccount: {
        flex: 1,
    },
    featuredAccountName: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    featuredAccountBalance: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statIconText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
    addButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    addIncomeButton: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    addExpenseButton: {
        flex: 1,
        height: 64,
        borderRadius: 24,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonIcon: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    addExpenseButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    viewTypeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
    },
    viewTypeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewTypeButtonActive: {
        backgroundColor: '#EF4444',
    },
    viewTypeButtonActiveIncome: {
        backgroundColor: '#22C55E',
    },
    viewTypeButtonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
    },
    viewTypeButtonTextActive: {
        color: '#FFFFFF',
    },
    categoryList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryIconText: {
        fontSize: 20,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },
    categoryPercentage: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 2,
    },
    categoryValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    viewAllButton: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    transactionsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    transactionDate: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
    transactionAmountIncome: {
        color: '#22C55E',
    },
    transactionAmountExpense: {
        color: '#EF4444',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        fontStyle: 'italic',
        paddingVertical: 24,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingBottom: 20,
        paddingTop: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIcon: {
        fontSize: 24,
        opacity: 0.5,
    },
    navIconActive: {
        fontSize: 24,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 4,
    },
    navLabelActive: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8B5CF6',
        marginTop: 4,
    },
    // Dark Mode Styles
    containerDark: {
        backgroundColor: '#0F172A',
    },
    filterPillDark: {
        backgroundColor: '#1E293B',
    },
    filterPillActiveDark: {
        backgroundColor: '#8B5CF6',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textGray: {
        color: '#94A3B8',
    },
    categoryListDark: {
        backgroundColor: '#1E293B',
    },
    borderDark: {
        borderBottomColor: '#334155',
    },
});
