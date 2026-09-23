"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

const pages = [
  { icon: "📋", title: "Product Ideas" },
  { icon: "🧠", title: "Things to Learn" },
  { icon: "🚀", title: "Projects" },
  { icon: "📝", title: "Meeting Notes" },
];

export default function MiniWorkspacePreview() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.7,
        delay: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative mt-8 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-900/5"
    >
      {/* Window */}
      <div className="flex h-10 items-center border-b border-stone-100 bg-stone-50/50 px-4">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        </div>

        <div className="mx-auto flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
          <span>My Workspace</span>
          <span className="text-stone-300">/</span>
          <span>Home</span>
        </div>
      </div>

      <div className="grid grid-cols-[145px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-stone-100 bg-stone-50/30 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
              Workspace
            </span>

            <Plus size={12} className="text-stone-400" />
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-[10px] text-stone-400">
            <Search size={11} />
            <span>Search</span>
          </div>

          <div className="space-y-0.5">
            {pages.map((page, index) => (
              <motion.div
                key={page.title}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5 + index * 0.08,
                }}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${
                  index === 0
                    ? "bg-stone-200/60 font-semibold text-stone-900"
                    : "font-medium text-stone-600"
                }`}
              >
                <span className="text-[11px]">{page.icon}</span>
                <span>{page.title}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 border-t border-stone-100 pt-3">
            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-stone-500">
              <Folder size={11} />
              <span>Archive</span>
            </div>
          </div>
        </aside>

        {/* Document */}
        <div className="min-w-0 p-6 sm:p-7">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.65,
              duration: 0.4,
            }}
          >
            <div className="mb-3 text-[10px] font-medium text-stone-400">
              My Workspace
            </div>

            <div className="mb-3 text-[25px]">📋</div>

            <h3 className="text-[21px] font-semibold tracking-tight text-stone-900">
              Product Ideas
            </h3>

            <p className="mt-2 max-w-[350px] text-[11px] leading-relaxed text-stone-500">
              A place to capture ideas before they disappear.
            </p>
          </motion.div>

          {/* Content */}
          <div className="mt-6 space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-2 text-[11px] text-stone-700"
            >
              <span className="text-stone-400">→</span>
              Build a workspace that feels like your own.
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
              className="flex items-center gap-2 text-[11px] text-stone-700"
            >
              <span className="text-stone-400">→</span>
              Turn scattered thoughts into connected pages.
            </motion.div>
          </div>

          {/* Nested page */}
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            transition={{
              delay: 1.25,
              duration: 0.45,
            }}
            className="mt-6 overflow-hidden rounded-lg border border-stone-200/60 bg-stone-50 px-3.5 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-stone-400" />

                <span className="text-[10px] font-medium text-stone-700">
                  Next steps
                </span>
              </div>

              <MoreHorizontal size={12} className="text-stone-400" />
            </div>

            <p className="mt-2 text-[9px] leading-4 text-stone-400">
              Ideas become pages. Pages become your workspace.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
