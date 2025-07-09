import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
// Update the import path below to the correct relative location of your database module.
// For example, if your database.ts is in 'app/database.ts', use '../database'.
// import { database, Product } from '../../../database';
import { database, Product } from '../database';
import { useFocusEffect } from '@react-navigation/native';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [categories, setCategories] = useState<string[]>(['Tutti']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, totalValue: 0, categories: 0 });

  // Inizializza database e carica dati
  const initializeAndLoad = async () => {
    try {
      await database.initDatabase();
      await loadData();
    } catch (error) {
      console.error('Errore inizializzazione:', error);
      Alert.alert('Errore', 'Impossibile inizializzare il database');
    }
  };

  // Carica tutti i dati
  const loadData = async () => {
    try {
      setLoading(true);
      const [allProducts, allCategories, dbStats] = await Promise.all([
        database.getAllProducts(),
        database.getAllCategories(),
        database.getStats()
      ]);
      
      setProducts(allProducts);
      setCategories(['Tutti', ...allCategories]);
      setStats(dbStats);
      filterProducts(allProducts, searchQuery, selectedCategory);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      Alert.alert('Errore', 'Impossibile caricare i prodotti');
    } finally {
      setLoading(false);
    }
  };

  // Filtra prodotti
  const filterProducts = (productList: Product[], query: string, category: string) => {
    let filtered = productList;

    if (query) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.code.includes(query)
      );
    }

    if (category !== 'Tutti') {
      filtered = filtered.filter(product => product.category === category);
    }

    setFilteredProducts(filtered);
  };

  // Refresh dei dati
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Hook per ricaricare quando si torna alla schermata
  useFocusEffect(
    useCallback(() => {
      if (products.length === 0) {
        initializeAndLoad();
      } else {
        loadData();
      }
    }, [])
  );

  // Effetto per il filtro di ricerca
  useEffect(() => {
    filterProducts(products, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, products]);

  // Modifica prodotto
  const handleEditProduct = (product: Product) => {
    Alert.alert(
      'Modifica Prodotto',
      `Vuoi modificare ${product.name}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Modifica Quantità', 
          onPress: () => showQuantityDialog(product)
        },
        { 
          text: 'Modifica Prezzo', 
          onPress: () => showPriceDialog(product)
        },
      ]
    );
  };

  // Dialog per modificare quantità
  const showQuantityDialog = (product: Product) => {
    Alert.prompt(
      'Modifica Quantità',
      `Quantità attuale: ${product.quantity}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Salva', 
          onPress: async (text) => {
            const newQuantity = parseInt(text || '0');
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              try {
                await database.updateProduct(product.id!, { quantity: newQuantity });
                await loadData();
                Alert.alert('Successo', 'Quantità aggiornata!');
              } catch (error) {
                Alert.alert('Errore', 'Impossibile aggiornare la quantità');
              }
            }
          }
        },
      ],
      'plain-text',
      product.quantity.toString()
    );
  };

  // Dialog per modificare prezzo
  const showPriceDialog = (product: Product) => {
    Alert.prompt(
      'Modifica Prezzo',
      `Prezzo attuale: €${product.price.toFixed(2)}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Salva', 
          onPress: async (text) => {
            const newPrice = parseFloat(text || '0');
            if (!isNaN(newPrice) && newPrice >= 0) {
              try {
                await database.updateProduct(product.id!, { price: newPrice });
                await loadData();
                Alert.alert('Successo', 'Prezzo aggiornato!');
              } catch (error) {
                Alert.alert('Errore', 'Impossibile aggiornare il prezzo');
              }
            }
          }
        },
      ],
      'plain-text',
      product.price.toString()
    );
  };

  // Elimina prodotto
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare ${product.name}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: async () => {
            try {
              await database.deleteProduct(product.id!);
              await loadData();
              Alert.alert('Successo', 'Prodotto eliminato!');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il prodotto');
            }
          }
        },
      ]
    );
  };

  // Dialog per aggiungere nuovo prodotto
  const handleAddProduct = () => {
    Alert.alert(
      'Aggiungi Prodotto',
      'Scegli come aggiungere il prodotto:',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Inserimento Manuale', onPress: showAddProductDialog },
        { text: 'Vai a Scanner', onPress: () => console.log('Vai a scanner') },
      ]
    );
  };

  // Dialog per inserimento manuale
  const showAddProductDialog = () => {
    // Per ora un messaggio, poi faremo un form completo
    Alert.alert(
      'Funzione in arrivo!',
      'Il form di inserimento manuale sarà disponibile nella prossima fase!',
      [{ text: 'OK' }]
    );
  };

  // Stato delle scorte
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Esaurito', color: '#ef4444' };
    if (quantity < 10) return { status: 'Scorte basse', color: '#f59e0b' };
    return { status: 'Disponibile', color: '#10b981' };
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>🔄 Caricamento inventario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📦 Inventario</Text>
        <Text style={styles.subtitle}>Database SQLite - {filteredProducts.length} prodotti</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cerca prodotto o codice..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Prodotti</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredProducts.reduce((sum, p) => sum + p.quantity, 0)}
          </Text>
          <Text style={styles.statLabel}>Quantità</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            €{stats.totalValue.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Valore Totale</Text>
        </View>
      </View>

      {/* Products List */}
      <ScrollView 
        style={styles.productsList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProducts.map(product => {
          const stockStatus = getStockStatus(product.quantity);
          return (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProduct(product)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.productInfo}>
                <Text style={styles.productCode}>📋 {product.code}</Text>
                <Text style={styles.productCategory}>🏷️ {product.category}</Text>
                {product.description && (
                  <Text style={styles.productDescription}>📝 {product.description}</Text>
                )}
              </View>
              
              <View style={styles.productDetails}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Prezzo</Text>
                  <Text style={styles.priceValue}>€{product.price.toFixed(2)}</Text>
                </View>
                
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantità</Text>
                  <Text style={styles.quantityValue}>{product.quantity}</Text>
                </View>
                
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Stato</Text>
                  <Text style={[styles.statusValue, { color: stockStatus.color }]}>
                    {stockStatus.status}
                  </Text>
                </View>
              </View>

              <View style={styles.productDates}>
                <Text style={styles.dateText}>
                  ID: {product.id} • Aggiornato: {product.updatedAt?.split('T')[0]}
                </Text>
              </View>
            </View>
          );
        })}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦 Nessun prodotto trovato</Text>
            <Text style={styles.emptySubtext}>Prova a modificare i filtri di ricerca</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Product Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
        <Text style={styles.addButtonText}>+ Aggiungi Prodotto</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#f59e0b',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fef3c7',
    textAlign: 'center',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  productCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 12,
  },
  productInfo: {
    marginBottom: 10,
  },
  productCode: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  quantityContainer: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  productDates: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});