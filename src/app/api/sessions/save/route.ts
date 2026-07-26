import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, type, level, topic, score, passageId, resultJson } = await req.json();

    // READING: create ReadingAttempt linked to a Passage
    if (type === "READING" && passageId) {
      const attempt = await prisma.readingAttempt.create({
        data: {
          userId: session.user.id,
          passageId,
          score: score ?? 0,
          resultJson: resultJson ?? null,
        },
      });
      return NextResponse.json({ attemptId: attempt.id });
    }

    // CONVERSATION: update existing ExerciseSession
    if (sessionId) {
      await prisma.exerciseSession.update({
        where: { id: sessionId, userId: session.user.id },
        data: { score, completedAt: new Date() },
      });
      return NextResponse.json({ sessionId });
    }

    // READING fallback without passageId (legacy)
    const exerciseSession = await prisma.exerciseSession.create({
      data: {
        userId: session.user.id,
        type: type ?? "READING",
        level,
        topic,
        score,
        completedAt: new Date(),
      },
    });
    return NextResponse.json({ sessionId: exerciseSession.id });
  } catch {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
