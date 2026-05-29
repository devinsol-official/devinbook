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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../contexts/AppContext';
import { BottomNav } from '../components/BottomNav';
import { CONFIG } from '../constants/config';
import { Skeleton } from '../components/Skeleton';

const API_URL = CONFIG.API_URL;

interface Category {
    id: string;
    _id?: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
}

const ICONS = ['cash', 'cart', 'home', 'car', 'fast-food', 'game-controller', 'medical', 'school', 'airplane', 'phone-portrait', 'flash', 'film', 'fitness', 'color-palette', 'book', 'wallet', 'gift', 'restaurant', 'bus', 'shirt'];

export function CategoriesScreen() {
    const { navigateTo, logout, isDarkMode } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [modalName, setModalName] = useState('');
    const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
    const [modalIcon, setModalIcon] = useState('cash');
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
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

            const response = await axios.get(`${API_URL}/categories`, config);
            setCategories(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                logout();
            } else {
                Alert.alert('Error', 'Failed to load categories');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCategories();
    };

    const openAddModal = (type: 'income' | 'expense') => {
        setEditingCategory(null);
        setModalName('');
        setModalType(type);
        setModalIcon('cash');
        setIsModalVisible(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setModalName(category.name);
        setModalType(category.type);
        setModalIcon(category.icon || 'cash');
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingCategory(null);
        setModalName('');
        setModalType('expense');
        setModalIcon('💰');
    };

    const handleSave = async () => {
        if (!modalName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
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
                type: modalType,
                icon: modalIcon,
            };

            if (editingCategory) {
                // Update existing category
                await axios.put(
                    `${API_URL}/categories/${editingCategory.id || editingCategory._id}`,
                    data,
                    config
                );
            } else {
                // Create new category
                await axios.post(`${API_URL}/categories`, data, config);
            }

            closeModal();
            loadCategories();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save category');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (category: Category) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category.name}"?`,
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
                                `${API_URL}/categories/${category.id || category._id}`,
                                config
                            );

                            loadCategories();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete category');
                        }
                    },
                },
            ]
        );
    };

    const getFilteredCategories = () => {
        if (filterType === 'all') return categories;
        return categories.filter(c => c.type === filterType);
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
                        <Skeleton width={130} height={28} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        <Skeleton width={170} height={14} isDarkMode={isDarkMode} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    </View>
                    <Skeleton width={40} height={40} borderRadius={20} isDarkMode={isDarkMode} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </LinearGradient>
                <View style={{ padding: 16 }}>
                    {/* Filter Buttons Skeleton */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} width="30%" height={40} borderRadius={12} isDarkMode={isDarkMode} />
                        ))}
                    </View>
                    {/* Add Buttons Row Skeleton */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                        {[...Array(2)].map((_, i) => (
                            <Skeleton key={i} width="48%" height={48} borderRadius={16} isDarkMode={isDarkMode} />
                        ))}
                    </View>
                    {/* Categories List Skeleton */}
                    <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 24, padding: 16 }}>
                        {[...Array(6)].map((_, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <Skeleton width={56} height={56} borderRadius={16} isDarkMode={isDarkMode} style={{ marginRight: 12 }} />
                                <View>
                                    <Skeleton width={120} height={18} isDarkMode={isDarkMode} style={{ marginBottom: 4 }} />
                                    <Skeleton width={60} height={12} isDarkMode={isDarkMode} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    const filteredCategories = getFilteredCategories();
    const incomeCount = categories.filter(c => c.type === 'income').length;
    const expenseCount = categories.filter(c => c.type === 'expense').length;

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
                    <Text style={styles.headerTitle}>Categories</Text>
                    <Text style={styles.headerSubtitle}>
                        {incomeCount} income • {expenseCount} expense
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
                                All ({categories.length})
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
                                Income ({incomeCount})
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
                                Expense ({expenseCount})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add Buttons */}
                    <View style={styles.addButtonsRow}>
                        <TouchableOpacity
                            style={styles.addIncomeButton}
                            onPress={() => openAddModal('income')}
                        >
                            <Text style={styles.addButtonText}>+ Income Category</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addExpenseButton}
                            onPress={() => openAddModal('expense')}
                        >
                            <Text style={styles.addButtonText}>+ Expense Category</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Categories List */}
                    <View style={[styles.categoriesList, isDarkMode && styles.surfaceDark]}>
                        {filteredCategories.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No categories yet</Text>
                                <Text style={styles.emptyStateSubtext}>Add your first category above</Text>
                            </View>
                        ) : (
                            filteredCategories.map((category) => (
                                <TouchableOpacity
                                    key={category.id || category._id}
                                    style={[styles.categoryItem, isDarkMode && styles.borderDark]}
                                    onPress={() => openEditModal(category)}
                                    onLongPress={() => handleDelete(category)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.categoryLeft}>
                                        <View style={[
                                            styles.categoryIcon,
                                            { backgroundColor: category.type === 'income' ? '#DCFCE7' : '#FEE2E2' }
                                        ]}>
                                            {category.icon && category.icon.length > 2 ? (
                                                <Ionicons
                                                    name={(category.icon as any) || 'cash'}
                                                    size={28}
                                                    color={category.type === 'income' ? '#16A34A' : '#DC2626'}
                                                />
                                            ) : (
                                                <Text style={styles.categoryIconText}>{category.icon || '💰'}</Text>
                                            )}
                                        </View>
                                        <View>
                                            <Text style={[styles.categoryName, isDarkMode && styles.textWhite]}>{category.name}</Text>
                                            <Text style={[
                                                styles.categoryType,
                                                { color: category.type === 'income' ? '#16A34A' : '#DC2626' }
                                            ]}>
                                                {category.type.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
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
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode && styles.surfaceDark]}>
                        <View style={[styles.modalHeader, isDarkMode && styles.borderDark]}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={28} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, isDarkMode && styles.textGray]}>Name</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && styles.inputDark]}
                                    value={modalName}
                                    onChangeText={setModalName}
                                    placeholder="Category name"
                                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                                />
                            </View>

                            {/* Type Selector */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Type</Text>
                                <View style={styles.typeSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            isDarkMode && styles.typeButtonDark,
                                            modalType === 'income' && styles.typeButtonActiveIncome
                                        ]}
                                        onPress={() => setModalType('income')}
                                    >
                                        <Text style={[styles.typeButtonText, modalType === 'income' && styles.typeButtonTextActive]}>
                                            Income
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            isDarkMode && styles.typeButtonDark,
                                            modalType === 'expense' && styles.typeButtonActiveExpense
                                        ]}
                                        onPress={() => setModalType('expense')}
                                    >
                                        <Text style={[styles.typeButtonText, modalType === 'expense' && styles.typeButtonTextActive]}>
                                            Expense
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Icon Selector */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Icon</Text>
                                <View style={styles.iconGrid}>
                                    {ICONS.map((icon) => (
                                        <TouchableOpacity
                                            key={icon}
                                            style={[
                                                styles.iconButton,
                                                isDarkMode && styles.iconButtonDark,
                                                modalIcon === icon && styles.iconButtonActive
                                            ]}
                                            onPress={() => setModalIcon(icon)}
                                        >
                                            {icon && icon.length > 2 ? (
                                                <Ionicons
                                                    name={icon as any}
                                                    size={24}
                                                    color={modalIcon === icon ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
                                                />
                                            ) : (
                                                <Text style={styles.iconButtonText}>{icon}</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
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
                                        {editingCategory ? 'Update Category' : 'Create Category'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bottom Navigation */}
            <BottomNav activeScreen="manage" />
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
    backButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
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
    addButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    addIncomeButton: {
        flex: 1,
        backgroundColor: '#22C55E',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    addExpenseButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    categoriesList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 4,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryIconText: {
        fontSize: 28,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    categoryType: {
        fontSize: 10,
        fontWeight: '700',
    },
    categoryArrow: {
        fontSize: 20,
        color: '#94A3B8',
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
    modalClose: {
        fontSize: 24,
        color: '#64748B',
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
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    typeButtonActiveIncome: {
        backgroundColor: '#22C55E',
    },
    typeButtonActiveExpense: {
        backgroundColor: '#EF4444',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    typeButtonTextActive: {
        color: '#FFFFFF',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    iconButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonActive: {
        backgroundColor: '#8B5CF6',
    },
    iconButtonText: {
        fontSize: 28,
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
    surfaceDark: {
        backgroundColor: '#1E293B',
    },
    filterButtonDark: {
        backgroundColor: '#1E293B',
    },
    borderDark: {
        borderBottomColor: '#334155',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textGray: {
        color: '#94A3B8',
    },
    inputDark: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        color: '#FFFFFF',
    },
    typeButtonDark: {
        backgroundColor: '#334155',
    },
    iconButtonDark: {
        backgroundColor: '#334155',
    },
});
