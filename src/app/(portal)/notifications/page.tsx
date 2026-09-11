"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PortalNotification } from "@/lib/portal";
import { timeAgo } from "@/lib/portal";
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from "@/lib/api/notifications";
import { Button } from "@/components/ui/controls";

export default function NotificationsPage() {
  const [items, setItems] = useState<PortalNotification[] | null>(null);

  useEffect(() => {
    listNotifications().then(setItems);
  }, []);

  const unread = (items ?? []).filter((item) => !item.readAt).length;

  async function readAll() {
    await markAllRead();
    const now = new Date().toISOString();
    setItems((current) => (current ?? []).map((item) => ({ ...item, readAt: item.readAt ?? now })));
  }

  async function open(item: PortalNotification) {
    if (!item.readAt) {
      await markRead(item.id);
      setItems((current) =>
        (current ?? []).map((entry) =>
          entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry
        )
      );
    }
  }

  async function remove(id: string) {
    await deleteNotification(id);
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            {unread > 0 ? `${unread} unread` : "You are all caught up."}
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 ? (
            <Button variant="secondary" onClick={readAll}>
              Mark all read
            </Button>
          ) : null}
          <Link href="/alerts">
            <Button variant="secondary">Manage alerts</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {items === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-slate-800">No notifications yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Create a job alert and you will be told here the moment a matching opening appears.
            </p>
            <Link href="/alerts" className="mt-4 inline-block text-sm font-medium text-indigo-600">
              Create an alert →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  item.readAt ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50/50"
                }`}
              >
                {!item.readAt ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {item.link ? (
                    <Link
                      href={item.link}
                      onClick={() => open(item)}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-700"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  )}
                  {item.body ? <p className="mt-0.5 text-sm text-slate-600">{item.body}</p> : null}
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(item.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Delete notification"
                  className="shrink-0 rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
