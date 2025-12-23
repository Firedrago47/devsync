// /state/tabState.ts
import { create } from 'zustand';
import { TabType } from '@/types/file';

type TabState = {
  tabs: TabType[];
  activeTabId: string | null;
  addTab: (tab: TabType) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setTabs: (tabs: TabType[]) => void;
};

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find((t) => t.path === tab.path);

    if (existingTab) {
      set({ activeTabId: existingTab.id });
    } else {
      set({
        tabs: [...tabs, tab],
        activeTabId: tab.id,
      });
    }
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    const isClosingActive = activeTabId === tabId;

    set({
      tabs: newTabs,
      activeTabId: isClosingActive
        ? newTabs.at(-1)?.id ?? null
        : activeTabId,
    });
  },

  updateTabContent: (tabId, content) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, content } : tab
    );
    set({ tabs: updatedTabs });
  },

  setTabs: (tabs) => {
    set({ tabs });
  },
}));