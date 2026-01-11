import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  searchIcons,
  getIcons,
  iconToSvg,
  getCollectionIcons,
  FEATURED_COLLECTIONS,
  type IconifyIcon,
} from '../services/iconService';
import { Button } from './Button';
import { Input } from './Input';
import styles from './IconPicker.module.css';

interface IconPickerProps {
  onInsertIcon: (svg: string, name: string) => void;
  size: number;
  color: string | null;
}

interface DisplayIcon {
  prefix: string;
  name: string;
  fullName: string;
  icon: IconifyIcon | null;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  onInsertIcon,
  size,
  color,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('lucide');
  const [icons, setIcons] = useState<DisplayIcon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load initial icons from selected collection
  const loadCollectionIcons = useCallback(async (prefix: string) => {
    // "all" is not a real collection - show empty state with prompt to search
    if (prefix === 'all') {
      setIcons([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const iconNames = await getCollectionIcons(prefix, 60);
      const iconData = await getIcons(prefix, iconNames);

      const displayIcons: DisplayIcon[] = iconNames.map((name) => ({
        prefix,
        name,
        fullName: prefix + ':' + name,
        icon: iconData[name] || null,
      }));

      setIcons(displayIcons.filter((i) => i.icon !== null));
    } catch (err) {
      setError('Failed to load icons');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search icons
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadCollectionIcons(selectedCollection);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchOptions: { prefix?: string; limit?: number } = {
        limit: 60,
      };
      
      // Only set prefix if a specific collection is selected (not "all")
      if (selectedCollection !== 'all') {
        searchOptions.prefix = selectedCollection;
      }

      const results = await searchIcons(searchQuery, searchOptions);

      // Group by prefix and fetch icon data
      const byPrefix: Record<string, string[]> = {};
      for (const fullName of results.icons) {
        const parts = fullName.split(':');
        const prefix = parts[0];
        const name = parts[1];
        if (!byPrefix[prefix]) {
          byPrefix[prefix] = [];
        }
        byPrefix[prefix].push(name);
      }

      const displayIcons: DisplayIcon[] = [];

      const prefixes = Object.keys(byPrefix);
      for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        const names = byPrefix[prefix];
        const iconData = await getIcons(prefix, names);
        for (let j = 0; j < names.length; j++) {
          const name = names[j];
          if (iconData[name]) {
            displayIcons.push({
              prefix,
              name,
              fullName: prefix + ':' + name,
              icon: iconData[name],
            });
          }
        }
      }

      setIcons(displayIcons);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCollection, loadCollectionIcons]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Load icons when collection changes
  useEffect(() => {
    if (!query) {
      loadCollectionIcons(selectedCollection);
    } else {
      // Re-run search with new collection filter
      performSearch(query);
    }
  }, [selectedCollection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle icon click
  const handleIconClick = (displayIcon: DisplayIcon) => {
    if (!displayIcon.icon) return;

    const svg = iconToSvg(displayIcon.icon, {
      size,
      color: color || undefined,
    });

    onInsertIcon(svg, displayIcon.fullName);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <Input
          label="Search icons"
          id="icon-search"
          type="text"
          placeholder="Search for icons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.collections}>
        <button
          className={styles.collectionTab + (selectedCollection === 'all' ? ' ' + styles.active : '')}
          onClick={() => setSelectedCollection('all')}
        >
          All
        </button>
        {FEATURED_COLLECTIONS.map((col) => (
          <button
            key={col.prefix}
            className={styles.collectionTab + (selectedCollection === col.prefix ? ' ' + styles.active : '')}
            onClick={() => setSelectedCollection(col.prefix)}
          >
            {col.title}
          </button>
        ))}
      </div>

      <div className={styles.iconGrid}>
        {isLoading && (
          <div className={styles.loading}>Loading icons...</div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {!isLoading && !error && icons.length === 0 && selectedCollection === 'all' && !query && (
          <div className={styles.empty}>
            Type to search across all icon libraries
          </div>
        )}

        {!isLoading && !error && icons.length === 0 && (selectedCollection !== 'all' || query) && (
          <div className={styles.empty}>No icons found</div>
        )}

        {!isLoading &&
          icons.map((displayIcon) => (
            <button
              key={displayIcon.fullName}
              className={styles.iconButton}
              onClick={() => handleIconClick(displayIcon)}
              title={displayIcon.fullName}
            >
              {displayIcon.icon && (
                <span
                  className={styles.iconPreview}
                  dangerouslySetInnerHTML={{
                    __html: iconToSvg(displayIcon.icon, {
                      size: 24,
                      color: 'currentColor',
                    }),
                  }}
                />
              )}
              <span className={styles.iconName}>{displayIcon.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
};