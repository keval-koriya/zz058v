import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { Channel } from '../types/channel';
import type { SortField, SortDirection } from '../lib/firebase';
import { formatNumber, formatCurrency, formatDuration, formatAge } from '../lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ChannelsTableProps {
  channels: Channel[];
  loading?: boolean;
  // Server-side sorting
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField, direction: SortDirection) => void;
  // Server-side pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  pageSize: number;
}

const columnHelper = createColumnHelper<Channel>();

// Map column IDs to sort fields
const sortableFields: Record<string, SortField> = {
  subscribers: 'subscribers',
  avgMonthlyRevenue: 'avgMonthlyRevenue',
  rpm: 'rpm',
  avgViewPerVideo: 'avgViewPerVideo',
  totalViews: 'totalViews',
  numOfUploads: 'numOfUploads',
  daysSinceStart: 'daysSinceStart',
  outlierScore: 'outlierScore',
};

export function ChannelsTable({
  channels,
  loading,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  totalCount,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  pageSize,
}: ChannelsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Channel',
        size: 240,
        enableSorting: false,
        cell: (info) => {
          const channel = info.row.original;
          return (
            <div className="flex items-center gap-3 pr-2">
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="h-8 w-8 rounded-full object-cover shrink-0 bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/32?text=?';
                }}
              />
              <div className="min-w-0 flex-1">
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {channel.title}
                  <ExternalLink className="h-3 w-3 inline ml-1 opacity-40" />
                </a>
                {channel.categories && channel.categories.length > 0 && (
                  <p className="text-xs text-gray-400 truncate">
                    {channel.categories.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('subscribers', {
        header: 'Subscribers',
        size: 95,
        cell: (info) => formatNumber(info.getValue()),
      }),
      columnHelper.accessor('avgMonthlyRevenue', {
        header: 'Monthly Rev',
        size: 100,
        cell: (info) => (
          <span className="text-green-600">{formatCurrency(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('rpm', {
        header: 'RPM',
        size: 70,
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('avgViewPerVideo', {
        header: 'Avg Views',
        size: 90,
        cell: (info) => formatNumber(info.getValue()),
      }),
      columnHelper.accessor('totalViews', {
        header: 'Total Views',
        size: 95,
        cell: (info) => formatNumber(info.getValue()),
      }),
      columnHelper.accessor('numOfUploads', {
        header: 'Uploads',
        size: 70,
        cell: (info) => info.getValue().toLocaleString(),
      }),
      columnHelper.accessor('avgVideoLength', {
        header: 'Avg Length',
        size: 90,
        enableSorting: false,
        cell: (info) => formatDuration(info.getValue()),
      }),
      columnHelper.accessor('quality', {
        header: 'Quality',
        size: 70,
        enableSorting: false,
        cell: (info) => {
          const q = info.getValue();
          const colors: Record<string, string> = {
            high: 'text-green-600',
            mid: 'text-yellow-600',
            low: 'text-gray-500',
          };
          return (
            <span className={`font-medium capitalize ${colors[q] || colors.low}`}>
              {q}
            </span>
          );
        },
      }),
      columnHelper.accessor('isMonetized', {
        header: 'Monetized',
        size: 80,
        enableSorting: false,
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-gray-400'}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
      }),
      columnHelper.accessor('isFaceless', {
        header: 'Faceless',
        size: 70,
        enableSorting: false,
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-gray-400'}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
      }),
      columnHelper.accessor('daysSinceStart', {
        header: 'Age',
        size: 75,
        cell: (info) => formatAge(info.getValue()),
      }),
      columnHelper.accessor('outlierScore', {
        header: 'Outlier',
        size: 60,
        cell: (info) => {
          const score = info.getValue();
          const color =
            score > 0.7
              ? 'text-green-600'
              : score > 0.4
              ? 'text-yellow-600'
              : 'text-gray-400';
          return <span className={color}>{score.toFixed(2)}</span>;
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: channels,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // We handle sorting on server
    manualPagination: true, // We handle pagination on server
  });

  // Handle column header click for sorting
  const handleSort = (columnId: string) => {
    const field = sortableFields[columnId];
    if (!field) return;

    if (sortField === field) {
      // Toggle direction
      onSort(field, sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // New field, default to desc
      onSort(field, 'desc');
    }
  };

  if (loading && channels.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading channels...</p>
      </div>
    );
  }

  if (!loading && channels.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No channels found</p>
      </div>
    );
  }

  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(startItem + channels.length - 1, totalCount);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      <div className="overflow-x-auto relative">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '1200px' }}>
          <colgroup>
            {table.getAllColumns().map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const isSortable = sortableFields[header.id];
                  const isCurrentSort = sortField === header.id;
                  
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            isSortable
                              ? 'flex items-center gap-1 cursor-pointer select-none hover:text-gray-900'
                              : ''
                          }
                          onClick={() => isSortable && handleSort(header.id)}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {isSortable && (
                            <span className="shrink-0 text-gray-400">
                              {isCurrentSort && sortDirection === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : isCurrentSort && sortDirection === 'desc' ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => {
                  // Only truncate the title/channel column
                  const shouldTruncate = cell.column.id === 'title';
                  return (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-4 py-2.5 text-gray-700"
                    >
                      <div className={shouldTruncate ? 'truncate' : 'whitespace-nowrap'}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600">
          {totalCount > 0 ? (
            <>
              Showing <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalCount.toLocaleString()}</span> channels
            </>
          ) : (
            'No channels found'
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage || loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4 inline -mt-0.5" /> Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage || loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4 inline -mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
