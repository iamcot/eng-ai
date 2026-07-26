import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { LEVELS } from "@/lib/prompts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  let preferredTopics: string[] = [];
  try {
    preferredTopics = JSON.parse(settings.preferredTopics);
  } catch {
    preferredTopics = [];
  }

  return NextResponse.json({
    currentLevel: settings.currentLevel,
    preferredTopics,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentLevel, preferredTopics } = body;

    const data: Record<string, unknown> = {};

    if (currentLevel !== undefined) {
      if (!LEVELS.includes(currentLevel)) {
        return NextResponse.json({ error: "Invalid level" }, { status: 400 });
      }
      data.currentLevel = currentLevel;
    }

    if (preferredTopics !== undefined) {
      if (!Array.isArray(preferredTopics)) {
        return NextResponse.json(
          { error: "preferredTopics must be an array" },
          { status: 400 }
        );
      }
      data.preferredTopics = JSON.stringify(preferredTopics);
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return NextResponse.json({
      currentLevel: settings.currentLevel,
      preferredTopics: JSON.parse(settings.preferredTopics),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
