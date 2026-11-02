import { ref, onMounted, onUnmounted } from 'vue';
import { storageService } from '../services/storageService.js';
import { STORAGE_KEYS, THEMES } from '../constants/extension.js';

export function useTheme() {
  const currentTheme = ref(THEMES.SYSTEM);
  const isDarkActive = ref(false);

  let mediaQuery = null;
  let removeStorageListener = null;

  const applyTheme = (theme) => {
    currentTheme.value = theme;
    let effectiveDark = false;

    if (theme === THEMES.DARK) {
      effectiveDark = true;
    } else if (theme === THEMES.LIGHT) {
      effectiveDark = false;
    } else {
      // System default
      effectiveDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    isDarkActive.value = effectiveDark;
    if (effectiveDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = async (newTheme) => {
    applyTheme(newTheme);
    await storageService.set(STORAGE_KEYS.THEME, newTheme);
  };

  const handleSystemThemeChange = (e) => {
    if (currentTheme.value === THEMES.SYSTEM) {
      applyTheme(THEMES.SYSTEM);
    }
  };

  onMounted(async () => {
    const savedTheme = await storageService.get(STORAGE_KEYS.THEME, THEMES.SYSTEM);
    applyTheme(savedTheme);

    // Watch system changes
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    // Watch storage changes from other tabs/options page
    removeStorageListener = storageService.onChanged((changes) => {
      if (changes[STORAGE_KEYS.THEME]) {
        applyTheme(changes[STORAGE_KEYS.THEME].newValue);
      }
    });
  });

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    if (removeStorageListener) {
      removeStorageListener();
    }
  });

  return {
    currentTheme,
    isDarkActive,
    setTheme,
    THEMES
  };
}

