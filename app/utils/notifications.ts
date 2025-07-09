import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { database, Product } from '../database';
// Configurazione notifiche
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Tipi per le notifiche
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data: any;
  trigger: Notifications.NotificationTriggerInput;
  categoryId?: string;
}

export interface NotificationSettings {
  lowStockEnabled: boolean;
  lowStockThreshold: number;
  dailyReportEnabled: boolean;
  dailyReportTime: { hour: number; minute: number };
  weeklyReportEnabled: boolean;
  weeklyReportDay: number; // 0 = domenica, 1 = lunedì, ecc.
  reminderEnabled: boolean;
}

// Classe per gestire le notifiche
class NotificationManager {
  private static instance: NotificationManager;
  private expoPushToken: string | null = null;
  private settings: NotificationSettings = {
    lowStockEnabled: true,
    lowStockThreshold: 10,
    dailyReportEnabled: true,
    dailyReportTime: { hour: 9, minute: 0 },
    weeklyReportEnabled: true,
    weeklyReportDay: 1, // Lunedì
    reminderEnabled: true,
  };

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Inizializza le notifiche
  async initialize(): Promise<void> {
    try {
      await this.registerForPushNotificationsAsync();
      await this.setupNotificationCategories();
      await this.loadSettings();
      await this.scheduleRecurringNotifications();
      console.log('✅ Notifiche inizializzate');
    } catch (error) {
      console.error('❌ Errore inizializzazione notifiche:', error);
    }
  }

