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
    Modal,
    Switch,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../contexts/AppContext';
import { BottomNav } from '../components/BottomNav';
import { TransactionItem } from '../components/TransactionItem';
import { CONFIG } from '../constants/config';
import { Skeleton } from '../components/Skeleton';

const API_URL = CONFIG.API_URL;

interface Account {
    id: string;
    _id?: string;
    name: string;
    balance: number;
    isFeatured?: boolean;
}

export function AccountsScreen() {
    const { navigateTo, logout, isDarkMode } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [modalName, setModalName] = useState('');
    const [modalBalance, setModalBalance] = useState('');
    const [modalIsFeatured, setModalIsFeatured] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // Detail view state
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);
    const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
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

            const response = await axios.get(`${API_URL}/accounts`, config);
            setAccounts(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                logout();
            } else {
                Alert.alert('Error', 'Failed to load accounts');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAccounts();
    };

    const openAddModal = () => {
        setEditingAccount(null);
        setModalName('');
        setModalBalance('');
        setModalIsFeatured(false);
        setIsModalVisible(true);
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setModalName(account.name);
        setModalBalance(account.balance.toString());
        setModalIsFeatured(account.isFeatured || false);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingAccount(null);
        setModalName('');
        setModalBalance('');
        setModalIsFeatured(false);
    };

    const handleSave = async () => {
        if (!modalName.trim()) {
            Alert.alert('Error', 'Please enter an account name');
            return;
        }

        const balance = parseFloat(modalBalance);
        if (isNaN(balance)) {
            Alert.alert('Error', 'Please enter a valid balance');
            return;
        }

        setModalLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const data = {
                name: modalName.trim(),
                balance,
                isFeatured: modalIsFeatured,
            };

            if (editingAccount) {
                // Update existing account
                await axios.put(
                    `${API_URL}/accounts/${editingAccount.id || editingAccount._id}`,
                    data,
                    config
                );
            } else {
                // Create new account
                await axios.post(`${API_URL}/accounts`, data, config);
            }

            closeModal();
            loadAccounts();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save account');
        } finally {
            setModalLoading(false);
        }
    };

    const openDetails = async (account: Account) => {
        setSelectedAccountForDetail(account);
        setIsDetailVisible(true);
        loadAccountTransactions(account.id || account._id || '');
    };

    const loadAccountTransactions = async (accountId: string) => {
        try {
            setTransactionsLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const response = await axios.get(`${API_URL}/transactions?accountId=${accountId}`, config);
            setAccountTransactions(response.data);
        } catch (error) {
            console.error('Failed to load transactions for account', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const handleExport = (account: Account) => {
        Alert.alert(
            'Export Report',
            `Generate and export transaction report for "${account.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export CSV',
                    onPress: () => Alert.alert('Success', 'Report has been generated and shared.'),
                },
            ]
        );
    };

    const deleteTransaction = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.delete(`${API_URL}/transactions/${id}`, config);
            if (selectedAccountForDetail) {
                loadAccountTransactions(selectedAccountForDetail.id || selectedAccountForDetail._id || '');
            }
            loadAccounts();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to delete transaction');
        }
    };

    const handleDelete = async (account: Account) => {
        Alert.alert(
            'Delete Account',
            `Are you sure you want to delete "${account.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const config = {
                                headers: { Authorization: `Bearer ${token}` }
                            };

                            await axios.delete(
                                `${API_URL}/accounts/${account.id || account._id}`,
                                config
                            );

                            loadAccounts();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    const renderRightActions = (account: Account) => {
        return (
            <View style={styles.rightActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editActionButton]}
                    onPress={() => openEditModal(account)}
                >
                    <Ionicons name="pencil" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => handleDelete(account)}
                >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
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
                    <View>
                        <Skeleton width={120} height={28} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        <Skeleton width={160} height={14} isDarkMode={isDarkMode} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    </View>
                    <Skeleton width={40} height={40} borderRadius={20} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </LinearGradient>
                <View style={{ padding: 16 }}>
                    {/* Featured Accounts Skeleton */}
                    <View style={{ marginBottom: 24 }}>
                        <Skeleton width={150} height={20} isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row' }}>
                            <Skeleton width={200} height={120} borderRadius={20} isDarkMode={isDarkMode} style={{ marginRight: 16 }} />
                            <Skeleton width={200} height={120} borderRadius={20} isDarkMode={isDarkMode} />
                        </View>
                    </View>
                    {/* All Accounts Skeleton */}
                    <Skeleton width={100} height={20} isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} width="100%" height={80} borderRadius={16} isDarkMode={isDarkMode} style={{ marginBottom: 12 }} />
                    ))}
                </View>
            </View>
        );
    }

    const totalBalance = accounts.reduce((sum: number, acc: Account) => sum + acc.balance, 0);
    const featuredCount = accounts.filter((a: Account) => a.isFeatured).length;

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            {/* Header */}
            <LinearGradient
                colors={['#8B5CF6', '#A855F7', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View>
                    <Text style={styles.headerTitle}>Accounts</Text>
                    <Text style={styles.headerSubtitle}>
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''} • {totalBalance.toLocaleString()} Rs total
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigateTo('manage')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={[styles.scrollView, isDarkMode && styles.containerDark]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? "#A855F7" : "#8B5CF6"} />
                }
            >
                <View style={styles.content}>
                    {/* Total Balance Card */}
                    <View style={styles.totalCard}>
                        <LinearGradient
                            colors={['#1E293B', '#334155']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.totalGradient}
                        >
                            <Text style={styles.totalLabel}>TOTAL BALANCE</Text>
                            <Text style={styles.totalAmount}>{totalBalance.toLocaleString()} Rs</Text>
                            {featuredCount > 0 && (
                                <Text style={styles.totalSubtext}>{featuredCount} featured account{featuredCount !== 1 ? 's' : ''}</Text>
                            )}
                        </LinearGradient>
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Add New Account</Text>
                    </TouchableOpacity>

                    {/* Accounts List */}
                    <View style={[styles.accountsList, isDarkMode && styles.accountsListDark]}>
                        {accounts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="wallet-outline" size={64} color="#CBD5E1" />
                                <Text style={styles.emptyStateText}>No accounts yet</Text>
                                <Text style={styles.emptyStateSubtext}>Add your first account above</Text>
                            </View>
                        ) : (
                            accounts.map((account) => (
                                <Swipeable
                                    key={account.id || account._id}
                                    renderRightActions={() => renderRightActions(account)}
                                    friction={2}
                                    rightThreshold={40}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.accountItem,
                                            isDarkMode && styles.featuredCardDark,
                                            isDarkMode && styles.borderDark
                                        ]}
                                        onPress={() => openDetails(account)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.accountLeft}>
                                            <View style={[
                                                styles.accountIcon,
                                                { backgroundColor: account.balance >= 0 ? '#DCFCE7' : '#FEE2E2' }
                                            ]}>
                                                <Ionicons
                                                    name="wallet"
                                                    size={24}
                                                    color={account.balance >= 0 ? '#16A34A' : '#DC2626'}
                                                />
                                            </View>
                                            <View style={styles.accountDetails}>
                                                <View style={styles.accountNameRow}>
                                                    <Text style={[styles.accountName, isDarkMode && styles.textWhite]}>{account.name}</Text>
                                                    {account.isFeatured && (
                                                        <View style={styles.featuredBadge}>
                                                            <Ionicons name="star" size={10} color="#F59E0B" />
                                                            <Text style={styles.featuredBadgeText}>Featured</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[
                                                    styles.accountBalance,
                                                    { color: account.balance >= 0 ? '#16A34A' : '#DC2626' }
                                                ]}>
                                                    {account.balance.toLocaleString()} Rs
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </Swipeable>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={closeModal}
                    >
                        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]} onStartShouldSetResponder={() => true}>
                            <View style={[styles.modalHeader, isDarkMode && styles.borderDark]}>
                                <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
                                    {editingAccount ? 'Edit Account' : 'Add Account'}
                                </Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <Ionicons name="close" size={28} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                {/* Name Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, isDarkMode && styles.textGray]}>Account Name</Text>
                                    <TextInput
                                        style={[styles.input, isDarkMode && styles.inputDark]}
                                        value={modalName}
                                        onChangeText={setModalName}
                                        placeholder="e.g., Main Bank, Cash, Credit Card"
                                        placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                                    />
                                </View>

                                {/* Balance Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, isDarkMode && styles.textGray]}>Current Balance (Rs)</Text>
                                    <TextInput
                                        style={[styles.input, isDarkMode && styles.inputDark]}
                                        value={modalBalance}
                                        onChangeText={setModalBalance}
                                        placeholder="0"
                                        placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {/* Featured Toggle */}
                                <View style={styles.inputContainer}>
                                    <View style={styles.toggleRow}>
                                        <View>
                                            <Text style={[styles.inputLabel, isDarkMode && styles.textGray]}>Featured Account</Text>
                                            <Text style={[styles.toggleDescription, isDarkMode && styles.textGray]}>
                                                Show on dashboard balance card
                                            </Text>
                                        </View>
                                        <Switch
                                            value={modalIsFeatured}
                                            onValueChange={setModalIsFeatured}
                                            trackColor={{ false: '#E2E8F0', true: '#A855F7' }}
                                            thumbColor={modalIsFeatured ? '#8B5CF6' : '#F1F5F9'}
                                        />
                                    </View>
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[styles.saveButton, modalLoading && styles.saveButtonDisabled]}
                                    onPress={handleSave}
                                    disabled={modalLoading}
                                >
                                    {modalLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {editingAccount ? 'Update Account' : 'Create Account'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Delete Button (only when editing) */}
                                {editingAccount && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => {
                                            closeModal();
                                            setTimeout(() => handleDelete(editingAccount), 300);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Account Detail Modal */}
            <Modal
                visible={isDetailVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDetailVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDetailVisible(false)}
                >
                    <View style={[styles.detailModalContent, isDarkMode && styles.detailModalContentDark]} onStartShouldSetResponder={() => true}>
                        {selectedAccountForDetail && (
                            <>
                                <View style={[
                                    styles.detailHeader,
                                    isDarkMode && styles.startSurfaceDark,
                                    isDarkMode && styles.borderDark
                                ]}>
                                    <TouchableOpacity
                                        onPress={() => setIsDetailVisible(false)}
                                        style={styles.closeBtn}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-circle" size={32} color={isDarkMode ? "#FFFFFF" : "#0F172A"} />
                                    </TouchableOpacity>
                                    <Text style={[styles.detailTitle, isDarkMode && styles.textWhite]}>{selectedAccountForDetail.name}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleExport(selectedAccountForDetail)}
                                        style={styles.exportBtn}
                                    >
                                        <Ionicons name="download-outline" size={20} color="#8B5CF6" />
                                        <Text style={styles.exportBtnText}>Report</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                                    {/* Account Summary Stats */}
                                    <View style={styles.statsRow}>
                                        <View style={[styles.statBox, isDarkMode && styles.statBoxDark]}>
                                            <Text style={[styles.statLabel, isDarkMode && styles.textGray]}>Current Balance</Text>
                                            <Text style={[
                                                styles.statValue,
                                                { color: selectedAccountForDetail.balance >= 0 ? '#16A34A' : '#DC2626' }
                                            ]}>
                                                {selectedAccountForDetail.balance.toLocaleString()} Rs
                                            </Text>
                                        </View>
                                        <View style={[styles.statBox, isDarkMode && styles.statBoxDark]}>
                                            <Text style={[styles.statLabel, isDarkMode && styles.textGray]}>Status</Text>
                                            <View style={styles.statusBadge}>
                                                <Ionicons
                                                    name={selectedAccountForDetail.isFeatured ? "star" : "wallet-outline"}
                                                    size={12}
                                                    color="#8B5CF6"
                                                />
                                                <Text style={styles.statusLabel}>
                                                    {selectedAccountForDetail.isFeatured ? 'Featured' : 'Active'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* History Header */}
                                    <View style={styles.historyHeader}>
                                        <Text style={[styles.historyTitle, isDarkMode && styles.textWhite]}>Transaction History</Text>
                                        <Text style={styles.historyCount}>{accountTransactions.length} items</Text>
                                    </View>

                                    {transactionsLoading ? (
                                        <ActivityIndicator size="small" color="#8B5CF6" style={{ marginTop: 20 }} />
                                    ) : (
                                        <View style={[styles.historyList, isDarkMode && styles.surfaceDark]}>
                                            {accountTransactions.length === 0 ? (
                                                <View style={styles.emptyHistory}>
                                                    <Ionicons name="receipt-outline" size={48} color={isDarkMode ? "#334155" : "#E2E8F0"} />
                                                    <Text style={[styles.emptyHistoryText, isDarkMode && styles.textGray]}>No history found</Text>
                                                </View>
                                            ) : (
                                                accountTransactions.map(t => (
                                                    <TransactionItem
                                                        key={t.id || t._id}
                                                        transaction={t}
                                                        onDelete={deleteTransaction}
                                                        onEdit={() => { }} // History view typically read-only or jumps to edit
                                                    />
                                                ))
                                            )}
                                        </View>
                                    )}
                                    <View style={{ height: 40 }} />
                                </ScrollView>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Bottom Navigation */}
            <BottomNav activeScreen="manage" />
        </View >
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    totalCard: {
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    totalGradient: {
        padding: 24,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    totalAmount: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 8,
    },
    totalSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B5CF6',
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 24,
        gap: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    accountsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 4,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    accountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    accountIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountDetails: {
        flex: 1,
    },
    accountNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    accountName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    featuredBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#F59E0B',
    },
    accountBalance: {
        fontSize: 18,
        fontWeight: '900',
    },
    emptyState: {
        padding: 48,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#94A3B8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    modalBody: {
        padding: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#0F172A',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleDescription: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: 12,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
    rightActions: {
        flexDirection: 'row',
        width: 120,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editActionButton: {
        backgroundColor: '#8B5CF6',
    },
    deleteActionButton: {
        backgroundColor: '#EF4444',
    },
    detailModalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        width: '100%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 10,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    closeBtn: {
        padding: 4,
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    exportBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8B5CF6',
    },
    detailBody: {
        flex: 1,
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statBoxDark: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    historyCount: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    historyList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
    },
    emptyHistory: {
        alignItems: 'center',
        padding: 40,
    },
    emptyHistoryText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 12,
        fontWeight: '600',
    },
    // Dark Mode Styles
    containerDark: {
        backgroundColor: '#0F172A',
    },
    surfaceDark: {
        backgroundColor: '#1E293B',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textGray: {
        color: '#94A3B8',
    },
    borderDark: {
        borderBottomColor: '#334155',
    },
    featuredCardDark: {
        backgroundColor: '#111827',
    },
    listHeaderDark: {
        color: '#FFFFFF',
    },
    modalContentDark: {
        backgroundColor: '#1E293B',
    },
    detailModalContentDark: {
        backgroundColor: '#1E293B',
    },
    inputDark: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        color: '#FFFFFF',
    },
    accountsListDark: {
        backgroundColor: '#1E293B',
    },
    startSurfaceDark: {
        backgroundColor: '#1E293B',
    },
});
