import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  QueryConstraint,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Channel, ChannelFilters } from '../types/channel';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

// Collection reference
const CHANNELS_COLLECTION = 'channels';

// Page size
export const PAGE_SIZE = 25;

export type SortField = 'subscribers' | 'avgMonthlyRevenue' | 'totalViews' | 'rpm' | 'numOfUploads' | 'avgViewPerVideo' | 'daysSinceStart' | 'outlierScore';
export type SortDirection = 'asc' | 'desc';

export interface PaginationCursor {
  firstDoc: QueryDocumentSnapshot | null;
  lastDoc: QueryDocumentSnapshot | null;
}

export interface FetchResult {
  channels: Channel[];
  cursor: PaginationCursor;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Build query constraints based on filters
 * Note: Firestore only allows range filters on ONE field per query
 * Priority: revenue range > subscriber range (revenue is more commonly filtered)
 */
function buildFilterConstraints(filters: ChannelFilters): { constraints: QueryConstraint[]; hasRevenueRange: boolean; hasSubscriberRange: boolean } {
  const constraints: QueryConstraint[] = [];
  let hasRevenueRange = false;
  let hasSubscriberRange = false;

  // Quality filter (equality)
  if (filters.quality.length === 1) {
    constraints.push(where('quality', '==', filters.quality[0]));
  } else if (filters.quality.length > 1) {
    constraints.push(where('quality', 'in', filters.quality));
  }

  // Boolean filters
  if (filters.isMonetized !== null) {
    constraints.push(where('isMonetized', '==', filters.isMonetized));
  }
  if (filters.isFaceless !== null) {
    constraints.push(where('isFaceless', '==', filters.isFaceless));
  }
  if (filters.hasShorts !== null) {
    constraints.push(where('hasShorts', '==', filters.hasShorts));
  }

  // Range filters - can only use one field for range queries in Firestore
  // Prioritize revenue range if set, otherwise use subscriber range
  if (filters.minRevenue !== null || filters.maxRevenue !== null) {
    hasRevenueRange = true;
    if (filters.minRevenue !== null) {
      constraints.push(where('avgMonthlyRevenue', '>=', filters.minRevenue));
    }
    if (filters.maxRevenue !== null) {
      constraints.push(where('avgMonthlyRevenue', '<=', filters.maxRevenue));
    }
  } else {
    // Only apply subscriber range if no revenue range
    if (filters.minSubscribers !== null || filters.maxSubscribers !== null) {
      hasSubscriberRange = true;
      if (filters.minSubscribers !== null) {
        constraints.push(where('subscribers', '>=', filters.minSubscribers));
      }
      if (filters.maxSubscribers !== null) {
        constraints.push(where('subscribers', '<=', filters.maxSubscribers));
      }
    }
  }

  return { constraints, hasRevenueRange, hasSubscriberRange };
}

/**
 * Apply client-side filters that can't be done in Firestore
 */
function applyClientFilters(channels: Channel[], filters: ChannelFilters, hasRevenueRange: boolean): Channel[] {
  let result = channels;

  // Search filter (always client-side - Firestore doesn't support full-text search)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (channel) =>
        channel.title.toLowerCase().includes(searchLower) ||
        channel.categories?.some((cat) => cat.toLowerCase().includes(searchLower))
    );
  }

  // Category filter (array-contains can't combine with other filters easily)
  if (filters.categories.length > 0) {
    result = result.filter((channel) =>
      filters.categories.some((cat) => channel.categories?.includes(cat))
    );
  }

  // Subscriber range (client-side if revenue range was used server-side)
  if (hasRevenueRange) {
    if (filters.minSubscribers !== null) {
      result = result.filter((channel) => channel.subscribers >= filters.minSubscribers!);
    }
    if (filters.maxSubscribers !== null) {
      result = result.filter((channel) => channel.subscribers <= filters.maxSubscribers!);
    }
  }

  return result;
}

/**
 * Fetch a page of channels with filters and sorting
 */
export async function fetchChannelsPage(
  filters: ChannelFilters,
  sortField: SortField = 'subscribers',
  sortDirection: SortDirection = 'desc',
  cursor?: QueryDocumentSnapshot,
  direction: 'next' | 'prev' = 'next'
): Promise<FetchResult> {
  // Get filter constraints
  const { constraints: filterConstraints, hasRevenueRange } = buildFilterConstraints(filters);
  const constraints: QueryConstraint[] = [...filterConstraints];

  // Add sorting
  constraints.push(orderBy(sortField, sortDirection));

  // Add pagination - fetch one extra to check if there's more
  if (cursor) {
    if (direction === 'next') {
      constraints.push(startAfter(cursor));
      constraints.push(limit(PAGE_SIZE + 1)); // +1 to check hasMore
    } else {
      constraints.push(endBefore(cursor));
      constraints.push(limitToLast(PAGE_SIZE + 1)); // +1 to check hasMore
    }
  } else {
    constraints.push(limit(PAGE_SIZE + 1)); // +1 to check hasMore
  }

  const q = query(collection(db, CHANNELS_COLLECTION), ...constraints);

  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Check if there are more pages
    const hasMore = docs.length > PAGE_SIZE;
    
    // Only take PAGE_SIZE items
    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
    
    let channels: Channel[] = pageDocs.map((doc) => ({
      ...doc.data(),
      id: doc.data().id || parseInt(doc.id, 10),
    })) as Channel[];

    // Apply client-side filters
    channels = applyClientFilters(channels, filters, hasRevenueRange);

    const firstDoc = pageDocs[0] || null;
    const lastDoc = pageDocs[pageDocs.length - 1] || null;

    return {
      channels,
      cursor: { firstDoc, lastDoc },
      hasNextPage: hasMore,
      hasPrevPage: cursor !== undefined, // If we have a cursor, we came from somewhere
    };
  } catch (error) {
    console.error('Firestore fetch error:', error);
    throw error;
  }
}

/**
 * Get total count (approximate) for display
 */
export async function getTotalCount(filters: ChannelFilters): Promise<number> {
  try {
    const { constraints } = buildFilterConstraints(filters);
    const q = query(collection(db, CHANNELS_COLLECTION), ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting count:', error);
    return 0;
  }
}

/**
 * Fetch all unique categories
 */
export async function fetchCategories(): Promise<string[]> {
  const q = query(collection(db, CHANNELS_COLLECTION), limit(500));

  try {
    const snapshot = await getDocs(q);
    const categoriesSet = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((cat: string) => categoriesSet.add(cat));
      }
    });

    return Array.from(categoriesSet).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export { db };
export type { QueryDocumentSnapshot };
