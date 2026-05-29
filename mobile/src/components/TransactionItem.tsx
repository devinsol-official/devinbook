import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppContext } from '../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

interface TransactionItemProps {
    transaction: any;
    onDelete: (id: string) => void;
    onEdit: (transaction: any) => void;
}

export function TransactionItem({ transaction, onDelete, onEdit }: TransactionItemProps) {
    const { isDarkMode } = useContext(AppContext);
    const renderRightActions = () => {
        return (
            <View style={styles.rightActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => onEdit(transaction)}
                >
                    <Ionicons name="pencil" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                        Alert.alert(
                            'Delete Transaction',
                            'Are you sure you want to delete this transaction?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => onDelete(transaction.id || transaction._id) }
                            ]
                        );
                    }}
                >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
    };

    const isExpense = transaction.type === 'expense';
    const amountPrefix = isExpense ? '-' : '+';
    const amountColor = isExpense ? '#EF4444' : '#22C55E';

    return (
        <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
            <View style={[styles.container, isDarkMode && styles.containerDark]}>
                <View style={styles.leftContent}>
                    <View style={[styles.iconContainer, { backgroundColor: isExpense ? '#FEE2E2' : '#DCFCE7' }]}>
                        {transaction.categoryId?.icon && transaction.categoryId?.icon.length > 2 ? (
                            <Ionicons
                                name={(transaction.categoryId?.icon as any)}
                                size={24}
                                color={isExpense ? '#EF4444' : '#22C55E'}
                            />
                        ) : (
                            <Text style={styles.iconText}>{transaction.categoryId?.icon || '💰'}</Text>
                        )}
                    </View>
                    <View style={styles.details}>
                        <Text style={[styles.description, isDarkMode && styles.textWhite]} numberOfLines={1}>
                            {transaction.description || transaction.categoryId?.name || 'No description'}
                        </Text>
                        <Text style={[styles.category, isDarkMode && styles.textGray]}>{transaction.categoryId?.name || 'General'}</Text>
                    </View>
                </View>
                <View style={styles.rightContent}>
                    <View style={styles.amountRow}>
                        {transaction.isOffline && (
                            <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" style={styles.offlineIcon} />
                        )}
                        <Text style={[styles.amount, { color: amountColor }]}>
                            {amountPrefix}Rs {transaction.amount.toLocaleString()}
                        </Text>
                    </View>
                    <Text style={styles.date}>
                        {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                    {transaction.isOffline && (
                        <Text style={styles.offlineText}>Pending Sync</Text>
                    )}
                </View>
            </View>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconText: {
        fontSize: 24,
    },
    details: {
        flex: 1,
    },
    description: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    category: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 2,
    },
    date: {
        fontSize: 10,
        color: '#94A3B8',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    offlineIcon: {
        marginRight: 4,
    },
    offlineText: {
        fontSize: 8,
        color: '#F59E0B',
        marginTop: 2,
        fontWeight: 'bold',
    },
    rightActions: {
        flexDirection: 'row',
        width: 140,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#8B5CF6',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    // Dark mode styles
    containerDark: {
        backgroundColor: '#1E293B',
        borderBottomColor: '#334155',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textGray: {
        color: '#94A3B8',
    },
});
