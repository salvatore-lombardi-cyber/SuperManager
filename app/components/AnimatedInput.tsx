import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
  error?: string;
  showPasswordToggle?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'send' | 'go';
  disabled?: boolean;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
  error,
  showPasswordToggle = false,
  onSubmitEditing,
  returnKeyType = 'next',
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  // Animazione del label
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  // Gestione focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Animazioni del label
  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9ca3af', isFocused ? '#3b82f6' : '#6b7280'],
    }),
  };

  // Stile del container
  const containerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    disabled && styles.inputContainerDisabled,
  ];

  // Stile dell'input
  const inputStyle = [
    styles.input,
    { paddingTop: value || isFocused ? 24 : 18 },
    disabled && styles.inputDisabled,
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={containerStyle}
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
      >
        {/* Icona */}
        {icon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}

        {/* Input e Label */}
        <View style={styles.inputWrapper}>
          <Animated.Text style={labelStyle}>
            {label}
          </Animated.Text>
          
          <TextInput
            ref={inputRef}
            style={inputStyle}
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor="#9ca3af"
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            editable={!disabled}
            autoCorrect={false}
            blurOnSubmit={false}
          />
        </View>

        {/* Password Toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Messaggio di errore */}
      {error && (
        <Animated.View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </Animated.View>
      )}

      {/* Indicatore di focus */}
      <View style={[styles.focusIndicator, isFocused && styles.focusIndicatorActive]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 60,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.1,
  },
  inputContainerDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    color: '#6b7280',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    paddingTop: 24,
    paddingBottom: 8,
    margin: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
      },
      android: {
        paddingVertical: 4,
      },
    }),
  },
  inputDisabled: {
    color: '#9ca3af',
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  focusIndicator: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 2,
    borderRadius: 1,
    opacity: 0,
  },
  focusIndicatorActive: {
    backgroundColor: '#3b82f6',
    opacity: 1,
  },
});

// Componente Button animato
interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const animatedValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [buttonStyles.button, buttonStyles.buttonSecondary];
      case 'danger':
        return [buttonStyles.button, buttonStyles.buttonDanger];
      default:
        return [buttonStyles.button, buttonStyles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [buttonStyles.buttonText, buttonStyles.buttonTextSecondary];
      case 'danger':
        return [buttonStyles.buttonText, buttonStyles.buttonTextDanger];
      default:
        return [buttonStyles.buttonText, buttonStyles.buttonTextPrimary];
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: animatedValue }] }, style]}>
      <TouchableOpacity
        style={[
          getButtonStyle(),
          (disabled || loading) && buttonStyles.buttonDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {loading && (
          <View style={buttonStyles.loadingContainer}>
            <Text style={buttonStyles.loadingText}>⏳</Text>
          </View>
        )}
        
        {icon && !loading && (
          <Text style={buttonStyles.buttonIcon}>{icon}</Text>
        )}
        
        <Text style={getTextStyle()}>
          {loading ? 'Caricamento...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#374151',
  },
  buttonTextDanger: {
    color: '#ffffff',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  loadingContainer: {
    marginRight: 8,
  },
  loadingText: {
    fontSize: 16,
  },
});