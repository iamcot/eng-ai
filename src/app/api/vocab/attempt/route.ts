import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applySM2 } from "@/lib/spacedRepetition";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { wordId, correct }: { wordId: string; correct: boolean } = await req.json();
    if (!wordId || typeof correct !== "boolean") {
      return NextResponse.json({ error: "wordId and correct required" }, { status: 400 });
    }

    const vocabWord = await prisma.vocabWord.findFirst({
      where: { id: wordId, userId: session.user.id },
    });
    if (!vocabWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const { newInterval, newEaseFactor, nextReviewAt } = applySM2(
      correct,
      vocabWord.interval,
      vocabWord.easeFactor
    );

    await Promise.all([
      prisma.vocabWord.update({
        where: { id: wordId },
        data: { interval: newInterval, easeFactor: newEaseFactor, nextReviewAt },
      }),
      prisma.vocabAttempt.create({
        data: { wordId, correct },
      }),
    ]);

    return NextResponse.json({ newInterval, nextReviewAt });
  } catch {
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }
}
