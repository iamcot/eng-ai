import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 50;

  const where = {
    userId: session.user.id,
    ...(search ? { word: { contains: search } } : {}),
  };

  const [words, total] = await Promise.all([
    prisma.vocabWord.findMany({
      where,
      orderBy: { nextReviewAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.vocabWord.count({ where }),
  ]);

  return NextResponse.json({ words, total, page, pageSize });
}
