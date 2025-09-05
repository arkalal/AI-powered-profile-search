"use client";

import { useState } from "react";
import SearchInput from "../../components/search/SearchInput";
import FilterChips from "../../components/search/FilterChips";
import SearchResults from "../../components/search/SearchResults";
import styles from "./page.module.scss";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (prompt) => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.results);
      setParsedFilters(data.parsedFilters);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred during search");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Candidate Search</h1>
        <p className={styles.description}>
          Enter your search criteria in natural language, and our AI will find the best matches.
        </p>
        
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />
        
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}
        
        {parsedFilters && (
          <FilterChips parsedFilters={parsedFilters} />
        )}
        
        {(searchResults || isLoading) && (
          <SearchResults results={searchResults} isLoading={isLoading} />
        )}
      </div>
    </main>
  );
}
