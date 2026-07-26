import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { Suspense } from "react";
import { RegisteredBanner } from "./RegisteredBanner";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">🎤 EngAI</h1>
          <p className="mt-2 text-sm text-gray-600">
            Practice English speaking with AI
          </p>
        </div>
        <Card>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign in</h2>
          <Suspense>
            <RegisteredBanner />
          </Suspense>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
