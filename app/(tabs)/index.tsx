import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Alert } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>🛒 SuperManager</Text>
              <Text style={styles.subtitle}>Gestisci il tuo supermercato</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
                Alert.alert(
                  '🚪 Logout',
                  'Sei sicuro di voler uscire?',
                  [
                    { text: 'Annulla', style: 'cancel' },
                    { 
                      text: 'Esci', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { authManager } = await import('../utils/auth');
                          await authManager.logout();
                          // Forza reload dell'app
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        } catch (error) {
                          console.error('Errore logout:', error);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>150</Text>
            <Text style={styles.statLabel}>Prodotti</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Categorie</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.scanButton]}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionTitle}>Scansiona Prodotto</Text>
            <Text style={styles.actionSubtitle}>Leggi o genera codice a barre</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.inventoryButton]}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionTitle}>Inventario</Text>
            <Text style={styles.actionSubtitle}>Gestisci tutti i prodotti</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.addButton]}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionTitle}>Aggiungi Prodotto</Text>
            <Text style={styles.actionSubtitle}>Inserisci nuovo articolo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.reportButton]}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Report</Text>
            <Text style={styles.actionSubtitle}>Statistiche e analisi</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Azioni Rapide</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🔍</Text>
              <Text style={styles.quickActionText}>Cerca</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>🏷️</Text>
              <Text style={styles.quickActionText}>Etichette</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📤</Text>
              <Text style={styles.quickActionText}>Esporta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Impostazioni</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100, // Spazio extra per lo scroll
  },
  header: {
    padding: 20,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scanButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  inventoryButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  addButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  reportButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 70,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
});