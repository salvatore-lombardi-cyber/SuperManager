import * as SQLite from 'expo-sqlite';

// Tipi per i prodotti
export interface Product {
  id?: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Classe per gestire il database
class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  // Inizializza il database
  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('supermanager.db');
      await this.createTables();
      console.log('✅ Database inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione database:', error);
      throw error;
    }
  }

  // Crea le tabelle se non esistono
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database non inizializzato');

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.db.execAsync(createProductsTable);
      console.log('✅ Tabella prodotti creata');
      
      // Inserisci dati di esempio se la tabella è vuota
      await this.insertSampleData();
    } catch (error) {
      console.error('❌ Errore creazione tabelle:', error);
      throw error;
    }
  }

  // Inserisci dati di esempio
  private async insertSampleData(): Promise<void> {
    try {
      const existingProducts = await this.getAllProducts();
      if (existingProducts.length === 0) {
        const sampleProducts: Omit<Product, 'id'>[] = [
          { name: 'Pasta Barilla', code: '8076809513548', price: 1.20, quantity: 50, category: 'Alimentari', description: 'Pasta di grano duro' },
          { name: 'Latte Parmalat', code: '8000300123456', price: 1.50, quantity: 30, category: 'Latticini', description: 'Latte fresco intero' },
          { name: 'Pane Mulino Bianco', code: '8076809876543', price: 2.00, quantity: 20, category: 'Panetteria', description: 'Pane bianco affettato' },
          { name: 'Coca Cola', code: '8000300987654', price: 1.80, quantity: 45, category: 'Bevande', description: 'Bibita gassata' },
          { name: 'Olio Extravergine', code: '8076809111222', price: 4.50, quantity: 15, category: 'Alimentari', description: 'Olio di oliva extravergine' },
        ];

        for (const product of sampleProducts) {
          await this.addProduct(product);
        }
        console.log('✅ Dati di esempio inseriti');
      }
    } catch (error) {
      console.error('❌ Errore inserimento dati esempio:', error);
    }
  }

  // Aggiungi un nuovo prodotto
  async addProduct(product: Omit<Product, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.runAsync(
        `INSERT INTO products (name, code, price, quantity, category, description, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [product.name, product.code, product.price, product.quantity, product.category, product.description || '']
      );
      
      console.log('✅ Prodotto aggiunto:', product.name);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ Errore aggiunta prodotto:', error);
      throw error;
    }
  }

  // Ottieni tutti i prodotti
  async getAllProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM products ORDER BY name');
      return result as Product[];
    } catch (error) {
      console.error('❌ Errore lettura prodotti:', error);
      throw error;
    }
  }

  // Cerca prodotti per nome o codice
  async searchProducts(query: string): Promise<Product[]> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM products WHERE name LIKE ? OR code LIKE ? ORDER BY name',
        [`%${query}%`, `%${query}%`]
      );
      return result as Product[];
    } catch (error) {
      console.error('❌ Errore ricerca prodotti:', error);
      throw error;
    }
  }

  // Ottieni prodotti per categoria
  async getProductsByCategory(category: string): Promise<Product[]> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM products WHERE category = ? ORDER BY name',
        [category]
      );
      return result as Product[];
    } catch (error) {
      console.error('❌ Errore lettura per categoria:', error);
      throw error;
    }
  }

  // Trova prodotto per codice a barre
  async getProductByCode(code: string): Promise<Product | null> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM products WHERE code = ?',
        [code]
      );
      return result as Product | null;
    } catch (error) {
      console.error('❌ Errore ricerca per codice:', error);
      throw error;
    }
  }

  // Aggiorna un prodotto
  async updateProduct(id: number, product: Partial<Product>): Promise<void> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const fields = Object.keys(product).filter(key => key !== 'id');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => product[field as keyof Product]);

      await this.db.runAsync(
        `UPDATE products SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );
      
      console.log('✅ Prodotto aggiornato:', id);
    } catch (error) {
      console.error('❌ Errore aggiornamento prodotto:', error);
      throw error;
    }
  }

  // Elimina un prodotto
  async deleteProduct(id: number): Promise<void> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      await this.db.runAsync('DELETE FROM products WHERE id = ?', [id]);
      console.log('✅ Prodotto eliminato:', id);
    } catch (error) {
      console.error('❌ Errore eliminazione prodotto:', error);
      throw error;
    }
  }

  // Aggiorna quantità prodotto
  async updateProductQuantity(code: string, quantity: number): Promise<void> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      await this.db.runAsync(
        'UPDATE products SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE code = ?',
        [quantity, code]
      );
      console.log('✅ Quantità aggiornata per:', code);
    } catch (error) {
      console.error('❌ Errore aggiornamento quantità:', error);
      throw error;
    }
  }

  // Ottieni statistiche
  async getStats(): Promise<{totalProducts: number, totalValue: number, categories: number}> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const totalProducts = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM products');
      const totalValue = await this.db.getFirstAsync('SELECT SUM(price * quantity) as value FROM products');
      const categories = await this.db.getFirstAsync('SELECT COUNT(DISTINCT category) as count FROM products');

      return {
        totalProducts: (totalProducts as any)?.count || 0,
        totalValue: (totalValue as any)?.value || 0,
        categories: (categories as any)?.count || 0
      };
    } catch (error) {
      console.error('❌ Errore lettura statistiche:', error);
      return { totalProducts: 0, totalValue: 0, categories: 0 };
    }
  }

  // Ottieni tutte le categorie
  async getAllCategories(): Promise<string[]> {
    if (!this.db) throw new Error('Database non inizializzato');

    try {
      const result = await this.db.getAllAsync('SELECT DISTINCT category FROM products ORDER BY category');
      return (result as any[]).map(row => row.category);
    } catch (error) {
      console.error('❌ Errore lettura categorie:', error);
      return [];
    }
  }
}

// Istanza singleton del database
export const database = new DatabaseManager();