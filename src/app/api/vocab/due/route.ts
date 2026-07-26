import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [due, total] = await Promise.all([
    prisma.vocabWord.findMany({
      where: { userId: session.user.id, nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: "asc" },
      take: 20,
    }),
    prisma.vocabWord.count({ where: { userId: session.user.id } }),
  ]);

  const mastered = await prisma.vocabWord.count({
    where: { userId: session.user.id, interval: { gte: 14 } },
  });

  return NextResponse.json({ due, total, mastered, dueCount: due.length });
}
