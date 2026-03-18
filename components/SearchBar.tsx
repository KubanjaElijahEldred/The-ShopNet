"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchBarInner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      return;
    }

    router.push("/products");
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products..."
        className="search-input"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="search-clear"
          aria-label="Clear search"
        >
          ×
        </button>
      ) : null}
    </form>
  );
}

export function SearchBar() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return <SearchBarInner key={initialQuery} initialQuery={initialQuery} />;
}
