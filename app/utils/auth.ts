import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipi per l'autenticazione
export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Classe per gestire l'autenticazione
class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Inizializza l'auth manager e crea utente demo
  async initAuth(): Promise<void> {
    await this.createDemoUser();
  }

  // Crea utente demo se non esiste
  private async createDemoUser(): Promise<void> {
    try {
      const demoEmail = 'demo@supermanager.com';
      const existingUser = await this.getUserByEmail(demoEmail);
      
      if (!existingUser) {
        const demoUser: User = {
          id: 'demo_user_123',
          email: demoEmail,
          name: 'Demo User',
          isVerified: true, // Già verificato
          createdAt: new Date().toISOString()
        };

        // Salva utente demo
        await AsyncStorage.setItem(`user_${demoUser.id}`, JSON.stringify(demoUser));
        await AsyncStorage.setItem(`password_${demoUser.id}`, 'demo123');
        await AsyncStorage.setItem(`email_${demoEmail}`, demoUser.id);
        
        console.log('✅ Utente demo creato:', demoEmail);
      } else {
        console.log('✅ Utente demo già esistente');
      }
    } catch (error) {
      console.error('❌ Errore creazione utente demo:', error);
    }
  }

  // Simula la registrazione (in una app reale useresti Firebase/Supabase)
  async register(email: string, password: string, confirmPassword: string, name: string): Promise<{success: boolean, message: string}> {
    try {
      // Validazioni
      if (!email || !password || !confirmPassword || !name) {
        return { success: false, message: 'Tutti i campi sono obbligatori' };
      }

      if (!this.isValidEmail(email)) {
        return { success: false, message: 'Email non valida' };
      }

      if (password.length < 6) {
        return { success: false, message: 'La password deve avere almeno 6 caratteri' };
      }

      if (password !== confirmPassword) {
        return { success: false, message: 'Le password non coincidono' };
      }

      // Controlla se l'email esiste già
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'Email già registrata' };
      }

      // Crea nuovo utente
      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        isVerified: false,
        createdAt: new Date().toISOString()
      };

      // Salva utente e password (separatamente per sicurezza)
      await AsyncStorage.setItem(`user_${newUser.id}`, JSON.stringify(newUser));
      await AsyncStorage.setItem(`password_${newUser.id}`, password);
      await AsyncStorage.setItem(`email_${email.toLowerCase()}`, newUser.id);

      console.log('✅ Utente registrato:', newUser.email);
      return { success: true, message: 'Registrazione completata! Controlla la tua email per la verifica.' };

    } catch (error) {
      console.error('❌ Errore registrazione:', error);
      return { success: false, message: 'Errore durante la registrazione' };
    }
  }

  // Simula il login
  async login(email: string, password: string): Promise<{success: boolean, message: string, user?: User}> {
    try {
      // Assicurati che l'utente demo esista
      await this.createDemoUser();
      
      if (!email || !password) {
        return { success: false, message: 'Email e password sono obbligatori' };
      }

      // Trova l'utente
      const user = await this.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Email non trovata' };
      }

      // Verifica la password
      const savedPassword = await AsyncStorage.getItem(`password_${user.id}`);
      if (savedPassword !== password) {
        return { success: false, message: 'Password errata' };
      }

      // Controlla se l'email è verificata
      if (!user.isVerified) {
        return { success: false, message: 'Email non verificata. Controlla la tua casella email.' };
      }

      // Login riuscito
      this.currentUser = user;
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      await AsyncStorage.setItem('isAuthenticated', 'true');

      console.log('✅ Login riuscito:', user.email);
      return { success: true, message: 'Login effettuato con successo!', user };

    } catch (error) {
      console.error('❌ Errore login:', error);
      return { success: false, message: 'Errore durante il login' };
    }
  }

  // Simula la verifica email
  async verifyEmail(email: string, code: string): Promise<{success: boolean, message: string}> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Utente non trovato' };
      }

      // Simula la verifica del codice (in realtà sarebbe un codice vero)
      const expectedCode = this.generateVerificationCode(user.id);
      if (code !== expectedCode) {
        return { success: false, message: 'Codice di verifica non valido' };
      }

      // Marca l'email come verificata
      user.isVerified = true;
      await AsyncStorage.setItem(`user_${user.id}`, JSON.stringify(user));

      console.log('✅ Email verificata:', user.email);
      return { success: true, message: 'Email verificata con successo!' };

    } catch (error) {
      console.error('❌ Errore verifica email:', error);
      return { success: false, message: 'Errore durante la verifica' };
    }
  }

  // Genera codice di verifica (simulato)
  generateVerificationCode(userId: string): string {
    // In una app reale, questo sarebbe generato dal server
    const code = userId.slice(-4).padStart(4, '0');
    return code;
  }

  // Ottieni codice di verifica per l'utente
  async getVerificationCode(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    return this.generateVerificationCode(user.id);
  }

  // Logout
  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('isAuthenticated');
      console.log('✅ Logout effettuato');
    } catch (error) {
      console.error('❌ Errore logout:', error);
    }
  }

  // Verifica se l'utente è autenticato
  async isAuthenticated(): Promise<boolean> {
    try {
      const isAuth = await AsyncStorage.getItem('isAuthenticated');
      const userStr = await AsyncStorage.getItem('currentUser');
      
      if (isAuth === 'true' && userStr) {
        this.currentUser = JSON.parse(userStr);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Errore verifica autenticazione:', error);
      return false;
    }
  }

  // Ottieni utente corrente
  async getCurrentUser(): Promise<User | null> {
    try {
      if (this.currentUser) return this.currentUser;
      
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('❌ Errore get current user:', error);
      return null;
    }
  }

  // Trova utente per email
  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userId = await AsyncStorage.getItem(`email_${email.toLowerCase()}`);
      if (!userId) return null;
      
      const userStr = await AsyncStorage.getItem(`user_${userId}`);
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Errore ricerca utente:', error);
      return null;
    }
  }

  // Validazione email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Reset password (simulato)
  async resetPassword(email: string): Promise<{success: boolean, message: string}> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Email non trovata' };
    }

    // In una app reale, invieresti una email con link di reset
    console.log('🔄 Password reset richiesto per:', email);
    return { success: true, message: 'Link di reset inviato alla tua email' };
  }

  // Pulisci dati di debug
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.currentUser = null;
      console.log('🧹 Tutti i dati cancellati');
    } catch (error) {
      console.error('❌ Errore pulizia dati:', error);
    }
  }
}

// Esporta l'istanza singleton
export const authManager = AuthManager.getInstance();

// Hook per React (semplificato)
export const useAuth = () => {
  return {
    login: authManager.login.bind(authManager),
    register: authManager.register.bind(authManager),
    logout: authManager.logout.bind(authManager),
    verifyEmail: authManager.verifyEmail.bind(authManager),
    isAuthenticated: authManager.isAuthenticated.bind(authManager),
    getCurrentUser: authManager.getCurrentUser.bind(authManager),
    resetPassword: authManager.resetPassword.bind(authManager),
    getVerificationCode: authManager.getVerificationCode.bind(authManager),
    initAuth: authManager.initAuth.bind(authManager),
  };
};