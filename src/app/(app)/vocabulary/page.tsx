"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { FlashCard } from "@/components/vocabulary/FlashCard";
import { WordDetailSheet } from "@/components/vocabulary/WordDetailSheet";
import { BrowserSupportCheck } from "@/components/shared/BrowserSupport";

interface VocabWord {
  id: string;
  word: string;
  exampleSentence: string | null;
  interval: number;
  easeFactor: number;
  nextReviewAt: string;
  addedAt: string;
  _count?: { attempts: number };
}

interface Stats {
  total: number;
  dueCount: number;
  mastered: number;
  due: VocabWord[];
}

interface WordList {
  words: VocabWord[];
  total: number;
}

function formatReviewDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
}

function isMastered(w: VocabWord) { return w.interval >= 14; }

export default function VocabularyPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [practicing, setPracticing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [userLevel, setUserLevel] = useState("B1");

  const handleAttempt = useCallback((wordId: string, correct: boolean) => {
    // Update interval in local list optimistically
    setWordList(prev => prev ? {
      ...prev,
      words: prev.words.map(w => w.id === wordId
        ? { ...w, interval: correct ? Math.round(w.interval * 2.5) : 1 }
        : w
      ),
    } : prev);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [dueRes, listRes, settingsRes] = await Promise.all([
      fetch("/api/vocab/due"),
      fetch(`/api/vocab/list?q=${encodeURIComponent(search)}`),
      fetch("/api/user/settings"),
    ]);
    const [dueData, listData, settingsData] = await Promise.all([
      dueRes.json(), listRes.json(), settingsRes.json(),
    ]);
    setStats(dueData);
    setWordList(listData);
    setUserLevel(settingsData.currentLevel ?? "B1");
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  if (practicing && stats?.due.length) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">📚 Practice</h1>
          <Button variant="ghost" size="sm" onClick={() => { setPracticing(false); loadData(); }}>
            ✕ Stop
          </Button>
        </div>
        <BrowserSupportCheck>
          <FlashCard
            words={stats.due}
            userLevel={userLevel}
            onComplete={() => { setPracticing(false); loadData(); }}
          />
        </BrowserSupportCheck>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Vocabulary</h1>
          <p className="mt-1 text-gray-600">Words collected from your reading practice.</p>
        </div>
        {stats && stats.dueCount > 0 && (
          <Button onClick={() => setPracticing(true)} size="lg">
            ▶ Practice {stats.dueCount} due
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500"><Spinner /><span>Loading…</span></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total words</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.dueCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Due today</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.mastered ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Mastered</p>
            </Card>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search words…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Word list */}
          {!wordList?.words.length ? (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div>
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500">
                  No words yet. Words you mispronounce during reading practice will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">Word</th>
                    <th className="px-4 py-2 font-medium">Example</th>
                    <th className="px-4 py-2 font-medium text-right">Interval</th>
                    <th className="px-4 py-2 font-medium text-right">Next review</th>
                  </tr>
                </thead>
                <tbody>
                  {wordList.words.map(w => (
                    <tr
                      key={w.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedWord(w)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{w.word}</span>
                          {isMastered(w) && <span className="text-xs text-green-600">✓ mastered</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 italic max-w-[300px] truncate">
                        {w.exampleSentence ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{w.interval}d</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-medium ${new Date(w.nextReviewAt) <= new Date() ? "text-blue-600" : "text-gray-400"}`}>
                          {formatReviewDate(w.nextReviewAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(wordList.total > wordList.words.length) && (
                <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                  Showing {wordList.words.length} of {wordList.total} words
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Word detail sheet */}
      {selectedWord && (
        <BrowserSupportCheck>
          <WordDetailSheet
            word={selectedWord}
            userLevel={userLevel}
            onClose={() => setSelectedWord(null)}
            onAttempt={(wordId, correct) => {
              handleAttempt(wordId, correct);
              setSelectedWord(null);
            }}
          />
        </BrowserSupportCheck>
      )}
    </div>
  );
}
