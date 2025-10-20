import { Rating, CustomPrompt } from '../types';

const DB_NAME = 'VideoArenaDB';
const DB_VERSION = 2;
const RATINGS_STORE_NAME = 'ratings';
const PROMPTS_STORE_NAME = 'prompts';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (event.oldVersion < 1) {
        if (!dbInstance.objectStoreNames.contains(RATINGS_STORE_NAME)) {
          const objectStore = dbInstance.createObjectStore(RATINGS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('resultId', 'resultId', { unique: true });
          objectStore.createIndex('model', 'model', { unique: false });
        }
      }
      if (event.oldVersion < 2) {
        if (!dbInstance.objectStoreNames.contains(PROMPTS_STORE_NAME)) {
          dbInstance.createObjectStore(PROMPTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      }
    };
  });
};

export const addRating = (rating: Rating): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([RATINGS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(RATINGS_STORE_NAME);
    const request = store.add(rating);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error adding rating:', request.error);
      reject(request.error);
    };
  });
};

export const getAllRatings = (): Promise<Rating[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([RATINGS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(RATINGS_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Error getting all ratings:', request.error);
      reject(request.error);
    };
  });
};

// --- Custom Prompts ---

export const addPrompt = (prompt: Omit<CustomPrompt, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([PROMPTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PROMPTS_STORE_NAME);
    const request = store.add(prompt);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => {
      console.error('Error adding prompt:', request.error);
      reject(request.error);
    };
  });
};

export const getAllPrompts = (): Promise<CustomPrompt[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([PROMPTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(PROMPTS_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Error getting all prompts:', request.error);
      reject(request.error);
    };
  });
};

export const deletePrompt = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction([PROMPTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PROMPTS_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error deleting prompt:', request.error);
      reject(request.error);
    };
  });
};
