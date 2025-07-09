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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedButton } from '../components/AnimatedInput';
import { useAuth } from '../utils/auth';

const { width, height } = Dimensions.get('window');

interface VerifyScreenProps {
  email: string;
  onBackToLogin?: () => void;
  onVerificationSuccess?: () => void;
}

export default function VerifyScreen({ email, onBackToLogin, onVerificationSuccess }: VerifyScreenProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [actualCode, setActualCode] = useState('');

  // Refs per gli input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animazioni
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Hook di autenticazione
  const { verifyEmail, getVerificationCode } = useAuth();

  useEffect(() => {
    // Animazione di entrata
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animazione di pulsazione per l'email
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ottieni il codice di verifica reale
    loadVerificationCode();

    // Avvia countdown
    startCountdown();
  }, []);

  const loadVerificationCode = async () => {
    try {
      const code = await getVerificationCode(email);
      if (code) {
        setActualCode(code);
        console.log('🔢 Codice di verifica per', email, ':', code);
      }
    } catch (error) {
      console.error('Errore ottenimento codice:', error);
    }
  };

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Gestione input codice
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus al prossimo input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verifica automatica quando tutti i campi sono pieni
    if (newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  // Gestione backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Animazione shake per errore
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Gestione verifica
  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 4) {
      Alert.alert('❌ Errore', 'Inserisci un codice di 4 cifre');
      shakeAnimation();
      return;
    }

    setLoading(true);

    try {
      const result = await verifyEmail(email, codeToVerify);
      
      if (result.success) {
        Alert.alert(
          '🎉 Email Verificata!',
          `Perfetto! Il tuo account è stato verificato con successo.\n\nOra puoi accedere al tuo SuperManager!`,
          [
            { 
              text: 'Accedi Ora', 
              onPress: () => {
                onVerificationSuccess?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('❌ Codice Errato', result.message);
        shakeAnimation();
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante la verifica');
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  // Rinvia codice
  const handleResend = async () => {
    setResendLoading(true);
    
    try {
      // Simula rinvio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        '📧 Codice Rinviato!',
        `Abbiamo inviato un nuovo codice di verifica a:\n${email}`,
        [{ text: 'OK' }]
      );
      
      // Ricarica il codice
      await loadVerificationCode();
      
      // Riavvia countdown
      startCountdown();
      
    } catch (error) {
      Alert.alert('❌ Errore', 'Impossibile rinviare il codice');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Main Content */}
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
            <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
              <Text style={styles.backButtonText}>← Indietro</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📧</Text>
            </View>
            
            <Text style={styles.title}>Verifica Email</Text>
            <Text style={styles.subtitle}>
              Abbiamo inviato un codice di verifica a:
            </Text>
            
            <Animated.View style={[styles.emailContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.emailText}>{email}</Text>
            </Animated.View>
          </View>

          {/* Verification Code Input */}
          <Animated.View style={[styles.codeContainer, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.codeTitle}>Inserisci il codice di 4 cifre</Text>
            
            <View style={styles.codeInputContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                    loading && styles.codeInputDisabled
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!loading}
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Hint per sviluppatori */}
            {actualCode && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  💡 Codice di verifica: {actualCode}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Verify Button */}
          <AnimatedButton
            title="Verifica Email"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={code.some(digit => digit === '')}
            icon="✅"
            style={styles.verifyButton}
          />

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Non hai ricevuto il codice?</Text>
            
            {canResend ? (
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResend}
                disabled={resendLoading}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? '📤 Invio...' : '🔄 Rinvia Codice'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Riprova tra {countdown}s
              </Text>
            )}
          </View>

          {/* Help */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>🤔 Problemi?</Text>
            <Text style={styles.helpText}>
              • Controlla la cartella spam{'\n'}
              • Verifica che l'email sia corretta{'\n'}
              • Contatta il supporto se necessario
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 La tua email è al sicuro con SuperManager
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10b981',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
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
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 30,
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  emailContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emailText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  codeInputFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#ffffff',
  },
  codeInputDisabled: {
    opacity: 0.5,
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifyButton: {
    marginBottom: 30,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 10,
  },
  resendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  helpTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
});