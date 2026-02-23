"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string  // For hiding columns on mobile etc.
  isPrimary?: boolean  // Rendered as card header on mobile
  isAction?: boolean   // Rendered at card bottom on mobile
  isFullWidth?: boolean // On mobile, label stacks above content instead of side-by-side
  mobileHidden?: boolean // Exclude from mobile card layout entirely
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  title?: string
  titleExtra?: React.ReactNode
  searchPlaceholder?: string
  searchFields?: (keyof T)[]
  onAdd?: () => void
  addLabel?: string
  isLoading?: boolean
  emptyMessage?: string
  expandedContent?: (item: T) => React.ReactNode
  enablePagination?: boolean
  pageSizeOptions?: number[]
  defaultPageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  title,
  titleExtra,
  searchPlaceholder = "Search...",
  searchFields,
  onAdd,
  addLabel = "Add New",
  isLoading = false,
  emptyMessage = "No data found",
  expandedContent,
  enablePagination = false,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)
  const isMobile = useIsMobile()

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter((item) => {
      const fieldsToSearch = searchFields || (Object.keys(item) as (keyof T)[])
      return fieldsToSearch.some((field) => {
        const value = item[field]
        if (value == null) return false
        return String(value).toLowerCase().includes(query)
      })
    })
  }, [data, searchQuery, searchFields])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortDirection === "asc" ? 1 : -1
      if (bVal == null) return sortDirection === "asc" ? -1 : 1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortDirection])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery, sortKey, sortDirection, pageSize, data.length])

  React.useEffect(() => {
    if (!enablePagination) return
    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [enablePagination, page, pageSize, sortedData.length])

  const totalPages = enablePagination
    ? Math.max(1, Math.ceil(sortedData.length / pageSize))
    : 1
  const startIdx = enablePagination ? (page - 1) * pageSize : 0
  const paginatedData = enablePagination
    ? sortedData.slice(startIdx, startIdx + pageSize)
    : sortedData
  const startCount = sortedData.length === 0 ? 0 : startIdx + 1
  const endCount = sortedData.length === 0 ? 0 : Math.min(startIdx + paginatedData.length, sortedData.length)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  // Derive column roles for mobile card layout
  const primaryColumn = columns.find(c => c.isPrimary) || columns[0]
  const actionColumn = columns.find(c => c.isAction) || columns.find(c => c.header === "")
  const detailColumns = columns.filter(c => c !== primaryColumn && c !== actionColumn && !c.mobileHidden)

  const renderCellValue = (column: Column<T>, item: T) => {
    return column.render ? column.render(item) : String(item[column.key] ?? "")
  }

  return (
    <Card depth={1} className="w-full max-w-full overflow-hidden">
      {/* Title bar */}
      {title && (
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          {titleExtra}
        </div>
      )}
      
      {/* Content area */}
      <div className="p-3 sm:p-4">
        {/* Header with search and add button */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          {onAdd && (
            <Button variant="accent" onClick={onAdd} className="w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4 mr-2" />
              {addLabel}
            </Button>
          )}
        </div>

        {/* Mobile card layout */}
        {isMobile ? (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">{emptyMessage}</div>
            ) : (
              paginatedData.map((item) => (
                <div
                  key={String(item[keyField])}
                  className="rounded-lg border border-border bg-surface-3 p-3 space-y-2"
                >
                  {/* Primary value - card header */}
                  <div className="font-medium text-sm">
                    {renderCellValue(primaryColumn, item)}
                  </div>

                  {/* Detail rows */}
                  {detailColumns.length > 0 && (
                    <div className="border-t border-border/50 pt-2 space-y-2">
                      {detailColumns.map((column) =>
                        column.isFullWidth ? (
                          <div key={column.key} className="space-y-1">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {column.header}
                            </span>
                            <div className="text-sm">{renderCellValue(column, item)}</div>
                          </div>
                        ) : (
                          <div key={column.key} className="space-y-0.5">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {column.header}
                            </span>
                            <div className="text-sm">{renderCellValue(column, item)}</div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Actions - card footer */}
                  {actionColumn && (
                    <div className="border-t border-border/50 pt-2">
                      {renderCellValue(actionColumn, item)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop table layout */
          <div className="rounded-md border border-border overflow-x-auto w-full bg-surface-3">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`text-xs sm:text-sm font-semibold ${column.sortable ? "cursor-pointer select-none" : ""} ${column.className || ""}`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        {column.header}
                        {column.sortable && sortKey === column.key && (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          )
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <div className="text-muted-foreground text-sm">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <div className="text-muted-foreground text-sm">{emptyMessage}</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const expanded = expandedContent ? expandedContent(item) : null
                    return (
                      <React.Fragment key={String(item[keyField])}>
                        <TableRow>
                          {columns.map((column) => (
                            <TableCell key={column.key} className={`text-xs sm:text-sm ${column.className || ""}`}>
                              {column.render
                                ? column.render(item)
                                : String(item[column.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                        {expanded && (
                          <TableRow>
                            <TableCell colSpan={columns.length}>
                              {expanded}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer with count */}
        <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm text-muted-foreground">
          <div>
            {startCount}-{endCount} of {sortedData.length} items
            {searchQuery && ` (filtered from ${data.length})`}
          </div>
          {enablePagination && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const nextPageSize = Number(e.target.value)
                    setPageSize(nextPageSize)
                    setPage(1)
                  }}
                  className="h-9 min-w-[4.5rem] rounded-md border border-border bg-background pl-2 pr-7 text-xs sm:text-sm"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="h-8 px-2"
              >
                Prev
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
