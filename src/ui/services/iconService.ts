export interface IconifyIcon {
  prefix: string;
  name: string;
  width: number;
  height: number;
  body: string;  // SVG path content (without <svg> wrapper)
}

export interface IconSearchResult {
  icons: string[];  // Format: "prefix:name"
  total: number;
}

export interface IconCollection {
  prefix: string;
  title: string;
  total: number;
  category?: string;
}

const API_BASE = 'https://api.iconify.design';

// Popular icon collections to feature
export const FEATURED_COLLECTIONS = [
  { prefix: 'lucide', title: 'Lucide' },
  { prefix: 'heroicons', title: 'Heroicons' },
  { prefix: 'mdi', title: 'Material Design Icons' },
  { prefix: 'tabler', title: 'Tabler Icons' },
  { prefix: 'ph', title: 'Phosphor Icons' },
  { prefix: 'ri', title: 'Remix Icon' },
  { prefix: 'carbon', title: 'Carbon Icons' },
  { prefix: 'fluent', title: 'Fluent UI Icons' },
];

/**
 * Search for icons across all collections or within a specific one
 */
export async function searchIcons(
  query: string,
  options: {
    prefix?: string;
    limit?: number;
  } = {}
): Promise<IconSearchResult> {
  const { prefix, limit = 64 } = options;
  
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
  });
  
  if (prefix) {
    params.set('prefix', prefix);
  }

  const response = await fetch(`${API_BASE}/search?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to search icons');
  }

  return response.json();
}

/**
 * Get full icon data including SVG body
 */
export async function getIcon(prefix: string, name: string): Promise<IconifyIcon> {
  const response = await fetch(`${API_BASE}/${prefix}/${name}.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch icon: ${prefix}:${name}`);
  }

  const data = await response.json();
  
  return {
    prefix,
    name,
    width: data.width || 24,
    height: data.height || 24,
    body: data.body,
  };
}

/**
 * Get multiple icons at once (more efficient)
 */
export async function getIcons(
  prefix: string,
  names: string[]
): Promise<Record<string, IconifyIcon>> {
  const response = await fetch(
    `${API_BASE}/${prefix}.json?icons=${names.join(',')}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch icons');
  }

  const data = await response.json();
  const result: Record<string, IconifyIcon> = {};

  for (const name of names) {
    if (data.icons[name]) {
      result[name] = {
        prefix,
        name,
        width: data.icons[name].width || data.width || 24,
        height: data.icons[name].height || data.height || 24,
        body: data.icons[name].body,
      };
    }
  }

  return result;
}

/**
 * Convert Iconify icon data to a complete SVG string
 */
export function iconToSvg(
  icon: IconifyIcon,
  options: { size?: number; color?: string } = {}
): string {
  const { size = 24, color } = options;
  
  // Calculate viewBox dimensions
  const viewBox = `0 0 ${icon.width} ${icon.height}`;
  
  // Apply color if specified (replace currentColor)
  let body = icon.body;
  if (color) {
    body = body.replace(/currentColor/g, color);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`;
}

/**
 * Get icons from a specific collection
 */
export async function getCollectionIcons(
  prefix: string,
  limit = 100
): Promise<string[]> {
  const response = await fetch(`${API_BASE}/collection?prefix=${prefix}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch collection');
  }

  const data = await response.json();
  
  // Return uncategorized icons or flatten categories
  if (data.uncategorized) {
    return data.uncategorized.slice(0, limit);
  }
  
  // Flatten categorized icons
  const allIcons: string[] = [];
  if (data.categories) {
    for (const category of Object.values(data.categories) as string[][]) {
      allIcons.push(...category);
    }
  }
  
  return allIcons.slice(0, limit);
}