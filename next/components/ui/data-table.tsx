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

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string  // For hiding columns on mobile etc.
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
  expandedContent
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  return (
    <Card depth={2} className="w-full max-w-full overflow-hidden">
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

        {/* Table - scrollable on mobile */}
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
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="text-muted-foreground text-sm">{emptyMessage}</div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item) => {
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

        {/* Footer with count */}
        <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
          {sortedData.length} of {data.length} items
          {searchQuery && ` (filtered)`}
        </div>
      </div>
    </Card>
  )
}
