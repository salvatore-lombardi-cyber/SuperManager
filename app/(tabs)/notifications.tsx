import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurazione notifiche
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string>('');
  const [settings, setSettings] = useState({
    stockAlerts: true,
    priceAlerts: true,
    weeklyReports: true,
    dailySummary: false,
  });

  useEffect(() => {
    loadSettings();
    registerForPushNotificationsAsync();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('❌ Errore caricamento impostazioni:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('❌ Errore salvataggio impostazioni:', error);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('❌ Permessi Richiesti', 'Abilita i permessi per le notifiche nelle impostazioni del dispositivo.');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('📱 Push Token:', token);
    } else {
      Alert.alert('📱 Dispositivo Fisico Richiesto', 'Le notifiche push funzionano solo su dispositivi fisici.');
    }

    setPushToken(token || '');
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      // Controlla permessi
      const { status } = await Notifications.getPermissionsAsync();
      console.log('🔔 Permessi notifiche:', status);
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('❌ Permessi Richiesti', 'Abilita i permessi nelle impostazioni del dispositivo.');
          return;
        }
      }

      // Test notifica immediata con scheduleNotificationAsync
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notifica',
          body: 'Questa è una notifica di test da SuperManager! 🚀',
          data: { type: 'TEST', timestamp: new Date().toISOString() },
        },
        trigger: null, // Trigger null = notifica immediata
      });
      
      Alert.alert('✅ Successo', 'Notifica di test mostrata!');
    } catch (error) {
      console.error('❌ Errore test notifica:', error);
      Alert.alert('❌ Errore', `Impossibile inviare la notifica: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAlert = async () => {
    setLoading(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📦 Scorte Basse',
          body: 'Alcuni prodotti stanno terminando nel magazzino!',
          data: { type: 'STOCK_ALERT' },
        },
        trigger: null, // Immediata
      });
      Alert.alert('✅ Successo', 'Notifica scorte inviata!');
    } catch (error) {
      console.error('❌ Errore notifica scorte:', error);
      Alert.alert('❌ Errore', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    setLoading(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Report Settimanale',
          body: 'Il tuo report settimanale è pronto da visualizzare!',
          data: { type: 'WEEKLY_REPORT' },
        },
        trigger: null, // Immediata
      });
      Alert.alert('✅ Successo', 'Report settimanale inviato!');
    } catch (error) {
      console.error('❌ Errore report:', error);
      Alert.alert('❌ Errore', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const scheduleDailyNotification = async () => {
    setLoading(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Buongiorno!',
          body: 'Inizia la giornata controllando il tuo inventario!',
          data: { type: 'DAILY_REMINDER' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
      
      Alert.alert('✅ Successo', 'Notifica giornaliera programmata per le 9:00!');
    } catch (error) {
      console.error('❌ Errore programmazione:', error);
      Alert.alert('❌ Errore', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const SettingItem = ({ title, value, onToggle, icon }: {
    title: string;
    value: boolean;
    onToggle: () => void;
    icon: string;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#8b5cf6' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={['#8b5cf6', '#a855f7', '#c084fc']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔔 Notifiche</Text>
          <Text style={styles.headerSubtitle}>Gestisci le tue notifiche</Text>
        </View>

        {/* Test Notifiche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Notifiche</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#10b981' }]}
            onPress={handleTestNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Invio...' : '🧪 Test Notifica'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#f59e0b' }]}
            onPress={handleStockAlert}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📦 Test Scorte Basse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#3b82f6' }]}
            onPress={handleWeeklyReport}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📊 Test Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#8b5cf6' }]}
            onPress={scheduleDailyNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>⏰ Programma Giornaliera</Text>
          </TouchableOpacity>
        </View>

        {/* Impostazioni */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Impostazioni</Text>
          
          <SettingItem
            title="Avvisi Scorte"
            value={settings.stockAlerts}
            onToggle={() => toggleSetting('stockAlerts')}
            icon="📦"
          />
          
          <SettingItem
            title="Avvisi Prezzi"
            value={settings.priceAlerts}
            onToggle={() => toggleSetting('priceAlerts')}
            icon="💰"
          />
          
          <SettingItem
            title="Report Settimanali"
            value={settings.weeklyReports}
            onToggle={() => toggleSetting('weeklyReports')}
            icon="📊"
          />
          
          <SettingItem
            title="Riassunto Giornaliero"
            value={settings.dailySummary}
            onToggle={() => toggleSetting('dailySummary')}
            icon="🌅"
          />
        </View>

        {/* Info Token */}
        {pushToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Info Dispositivo</Text>
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Push Token:</Text>
              <Text style={styles.tokenText} numberOfLines={3}>
                {pushToken}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    opacity: 0.8,
  },
  section: {
    margin: 20,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  tokenContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
});