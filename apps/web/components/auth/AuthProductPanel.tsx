"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import MiniWorkspacePreview from "./MiniWorkspacePreview";

export default function AuthProductPanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden bg-stone-50 px-10 py-10 lg:flex lg:flex-col">
      {/* Subtle background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#e7e5e4_1px,transparent_1px),linear-gradient(to_bottom,#e7e5e4_1px,transparent_1px)] [background-size:48px_48px]"
      />

      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl"
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Brand Header */}
        <Link
          href="/"
          className="group flex w-fit items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 rounded-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            V
          </span>

          <span className="text-[15px] font-semibold tracking-tight text-stone-900">
            VaultGraph
          </span>
        </Link>

        {/* Center Content */}
        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mx-auto w-full max-w-[620px]"
          >
            {/* Tagline */}
            <p className="mb-4 font-mono text-[11px] font-semibold tracking-widest text-stone-600 uppercase">
              Your knowledge, together.
            </p>

            {/* Main Heading */}
            <h2 className="max-w-[570px] text-[clamp(40px,4.5vw,62px)] font-semibold leading-[1.02] tracking-tight text-stone-900">
              A quiet place for everything you know.
            </h2>

            {/* Subheading Description */}
            <p className="mt-5 max-w-[470px] text-[15.5px] leading-relaxed font-normal text-stone-700">
              Write ideas, connect pages, organize projects, and build a
              workspace that grows with you.
            </p>

            {/* Dynamic Preview Widget */}
            <div className="mt-8">
              <MiniWorkspacePreview />
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[12px] font-medium text-stone-600">
          <span>Write · Connect · Discover</span>
          <span>VaultGraph © 2026</span>
        </div>
      </div>
    </section>
  );
}
