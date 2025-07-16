import { type RetrieveDocumentResult } from '../types/types';

interface CachedDocument {
  documentId: string;
  data: string; // Base64 decrypted data
  contentType: string;
  filename: string;
  timestamp: number;
  expiresAt: number;
}

interface DocumentCacheOptions {
  maxCacheSize: number; // Maximum number of documents to cache
  defaultTTL: number; // Time to live in milliseconds (default: 10 minutes)
  securityCleanupInterval: number; // How often to run security cleanup (default: 5 minutes)
}

class SecureDocumentCache {
  private cache = new Map<string, CachedDocument>();
  private options: DocumentCacheOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private accessLog = new Map<string, number>(); // Track document access for security

  constructor(options: Partial<DocumentCacheOptions> = {}) {
    this.options = {
      maxCacheSize: options.maxCacheSize || 10,
      defaultTTL: options.defaultTTL || 10 * 60 * 1000, // 10 minutes
      securityCleanupInterval: options.securityCleanupInterval || 5 * 60 * 1000 // 5 minutes
    };

    this.startSecurityCleanup();
  }

  private startSecurityCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performSecurityCleanup();
    }, this.options.securityCleanupInterval);
  }

  private performSecurityCleanup() {
    const now = Date.now();
    
    // Remove expired documents
    for (const [documentId, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.secureDelete(documentId);
      }
    }

    // Enforce cache size limit (LRU eviction)
    if (this.cache.size > this.options.maxCacheSize) {
      const sortedByAccess = Array.from(this.accessLog.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by access time (oldest first)
      
      const itemsToRemove = this.cache.size - this.options.maxCacheSize;
      for (let i = 0; i < itemsToRemove; i++) {
        const [documentId] = sortedByAccess[i];
        this.secureDelete(documentId);
      }
    }

    console.log(`[DocumentCache] Security cleanup completed. Cache size: ${this.cache.size}`);
  }

  private secureDelete(documentId: string) {
    const cached = this.cache.get(documentId);
    if (cached) {
      // Security: Overwrite sensitive data before deletion
      // This doesn't guarantee memory cleanup in JS, but it's a best effort
      try {
        // Create a buffer of random data to overwrite the base64 string
        const overwriteData = this.generateSecureRandomString(cached.data.length);
        (cached as any).data = overwriteData;
        (cached as any).filename = '';
        (cached as any).contentType = '';
      } catch (error) {
        console.warn('[DocumentCache] Failed to securely overwrite data:', error);
      }
    }
    
    this.cache.delete(documentId);
    this.accessLog.delete(documentId);
  }

  private generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Store a document in the cache
   */
  set(documentId: string, documentData: RetrieveDocumentResult): void {
    if (!documentData.success || !documentData.data) {
      console.warn('[DocumentCache] Cannot cache invalid document data');
      return;
    }

    const now = Date.now();
    const cached: CachedDocument = {
      documentId,
      data: documentData.data.decryptedData,
      contentType: documentData.data.contentType,
      filename: documentData.data.filename,
      timestamp: now,
      expiresAt: now + this.options.defaultTTL
    };

    // If we're at capacity, remove the least recently accessed item
    if (this.cache.size >= this.options.maxCacheSize) {
      const lruDocumentId = this.findLRUDocument();
      if (lruDocumentId) {
        this.secureDelete(lruDocumentId);
      }
    }

    this.cache.set(documentId, cached);
    this.accessLog.set(documentId, now);
    
    console.log(`[DocumentCache] Cached document ${documentId}. Cache size: ${this.cache.size}`);
  }

  /**
   * Retrieve a document from the cache
   */
  get(documentId: string): RetrieveDocumentResult | null {
    const cached = this.cache.get(documentId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > cached.expiresAt) {
      this.secureDelete(documentId);
      return null;
    }

    // Update access time
    this.accessLog.set(documentId, now);

    // Return in the expected format
    return {
      success: true,
      data: {
        decryptedData: cached.data,
        contentType: cached.contentType,
        filename: cached.filename,
        category: '' // We don't store category in cache
      }
    };
  }

  /**
   * Check if a document is cached and not expired
   */
  has(documentId: string): boolean {
    const cached = this.cache.get(documentId);
    if (!cached) return false;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.secureDelete(documentId);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific document from cache (e.g., when it's updated)
   */
  invalidate(documentId: string): void {
    this.secureDelete(documentId);
    console.log(`[DocumentCache] Invalidated document ${documentId}`);
  }

  /**
   * Clear all cached documents
   */
  clear(): void {
    const documentIds = Array.from(this.cache.keys());
    for (const documentId of documentIds) {
      this.secureDelete(documentId);
    }
    console.log('[DocumentCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      documents: Array.from(this.cache.keys())
    };
  }

  /**
   * Find the least recently used document
   */
  private findLRUDocument(): string | null {
    if (this.accessLog.size === 0) return null;

    let lruDocumentId = '';
    let lruTime = Date.now();

    for (const [documentId, accessTime] of this.accessLog.entries()) {
      if (accessTime < lruTime) {
        lruTime = accessTime;
        lruDocumentId = documentId;
      }
    }

    return lruDocumentId || null;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    console.log('[DocumentCache] Cache destroyed');
  }
}

// Create a singleton instance for the application
let documentCacheInstance: SecureDocumentCache | null = null;

export function getDocumentCache(): SecureDocumentCache {
  if (!documentCacheInstance) {
    documentCacheInstance = new SecureDocumentCache({
      maxCacheSize: 8, // Limit to 8 documents to manage memory usage
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      securityCleanupInterval: 3 * 60 * 1000 // 3 minutes
    });
  }
  return documentCacheInstance;
}

export function destroyDocumentCache(): void {
  if (documentCacheInstance) {
    documentCacheInstance.destroy();
    documentCacheInstance = null;
  }
}

// Cleanup on page unload for security
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    destroyDocumentCache();
  });

  // Also cleanup when page becomes hidden (user switches tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && documentCacheInstance) {
      // Optionally clear cache when page is hidden for security
      // documentCacheInstance.clear();
    }
  });
} 