export const THEMES = [
  { id: 'parchment', name: 'Parchment', mode: 'light', description: 'Warm paper & olive green' },
  { id: 'sea-glass', name: 'Sea Glass', mode: 'light', description: 'Cool mist & coastal teal' },
  { id: 'coral-sand', name: 'Coral Sand', mode: 'light', description: 'Soft sand & terracotta' },
  { id: 'midnight-sea', name: 'Midnight Sea', mode: 'dark', description: 'Deep navy & sea blue' },
  { id: 'mangrove', name: 'Mangrove', mode: 'dark', description: 'Forest shadows & sage' },
  { id: 'captains-cabin', name: 'Captain’s Cabin', mode: 'dark', description: 'Dark walnut & warm brass' },
] as const;
export type ThemeId = typeof THEMES[number]['id'];
const STORAGE_KEY = 'caribbean-captain.theme';
export function readTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.find(theme => theme.id === saved)?.id ?? 'parchment';
  } catch { return 'parchment'; }
}
export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--sea').trim();
}
export function rememberTheme(id: ThemeId): boolean {
  try { localStorage.setItem(STORAGE_KEY, id); return true; }
  catch { return false; }
}
