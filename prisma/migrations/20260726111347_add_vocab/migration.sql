-- CreateTable
CREATE TABLE "VocabWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    CONSTRAINT "VocabWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VocabAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wordId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabAttempt_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "VocabWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VocabWord_userId_idx" ON "VocabWord"("userId");

-- CreateIndex
CREATE INDEX "VocabWord_userId_nextReviewAt_idx" ON "VocabWord"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "VocabWord_userId_word_key" ON "VocabWord"("userId", "word");

-- CreateIndex
CREATE INDEX "VocabAttempt_wordId_idx" ON "VocabAttempt"("wordId");
