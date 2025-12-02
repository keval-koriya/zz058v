import { useChannels } from './hooks/useChannels';
import { Filters } from './components/Filters';
import { ChannelsTable } from './components/ChannelsTable';
import { ErrorState } from './components/ErrorState';
import { RefreshCw, Youtube } from 'lucide-react';

function App() {
  const {
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
    pageSize,
  } = useChannels();

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Channel Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">YouTube channel insights</p>
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
        {/* Filters */}
        <Filters
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
          allCategories={allCategories}
        />

        {/* Table */}
        <ChannelsTable
          channels={channels}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={updateSort}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          pageSize={pageSize}
        />
      </main>
    </div>
  );
}

export default App;
