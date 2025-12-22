import { useEffect, useState } from 'react';

export interface CurrentTab {
  url: string | null;
  title: string | null;
  isRestricted: boolean;
}

/**
 * Hook to get the current active tab's URL
 */
export function useCurrentTab() {
  const [tab, setTab] = useState<CurrentTab>({
    url: null,
    title: null,
    isRestricted: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!activeTab?.url) {
          setTab({ url: null, title: null, isRestricted: true });
          return;
        }

        // Check if it's a restricted URL (chrome://, edge://, etc.)
        const isRestricted =
          activeTab.url.startsWith('chrome://') ||
          activeTab.url.startsWith('chrome-extension://') ||
          activeTab.url.startsWith('edge://') ||
          activeTab.url.startsWith('about:');

        setTab({
          url: activeTab.url,
          title: activeTab.title || null,
          isRestricted,
        });
      } catch (error) {
        console.error('[Popup] Failed to get current tab:', error);
        setTab({ url: null, title: null, isRestricted: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { tab, loading };
}
