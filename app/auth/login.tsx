import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedInput, AnimatedButton } from '../components/AnimatedInput';
import { useAuth } from '../utils/auth';
import RegisterScreen from './register';
import VerifyScreen from './verify';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

type AuthScreenType = 'login' | 'register' | 'verify';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>('login');
  const [verificationEmail, setVerificationEmail] = useState('');
  
  // Estados del login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);

  // Animazioni
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Hook di autenticazione
  const { login } = useAuth();

  useEffect(() => {
    // Animazione di entrata
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animazione di rotazione continua per il logo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Nascondi welcome dopo 3 secondi
    setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
  }, []);

  // Navigazione tra schermate
  const handleGoToRegister = () => {
    setCurrentScreen('register');
  };

  const handleGoToLogin = () => {
    setCurrentScreen('login');
  };

  const handleRegisterSuccess = (email: string) => {
    setVerificationEmail(email);
    setCurrentScreen('verify');
  };

  const handleVerificationSuccess = () => {
    Alert.alert(
      '🎉 Benvenuto!',
      'Account verificato con successo! Ora puoi accedere.',
      [
        { 
          text: 'Accedi', 
          onPress: () => {
            setCurrentScreen('login');
          }
        }
      ]
    );
  };

  // Renderizza la schermata corrente
  if (currentScreen === 'register') {
    return (
      <RegisterScreen 
        onBackToLogin={handleGoToLogin}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  if (currentScreen === 'verify') {
    return (
      <VerifyScreen 
        email={verificationEmail}
        onBackToLogin={handleGoToLogin}
        onVerificationSuccess={handleVerificationSuccess}
      />
    );
  }

  // Validazione email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email è obbligatoria');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Email non valida');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validazione password
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password è obbligatoria');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password deve avere almeno 6 caratteri');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Gestione login
  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        Alert.alert(
          '🎉 Benvenuto!',
          `Login effettuato con successo!\n\nBentornato nel tuo SuperManager!`,
          [
            { 
              text: 'Continua', 
              onPress: () => {
                onLoginSuccess?.(); // Chiama la callback per aggiornare lo stato
              }
            }
          ]
        );
      } else {
        Alert.alert('❌ Errore Login', result.message);
      }
    } catch (error) {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('📧 Email richiesta', 'Inserisci prima la tua email');
      return;
    }
    
    Alert.alert(
      '🔄 Reset Password',
      `Inviare il link di reset a ${email}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Invia', 
          onPress: () => {
            Alert.alert('📧 Email Inviata', 'Controlla la tua casella email per il link di reset');
          }
        }
      ]
    );
  };

  // Animazione di rotazione del logo
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animazioni di background */}
      <View style={styles.backgroundAnimations}>
        <Animated.View style={[styles.circle1, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[styles.circle2, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[styles.circle3, { transform: [{ rotate: spin }] }]} />
      </View>

      {/* Welcome Screen */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.welcomeText, { transform: [{ scale: scaleAnim }] }]}>
            🛒 SuperManager
          </Animated.Text>
          <Text style={styles.welcomeSubtext}>Il tuo gestionale del futuro</Text>
        </Animated.View>
      )}

      {/* Main Content */}
      {!showWelcome && (
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
                <Text style={styles.logo}>🛒</Text>
              </Animated.View>
              <Text style={styles.title}>SuperManager</Text>
              <Text style={styles.subtitle}>Accedi al tuo gestionale</Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <AnimatedInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="esempio@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="📧"
                error={emailError}
                returnKeyType="next"
                onSubmitEditing={() => validateEmail(email)}
              />

              <AnimatedInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={true}
                icon="🔒"
                error={passwordError}
                showPasswordToggle={true}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Password dimenticata?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <AnimatedButton
                title="Accedi"
                onPress={handleLogin}
                loading={loading}
                icon="🚀"
                style={styles.loginButton}
              />

              {/* Demo Credentials */}
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>🧪 Credenziali Demo:</Text>
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={() => {
                    setEmail('demo@supermanager.com');
                    setPassword('demo123');
                  }}
                >
                  <Text style={styles.demoButtonText}>📧 demo@supermanager.com</Text>
                  <Text style={styles.demoButtonText}>🔑 demo123</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>oppure</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Button */}
              <AnimatedButton
                title="Crea Account"
                onPress={handleGoToRegister}
                variant="secondary"
                icon="➕"
                style={styles.registerButton}
              />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Creato con ❤️ da Salvatore Lombardi
                </Text>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  backgroundAnimations: {
    position: 'absolute',
    width: width,
    height: height,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    left: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: height * 0.3,
    right: -75,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 100,
    left: width * 0.3,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
  },
  form: {
    flex: 1,
    paddingBottom: 40,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 20,
  },
  demoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoButton: {
    alignItems: 'center',
  },
  demoButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  registerButton: {
    marginBottom: 30,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
});