import initialDb from '../../db.json';

const STORAGE_PREFIX = 'fixmaster_db_';

// Initialize local store from db.json if not present
export const initializeLocalStore = () => {
  if (typeof window === 'undefined') return;
  Object.keys(initialDb).forEach((key) => {
    const storageKey = STORAGE_PREFIX + key;
    if (!localStorage.getItem(storageKey)) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(initialDb[key]));
      } catch (e) {
        console.warn('Could not seed local store for', key, e);
      }
    }
  });
};

export const getCollection = (collectionName) => {
  const storageKey = STORAGE_PREFIX + collectionName;
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    const fallback = initialDb[collectionName] || [];
    try {
      localStorage.setItem(storageKey, JSON.stringify(fallback));
    } catch {}
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return initialDb[collectionName] || [];
  }
};

export const saveCollection = (collectionName, items) => {
  const storageKey = STORAGE_PREFIX + collectionName;
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

// Parse REST endpoint e.g. /customers or /jobCards/1 or /devices?customerId=1
export const parseEndpoint = (url) => {
  // Strip leading /api or /
  let cleaned = url.replace(/^\/api/, '').replace(/^\//, '');
  const [pathPart, queryPart] = cleaned.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const collectionName = segments[0];
  const id = segments[1] ? Number(segments[1]) || segments[1] : null;

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

  if (id !== null) {
    const found = items.find((item) => String(item.id) === String(id));
    return found || null;
  }

  let result = [...items];

  // Filtering by query parameters
  Object.keys(mergedParams).forEach((key) => {
    if (key.startsWith('_')) return; // ignore _sort, _order, _limit
    const targetVal = String(mergedParams[key]);
    result = result.filter((item) => String(item[key]) === targetVal);
  });

  // Sorting
  if (mergedParams._sort) {
    const sortField = mergedParams._sort;
    const isDesc = mergedParams._order === 'desc';
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
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
  const newId =
    data.id || (items.length > 0 ? Math.max(...items.map((i) => Number(i.id) || 0)) + 1 : 1);
  const newItem = { ...data, id: newId };
  const updated = [...items, newItem];
  saveCollection(collectionName, updated);
  return newItem;
};

// Local PUT
export const handleLocalPut = (url, data) => {
  const { collectionName, id } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const targetId = id || data.id;
  const updated = items.map((item) => (String(item.id) === String(targetId) ? { ...data, id: targetId } : item));
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
  saveCollection(collectionName, updated);
  return updatedItem || { ...data, id: targetId };
};

// Local DELETE
export const handleLocalDelete = (url) => {
  const { collectionName, id } = parseEndpoint(url);
  const items = getCollection(collectionName);
  const updated = items.filter((item) => String(item.id) !== String(id));
  saveCollection(collectionName, updated);
  return { success: true };
};
