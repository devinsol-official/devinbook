import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../contexts/AppContext';
import { CONFIG } from '../constants/config';
import Logo from '../../assets/logo.svg';

const API_URL = CONFIG.API_URL;

export function RegisterScreen() {
    const { setUser, navigateTo, isDarkMode } = useContext(AppContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                name: name.trim(),
                email: email.trim(),
                password,
            });

            const { token, user } = response.data;

            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            setUser(user);
            navigateTo('dashboard');
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#8B5CF6', '#A855F7', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Logo width={100} height={100} style={styles.logoImage} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Start managing your expenses today
                    </Text>
                </View>

                <View style={[styles.formContainer, isDarkMode && styles.formContainerDark]}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, isDarkMode && styles.textGray]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            autoCapitalize="words"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, isDarkMode && styles.textGray]}>Email</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, isDarkMode && styles.textGray]}>Password</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Create a password"
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            secureTextEntry={true}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, isDarkMode && styles.textGray]}>Confirm Password</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm your password"
                            placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                            secureTextEntry={true}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#A855F7', '#D946EF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={[styles.loginText, isDarkMode && styles.textGray]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigateTo('login')}>
                            <Text style={styles.loginLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#0F172A',
    },
    registerButton: {
        marginTop: 8,
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#64748B',
    },
    loginLink: {
        fontSize: 14,
        color: '#8B5CF6',
        fontWeight: '700',
    },
    // Dark Mode Styles
    formContainerDark: {
        backgroundColor: '#1E293B',
        shadowColor: '#000',
    },
    inputDark: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        color: '#FFFFFF',
    },
    textGray: {
        color: '#94A3B8',
    },
});