  // Registra per le notifiche push
  // Registra per le notifiche push
private async registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SuperManager',
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
      console.log('❌ Permessi notifiche negati');
      return null;
    }
    
    // Per ora usiamo solo notifiche locali
    this.expoPushToken = 'local-notifications-enabled';
    console.log('✅ Notifiche locali abilitate');
    return this.expoPushToken;
  } else {
    console.log('⚠️ Simulatore - notifiche locali abilitate');
    this.expoPushToken = 'simulator-local-notifications';
    return this.expoPushToken;
  }
}

  // Configura le categorie di notifiche
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('LOW_STOCK', [
      {
        identifier: 'VIEW_PRODUCT',
        buttonTitle: '👀 Visualizza',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'RESTOCK',
        buttonTitle: '📦 Riordina',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('DAILY_REPORT', [
      {
        identifier: 'VIEW_REPORT',
        buttonTitle: '📊 Visualizza Report',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('REMINDER', [
      {
        identifier: 'OPEN_APP',
        buttonTitle: '🚀 Apri App',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  // Carica impostazioni
  private async loadSettings(): Promise<void> {
    try {
      // In una app reale, caricheresti da AsyncStorage
      console.log('✅ Impostazioni notifiche caricate');
    } catch (error) {
      console.error('❌ Errore caricamento impostazioni:', error);
    }
  }

  // Invia notifica immediata
  async sendNotification(notification: Omit<NotificationData, 'id'>): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          categoryIdentifier: notification.categoryId,
          sound: 'default',
        },
        trigger: notification.trigger,
      });
      
      console.log('✅ Notifica programmata:', id);
      return id;
    } catch (error) {
      console.error('❌ Errore invio notifica:', error);
      throw error;
    }
  }

  // Controlla prodotti con scorte basse
  async checkLowStock(): Promise<void> {
    if (!this.settings.lowStockEnabled) return;

    try {
      const products = await database.getAllProducts();
      const lowStockProducts = products.filter(
        (product: Product) => product.quantity <= this.settings.lowStockThreshold && product.quantity > 0
      );

      if (lowStockProducts.length > 0) {
        await this.sendNotification({
          title: '⚠️ Scorte Basse!',
          body: `${lowStockProducts.length} prodotti hanno scorte basse. Controlla l'inventario.`,
          data: { type: 'LOW_STOCK', products: lowStockProducts },
          trigger: null, // Immediata
          categoryId: 'LOW_STOCK',
        });
      }

      // Controlla prodotti esauriti
      const outOfStockProducts = products.filter((product: Product) => product.quantity === 0);
      if (outOfStockProducts.length > 0) {
        await this.sendNotification({
          title: '🚨 Prodotti Esauriti!',
          body: `${outOfStockProducts.length} prodotti sono completamente esauriti.`,
          data: { type: 'OUT_OF_STOCK', products: outOfStockProducts },
          trigger: null,
          categoryId: 'LOW_STOCK',
        });
      }
    } catch (error) {
      console.error('❌ Errore controllo scorte:', error);
    }
  }

  // Genera report giornaliero
  async sendDailyReport(): Promise<void> {
    if (!this.settings.dailyReportEnabled) return;

    try {
      const stats = await database.getStats();
      const products = await database.getAllProducts();
      const lowStockCount = products.filter(p => p.quantity <= this.settings.lowStockThreshold).length;

      await this.sendNotification({
        title: '📊 Report Giornaliero',
        body: `${stats.totalProducts} prodotti • €${stats.totalValue.toFixed(2)} valore • ${lowStockCount} scorte basse`,
        data: { type: 'DAILY_REPORT', stats },
        trigger: null,
        categoryId: 'DAILY_REPORT',
      });
    } catch (error) {
      console.error('❌ Errore report giornaliero:', error);
    }
  }

  // Promemoria generale
  async sendReminder(): Promise<void> {
    if (!this.settings.reminderEnabled) return;

    const messages = [
      '🛒 Hai controllato l\'inventario oggi?',
      '📦 Ricordati di aggiornare le scorte!',
      '🔍 Che ne dici di scansionare qualche prodotto?',
      '📊 Dai un\'occhiata alle statistiche!',
      '🎯 SuperManager ti sta aspettando!',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendNotification({
      title: '💡 Promemoria SuperManager',
      body: randomMessage,
      data: { type: 'REMINDER' },
      trigger: null,
      categoryId: 'REMINDER',
    });
  }

  // Programma notifiche ricorrenti
  private async scheduleRecurringNotifications(): Promise<void> {
    // Cancella notifiche precedenti
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Report giornaliero
    if (this.settings.dailyReportEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Report Giornaliero',
          body: 'Ecco il riepilogo del tuo supermercato!',
          data: { type: 'DAILY_REPORT_SCHEDULED' },
          categoryIdentifier: 'DAILY_REPORT',
        },
        trigger: {
          hour: this.settings.dailyReportTime.hour,
          minute: this.settings.dailyReportTime.minute,
          repeats: true,
        },
      });
    }

    // Controllo scorte (ogni 6 ore)
    if (this.settings.lowStockEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔍 Controllo Scorte',
          body: 'Verifica se ci sono prodotti con scorte basse',
          data: { type: 'STOCK_CHECK' },
        },
        trigger: {
          seconds: 6 * 60 * 60, // 6 ore
          repeats: true,
        },
      });
    }

    // Promemoria settimanale
    if (this.settings.weeklyReportEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📈 Report Settimanale',
          body: 'Analizza le performance della settimana!',
          data: { type: 'WEEKLY_REPORT' },
          categoryIdentifier: 'DAILY_REPORT',
        },
        trigger: {
          weekday: this.settings.weeklyReportDay,
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });
    }
  }

  // Notifica per prodotto specifico
  async notifyProductAction(product: Product, action: 'added' | 'updated' | 'deleted' | 'low_stock' | 'out_of_stock'): Promise<void> {
    const actions: Record<'added' | 'updated' | 'deleted' | 'low_stock' | 'out_of_stock', string> = {
      'added': `✅ ${product.name} aggiunto all'inventario`,
      'updated': `✏️ ${product.name} aggiornato`,
      'deleted': `🗑️ ${product.name} rimosso dall'inventario`,
      'low_stock': `⚠️ ${product.name} ha scorte basse (${product.quantity})`,
      'out_of_stock': `🚨 ${product.name} è esaurito!`,
    };

    const message = actions[action] || `🔄 ${product.name} modificato`;

    await this.sendNotification({
      title: '📦 Aggiornamento Prodotto',
      body: message,
      data: { type: 'PRODUCT_ACTION', product, action },
      trigger: null,
    });
  }

  // Gestione listener notifiche
  addNotificationListener(handler: (notification: Notifications.Notification) => void): void {
    Notifications.addNotificationReceivedListener(handler);
  }

  addNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void): void {
    Notifications.addNotificationResponseReceivedListener(handler);
  }

  // Ottieni impostazioni
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Aggiorna impostazioni
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.scheduleRecurringNotifications();
    console.log('✅ Impostazioni notifiche aggiornate');
  }

  // Cancella tutte le notifiche
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Tutte le notifiche cancellate');
  }

  // Ottieni notifiche programmate
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

// Esporta l'istanza singleton
export const notificationManager = NotificationManager.getInstance();

// Hook per React
export const useNotifications = () => {
  return {
    initialize: notificationManager.initialize.bind(notificationManager),
    sendNotification: notificationManager.sendNotification.bind(notificationManager),
    checkLowStock: notificationManager.checkLowStock.bind(notificationManager),
    sendDailyReport: notificationManager.sendDailyReport.bind(notificationManager),
    sendReminder: notificationManager.sendReminder.bind(notificationManager),
    notifyProductAction: notificationManager.notifyProductAction.bind(notificationManager),
    getSettings: notificationManager.getSettings.bind(notificationManager),
    updateSettings: notificationManager.updateSettings.bind(notificationManager),
    cancelAllNotifications: notificationManager.cancelAllNotifications.bind(notificationManager),
    getScheduledNotifications: notificationManager.getScheduledNotifications.bind(notificationManager),
    addNotificationListener: notificationManager.addNotificationListener.bind(notificationManager),
    addNotificationResponseListener: notificationManager.addNotificationResponseListener.bind(notificationManager),
  };
};