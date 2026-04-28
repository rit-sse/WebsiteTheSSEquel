"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PhotoEventOption, Filters } from "./PhotosClient";

export function PhotoFilters({
  filters,
  onChange,
  onApply,
  onClear,
  isFiltered,
  events,
  years,
  categories,
  disabled,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  onClear: () => void;
  isFiltered: boolean;
  events: PhotoEventOption[];
  years: number[];
  categories: string[];
  disabled?: boolean;
}) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,150px)_minmax(0,180px)_minmax(0,160px)_auto_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(event) => update("q", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onApply();
          }}
          placeholder="Search captions, alt text, or filenames…"
          className="pl-9"
          disabled={disabled}
        />
      </div>

      <Select
        value={filters.year || "all"}
        onValueChange={(value) => update("year", value === "all" ? "" : value)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="All years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All years</SelectItem>
          {years
            .slice()
            .sort((a, b) => b - a)
            .map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.eventId || "all"}
        onValueChange={(value) =>
          update("eventId", value === "all" ? "" : value)
        }
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="All events" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All events</SelectItem>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category || "all"}
        onValueChange={(value) =>
          update("category", value === "all" ? "" : value)
        }
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              <span className="capitalize">{category}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onApply} disabled={disabled}>
        <SlidersHorizontal className="size-4" />
        Apply
      </Button>

      {isFiltered && (
        <Button
          type="button"
          variant="neutral"
          onClick={onClear}
          disabled={disabled}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
