import { useState, useEffect, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import styles from "../styles/MessageSearch.module.css";

const MessageSearch = ({
  messages,
  searchQuery,
  onQueryChange,
  onScrollTo,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevMessages, setPrevMessages] = useState(messages);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results = [];
    messages.forEach((msg, index) => {
      if (
        msg.message &&
        msg.message.toLowerCase().includes(query) &&
        !msg.isDeleted
      ) {
        results.push({ id: msg._id, index });
      }
    });

    return results;
  }, [searchQuery, messages]);

  if (searchQuery !== prevSearchQuery || messages !== prevMessages) {
    setPrevSearchQuery(searchQuery);
    setPrevMessages(messages);
    if (!searchQuery.trim() || searchResults.length === 0) {
      setCurrentSearchIndex(-1);
    } else {
      setCurrentSearchIndex(0);
    }
  }

  useEffect(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      onScrollTo(searchResults[0].id);
    }
  }, [searchQuery, messages, searchResults, onScrollTo]);

  const handleSearchChange = (e) => {
    onQueryChange(e.target.value);
  };

  const handleSearchNext = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => {
        const nextIndex = (prev + 1) % searchResults.length;
        onScrollTo(searchResults[nextIndex].id);
        return nextIndex;
      });
    }
  };

  const handleSearchPrev = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => {
        const prevIndex =
          (prev - 1 + searchResults.length) % searchResults.length;
        onScrollTo(searchResults[prevIndex].id);
        return prevIndex;
      });
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    onQueryChange("");
    setCurrentSearchIndex(-1);
  };

  if (!isSearchOpen) {
    return (
      <button
        onClick={() => setIsSearchOpen(true)}
        className={styles.openSearchBtn}
        title="Search messages"
        type="button"
      >
        <Search className={styles.searchIcon} size={18} />
      </button>
    );
  }

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        autoFocus
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearchChange}
        className={styles.searchInput}
      />
      {searchResults.length > 0 && (
        <span className={styles.searchCount}>
          {currentSearchIndex + 1} of {searchResults.length}
        </span>
      )}
      {searchResults.length === 0 && searchQuery.trim() !== "" && (
        <span className={styles.searchCount}>0 of 0</span>
      )}
      <div className={styles.searchNavButtons}>
        <button
          onClick={handleSearchPrev}
          className={styles.iconBtn}
          disabled={searchResults.length === 0}
          title="Previous match"
          type="button"
        >
          <ChevronUp className={styles.upIcon} size={16} />
        </button>
        <button
          onClick={handleSearchNext}
          className={styles.iconBtn}
          disabled={searchResults.length === 0}
          title="Next match"
          type="button"
        >
          <ChevronDown className={styles.downIcon} size={16} />
        </button>
        <button
          onClick={closeSearch}
          className={`${styles.iconBtn} ${styles.closeBtn}`}
          title="Close search"
          type="button"
        >
          <X className={styles.closeIcon} size={16} />
        </button>
      </div>
    </div>
  );
};

export default MessageSearch;
