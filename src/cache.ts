import { LRUCache } from "lru-cache";
import storage from "node-persist";
import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { SourceFile } from "ts-morph";
import { SymbolInfo, AnalysisError, ErrorCode } from "./types.js";

export interface ParsedFile {
  sourceFile: SourceFile;
  lastModified: number;
  contentHash: string;
}

export interface AnalysisResult {
  data: any;
  timestamp: number;
  contentHash?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
}

export type InvalidationStrategy = "timestamp" | "content-hash" | "manual";

export interface CacheOptions {
  cacheDir?: string;
  invalidation?: InvalidationStrategy;
  ttl?: number; // Time to live in milliseconds
}

class DiskCache<T> {
  private initialized = false;
  private cacheDir: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0
  };

  constructor(namespace: string, options: CacheOptions = {}) {
    this.cacheDir = options.cacheDir || join(process.cwd(), ".mcp-cache", namespace);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    await storage.init({
      dir: this.cacheDir,
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: "utf8",
      forgiveParseErrors: true
    });
    
    this.initialized = true;
  }

  async get(key: string): Promise<T | undefined> {
    await this.init();
    
    try {
      const value = await storage.getItem(key);
      if (value) {
        this.stats.hits++;
        return value as T;
      }
      this.stats.misses++;
      return undefined;
    } catch (error) {
      this.stats.misses++;
      return undefined;
    }
  }

  async set(key: string, value: T): Promise<void> {
    await this.init();
    
    try {
      await storage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to cache item ${key}:`, error);
    }
  }

  async has(key: string): Promise<boolean> {
    await this.init();
    const keys = await storage.keys();
    return keys.includes(key);
  }

  async delete(key: string): Promise<void> {
    await this.init();
    await storage.removeItem(key);
    this.stats.evictions++;
  }

  async clear(): Promise<void> {
    await this.init();
    await storage.clear();
    this.stats.evictions = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}

export class CacheManager {
  private fileCache: LRUCache<string, ParsedFile>;
  private symbolCache: LRUCache<string, SymbolInfo>;
  private analysisCache: DiskCache<AnalysisResult>;
  private options: Required<CacheOptions>;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      cacheDir: options.cacheDir || join(process.cwd(), ".mcp-cache"),
      invalidation: options.invalidation || "content-hash",
      ttl: options.ttl || 3600000 // 1 hour default
    };

    // Initialize LRU caches as per specification
    this.fileCache = new LRUCache<string, ParsedFile>({
      max: 1000,
      dispose: (value) => {
        // Clean up source file when evicted
        if (value?.sourceFile) {
          try {
            value.sourceFile.forget();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    });

    this.symbolCache = new LRUCache<string, SymbolInfo>({
      max: 10000
    });

    this.analysisCache = new DiskCache<AnalysisResult>("analysis", this.options);
  }

  async getContentHash(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, "utf8");
      return createHash("sha256").update(content).digest("hex");
    } catch (error) {
      throw new AnalysisError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Failed to read file for hashing: ${filePath}`,
        details: { file: filePath }
      });
    }
  }

  async getFileStats(filePath: string): Promise<{ lastModified: number; size: number }> {
    try {
      const stats = await stat(filePath);
      return {
        lastModified: stats.mtimeMs,
        size: stats.size
      };
    } catch (error) {
      throw new AnalysisError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Failed to get file stats: ${filePath}`,
        details: { file: filePath }
      });
    }
  }

  async isFileCacheValid(filePath: string, cached: ParsedFile): Promise<boolean> {
    if (this.options.invalidation === "manual") {
      return true;
    }

    const stats = await this.getFileStats(filePath);

    if (this.options.invalidation === "timestamp") {
      return stats.lastModified <= cached.lastModified;
    }

    if (this.options.invalidation === "content-hash") {
      const currentHash = await this.getContentHash(filePath);
      return currentHash === cached.contentHash;
    }

    return false;
  }

  async getCachedFile(filePath: string): Promise<ParsedFile | undefined> {
    const cached = this.fileCache.get(filePath);
    
    if (cached && await this.isFileCacheValid(filePath, cached)) {
      return cached;
    }

    if (cached) {
      this.fileCache.delete(filePath);
    }

    return undefined;
  }

  async setCachedFile(filePath: string, sourceFile: SourceFile): Promise<void> {
    const stats = await this.getFileStats(filePath);
    const contentHash = this.options.invalidation === "content-hash" 
      ? await this.getContentHash(filePath)
      : "";

    this.fileCache.set(filePath, {
      sourceFile,
      lastModified: stats.lastModified,
      contentHash
    });
  }

  getCachedSymbol(key: string): SymbolInfo | undefined {
    return this.symbolCache.get(key);
  }

  setCachedSymbol(key: string, symbol: SymbolInfo): void {
    this.symbolCache.set(key, symbol);
  }

  async getCachedAnalysis(key: string): Promise<any | undefined> {
    const cached = await this.analysisCache.get(key);
    
    if (!cached) return undefined;

    // Check TTL
    if (Date.now() - cached.timestamp > this.options.ttl) {
      await this.analysisCache.delete(key);
      return undefined;
    }

    return cached.data;
  }

  async setCachedAnalysis(key: string, data: any): Promise<void> {
    await this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  generateCacheKey(...parts: any[]): string {
    const normalized = parts.map(part => {
      if (part === undefined || part === null) {
        return "null";
      }
      if (typeof part === "object") {
        return JSON.stringify(part, Object.keys(part).sort());
      }
      return String(part);
    }).join(":");

    return createHash("sha256").update(normalized).digest("hex");
  }

  async clearFileCache(): Promise<void> {
    this.fileCache.clear();
  }

  async clearSymbolCache(): Promise<void> {
    this.symbolCache.clear();
  }

  async clearAnalysisCache(): Promise<void> {
    await this.analysisCache.clear();
  }

  async clearAll(): Promise<void> {
    await this.clearFileCache();
    await this.clearSymbolCache();
    await this.clearAnalysisCache();
  }

  getMemoryUsage(): number {
    const fileCount = this.fileCache.size;
    const symbolCount = this.symbolCache.size;
    
    // Rough estimation of memory usage
    const avgFileSize = 50 * 1024; // 50KB average per file
    const avgSymbolSize = 1024; // 1KB average per symbol
    
    return (fileCount * avgFileSize) + (symbolCount * avgSymbolSize);
  }

  getStats(): {
    fileCache: { size: number; capacity: number };
    symbolCache: { size: number; capacity: number };
    analysisCache: CacheStats;
    memoryUsage: number;
  } {
    return {
      fileCache: {
        size: this.fileCache.size,
        capacity: 1000
      },
      symbolCache: {
        size: this.symbolCache.size,
        capacity: 10000
      },
      analysisCache: this.analysisCache.getStats(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  getCacheDir(): string {
    return this.options.cacheDir;
  }

  // Cache strategy based on project size
  static getCacheStrategy(fileCount: number): "memory" | "disk" | "hybrid" {
    if (fileCount < 100) return "memory";
    if (fileCount < 1000) return "memory";
    if (fileCount < 5000) return "hybrid";
    return "disk";
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Helper for caching function results
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : cacheManager.generateCacheKey(...args);
    
    const cached = await cacheManager.getCachedAnalysis(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    await cacheManager.setCachedAnalysis(key, result);
    
    return result;
  }) as T;
}