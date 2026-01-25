"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emailDomain?: string; // e.g., "@g.rit.edu" - required domain for custom emails
  className?: string;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [data, setData] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setData(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return data;
}

/**
 * EmailAutocomplete - an input that searches for existing users while allowing
 * custom email addresses to be typed in.
 * 
 * - Searches users by name or email as user types
 * - Shows matching users in a dropdown
 * - Allows selecting a user (uses their email)
 * - Allows typing a custom email (must end with emailDomain if specified)
 */
export function EmailAutocomplete({
  value,
  onChange,
  placeholder = "Search users or enter email...",
  disabled = false,
  emailDomain = "@g.rit.edu",
  className,
}: EmailAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const debouncedQuery = useDebouncedValue(query, 250);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== query && value) {
      setQuery(value);
      setIsSelected(true);
    }
  }, [value]);

  // Search for users when query changes
  useEffect(() => {
    if (isSelected) return;
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setUsers([]);
      setIsOpen(false);
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/user/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: ac.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data.items ?? []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch {
        // Aborted or error
      }
    })();
    return () => ac.abort();
  }, [debouncedQuery, isSelected]);

  // Build options list: users + custom email option
  const options: { type: "user" | "custom"; user?: UserOption; email: string; label: string }[] = [];
  
  // Add matching users
  users.forEach((user) => {
    options.push({
      type: "user",
      user,
      email: user.email,
      label: `${user.name} (${user.email})`,
    });
  });

  // Add custom email option if valid
  const trimmedQuery = query.trim();
  const isValidCustomEmail = emailDomain
    ? trimmedQuery.endsWith(emailDomain) && trimmedQuery.length > emailDomain.length
    : trimmedQuery.includes("@") && trimmedQuery.includes(".");
  
  // Only show custom option if it's not already in the users list
  const emailAlreadyInList = users.some(
    (u) => u.email.toLowerCase() === trimmedQuery.toLowerCase()
  );
  
  if (isValidCustomEmail && !emailAlreadyInList && !isSelected) {
    options.push({
      type: "custom",
      email: trimmedQuery,
      label: `Use "${trimmedQuery}"`,
    });
  }

  function selectOption(email: string) {
    setQuery(email);
    onChange(email);
    setIsOpen(false);
    setUsers([]);
    setIsSelected(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsSelected(false);
    
    // If the input is cleared or changed, clear the selection
    if (!newValue) {
      onChange("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || options.length === 0) {
      // Allow Enter to select current typed value if it's a valid email
      if (e.key === "Enter" && isValidCustomEmail) {
        e.preventDefault();
        selectOption(trimmedQuery);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (options[highlightedIndex]) {
          selectOption(options[highlightedIndex].email);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "Tab":
        if (options[highlightedIndex]) {
          selectOption(options[highlightedIndex].email);
        }
        break;
    }
  }

  function handleBlur() {
    // Delay to allow click on option
    setTimeout(() => {
      setIsOpen(false);
      // If we have a partial query that's a valid email, use it
      if (!isSelected && isValidCustomEmail) {
        selectOption(trimmedQuery);
      }
    }, 200);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          if (users.length > 0 && !isSelected) {
            setIsOpen(true);
          }
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
        autoComplete="off"
      />
      
      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 z-50 overflow-y-auto"
        >
          {options.map((option, index) => (
            <li
              key={option.type === "user" ? `user-${option.user?.id}` : "custom"}
              role="option"
              aria-selected={index === highlightedIndex}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm",
                index === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option.email);
              }}
            >
              {option.type === "user" ? (
                <div className="flex flex-col">
                  <span className="font-medium">{option.user?.name}</span>
                  <span className="text-xs text-muted-foreground">{option.user?.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>+</span>
                  <span>Invite <span className="font-medium text-foreground">{option.email}</span></span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
