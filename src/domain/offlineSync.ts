/**
 * POLARIS-X Offline Persistence & Duplicate-Safe Synchronization Engine
 *
 * Implements native IndexedDB storage for:
 * 1. Station telemetry snapshots
 * 2. Operator decisions and intervention audit logs
 * 3. Event Outbox for offline queueing
 * 4. Duplicate-safe reconciliation using idempotent event IDs
 */

import { OutboxSyncEvent, StationState } from './types';

const DB_NAME = 'polaris_x_db';
const DB_VERSION = 1;
const STORE_STATE = 'station_snapshots';
const STORE_OUTBOX = 'event_outbox';
const STORE_DECISIONS = 'operator_decisions';

export class OfflineStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      // Check for indexedDB existence in browser environment
      if (typeof window === 'undefined' || !window.indexedDB) {
        // Fallback mock if in non-DOM environment
        return resolve({} as IDBDatabase);
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const outboxStore = db.createObjectStore(STORE_OUTBOX, { keyPath: 'eventId' });
          outboxStore.createIndex('synced', 'synced', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_DECISIONS)) {
          db.createObjectStore(STORE_DECISIONS, { keyPath: 'decisionId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Saves latest snapshot to IndexedDB
   */
  public async saveSnapshot(state: StationState): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return;
      const tx = db.transaction(STORE_STATE, 'readwrite');
      const store = tx.objectStore(STORE_STATE);
      store.put({
        id: 'latest_state',
        state,
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed saving snapshot to IndexedDB:', err);
    }
  }

  /**
   * Loads latest state snapshot from IndexedDB
   */
  public async loadLatestSnapshot(): Promise<StationState | null> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_STATE, 'readonly');
        const store = tx.objectStore(STORE_STATE);
        const req = store.get('latest_state');
        req.onsuccess = () => {
          if (req.result && req.result.state) {
            resolve(req.result.state);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Queues an event into the offline outbox
   */
  public async queueOutboxEvent(event: OutboxSyncEvent): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return;
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      store.put(event);
    } catch (err) {
      console.warn('Failed queueing event to IndexedDB outbox:', err);
    }
  }

  /**
   * Gets all pending unsynced outbox events
   */
  public async getPendingOutboxEvents(): Promise<OutboxSyncEvent[]> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.getAll();
        req.onsuccess = () => {
          const all = (req.result as OutboxSyncEvent[]) || [];
          resolve(all.filter((e) => !e.synced));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Marks outbox events as synced
   */
  public async markEventsSynced(eventIds: string[]): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return;
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      for (const id of eventIds) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            getReq.result.synced = true;
            store.put(getReq.result);
          }
        };
      }
    } catch (err) {
      console.warn('Failed updating synced events in IndexedDB:', err);
    }
  }

  /**
   * Records an approved advisory intervention or operator decision
   */
  public async recordDecision(decision: {
    decisionId: string;
    packageId: string;
    title: string;
    operator: string;
    decision: 'APPROVED' | 'REJECTED' | 'APPLIED_TO_SIMULATOR';
    simulatedTimeHours: number;
    timestamp: string;
    details: string;
  }): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return;
      const tx = db.transaction(STORE_DECISIONS, 'readwrite');
      tx.objectStore(STORE_DECISIONS).put(decision);
    } catch (err) {
      console.warn('Failed recording decision:', err);
    }
  }

  public async getDecisions(): Promise<any[]> {
    try {
      const db = await this.getDB();
      if (!db.transaction) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_DECISIONS, 'readonly');
        const req = tx.objectStore(STORE_DECISIONS).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}
