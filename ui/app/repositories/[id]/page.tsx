import React, { Suspense } from "react";
import RepoDetailsClient from "./RepoDetailsClient";

export default function RepositoryDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6">
          <div className="h-6 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
        </div>
      }
    >
      <RepoDetailsClient />
    </Suspense>
  );
}
