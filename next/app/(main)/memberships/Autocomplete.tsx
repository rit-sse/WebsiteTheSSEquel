"use client";

import { useEffect, useState } from "react";
import { AutocompleteOption } from "./membership";

interface AutocompleteOptionProps {
  option: AutocompleteOption | null;
  onChange: (opt: AutocompleteOption | null) => void;
  placeholder?: string;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [data, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return data;
}

/**
 * UserAutocomplete component — an input that fetches and displays user suggestions as the user types.
 *
 * @param option - Initial selected option (optional).
 * @param onChange - Callback invoked when an option is selected or cleared.
 * @param placeholder - Input placeholder text (defaults to "Search Users...").
 * @returns JSX element rendering the autocomplete input and suggestion list.
 */
export function UserAutocomplete({
  option,
  onChange,
  placeholder = "Search Users...",
}: AutocompleteOptionProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [opts, setOpts] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const locked = Boolean(option);
  const displayedQuery = option?.name ?? query;
  const open = isOpen && opts.length > 0;

  useEffect(() => {
    if (locked) return;

    if (!debounced || debounced.length < 2) {
      return;
    }

    if (option && debounced === option.name) return;

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
      setIsOpen(true);
    })().catch(() => {});
    return () => {
      ac.abort();
      setOpts([]);
      setIsOpen(false);
    };
  }, [option, debounced, locked]);

  function select(opt: AutocompleteOption) {
    onChange(opt);
    setQuery(opt.name);
    setIsOpen(false);
    setOpts([]);
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
      setIsOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <input
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={displayedQuery}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
        onFocus={() => opts.length > 0 && setIsOpen(true)}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
        // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
        role="combobox"
      />
      {open && (
        <ul
          id="user-listbox"
          role="listbox"
          className="
        absolute top-full left-0 right-0 mt-1
        bg-background border border-border rounded-box shadow-lg
        max-h-64 z-[90]
        overflow-y-auto overflow-x-hidden
        flex-nowrap overscroll-contain
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
                    <div className="flex flex-row items-center gap-2">
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
