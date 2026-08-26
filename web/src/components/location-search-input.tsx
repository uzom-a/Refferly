"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface LocationOption {
  id: string;
  label: string;
  city: string;
  area: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchInputProps {
  label: string;
  selected: LocationOption | null;
  onSelect(option: LocationOption): void;
  placeholder?: string;
  required?: boolean;
}

export function LocationSearchInput({
  label,
  selected,
  onSelect,
  placeholder = "Search by address, city, or landmark",
  required,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(selected?.label ?? "");
  const [results, setResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(selected?.label ?? "");
  }, [selected]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          results?: LocationOption[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to search locations.");
        }

        setResults(payload.results ?? []);
        setOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to search locations.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const hint = useMemo(() => {
    if (!selected) return null;
    const parts = [selected.area, selected.city, selected.state, selected.country].filter(
      (part) => part && part.length > 0,
    );
    return parts.join(", ");
  }, [selected]);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-800">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(false);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && (
          <div className="absolute right-3 top-2 text-[10px] text-neutral-400">Searching...</div>
        )}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute inset-y-0 right-1 my-auto h-7 px-2 text-[11px] text-neutral-500"
          >
            Clear
          </Button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {hint && <p className="text-[11px] text-neutral-600">Selected: {hint}</p>}
      {open && results.length > 0 && (
        <div className="z-10 mt-1 max-h-60 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onSelect(result);
                setOpen(false);
                setResults([]);
                setQuery(result.label);
              }}
              className="w-full border-b border-neutral-100 px-3 py-2 text-left text-xs hover:bg-neutral-50"
            >
              <div className="font-medium text-neutral-900">{result.area}</div>
              <div className="text-[11px] text-neutral-600">{result.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


