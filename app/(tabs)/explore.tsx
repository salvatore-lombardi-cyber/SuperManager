import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, TextInput, ScrollView, Dimensions } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { database, Product } from '../database';

const { width, height } = Dimensions.get('window');

export default function ScannerWithDatabaseScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [recentScans, setRecentScans] = useState<string[]>([]);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    const initDatabase = async () => {
      try {
        await database.initDatabase();
      } catch (error) {
        console.error('Errore inizializzazione database:', error);
      }
    };

    getBarCodeScannerPermissions();
    initDatabase();
  }, []);

  const searchProductInDatabase = async (code: string) => {
    try {
      const product = await database.getProductByCode(code);
      return product;
    } catch (error) {
      console.error('Errore ricerca prodotto:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScannedCode(data);
    setIsScanning(false);
    
    // Cerca il prodotto nel database
    const product = await searchProductInDatabase(data);
    setFoundProduct(product);

    // Aggiungi ai scan recenti
    setRecentScans(prev => {
      const newScans = [data, ...prev.filter(code => code !== data)].slice(0, 5);
      return newScans;
    });

    if (product) {
      // Prodotto trovato nel database
      Alert.alert(
        '✅ Prodotto Trovato!',
        `${product.name}\nPrezzo: €${product.price.toFixed(2)}\nQuantità: ${product.quantity}\nCategoria: ${product.category}`,
        [
          { text: 'Modifica Quantità', onPress: () => showQuantityDialog(product) },
          { text: 'Dettagli', onPress: () => showProductDetails(product) },
          { text: 'Scansiona Altro', onPress: () => setScanned(false) },
          { text: 'OK', onPress: () => console.log('Scansione completata') }
        ]
      );
    } else {
      // Prodotto non trovato
      Alert.alert(
        '❓ Prodotto Non Trovato',
        `Codice: ${data}\n\nQuesto prodotto non è presente nel database.`,
        [
          { text: 'Aggiungi Prodotto', onPress: () => showAddProductDialog(data) },
          { text: 'Scansiona Altro', onPress: () => setScanned(false) },
          { text: 'OK', onPress: () => console.log('Prodotto non trovato') }
        ]
      );
    }
  };

  const showQuantityDialog = (product: Product) => {
    Alert.prompt(
      'Aggiorna Quantità',
      `Prodotto: ${product.name}\nQuantità attuale: ${product.quantity}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: '+1', 
          onPress: async () => {
            await updateProductQuantity(product, product.quantity + 1);
          }
        },
        { 
          text: '-1', 
          onPress: async () => {
            if (product.quantity > 0) {
              await updateProductQuantity(product, product.quantity - 1);
            }
          }
        },
        { 
          text: 'Personalizza', 
          onPress: (text) => {
            Alert.prompt(
              'Nuova Quantità',
              `Inserisci la nuova quantità per ${product.name}:`,
              [
                { text: 'Annulla', style: 'cancel' },
                { 
                  text: 'Salva', 
                  onPress: async (newQty) => {
                    const quantity = parseInt(newQty || '0');
                    if (!isNaN(quantity) && quantity >= 0) {
                      await updateProductQuantity(product, quantity);
                    }
                  }
                },
              ],
              'plain-text',
              product.quantity.toString()
            );
          }
        },
      ]
    );
  };

  const updateProductQuantity = async (product: Product, newQuantity: number) => {
    try {
      await database.updateProduct(product.id!, { quantity: newQuantity });
      
      // Aggiorna il prodotto trovato
      const updatedProduct = { ...product, quantity: newQuantity };
      setFoundProduct(updatedProduct);
      
      Alert.alert(
        '✅ Quantità Aggiornata!',
        `${product.name}\nNuova quantità: ${newQuantity}`,
        [
          { text: 'Scansiona Altro', onPress: () => setScanned(false) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('❌ Errore', 'Impossibile aggiornare la quantità');
    }
  };

  const showProductDetails = (product: Product) => {
    Alert.alert(
      `📦 ${product.name}`,
      `Codice: ${product.code}
Prezzo: €${product.price.toFixed(2)}
Quantità: ${product.quantity}
Categoria: ${product.category}
${product.description ? `Descrizione: ${product.description}` : ''}
ID: ${product.id}
Ultimo aggiornamento: ${product.updatedAt?.split('T')[0]}`,
      [
        { text: 'Modifica', onPress: () => showQuantityDialog(product) },
        { text: 'OK' }
      ]
    );
  };

  const showAddProductDialog = (code: string) => {
    Alert.prompt(
      '➕ Aggiungi Nuovo Prodotto',
      `Codice: ${code}\nInserisci il nome del prodotto:`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Aggiungi', 
          onPress: async (name) => {
            if (name && name.trim()) {
              await addNewProduct(code, name.trim());
            }
          }
        },
      ],
      'plain-text',
      ''
    );
  };

  const addNewProduct = async (code: string, name: string) => {
    try {
      const newProduct: Omit<Product, 'id'> = {
        name: name,
        code: code,
        price: 0.00,
        quantity: 1,
        category: 'Nuovo',
        description: 'Prodotto aggiunto da scanner'
      };

      const productId = await database.addProduct(newProduct);
      
      Alert.alert(
        '✅ Prodotto Aggiunto!',
        `${name} è stato aggiunto al database.\n\nVai nell'inventario per completare le informazioni (prezzo, categoria, ecc.)`,
        [
          { text: 'Scansiona Altro', onPress: () => setScanned(false) },
          { text: 'OK' }
        ]
      );

      // Aggiorna il prodotto trovato
      const addedProduct = await database.getProductByCode(code);
      setFoundProduct(addedProduct);
      
    } catch (error) {
      Alert.alert('❌ Errore', 'Impossibile aggiungere il prodotto al database');
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanned(false);
    setFoundProduct(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanned(false);
  };

  const handleManualEntry = async () => {
    if (manualCode.trim()) {
      setScannedCode(manualCode);
      
      const product = await searchProductInDatabase(manualCode);
      setFoundProduct(product);
      
      if (product) {
        Alert.alert(
          '✅ Prodotto Trovato!',
          `${product.name}\nPrezzo: €${product.price.toFixed(2)}\nQuantità: ${product.quantity}`,
          [
            { text: 'Modifica', onPress: () => showQuantityDialog(product) },
            { text: 'OK', onPress: () => setManualCode('') }
          ]
        );
      } else {
        Alert.alert(
          '❓ Prodotto Non Trovato',
          `Codice: ${manualCode}`,
          [
            { text: 'Aggiungi', onPress: () => showAddProductDialog(manualCode) },
            { text: 'OK', onPress: () => setManualCode('') }
          ]
        );
      }
    }
  };

  const generateNewCode = () => {
    const newCode = '800' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    setScannedCode(newCode);
    setFoundProduct(null);
    
    Alert.alert(
      '🏷️ Codice Generato!',
      `Nuovo codice: ${newCode}\n\nVuoi aggiungere un prodotto con questo codice?`,
      [
        { text: 'No', onPress: () => console.log('Codice generato') },
        { text: 'Aggiungi Prodotto', onPress: () => showAddProductDialog(newCode) }
      ]
    );
  };

  const handleRecentScan = async (code: string) => {
    setScannedCode(code);
    const product = await searchProductInDatabase(code);
    setFoundProduct(product);
    
    if (product) {
      showProductDetails(product);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>🔄 Richiesta permessi camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>❌ Accesso camera negato</Text>
          <Text style={styles.permissionSubtext}>
            Vai in Impostazioni → SuperManager → Camera per abilitare l'accesso
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📷 Scanner Smart</Text>
          <Text style={styles.subtitle}>Connesso al database SQLite</Text>
        </View>

        {/* Camera or Preview */}
        <View style={styles.cameraContainer}>
          {isScanning ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={styles.camera}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'pdf417', 'aztec', 'ean13', 'ean8', 'upc_e', 'code128', 'code39'],
                }}
              />
              {/* Scanning overlay */}
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.scanLine} />
                <Text style={styles.scanText}>Inquadra il codice a barre</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.cameraText}>Scanner collegato al database</Text>
              <Text style={styles.cameraSubtext}>Trova automaticamente i tuoi prodotti</Text>
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!isScanning ? (
            <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={startScanning}>
              <Text style={styles.buttonIcon}>🚀</Text>
              <Text style={styles.buttonText}>Avvia Scanner Smart</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopScanning}>
              <Text style={styles.buttonIcon}>⏹️</Text>
              <Text style={styles.buttonText}>Ferma Scanner</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.generateButton]}
            onPress={generateNewCode}
          >
            <Text style={styles.buttonIcon}>🏷️</Text>
            <Text style={styles.buttonText}>Genera Codice per Nuovo Prodotto</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Entry */}
        <View style={styles.manualContainer}>
          <Text style={styles.sectionTitle}>Ricerca Manuale nel Database</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Inserisci codice a barre..."
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="default"
            />
            <TouchableOpacity 
              style={styles.inputButton}
              onPress={handleManualEntry}
            >
              <Text style={styles.inputButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Found Product Info */}
        {foundProduct && (
          <View style={styles.productContainer}>
            <Text style={styles.sectionTitle}>✅ Prodotto Trovato</Text>
            <View style={styles.productCard}>
              <Text style={styles.productName}>{foundProduct.name}</Text>
              <Text style={styles.productCode}>📋 {foundProduct.code}</Text>
              <Text style={styles.productCategory}>🏷️ {foundProduct.category}</Text>
              <View style={styles.productDetails}>
                <Text style={styles.productPrice}>€{foundProduct.price.toFixed(2)}</Text>
                <Text style={styles.productQuantity}>Qty: {foundProduct.quantity}</Text>
              </View>
              {foundProduct.description && (
                <Text style={styles.productDescription}>{foundProduct.description}</Text>
              )}
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => showQuantityDialog(foundProduct)}
              >
                <Text style={styles.editButtonText}>✏️ Modifica Quantità</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Last Scanned Code */}
        {scannedCode && !foundProduct && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Ultimo Codice Scansionato</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{scannedCode}</Text>
              <Text style={styles.notFoundText}>❌ Non trovato nel database</Text>
            </View>
          </View>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Scansioni Recenti</Text>
            {recentScans.map((code, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.recentItem}
                onPress={() => handleRecentScan(code)}
              >
                <Text style={styles.recentCode}>📋 {code}</Text>
                <Text style={styles.recentAction}>👆 Tocca per cercare</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingBottom: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#10b981',
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
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 5,
  },
  cameraContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 300,
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#10b981',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: '#10b981',
    opacity: 0.8,
  },
  scanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 140,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  cameraText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  cameraSubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  generateButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputButton: {
    backgroundColor: '#3b82f6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  productContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  productCode: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  productQuantity: {
    fontSize: 16,
    color: '#1f2937',
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resultContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  codeDisplay: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  notFoundText: {
    fontSize: 14,
    color: '#ef4444',
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentCode: {
    fontSize: 14,
    color: '#1f2937',
  },
  recentAction: {
    fontSize: 12,
    color: '#6b7280',
  },
});