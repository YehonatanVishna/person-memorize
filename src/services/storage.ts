import { Person, StoredPerson } from '../types/person';

const DB_NAME = 'person_memorize_db';
const DB_VERSION = 1;
const STORE_NAME = 'people';

/**
 * Open or create the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all stored people from IndexedDB.
 */
export async function getAllStoredPeople(): Promise<StoredPerson[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as StoredPerson[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or replace multiple people in IndexedDB.
 */
export async function savePeopleToStorage(people: StoredPerson[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const person of people) {
      store.put(person);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Delete a specific person by ID.
 */
export async function deletePersonFromStorage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all stored people.
 */
export async function clearAllPeopleFromStorage(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Convert StoredPerson list to runtime Person list with browser Object URLs.
 */
export function hydrateRuntimePeople(storedList: StoredPerson[]): Person[] {
  return storedList.map((item) => ({
    id: String(item.id),
    name: item.name,
    photoBlob: item.photoBlob,
    photoUrl: URL.createObjectURL(item.photoBlob),
  }));
}

/**
 * Cleanup created object URLs to prevent memory leakage.
 */
export function cleanupRuntimePeople(people: Person[]): void {
  for (const person of people) {
    if (person.photoUrl && person.photoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(person.photoUrl);
      } catch {
        // ignore error during cleanup
      }
    }
  }
}
