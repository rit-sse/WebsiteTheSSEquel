"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PhotoEventOption } from "./PhotosClient";

type Filters = {
  year: string;
  eventId: string;
  category: string;
  q: string;
};

export function PhotoFilters({
  filters,
  onChange,
  onApply,
  events,
  years,
  categories,
  disabled,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  events: PhotoEventOption[];
  years: number[];
  categories: string[];
  disabled?: boolean;
}) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border/50 bg-secondary-background p-4 md:grid-cols-[1fr_160px_180px_180px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(event) => update("q", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onApply();
          }}
          placeholder="Search captions or filenames"
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
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All years</SelectItem>
          {years.map((year) => (
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
          <SelectValue placeholder="Event" />
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
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onApply} disabled={disabled}>
        Apply
      </Button>
    </div>
  );
}
