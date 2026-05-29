import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform, Dimensions, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../contexts/AppContext';
import { CONFIG } from '../constants/config';

const API_URL = CONFIG.API_URL;

interface Category {
    _id: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
}

interface Account {
    _id: string;
    name: string;
    balance: number;
}

const { width, height } = Dimensions.get('window');

export function AddTransactionModal() {
    const { isAddModalVisible, setAddModalVisible, refreshData, logout, initialType, isDarkMode, navigateTo, editingTransaction } = useContext(AppContext);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // UI state
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [amount, setAmount] = useState('0');
    const [accountId, setAccountId] = useState('');

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [submittingCategory, setSubmittingCategory] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        if (isAddModalVisible) {
            if (editingTransaction) {
                setType(editingTransaction.type);
                setAmount(editingTransaction.amount.toString());
                setAccountId(editingTransaction.accountId?._id || editingTransaction.accountId || '');
                // Try to find full category object after data loads
            } else {
                setType(initialType || 'expense');
                setSelectedCategory(null);
                setAmount('0');
            }
            loadData();
        }
    }, [isAddModalVisible, editingTransaction]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                logout();
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [catsRes, accsRes] = await Promise.all([
                axios.get(`${API_URL}/categories`, config),
                axios.get(`${API_URL}/accounts`, config)
            ]);

            setCategories(catsRes.data);
            setAccounts(accsRes.data);

            if (editingTransaction) {
                const catId = editingTransaction.categoryId?._id || editingTransaction.categoryId;
                const foundCat = catsRes.data.find((c: any) => c._id === catId || c.id === catId);
                if (foundCat) setSelectedCategory(foundCat);
            }

            if (accsRes.data.length > 0 && !accountId && !editingTransaction) {
                setAccountId(accsRes.data[0]._id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNumberPress = (num: string) => {
        if (amount.length > 10) return;
        setAmount(prev => {
            if (prev === '0') return num === '.' ? '0.' : num;
            if (num === '.' && prev.includes('.')) return prev;
            return prev + num;
        });
    };

    const handleBackspace = () => {
        setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const handleSave = async () => {
        if (amount === '0' || amount === '0.' || isNaN(parseFloat(amount))) return;
        if (!selectedCategory || !accountId) return;

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                amount: parseFloat(amount),
                type,
                categoryId: selectedCategory._id,
                accountId,
                date: editingTransaction ? editingTransaction.date : new Date().toISOString(),
                description: selectedCategory.name
            };

            if (editingTransaction) {
                await axios.put(`${API_URL}/transactions/${editingTransaction._id || editingTransaction.id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/transactions`, payload, config);
            }

            setSelectedCategory(null);
            setAmount('0');
            setAddModalVisible(false);
            refreshData();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === type);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSubmittingCategory(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                name: newCategoryName.trim(),
                type,
                icon: 'cube',
            };
            const res = await axios.post(`${API_URL}/categories`, payload, config);
            setCategories([...categories, res.data.category || res.data]);
            setIsCreatingCategory(false);
            setNewCategoryName('');
            setSelectedCategory(res.data.category || res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingCategory(false);
        }
    };

    const renderCreateCategoryPopup = () => {
        if (!isCreatingCategory) return null;
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[StyleSheet.absoluteFill, styles.popupOverlay]}>
                <View style={[styles.popupContent, isDarkMode && styles.popupContentDark, { paddingBottom: Platform.OS === 'ios' ? 60 : 40 }]}>
                    <View style={styles.popupHeader}>
                        <TouchableOpacity onPress={() => { setIsCreatingCategory(false); setNewCategoryName(''); }} style={styles.closePopupBtn}>
                            <Ionicons name="close" size={24} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                        </TouchableOpacity>
                        <Text style={[styles.popupTitle, isDarkMode && styles.textWhite]}>
                            New {type === 'income' ? 'Income' : 'Expense'} Category
                        </Text>
                        <View style={{ width: 32 }} />
                    </View>

                    <View style={{ padding: 24 }}>
                        <Text style={[{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }, isDarkMode && styles.textGray]}>
                            Category Name
                        </Text>
                        <TextInput
                            style={[{ height: 56, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, fontSize: 16, color: '#0F172A', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 }, isDarkMode && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFFFFF' }]}
                            placeholder="e.g. Shopping, Utilities..."
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, submittingCategory && styles.submitButtonDisabled]}
                            onPress={handleCreateCategory}
                            disabled={submittingCategory}
                        >
                            {submittingCategory ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Create Category</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    };

    const renderNumpadPopup = () => {
        if (!selectedCategory) return null;
        return (
            <View style={[StyleSheet.absoluteFill, styles.popupOverlay]}>
                <View style={[styles.popupContent, isDarkMode && styles.popupContentDark]}>
                    <View style={styles.popupHeader}>
                        <TouchableOpacity onPress={() => { setSelectedCategory(null); setAmount('0'); }} style={styles.closePopupBtn}>
                            <Ionicons name="close" size={24} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                        </TouchableOpacity>
                        <Text style={[styles.popupTitle, isDarkMode && styles.textWhite]}>
                            {selectedCategory?.name}
                        </Text>
                        <View style={{ width: 32 }} />
                    </View>

                    {/* Account Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroller} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {accounts.map(acc => (
                            <TouchableOpacity
                                key={acc._id}
                                style={[styles.accountItem, isDarkMode && styles.accountItemDark, accountId === acc._id && styles.accountItemActive]}
                                onPress={() => setAccountId(acc._id)}
                            >
                                <Ionicons name="wallet" size={16} color={accountId === acc._id ? '#8B5CF6' : (isDarkMode ? '#64748B' : '#94A3B8')} />
                                <Text style={[styles.accountLabel, isDarkMode && styles.textGray, accountId === acc._id && styles.accountLabelActive]}>{acc.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Amount Display */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: type === 'expense' ? '#EF4444' : '#22C55E' }]}>Rs</Text>
                        <Text style={[styles.amountText, isDarkMode && styles.textWhite, { fontSize: amount.length > 7 ? 40 : 64 }]} numberOfLines={1} adjustsFontSizeToFit>{amount}</Text>
                    </View>

                    {/* Numpad */}
                    <View style={styles.numpad}>
                        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', 'back']].map((row, i) => (
                            <View key={i} style={styles.numRow}>
                                {row.map(btn => (
                                    <TouchableOpacity
                                        key={btn}
                                        style={[styles.numButton, isDarkMode && styles.numButtonDark]}
                                        onPress={() => btn === 'back' ? handleBackspace() : handleNumberPress(btn)}
                                        activeOpacity={0.7}
                                    >
                                        {btn === 'back' ? (
                                            <Ionicons name="backspace-outline" size={28} color={isDarkMode ? "#E2E8F0" : "#0F172A"} />
                                        ) : (
                                            <Text style={[styles.numText, isDarkMode && styles.textWhite]}>{btn}</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Add Transaction Button */}
                    <View style={styles.popupFooter}>
                        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSave} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{editingTransaction ? 'Update Transaction' : 'Add Transaction'}</Text>}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        );
    };

    return (
        <Modal visible={isAddModalVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setAddModalVisible(false)}>
            <SafeAreaView style={[styles.fullScreen, isDarkMode && styles.fullScreenDark]}>
                <View style={styles.topHeader}>
                    <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color={isDarkMode ? "#E2E8F0" : "#0F172A"} />
                    </TouchableOpacity>
                    <Text style={[styles.mainTitle, isDarkMode && styles.textWhite]}>{editingTransaction ? 'Edit Transaction' : 'Select Category'}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={[styles.tabBtn, type === 'expense' && styles.tabBtnActiveExpense]}
                        onPress={() => setType('expense')}
                    >
                        <Text style={[styles.tabText, isDarkMode && styles.textGray, type === 'expense' && styles.tabTextActiveExpense]}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, type === 'income' && styles.tabBtnActiveIncome]}
                        onPress={() => setType('income')}
                    >
                        <Text style={[styles.tabText, isDarkMode && styles.textGray, type === 'income' && styles.tabTextActiveIncome]}>Income</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
                        {filteredCategories.map(cat => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.catBox, isDarkMode && styles.catBoxDark]}
                                onPress={() => setSelectedCategory(cat)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.catIconCircle, { backgroundColor: type === 'income' ? '#DCFCE7' : '#FEE2E2' }]}>
                                    {cat.icon && cat.icon.length > 2 ? (
                                        <Ionicons name={(cat.icon as any)} size={24} color={type === 'income' ? '#16A34A' : '#DC2626'} />
                                    ) : (
                                        <Text style={{ fontSize: 24 }}>{cat.icon || '💰'}</Text>
                                    )}
                                </View>
                                <Text style={[styles.catName, isDarkMode && styles.textWhite]} numberOfLines={1}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.catBox, isDarkMode && styles.catBoxDark]}
                            onPress={() => {
                                setIsCreatingCategory(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.catIconCircle, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' }]}>
                                <Ionicons name="add" size={24} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                            </View>
                            <Text style={[styles.catName, isDarkMode && styles.textGray]}>New Category</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {renderNumpadPopup()}
                {renderCreateCategoryPopup()}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    fullScreenDark: {
        backgroundColor: '#0F172A',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 20,
    },
    closeBtn: {
        padding: 4,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    tabsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 16,
        marginBottom: 20,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabBtnActiveExpense: {
        backgroundColor: '#EF4444',
    },
    tabBtnActiveIncome: {
        backgroundColor: '#22C55E',
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    tabTextActiveExpense: {
        color: '#FFFFFF',
    },
    tabTextActiveIncome: {
        color: '#FFFFFF',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingBottom: 100,
        justifyContent: 'flex-start',
    },
    catBox: {
        width: '25%',
        padding: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    catBoxDark: {
        // ...
    },
    catIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    catName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
    },

    // Popup Layout
    popupOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    popupContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 10,
        maxHeight: '90%',
    },
    popupContentDark: {
        backgroundColor: '#1E293B',
    },
    popupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closePopupBtn: {
        padding: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
    },
    savePopupBtn: {
        padding: 8,
        paddingHorizontal: 12,
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },

    accountScroller: {
        maxHeight: 60,
        minHeight: 60,
        marginTop: 16,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        marginRight: 10,
        alignSelf: 'center',
    },
    accountItemDark: {
        backgroundColor: '#0F172A',
    },
    accountItemActive: {
        backgroundColor: '#F5F3FF',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    accountLabel: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    accountLabelActive: {
        color: '#8B5CF6',
    },

    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 8,
    },
    amountText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#0F172A',
    },

    numpad: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    numRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    numButton: {
        width: '31%',
        aspectRatio: 1.5,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numButtonDark: {
        backgroundColor: '#0F172A',
    },
    numText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
    },

    popupFooter: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 16,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // basic colors for dark theme overrides built-in:
    textWhite: { color: '#FFFFFF' },
    textGray: { color: '#94A3B8' },
});
