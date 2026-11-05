import type { CSSProperties } from 'react';

/* Skeleton shimmer — uses the .skeleton class from index.css */

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/* ── Pre-built page skeletons ─────────────────────────── */

/** Projects grid skeleton */
export function ProjectsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* header */}
      <div className="page-header">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="p-6">
        {/* search */}
        <Skeleton className="h-9 w-48 rounded-xl mb-6" />
        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
              <div className="pt-2 border-t border-gray-100 dark:border-surface-600 flex gap-3">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Backlog list skeleton */
export function BacklogSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* header */}
      <div className="page-header">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      {/* toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-surface-600">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      {/* rows */}
      <div className="flex-1 overflow-hidden">
        {/* sprint section header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-surface-600">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded ml-auto" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-surface-600/50">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
            <Skeleton className="flex-1 h-3 rounded" style={{ maxWidth: `${55 + (i % 4) * 10}%` }} />
            <div className="hidden sm:flex gap-2">
              <Skeleton className="w-12 h-5 rounded-full" />
              <Skeleton className="w-14 h-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Board skeleton */
export function BoardSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="page-header">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {/* sprint bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-surface-600 space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-32 rounded ml-auto" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {/* columns */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 h-full">
          {['To Do', 'In Progress', 'In Review', 'Done'].map((col) => (
            <div key={col} className="flex-1 min-w-56 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              {Array.from({ length: col === 'To Do' ? 3 : col === 'In Progress' ? 2 : 1 }).map((_, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-14 rounded" />
                    <Skeleton className="h-3 w-8 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <div className="flex gap-1.5 pt-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sprints skeleton */
export function SprintsSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="page-header">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* left list */}
        <div className="w-72 shrink-0 border-r border-gray-200 dark:border-surface-600 p-3 space-y-2">
          <Skeleton className="h-3 w-20 rounded mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          ))}
        </div>
        {/* right detail */}
        <div className="flex-1 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
          {/* stats */}
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            ))}
          </div>
          {/* summary card */}
          <div className="card p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
            <Skeleton className="h-3 w-4/6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
