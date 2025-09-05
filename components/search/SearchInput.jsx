"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./SearchInput.module.scss";
import { FiSearch, FiRefreshCw, FiRepeat } from "react-icons/fi";

const SearchInput = ({ onSearch, isLoading }) => {
  const [prompt, setPrompt] = useState("");
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSearch(prompt);
    }
  };

  // Focus the input automatically on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <motion.div 
          className={styles.inputWrapper}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}
            placeholder="Technical decision-maker at mid-sized SaaS company, previously worked at a Mag7 company..."
            className={styles.searchInput}
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            className={styles.searchButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading}
            aria-label="Search"
          >
            <div className={styles.searchButtonContent}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiRefreshCw size={22} />
                </motion.div>
              ) : (
                <FiSearch size={22} />
              )}
            </div>
          </motion.button>
        </motion.div>
      </form>
      
      <AnimatePresence>
        {prompt && !isLoading && (
          <motion.div
            className={styles.replayButton}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={() => {
                if (prompt.trim()) {
                  onSearch(prompt);
                }
              }}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiRepeat />
              Replay Search
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
