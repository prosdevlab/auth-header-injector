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
    const updateCurrentTab = async () => {
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
        console.error('[Panel] Failed to get current tab:', error);
        setTab({ url: null, title: null, isRestricted: true });
      } finally {
        setLoading(false);
      }
    };

    // Get initial tab
    updateCurrentTab();

    // Listen for tab activation (switching between tabs)
    const handleTabActivated = () => {
      updateCurrentTab();
    };

    // Listen for tab updates (URL changes in current tab)
    const handleTabUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.url || changeInfo.status === 'complete') {
        updateCurrentTab();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Cleanup listeners
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, []);

  return { tab, loading };
}
