"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiLinkedin, FiMapPin } from "react-icons/fi";
import styles from "./SearchResults.module.scss";

const SearchResults = ({ results, isLoading }) => {
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  if (!results || !results.hits || results.hits.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>No results found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.resultsContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            <th className={styles.nameColumn}>Name</th>
            <th className={styles.linkedInColumn}>LinkedIn</th>
            <th className={styles.emailColumn}>Email</th>
            <th className={styles.phoneColumn}>Phone</th>
            <th className={styles.addressColumn}>Address</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {results.hits.map((candidate, index) => (
              <motion.tr
                key={candidate.document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={styles.resultRow}
              >
                <td className={styles.nameCell}>
                  <div className={styles.avatarNameWrapper}>
                    <div className={styles.avatar}>
                      {candidate.document.first_name?.[0]}
                      {candidate.document.last_name?.[0]}
                    </div>
                    <div className={styles.nameInfo}>
                      <div className={styles.name}>
                        {candidate.document.name_full}
                      </div>
                      <div className={styles.title}>
                        {candidate.document.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.linkedInCell}>
                  {candidate.document.linkedin_url && (
                    <a
                      href={candidate.document.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedInLink}
                    >
                      /{candidate.document.name_full.toLowerCase().replace(/\s+/g, "-")}
                      <span className={styles.copyIcon}>⧉</span>
                    </a>
                  )}
                </td>
                <td className={styles.emailCell}>
                  {/* For demo purposes, generate a fake email */}
                  <div className={styles.emailWrapper}>
                    {candidate.document.first_name?.toLowerCase()}@company.com
                    <span className={styles.copyIcon}>⧉</span>
                  </div>
                </td>
                <td className={styles.phoneCell}>
                  {/* For demo purposes, generate a fake phone number */}
                  <div className={styles.phoneWrapper}>
                    {`(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`}
                    <span className={styles.copyIcon}>⧉</span>
                  </div>
                </td>
                <td className={styles.addressCell}>
                  <div className={styles.addressWrapper}>
                    {candidate.document.city && candidate.document.country ? (
                      <>
                        {`${candidate.document.city}, ${candidate.document.country}`}
                        <span className={styles.copyIcon}>⧉</span>
                      </>
                    ) : candidate.document.city ? (
                      <>
                        {candidate.document.city}
                        <span className={styles.copyIcon}>⧉</span>
                      </>
                    ) : candidate.document.country ? (
                      <>
                        {candidate.document.country}
                        <span className={styles.copyIcon}>⧉</span>
                      </>
                    ) : (
                      "Location not available"
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Pagination */}
      {results.found > results.hits.length && (
        <div className={styles.paginationContainer}>
          <button 
            className={styles.paginationButton} 
            disabled={results.page === 1}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Page {results.page} of {Math.ceil(results.found / results.hits.length)}
          </span>
          <button 
            className={styles.paginationButton}
            disabled={results.page * results.hits.length >= results.found}
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};

const SearchResultsSkeleton = () => {
  return (
    <div className={styles.resultsContainer}>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            <th className={styles.nameColumn}>Name</th>
            <th className={styles.linkedInColumn}>LinkedIn</th>
            <th className={styles.emailColumn}>Email</th>
            <th className={styles.phoneColumn}>Phone</th>
            <th className={styles.addressColumn}>Address</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, index) => (
            <tr key={index} className={styles.resultRow}>
              <td className={styles.nameCell}>
                <div className={styles.avatarNameWrapper}>
                  <div className={`${styles.avatar} ${styles.skeleton}`}></div>
                  <div className={styles.nameInfo}>
                    <div className={`${styles.name} ${styles.skeleton}`}></div>
                    <div className={`${styles.title} ${styles.skeleton}`}></div>
                  </div>
                </div>
              </td>
              <td className={styles.linkedInCell}>
                <div className={`${styles.linkedInLink} ${styles.skeleton}`}></div>
              </td>
              <td className={styles.emailCell}>
                <div className={`${styles.emailWrapper} ${styles.skeleton}`}></div>
              </td>
              <td className={styles.phoneCell}>
                <div className={`${styles.phoneWrapper} ${styles.skeleton}`}></div>
              </td>
              <td className={styles.addressCell}>
                <div className={`${styles.addressWrapper} ${styles.skeleton}`}></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchResults;
