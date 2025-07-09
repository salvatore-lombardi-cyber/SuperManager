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

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  onBackToLogin?: () => void;
  onRegisterSuccess?: (email: string) => void;
}

export default function RegisterScreen({ onBackToLogin, onRegisterSuccess }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Errori
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Animazioni
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Hook di autenticazione
  const { register } = useAuth();

  useEffect(() => {
    // Animazione di entrata
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animazione di rotazione continua
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Validazione nome
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Nome è obbligatorio');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Nome deve avere almeno 2 caratteri');
      return false;
    }
    setNameError('');
    return true;
  };

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
    if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError('Password deve contenere almeno una lettera minuscola');
      return false;
    }
    if (!/(?=.*\d)/.test(password)) {
      setPasswordError('Password deve contenere almeno un numero');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Validazione conferma password
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Conferma password è obbligatoria');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Le password non coincidono');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Gestione registrazione
  const handleRegister = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password, confirmPassword, name);
      
      if (result.success) {
        Alert.alert(
          '🎉 Registrazione Completata!',
          `Benvenuto ${name}!\n\nAbbiamo inviato un codice di verifica a:\n${email}\n\nVerifica la tua email per completare l'accesso.`,
          [
            { 
              text: 'Verifica Email', 
              onPress: () => {
                onRegisterSuccess?.(email);
              }
            }
          ]
        );
      } else {
        Alert.alert('❌ Errore Registrazione', result.message);
      }
    } catch (error) {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  // Animazione di rotazione
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#a855f7', '#ec4899', '#f59e0b']}
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

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
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
            <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
              <Text style={styles.backButtonText}>← Indietro</Text>
            </TouchableOpacity>
            
            <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
              <Text style={styles.logo}>🚀</Text>
            </Animated.View>
            <Text style={styles.title}>Crea Account</Text>
            <Text style={styles.subtitle}>Unisciti a SuperManager</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <AnimatedInput
              label="Nome Completo"
              value={name}
              onChangeText={setName}
              placeholder="Mario Rossi"
              autoCapitalize="words"
              icon="👤"
              error={nameError}
              returnKeyType="next"
              onSubmitEditing={() => validateName(name)}
            />

            <AnimatedInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="mario@email.com"
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
              returnKeyType="next"
              onSubmitEditing={() => validatePassword(password)}
            />

            <AnimatedInput
              label="Conferma Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry={true}
              icon="🔐"
              error={confirmPasswordError}
              showPasswordToggle={true}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>📋 Requisiti Password:</Text>
              <View style={styles.requirementsList}>
                <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
                  {password.length >= 6 ? '✅' : '⭕'} Almeno 6 caratteri
                </Text>
                <Text style={[styles.requirement, /(?=.*[a-z])/.test(password) && styles.requirementMet]}>
                  {/(?=.*[a-z])/.test(password) ? '✅' : '⭕'} Una lettera minuscola
                </Text>
                <Text style={[styles.requirement, /(?=.*\d)/.test(password) && styles.requirementMet]}>
                  {/(?=.*\d)/.test(password) ? '✅' : '⭕'} Un numero
                </Text>
                <Text style={[styles.requirement, password === confirmPassword && password.length > 0 && styles.requirementMet]}>
                  {password === confirmPassword && password.length > 0 ? '✅' : '⭕'} Password corrispondenti
                </Text>
              </View>
            </View>

            {/* Register Button */}
            <AnimatedButton
              title="Crea Account"
              onPress={handleRegister}
              loading={loading}
              icon="🚀"
              style={styles.registerButton}
            />

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Creando un account accetti i nostri{' '}
                <Text style={styles.termsLink}>Termini di Servizio</Text>
                {' '}e la{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Button */}
            <AnimatedButton
              title="Hai già un account? Accedi"
              onPress={onBackToLogin}
              variant="secondary"
              icon="🔑"
              style={styles.loginButton}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                🛒 SuperManager - Il gestionale del futuro
              </Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a855f7',
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -40,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: height * 0.2,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 150,
    right: width * 0.2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    fontSize: 35,
  },
  title: {
    fontSize: 28,
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
  },
  requirementsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  requirementsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 4,
  },
  requirement: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  requirementMet: {
    color: '#ffffff',
    fontWeight: '500',
  },
  registerButton: {
    marginBottom: 20,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#ffffff',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  loginButton: {
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