"use client";

import { useState, useEffect, useCallback } from "react";
import { WordResult } from "@/lib/textComparison";

export interface AttemptRecord {
  id: string;
  score: number;
  completedAt: number;
  wordResults: WordResult[] | null;
}

export interface PassageEntry {
  passageId: string;
  passage: string;
  level: string;
  topic: string;
  latestScore: number | null;
  bestScore: number | null;
  completedAt: number;
  attempts: AttemptRecord[];
}

export function usePassageHistory() {
  const [history, setHistory] = useState<PassageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/passages/history")
      .then((r) => r.json())
      .then((data) => {
        const entries: PassageEntry[] = (data.history ?? []).map(
          (h: {
            passageId: string;
            passage: string;
            level: string;
            topic: string;
            latestScore: number;
            bestScore: number;
            completedAt: number;
            attempts: { id: string; score: number; completedAt: number; resultJson: string | null }[];
          }) => ({
            passageId: h.passageId,
            passage: h.passage,
            level: h.level,
            topic: h.topic,
            latestScore: h.latestScore,
            bestScore: h.bestScore,
            completedAt: h.completedAt,
            attempts: h.attempts.map((a) => ({
              id: a.id,
              score: a.score,
              completedAt: a.completedAt,
              wordResults: a.resultJson ? JSON.parse(a.resultJson) : null,
            })),
          })
        );
        setHistory(entries);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistically prepend a new passage entry (before DB write completes)
  const addPassage = useCallback(
    (passage: string, level: string, topic: string, passageId: string): string => {
      const entry: PassageEntry = {
        passageId,
        passage,
        level,
        topic,
        latestScore: null,
        bestScore: null,
        completedAt: Date.now(),
        attempts: [],
      };
      setHistory((prev) => {
        // If already exists (pool hit), move to top
        const filtered = prev.filter((e) => e.passageId !== passageId);
        return [entry, ...filtered];
      });
      return passageId;
    },
    []
  );

  // Update score on existing entry and add attempt record
  const updateScore = useCallback(
    (passageId: string, score: number, wordResults: WordResult[] | null) => {
      setHistory((prev) =>
        prev.map((e) => {
          if (e.passageId !== passageId) return e;
          const newAttempt: AttemptRecord = {
            id: `local-${Date.now()}`,
            score,
            completedAt: Date.now(),
            wordResults,
          };
          return {
            ...e,
            latestScore: score,
            bestScore: Math.max(e.bestScore ?? 0, score),
            completedAt: Date.now(),
            attempts: [newAttempt, ...e.attempts],
          };
        })
      );
      // Refresh from DB after a short delay to get real attempt id
      setTimeout(refresh, 1000);
    },
    [refresh]
  );

  const removePassage = useCallback((passageId: string) => {
    setHistory((prev) => prev.filter((e) => e.passageId !== passageId));
  }, []);

  return { history, loading, addPassage, updateScore, removePassage, refresh };
}
