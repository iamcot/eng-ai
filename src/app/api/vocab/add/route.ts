import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { words }: { words: string[] } = await req.json();
    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: "words array required" }, { status: 400 });
    }

    const clean = [...new Set(
      words.map(w => w.toLowerCase().replace(/[^a-z]/g, "").trim()).filter(Boolean)
    )];

    await Promise.all(
      clean.map(word =>
        prisma.vocabWord.upsert({
          where: { userId_word: { userId: session.user!.id!, word } },
          create: { userId: session.user!.id!, word },
          update: {},
        })
      )
    );

    return NextResponse.json({ added: clean.length });
  } catch {
    return NextResponse.json({ error: "Failed to add words" }, { status: 500 });
  }
}
