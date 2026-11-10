import { initialDb } from './mockData';

const STORAGE_PREFIX = 'fixmaster_db_';

// Initialize local store from mockData if not present or empty
export const initializeLocalStore = () => {
  if (typeof window === 'undefined') return;
  if (!initialDb) return;

  Object.keys(initialDb).forEach((key) => {
    const storageKey = STORAGE_PREFIX + key;
    const existing = localStorage.getItem(storageKey);
    if (!existing || existing === '[]' || existing === 'null' || existing === 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(initialDb[key]));
      } catch (e) {
        console.warn('Could not seed local store for', key, e);
      }
    }
  });
};

export const getCollection = (collectionName) => {
  if (!collectionName) return [];
  const storageKey = STORAGE_PREFIX + collectionName;
  const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  if (!raw) {
    const fallback = (initialDb && initialDb[collectionName]) || [];
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(fallback));
      }
    } catch {}
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && initialDb && initialDb[collectionName]?.length > 0) {
      // Re-seed if previously emptied accidentally
      localStorage.setItem(storageKey, JSON.stringify(initialDb[collectionName]));
      return initialDb[collectionName];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return (initialDb && initialDb[collectionName]) || [];
  }
};

export const saveCollection = (collectionName, items) => {
  if (!collectionName || typeof window === 'undefined') return;
  const storageKey = STORAGE_PREFIX + collectionName;
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

// Parse REST endpoint e.g. /customers or /jobCards/1 or /devices?customerId=1 or /invoices?_sort=date&_order=desc
export const parseEndpoint = (url) => {
  let cleaned = (url || '').replace(/^\/api/, '').replace(/^\//, '');
  const [pathPart, queryPart] = cleaned.split('?');
  const segments = (pathPart || '').split('/').filter(Boolean);
  const collectionName = segments[0] || '';
  const id = segments[1] !== undefined ? segments[1] : null;

  const queryParams = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [k, v] of searchParams.entries()) {
      queryParams[k] = v;
    }
  }

  return { collectionName, id, queryParams };
};

// Local GET
export const handleLocalGet = (url, params = {}) => {
  const { collectionName, id, queryParams } = parseEndpoint(url);
  const mergedParams = { ...queryParams, ...params };
  const items = getCollection(collectionName);

  if (id !== null && id !== undefined && id !== '') {
    const found = items.find((item) => String(item.id) === String(id));
    return found || null;
  }

  let result = Array.isArray(items) ? [...items] : [];

  // Filtering by query parameters
  Object.keys(mergedParams).forEach((key) => {
    if (key.startsWith('_')) return; // ignore _sort, _order, _limit
    const targetVal = String(mergedParams[key]);
    result = result.filter((item) => item && String(item[key]) === targetVal);
  });

  // Sorting
  if (mergedParams._sort) {
    const sortField = mergedParams._sort;
    const isDesc = mergedParams._order === 'desc';
    result.sort((a, b) => {
      const valA = a && a[sortField] !== undefined && a[sortField] !== null ? a[sortField] : '';
      const valB = b && b[sortField] !== undefined && b[sortField] !== null ? b[sortField] : '';
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });
  }

  // Limit
  if (mergedParams._limit) {
    const limitNum = parseInt(mergedParams._limit, 10);
    if (!isNaN(limitNum)) {
      result = result.slice(0, limitNum);
    }
  }

  return result;
};

// Local POST
export const handleLocalPost = (url, data) => {
  const { collectionName } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const numericIds = items.map((i) => Number(i.id)).filter((n) => !isNaN(n));
  const newId =
    data.id || (numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1);
  const newItem = { ...data, id: newId };
  const updated = [newItem, ...items];
  saveCollection(collectionName, updated);
  return newItem;
};

// Local PUT
export const handleLocalPut = (url, data) => {
  const { collectionName, id } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const targetId = id || data.id;
  let found = false;
  const updated = items.map((item) => {
    if (String(item.id) === String(targetId)) {
      found = true;
      return { ...data, id: targetId };
    }
    return item;
  });
  if (!found) {
    updated.unshift({ ...data, id: targetId });
  }
  saveCollection(collectionName, updated);
  return { ...data, id: targetId };
};

// Local PATCH
export const handleLocalPatch = (url, data) => {
  const { collectionName, id } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const targetId = id || data.id;
  let updatedItem = null;
  const updated = items.map((item) => {
    if (String(item.id) === String(targetId)) {
      updatedItem = { ...item, ...data };
      return updatedItem;
    }
    return item;
  });
  if (!updatedItem) {
    updatedItem = { ...data, id: targetId };
    updated.unshift(updatedItem);
  }
  saveCollection(collectionName, updated);
  return updatedItem;
};

// Local DELETE
export const handleLocalDelete = (url) => {
  const { collectionName, id } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const updated = items.filter((item) => String(item.id) !== String(id));
  saveCollection(collectionName, updated);
  return { success: true };
};
