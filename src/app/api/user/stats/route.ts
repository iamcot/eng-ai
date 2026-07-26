import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { estimateCost } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usages = await prisma.tokenUsage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalInput = usages.reduce((s, u) => s + u.inputTokens, 0);
  const totalOutput = usages.reduce((s, u) => s + u.outputTokens, 0);
  const totalCost = estimateCost(totalInput, totalOutput);
  const totalCalls = usages.length;

  // Breakdown per endpoint
  const byEndpoint: Record<
    string,
    { calls: number; inputTokens: number; outputTokens: number; cost: number }
  > = {};
  for (const u of usages) {
    if (!byEndpoint[u.endpoint]) {
      byEndpoint[u.endpoint] = { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    byEndpoint[u.endpoint].calls++;
    byEndpoint[u.endpoint].inputTokens += u.inputTokens;
    byEndpoint[u.endpoint].outputTokens += u.outputTokens;
    byEndpoint[u.endpoint].cost += estimateCost(u.inputTokens, u.outputTokens);
  }

  return NextResponse.json({
    totalInput,
    totalOutput,
    totalCost,
    totalCalls,
    byEndpoint,
  });
}
