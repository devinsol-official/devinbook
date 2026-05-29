import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SyncStatus, onSyncStatusChange } from '../services/apiClient';

export function SyncStatusBanner() {
    const [status, setStatus] = useState<SyncStatus>('live');

    useEffect(() => {
        const unsubscribe = onSyncStatusChange((newStatus) => {
            setStatus(newStatus);
        });
        return unsubscribe;
    }, []);

    if (status === 'live') {
        return null; // hide when live
    }

    return (
        <View style={[styles.container, status === 'offline' ? styles.offline : styles.syncing]}>
            <Text style={styles.text}>
                {status === 'offline' ? 'Offline - Working Locally' : 'Syncing Data...'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // just above bottom nav
        left: 0,
        right: 0,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    offline: {
        backgroundColor: '#F59E0B', // amber-500
    },
    syncing: {
        backgroundColor: '#3B82F6', // blue-500
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
