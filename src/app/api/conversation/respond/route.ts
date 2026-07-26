import { auth } from "@/lib/auth";
import { anthropic, AI_MODEL, saveTokenUsage } from "@/lib/anthropic";
import {
  buildConversationSystemPrompt,
  trimConversationHistory,
  type Level,
  LEVELS,
} from "@/lib/prompts";
import { prisma } from "@/lib/db";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ScenarioContext {
  characterName: string;
  characterDescription: string;
  level: string;
  topic: string;
  sessionId: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    const {
      userSpeech,
      conversationHistory,
      scenarioContext,
    }: {
      userSpeech: string;
      conversationHistory: ConversationMessage[];
      scenarioContext: ScenarioContext;
    } = await req.json();

    const { characterName, characterDescription, level, topic, sessionId } =
      scenarioContext;

    if (!LEVELS.includes(level as Level)) {
      return new Response("Invalid level", { status: 400 });
    }

    // Save user turn to DB
    await prisma.conversationTurn.create({
      data: {
        sessionId,
        role: "USER",
        content: userSpeech,
        detectedSpeech: userSpeech,
      },
    });

    const trimmedHistory = trimConversationHistory(conversationHistory, 10);
    const messages: ConversationMessage[] = [
      ...trimmedHistory,
      { role: "user", content: userSpeech },
    ];

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = anthropic.messages.stream({
            model: AI_MODEL,
            max_tokens: 256,
            system: buildConversationSystemPrompt(
              level as Level,
              topic,
              characterName,
              characterDescription
            ),
            messages,
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Get final message for usage stats
          const finalMessage = await anthropicStream.finalMessage();
          await saveTokenUsage(
            userId,
            "conversation/respond",
            finalMessage.usage.input_tokens,
            finalMessage.usage.output_tokens
          );

          // Save assistant response to DB
          await prisma.conversationTurn.create({
            data: { sessionId, role: "ASSISTANT", content: fullResponse },
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Generation failed" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Conversation respond error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
