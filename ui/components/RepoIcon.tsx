"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FolderGit2 } from "lucide-react";
import { resolveAssetUrl } from "@/lib/api";

interface RepoIconProps {
  src?: string | null;
  name: string;
  size?: "sm" | "lg";
}

export default function RepoIcon({ src, name, size = "sm" }: RepoIconProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const resolvedUrl = resolveAssetUrl(src);
  const showImage = !!resolvedUrl && failedUrl !== resolvedUrl;

  if (size === "lg") {
    return showImage ? (
      <Image
        src={resolvedUrl}
        alt={name}
        width={40}
        height={40}
        unoptimized
        onError={() => setFailedUrl(resolvedUrl)}
        className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
      />
    ) : (
      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
        <FolderGit2 className="w-5 h-5" />
      </div>
    );
  }

  return showImage ? (
    <Image
      src={resolvedUrl}
      alt={name}
      width={24}
      height={24}
      unoptimized
      onError={() => setFailedUrl(resolvedUrl)}
      className="w-6 h-6 rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
    />
  ) : (
    <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
      <FolderGit2 className="w-3.5 h-3.5" />
    </div>
  );
}
