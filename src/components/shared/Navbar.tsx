"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface UsageSummary {
  totalInput: number;
  totalOutput: number;
  totalCost: number;
}

function UsageBadge() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((d) =>
        setUsage({
          totalInput: d.totalInput,
          totalOutput: d.totalOutput,
          totalCost: d.totalCost,
        })
      )
      .catch(() => {});
  }, []);

  if (!usage || (usage.totalInput === 0 && usage.totalOutput === 0)) return null;

  return (
    <div
      className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 cursor-default"
      title="API usage this account"
    >
      <span title="Input tokens">↑ {(usage.totalInput / 1000).toFixed(1)}k</span>
      <span className="text-gray-300">|</span>
      <span title="Output tokens">↓ {(usage.totalOutput / 1000).toFixed(1)}k</span>
      <span className="text-gray-300">|</span>
      <span className="font-medium text-blue-600" title="Estimated cost">
        ${usage.totalCost.toFixed(4)}
      </span>
    </div>
  );
}

export function Navbar({ username }: { username: string }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Home" },
    { href: "/reading", label: "📖 Reading" },
    { href: "/conversation", label: "💬 Conversation" },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white px-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            🎤 EngAI
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UsageBadge />
          <span className="text-sm text-gray-500 hidden sm:block">
            {username}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
