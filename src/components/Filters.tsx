import { useState } from 'react';
import type { ChannelFilters } from '../types/channel';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

interface FiltersProps {
  filters: ChannelFilters;
  updateFilters: (filters: Partial<ChannelFilters>) => void;
  resetFilters: () => void;
  allCategories: string[];
}

export function Filters({
  filters,
  updateFilters,
  resetFilters,
  allCategories,
}: FiltersProps) {
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.quality.length > 0 ||
    filters.isMonetized !== null ||
    filters.isFaceless !== null ||
    filters.hasShorts !== null ||
    filters.minSubscribers !== null ||
    filters.maxSubscribers !== null ||
    filters.minRevenue !== null ||
    filters.maxRevenue !== null;

  const activeFilterCount = [
    filters.search,
    filters.categories.length > 0,
    filters.quality.length > 0,
    filters.isMonetized !== null,
    filters.isFaceless !== null,
    filters.hasShorts !== null,
    filters.minSubscribers !== null || filters.maxSubscribers !== null,
    filters.minRevenue !== null || filters.maxRevenue !== null,
  ].filter(Boolean).length;

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleQuality = (quality: string) => {
    const newQuality = filters.quality.includes(quality)
      ? filters.quality.filter((q) => q !== quality)
      : [...filters.quality, quality];
    updateFilters({ quality: newQuality });
  };

  const toggleBooleanFilter = (
    key: 'isMonetized' | 'isFaceless' | 'hasShorts',
    value: boolean
  ) => {
    updateFilters({ [key]: filters[key] === value ? null : value });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Mobile: Search + Filter Toggle */}
      <div className="p-3 flex gap-2 lg:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
          />
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
            showMobileFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: Expandable Filters */}
      {showMobileFilters && (
        <div className="p-3 pt-0 space-y-3 lg:hidden border-t border-gray-100">
          {/* Quality */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Quality</span>
            <div className="flex flex-wrap gap-2">
              {['Low', 'Mid', 'High'].map((q) => (
                <button
                  key={q}
                  onClick={() => toggleQuality(q.toLowerCase())}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filters.quality.includes(q.toLowerCase())
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Type</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleBooleanFilter('isMonetized', true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filters.isMonetized === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monetized
              </button>
              <button
                onClick={() => toggleBooleanFilter('isFaceless', true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filters.isFaceless === true
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Faceless
              </button>
              <button
                onClick={() => toggleBooleanFilter('hasShorts', true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filters.hasShorts === true
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Shorts
              </button>
            </div>
          </div>

          {/* Subscribers Range */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Subscribers</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minSubscribers ?? ''}
                onChange={(e) =>
                  updateFilters({ minSubscribers: e.target.value ? parseInt(e.target.value) : null })
                }
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxSubscribers ?? ''}
                onChange={(e) =>
                  updateFilters({ maxSubscribers: e.target.value ? parseInt(e.target.value) : null })
                }
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Monthly Revenue</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="$Min"
                value={filters.minRevenue ?? ''}
                onChange={(e) =>
                  updateFilters({ minRevenue: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                placeholder="$Max"
                value={filters.maxRevenue ?? ''}
                onChange={(e) =>
                  updateFilters({ maxRevenue: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 uppercase">
                Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-2 py-1 text-xs rounded-md capitalize transition-colors ${
                      filters.categories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Desktop: Inline Filters */}
      <div className="hidden lg:block">
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative" style={{ width: '220px' }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
            />
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Quality */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Quality:</span>
            <div className="flex gap-1">
              {['Low', 'Mid', 'High'].map((q) => (
                <button
                  key={q}
                  onClick={() => toggleQuality(q.toLowerCase())}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    filters.quality.includes(q.toLowerCase())
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Type Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Type:</span>
            <div className="flex gap-1">
              <button
                onClick={() => toggleBooleanFilter('isMonetized', true)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  filters.isMonetized === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monetized
              </button>
              <button
                onClick={() => toggleBooleanFilter('isFaceless', true)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  filters.isFaceless === true
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Faceless
              </button>
              <button
                onClick={() => toggleBooleanFilter('hasShorts', true)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  filters.hasShorts === true
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Shorts
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Subscribers Range */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Subs:</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minSubscribers ?? ''}
              onChange={(e) =>
                updateFilters({ minSubscribers: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-300">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxSubscribers ?? ''}
              onChange={(e) =>
                updateFilters({ maxSubscribers: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Revenue Range */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Revenue:</span>
            <input
              type="number"
              placeholder="$Min"
              value={filters.minRevenue ?? ''}
              onChange={(e) =>
                updateFilters({ minRevenue: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-300">-</span>
            <input
              type="number"
              placeholder="$Max"
              value={filters.maxRevenue ?? ''}
              onChange={(e) =>
                updateFilters({ maxRevenue: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="w-16 px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </>
          )}
        </div>

        {/* Categories Expandable - Desktop */}
        {allCategories.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">Categories</span>
                {filters.categories.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {filters.categories.length}
                  </span>
                )}
              </span>
              {showCategories ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showCategories && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {allCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-2 py-0.5 text-xs rounded capitalize transition-colors ${
                      filters.categories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
