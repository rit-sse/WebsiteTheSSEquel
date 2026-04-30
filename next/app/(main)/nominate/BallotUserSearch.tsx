"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./nominate.module.scss";

interface UserOption {
  id: number;
  name: string;
  email?: string;
  image?: string | null;
}

interface BallotUserSearchProps {
  /** Currently picked nominee, if any. */
  value: UserOption | null;
  onPick: (user: UserOption) => void;
  onClear: () => void;
  /** Major to display under a picked nominee. Optional. */
  pickedMajor?: string | null;
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [stored, setStored] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setStored(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return stored;
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={styles.searchResultAvatar}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono-stub), monospace",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: "var(--ink)",
      }}
      aria-hidden
    >
      {initials || "??"}
    </div>
  );
}

/**
 * Inline user-search combobox styled as a ballot row stack. Wraps
 * `/api/user/search?q=` (the same endpoint EmailAutocomplete uses) but
 * presents results as ballot rows — name + meta — so it lives inside
 * the page rhythm instead of breaking out into a modal.
 *
 * - Debounced 250ms
 * - Keyboard navigable (↑↓ Enter Escape)
 * - Empty state with "no matches" message after a non-empty query
 */
export default function BallotUserSearch({
  value,
  onPick,
  onClear,
  pickedMajor,
}: BallotUserSearchProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 250);
  const [results, setResults] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) return;
    if (debounced.trim().length < 2) {
      // Stale results are cleared in handleQueryChange when the query
      // shrinks; the effect just bails out when there's nothing to fetch.
      return;
    }
    const ac = new AbortController();
    // The loading flag, results, and "have I searched yet" booleans are
    // all derived from the debounced query — exactly what an effect is
    // for. The lint warning fires on any synchronous setState in an
    // effect body; the React docs allow this pattern when initiating
    // async work, so we suppress it here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/user/search?q=${encodeURIComponent(debounced.trim())}`, {
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        setResults(data.items ?? []);
        setActiveIdx(0);
        setSearched(true);
      })
      .catch(() => {
        /* aborted */
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [debounced, value]);

  function handleQueryChange(next: string) {
    setQuery(next);
    if (next.trim().length < 2) {
      setResults([]);
      setSearched(false);
    }
  }

  if (value) {
    return (
      <div className={styles.nomineePicked}>
        {value.image ? (
          // Avatar images are tiny (32px) and come from arbitrary
          // (S3 / Google) origins — `next/image` would require remote
          // pattern config and a layout shift fix; a plain <img> with
          // explicit dimensions is the right tool here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.image}
            alt=""
            width={36}
            height={36}
            className={styles.searchResultAvatar}
            style={{ borderColor: "var(--paper)" }}
          />
        ) : (
          <Initials name={value.name} />
        )}
        <div>
          <div className={styles.nomineeName}>{value.name}</div>
          <div className={styles.nomineeMeta}>
            {pickedMajor ? `${pickedMajor} · ` : ""}NOMINATED
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
            setResults([]);
            setSearched(false);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={styles.nomineeUnpick}
          aria-label="Pick a different nominee"
        >
          CHANGE
        </button>
      </div>
    );
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIdx];
      if (picked) onPick(picked);
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
    }
  }

  return (
    <div className={styles.searchInputWrap}>
      <label className={styles.searchLabel} htmlFor="nominee-search">
        Type a name or email
      </label>
      <input
        id="nominee-search"
        ref={inputRef}
        type="text"
        autoComplete="off"
        className={styles.searchInput}
        placeholder="e.g. Cayden Pierce"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleKey}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="nominee-search-results"
        aria-activedescendant={
          results[activeIdx] ? `nominee-result-${results[activeIdx].id}` : undefined
        }
      />
      {(results.length > 0 || (searched && !loading)) && (
        <ul
          id="nominee-search-results"
          role="listbox"
          className={styles.searchResults}
        >
          {results.length === 0 && searched && !loading ? (
            <li className={styles.searchEmpty} role="status">
              No SSE members match &ldquo;{query}&rdquo;.
            </li>
          ) : (
            results.map((user, idx) => (
              <li
                id={`nominee-result-${user.id}`}
                key={user.id}
                role="option"
                aria-selected={idx === activeIdx}
                data-active={idx === activeIdx}
                className={styles.searchResult}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(user);
                }}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.searchResultAvatar}
                  />
                ) : (
                  <Initials name={user.name} />
                )}
                <div>
                  <div className={styles.searchResultName}>{user.name}</div>
                  {user.email && (
                    <div className={styles.searchResultMeta}>{user.email}</div>
                  )}
                </div>
                <div className={styles.searchResultStub}>NOMINATE →</div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
