import type { AnswerMap } from "@survey/shared";

const PREFIX = "survey:";

export interface DraftData {
  draftId: string;
  answers: AnswerMap;
  startedAt: string;
  currentSectionId: number;
}

export function saveDraft(draftId: string, data: Omit<DraftData, "draftId">): void {
  try {
    localStorage.setItem(PREFIX + draftId, JSON.stringify({ draftId, ...data }));
  } catch {
    // localStorage unavailable (private mode, full storage, etc.) — fail silently
  }
}

export function loadDraft(draftId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(PREFIX + draftId);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

export function clearDraft(draftId: string): void {
  try {
    localStorage.removeItem(PREFIX + draftId);
  } catch {
    // ignore
  }
}

/** Find any existing draft (returns the first found). */
export function findExistingDraft(): DraftData | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as DraftData;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** Clear ALL survey drafts (for "start fresh" action). */
export function clearAllDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
