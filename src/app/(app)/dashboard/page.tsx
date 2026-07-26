import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { UsageStats } from "@/components/shared/UsageStats";

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {name}! 👋
        </h1>
        <p className="mt-1 text-gray-600">
          Choose an exercise to practice your English speaking skills.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/reading">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl mb-3">📖</div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reading Practice
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Read a passage aloud and get instant feedback on your
              pronunciation. Words are highlighted as you speak.
            </p>
            <div className="mt-4 text-sm font-medium text-blue-600">
              Start reading →
            </div>
          </Card>
        </Link>

        <Link href="/conversation">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl mb-3">💬</div>
            <h2 className="text-lg font-semibold text-gray-900">
              Conversation Practice
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Have a real conversation with an AI character in various
              scenarios. Practice speaking naturally.
            </p>
            <div className="mt-4 text-sm font-medium text-blue-600">
              Start talking →
            </div>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          📊 API Usage
        </h2>
        <UsageStats />
      </div>
    </div>
  );
}
