import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../contexts/AppContext';
import { BottomNav } from '../components/BottomNav';
import { CONFIG } from '../constants/config';
import { TransactionItem } from '../components/TransactionItem';
import Logo from '../../assets/logo.svg';
import { Skeleton } from '../components/Skeleton';

const API_URL = CONFIG.API_URL;

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

export function TransactionsScreen() {
    const { navigateTo, logout, setAddModalVisible, refreshData, openEditModal, isDarkMode } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [transactions, filterType, searchQuery]);

    const loadTransactions = async () => {
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

            const response = await axios.get(`${API_URL}/transactions`, config);
            setTransactions(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                logout();
            } else {
                Alert.alert('Error', 'Failed to load transactions');
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
            loadTransactions();
            refreshData();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete transaction');
        }
    };

    const handleEditTransaction = (tx: any) => {
        openEditModal(tx);
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.type === filterType);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.description?.toLowerCase().includes(query) ||
                t.categoryId?.name?.toLowerCase().includes(query) ||
                t.amount.toString().includes(query)
            );
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFilteredTransactions(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    const getTotalAmount = () => {
        return filteredTransactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);
    };

    const getStats = () => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { income, expenses, total: income - expenses };
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
                            <Skeleton width={120} height={24} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <Skeleton width={160} height={14} isDarkMode={isDarkMode} style={{ marginTop: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Filter Pills Skeleton */}
                    <View style={{ flexDirection: 'row', marginBottom: 24, paddingHorizontal: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} width={80} height={40} borderRadius={20} isDarkMode={isDarkMode} style={{ marginRight: 8 }} />
                        ))}
                    </View>

                    {/* Stats Summary Skeleton */}
                    <View style={{ paddingHorizontal: 16, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Skeleton width="30%" height={80} borderRadius={16} isDarkMode={isDarkMode} />
                        <Skeleton width="30%" height={80} borderRadius={16} isDarkMode={isDarkMode} />
                        <Skeleton width="30%" height={80} borderRadius={16} isDarkMode={isDarkMode} />
                    </View>

                    {/* Transactions Skeleton */}
                    <View style={{ paddingHorizontal: 16 }}>
                        <Skeleton width={100} height={20} isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} width="100%" height={70} borderRadius={12} isDarkMode={isDarkMode} style={{ marginBottom: 12 }} />
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    const stats = getStats();

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
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
                        <Text style={styles.headerTitle}>Transactions</Text>
                        <Text style={styles.headerSubtitle}>
                            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={[styles.scrollView, isDarkMode && styles.containerDark]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#A855F7" : "#8B5CF6"} />
                }
            >
                <View style={styles.content}>
                    {/* Stats Cards */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#14532D' : '#DCFCE7' }]}>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#BBF7D0' : '#64748B' }]}>Income</Text>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#4ADE80' : '#16A34A' }]}>
                                +{stats.income.toLocaleString()}
                            </Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' }]}>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#FECACA' : '#64748B' }]}>Expenses</Text>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#F87171' : '#DC2626' }]}>
                                -{stats.expenses.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
                            placeholder="Search transactions..."
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filter Buttons */}
                    <View style={styles.filterContainer}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                isDarkMode && styles.filterButtonDark,
                                filterType === 'all' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterType('all')}
                        >
                            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                isDarkMode && styles.filterButtonDark,
                                filterType === 'income' && styles.filterButtonActiveIncome
                            ]}
                            onPress={() => setFilterType('income')}
                        >
                            <Text style={[styles.filterButtonText, filterType === 'income' && styles.filterButtonTextActive]}>
                                Income
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                isDarkMode && styles.filterButtonDark,
                                filterType === 'expense' && styles.filterButtonActiveExpense
                            ]}
                            onPress={() => setFilterType('expense')}
                        >
                            <Text style={[styles.filterButtonText, filterType === 'expense' && styles.filterButtonTextActive]}>
                                Expenses
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Transactions List */}
                    <View style={[styles.transactionsList, isDarkMode && styles.transactionsListDark]}>
                        {filteredTransactions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyStateText, isDarkMode && styles.textGray]}>No transactions found</Text>
                                <Text style={[styles.emptyStateSubtext, isDarkMode && styles.textGray]}>
                                    {searchQuery ? 'Try a different search' : 'Add your first transaction'}
                                </Text>
                            </View>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <TransactionItem
                                    key={transaction.id || transaction._id}
                                    transaction={transaction}
                                    onDelete={handleDeleteTransaction}
                                    onEdit={handleEditTransaction}
                                />
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNav activeScreen="transactions" />
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
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#0F172A',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#8B5CF6',
    },
    filterButtonActiveIncome: {
        backgroundColor: '#22C55E',
    },
    filterButtonActiveExpense: {
        backgroundColor: '#EF4444',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    transactionsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 4,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionIconText: {
        fontSize: 20,
        fontWeight: '700',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    transactionCategory: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8B5CF6',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    transactionDate: {
        fontSize: 11,
        color: '#64748B',
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 2,
    },
    transactionAmountIncome: {
        color: '#16A34A',
    },
    transactionAmountExpense: {
        color: '#DC2626',
    },
    transactionAccount: {
        fontSize: 10,
        color: '#64748B',
    },
    emptyState: {
        padding: 48,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#94A3B8',
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
    searchInputDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        color: '#FFFFFF',
    },
    filterButtonDark: {
        backgroundColor: '#1E293B',
    },
    transactionsListDark: {
        backgroundColor: '#1E293B',
    },
    textGray: {
        color: '#94A3B8',
    },
});
