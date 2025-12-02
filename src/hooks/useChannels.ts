import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchChannelsPage, 
  fetchCategories, 
  getTotalCount,
  PAGE_SIZE,
  type SortField, 
  type SortDirection,
  type PaginationCursor,
} from '../lib/firebase';
import type { Channel, ChannelFilters } from '../types/channel';

const defaultFilters: ChannelFilters = {
  search: '',
  categories: [],
  quality: [],
  isMonetized: null,
  isFaceless: null,
  hasShorts: null,
  minSubscribers: null,
  maxSubscribers: null,
  minRevenue: null,
  maxRevenue: null,
};

/**
 * Parse filters from URL search params
 */
function parseFiltersFromURL(): ChannelFilters {
  const params = new URLSearchParams(window.location.search);
  
  return {
    search: params.get('search') || '',
    categories: params.get('categories')?.split(',').filter(Boolean) || [],
    quality: params.get('quality')?.split(',').filter(Boolean) || [],
    isMonetized: params.get('monetized') === 'true' ? true : params.get('monetized') === 'false' ? false : null,
    isFaceless: params.get('faceless') === 'true' ? true : params.get('faceless') === 'false' ? false : null,
    hasShorts: params.get('shorts') === 'true' ? true : params.get('shorts') === 'false' ? false : null,
    minSubscribers: params.get('minSubs') ? parseInt(params.get('minSubs')!) : null,
    maxSubscribers: params.get('maxSubs') ? parseInt(params.get('maxSubs')!) : null,
    minRevenue: params.get('minRev') ? parseFloat(params.get('minRev')!) : null,
    maxRevenue: params.get('maxRev') ? parseFloat(params.get('maxRev')!) : null,
  };
}

function parseSortFromURL(): { field: SortField; direction: SortDirection } {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort') as SortField | null;
  const dir = params.get('dir') as SortDirection | null;
  return {
    field: sort || 'subscribers',
    direction: dir || 'desc',
  };
}

/**
 * Convert filters to URL search params
 */
function stateToURLParams(
  filters: ChannelFilters, 
  sortField: SortField, 
  sortDirection: SortDirection
): string {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
  if (filters.quality.length > 0) params.set('quality', filters.quality.join(','));
  if (filters.isMonetized !== null) params.set('monetized', String(filters.isMonetized));
  if (filters.isFaceless !== null) params.set('faceless', String(filters.isFaceless));
  if (filters.hasShorts !== null) params.set('shorts', String(filters.hasShorts));
  if (filters.minSubscribers !== null) params.set('minSubs', String(filters.minSubscribers));
  if (filters.maxSubscribers !== null) params.set('maxSubs', String(filters.maxSubscribers));
  if (filters.minRevenue !== null) params.set('minRev', String(filters.minRevenue));
  if (filters.maxRevenue !== null) params.set('maxRev', String(filters.maxRevenue));
  if (sortField !== 'subscribers') params.set('sort', sortField);
  if (sortDirection !== 'desc') params.set('dir', sortDirection);
  
  return params.toString();
}

/**
 * Custom hook for managing channel data with server-side pagination
 */
export function useChannels() {
  // Initialize from URL
  const [filters, setFilters] = useState<ChannelFilters>(() => parseFiltersFromURL());
  const [sortField, setSortField] = useState<SortField>(() => parseSortFromURL().field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => parseSortFromURL().direction);
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const cursorRef = useRef<PaginationCursor>({ firstDoc: null, lastDoc: null });

  // Prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Debounce refs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch categories on mount (only once)
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    fetchCategories().then(setAllCategories).catch(console.error);
  }, []);

  // Update URL when state changes (debounced)
  useEffect(() => {
    if (urlUpdateRef.current) clearTimeout(urlUpdateRef.current);

    urlUpdateRef.current = setTimeout(() => {
      const queryString = stateToURLParams(filters, sortField, sortDirection);
      const newURL = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
      window.history.replaceState(null, '', newURL);
    }, 500);

    return () => {
      if (urlUpdateRef.current) clearTimeout(urlUpdateRef.current);
    };
  }, [filters, sortField, sortDirection]);

  // Fetch data when filters or sort changes (debounced, resets to page 1)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Prevent duplicate fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      cursorRef.current = { firstDoc: null, lastDoc: null };

      try {
        const [result, count] = await Promise.all([
          fetchChannelsPage(filters, sortField, sortDirection),
          getTotalCount(filters),
        ]);
        
        setChannels(result.channels);
        setHasNextPage(result.hasNextPage);
        setHasPrevPage(result.hasPrevPage);
        cursorRef.current = result.cursor;
        setTotalCount(count);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch channels'));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, sortField, sortDirection]);

  // Go to next page
  const nextPage = useCallback(async () => {
    if (!hasNextPage || !cursorRef.current.lastDoc) return;

    setLoading(true);
    try {
      const result = await fetchChannelsPage(
        filters, 
        sortField, 
        sortDirection, 
        cursorRef.current.lastDoc,
        'next'
      );
      
      setChannels(result.channels);
      setHasNextPage(result.hasNextPage);
      setHasPrevPage(result.hasPrevPage);
      cursorRef.current = result.cursor;
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch next page'));
    } finally {
      setLoading(false);
    }
  }, [filters, sortField, sortDirection, hasNextPage]);

  // Go to previous page
  const prevPage = useCallback(async () => {
    if (!hasPrevPage || !cursorRef.current.firstDoc) return;

    setLoading(true);
    try {
      const result = await fetchChannelsPage(
        filters, 
        sortField, 
        sortDirection, 
        cursorRef.current.firstDoc,
        'prev'
      );
      
      setChannels(result.channels);
      setHasNextPage(result.hasNextPage);
      setHasPrevPage(result.hasPrevPage);
      cursorRef.current = result.cursor;
      setCurrentPage(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch previous page'));
    } finally {
      setLoading(false);
    }
  }, [filters, sortField, sortDirection, hasPrevPage]);

  const updateFilters = useCallback((newFilters: Partial<ChannelFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateSort = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    channels,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    allCategories,
    // Sorting
    sortField,
    sortDirection,
    updateSort,
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    pageSize: PAGE_SIZE,
  };
}
