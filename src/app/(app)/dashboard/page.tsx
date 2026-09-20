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
          Chào mừng trở lại, {name}! 👋
        </h1>
        <p className="mt-1 text-gray-600">
          Chọn bài tập để luyện kỹ năng nói tiếng Anh.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/reading">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl mb-3">📖</div>
            <h2 className="text-lg font-semibold text-gray-900">Luyện đọc</h2>
            <p className="mt-1 text-sm text-gray-600">
              Đọc to đoạn văn và nhận phản hồi tức thì về phát âm. Từng từ được highlight khi bạn đọc.
            </p>
            <div className="mt-4 text-sm font-medium text-blue-600">Bắt đầu đọc →</div>
          </Card>
        </Link>

        <Link href="/conversation">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="text-3xl mb-3">💬</div>
            <h2 className="text-lg font-semibold text-gray-900">Luyện hội thoại</h2>
            <p className="mt-1 text-sm text-gray-600">
              Trò chuyện thật sự với nhân vật AI trong nhiều tình huống. Luyện nói tiếng Anh tự nhiên.
            </p>
            <div className="mt-4 text-sm font-medium text-blue-600">Bắt đầu nói →</div>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 Thống kê API</h2>
        <UsageStats />
      </div>
    </div>
  );
}
