"use client";

import { useEffect, useState } from "react";
import { AutocompleteOption } from "./options";

interface AutocompleteOptionProps {
  option: AutocompleteOption | null;
  onChange: (opt: AutocompleteOption | null) => void;
  placeholder?: string;
}

function useDebouncedValue<T>(v: T, delay: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), delay);
    return () => clearTimeout(t);
  }, [v, delay]);

  return d;
}

export function UserAutocomplete({
  option,
  onChange,
  placeholder = "Search Users...",
}: AutocompleteOptionProps) {
  const [query, setQuery] = useState(option?.name ?? "");
  const debounced = useDebouncedValue(query, 250);
  const [opts, setOpts] = useState<AutocompleteOption[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  useEffect(() => {
    if (debounced.length < 2) {
      setOpts([]);
      setOpen(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      const res = await fetch(
        `/api/user/search?q=${encodeURIComponent(debounced)}`,
        { signal: ac.signal }
      );
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setOpts(data.items ?? []);
      setOpen(true);
    })().catch(() => {});
    return () => ac.abort();
  }, [debounced]);

  function select(opt: AutocompleteOption) {
    onChange(opt);
    setQuery(opt.name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || opts.length == 0) return;
    if (e.key == "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, opts.length - 1));
    } else if (e.key == "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key == "Enter") {
      e.preventDefault();
      select(opts[hi]);
    } else if (e.key == "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full">
            <input
                className="input input-bordered w-full"
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                setQuery(e.target.value);
                onChange(null);
                }}
                onFocus={() => opts.length > 0 && setOpen(true)}
                onKeyDown={onKeyDown}
                aria-autocomplete="list"
                aria-expanded={open}
                role="combobox"
            />
      {open && (
        <ul 
        id="user-listbox"
        role="listbox"
        className="
        absolute top-full left-0 right-0 mt-1
        bg-base-100 border border-base-300 rounded-box shadow-lg
        max-h-64 overflow-auto z-[90]
        menu p-2
        "
        >
          {opts.length === 0 ? (
            <li className="disabled">
              <a>No matches</a>
            </li>
          ) : (
            opts.map((o, i) => (
              <li key={o.id}>
                <a
                  className={i === hi ? "active" : ""}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(o);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="ml-auto text-xs opacity-60">ID: {o.id}</span>
                    <div className="flex flex-col">
                      <span className="text-sm">{o.name}</span>
                      {o.email && (
                        <span className="text-xs opacity-60">{o.email}</span>
                      )}
                    </div>
                  </div>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
