import Link from "next/link";
import { FolderGit2, Settings, KeyRound } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Navigation
          </p>
          <nav className="space-y-1">
            {/* 1. Repository Menu */}
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-colors"
            >
              <FolderGit2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span>Repositories</span>
            </Link>

            {/* 2. Access Token Menu */}
            <Link
              href="/access-token"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-colors"
            >
              <KeyRound className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span>Access Token</span>
            </Link>

            {/* 3. Settings / Profile Menu */}
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-colors"
            >
              <Settings className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span>Profile Settings</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
