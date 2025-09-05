"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./FilterChips.module.scss";

const FilterChips = ({ parsedFilters }) => {
  if (!parsedFilters) return null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.filtersContainer}
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        {/* Title includes */}
        {parsedFilters.titles_include?.length > 0 && (
          <FilterSection
            title="Title includes"
            items={parsedFilters.titles_include}
            variants={itemVariants}
          />
        )}

        {/* Company size */}
        {parsedFilters.size_buckets?.length > 0 && (
          <FilterSection
            title="Company has"
            items={parsedFilters.size_buckets.map(size => `${size} employees`)}
            variants={itemVariants}
          />
        )}

        {/* Company type */}
        {(parsedFilters.keywords?.some(k => 
          ['saas', 'b2b', 'cloud'].some(term => 
            k.toLowerCase().includes(term)
          )
        )) && (
          <FilterSection
            title="Company type is"
            items={['SaaS', 'B2B', 'Cloud'].filter(type => 
              parsedFilters.keywords.some(k => 
                k.toLowerCase().includes(type.toLowerCase())
              )
            )}
            variants={itemVariants}
          />
        )}

        {/* Previously worked at */}
        {parsedFilters.past_employers?.length > 0 && (
          <FilterSection
            title="Previously worked at"
            items={parsedFilters.past_employers}
            variants={itemVariants}
          />
        )}

        {/* Profile mentions */}
        {parsedFilters.keywords?.length > 0 && (
          <FilterSection
            title="Profile or work description mentions"
            items={parsedFilters.keywords}
            variants={itemVariants}
          />
        )}

        {/* Location */}
        {(parsedFilters.country || parsedFilters.city) && (
          <FilterSection
            title="Location is"
            items={[parsedFilters.city, parsedFilters.country].filter(Boolean)}
            variants={itemVariants}
          />
        )}

        {/* Past seniority */}
        {parsedFilters.seniority?.length > 0 && (
          <FilterSection
            title="Past seniority was"
            items={parsedFilters.seniority.map(s => 
              s === 'cxo/founder' ? 'Founding Team' : 
              s === 'vp' ? 'VP' : 
              s === 'director' ? 'Director' :
              s === 'lead/manager' ? 'Lead/Manager' :
              s
            )}
            variants={itemVariants}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const FilterSection = ({ title, items, variants }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.div className={styles.filterSection} variants={variants}>
      <div className={styles.filterTitle}>{title}</div>
      <div className={styles.chipContainer}>
        {items.map((item, index) => (
          <motion.div 
            key={`${item}-${index}`} 
            className={styles.chip}
            variants={variants}
          >
            {item}
          </motion.div>
        ))}
        {items.length > 3 && (
          <motion.div 
            className={styles.chip + ' ' + styles.moreChip}
            variants={variants}
          >
            {`or ${items.length - 3} others`}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FilterChips;
