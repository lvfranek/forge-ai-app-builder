"use client";

import { Bot, Code2, Eye, Lock, RefreshCw, Send, Sparkles, User, Plus, CheckCircle2, Clock } from "lucide-react";

export function WorkspaceMockup() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {/* Background glow behind mockup */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[350px] w-[700px] bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-purple-600/15 blur-3xl rounded-full opacity-70" />
      </div>

      {/* Outer Browser Chrome Window */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-2xl overflow-hidden backdrop-blur-xl ring-1 ring-white/10">
        {/* Browser Chrome Header / Navigation Bar */}
        <div className="flex h-11 items-center justify-between border-b border-white/8 bg-[#121215] px-4">
          {/* Traffic Light Window Controls */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57] border border-red-600/40" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e] border border-amber-600/40" />
            <div className="h-3 w-3 rounded-full bg-[#28c840] border border-emerald-600/40" />
          </div>

          {/* URL Bar */}
          <div className="flex items-center justify-center gap-2 rounded-md border border-white/8 bg-[#09090b] px-4 py-1 text-xs text-white/50 font-mono max-w-md w-full mx-4 shadow-inner">
            <Lock className="h-3 w-3 text-emerald-400/80" />
            <span className="text-white/30">https://</span>
            <span className="text-white/80">forge.ai</span>
            <span className="text-white/40">/workspace/kanban-app</span>
          </div>

          {/* Right Header Indicators */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Workspace
            </span>
          </div>
        </div>

        {/* Workspace Split Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          {/* Left Panel: Chat AI Interface */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/8 bg-[#0a0a0c] p-4 flex flex-col justify-between">
            {/* Chat Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-white/90">Forge AI Assistant</span>
                </div>
                <span className="text-[10px] text-white/30 font-mono">v3.5-flash</span>
              </div>

              {/* Chat Messages Stream */}
              <div className="space-y-4">
                {/* User Message Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-blue-600/20 border border-blue-500/30 px-3.5 py-2.5 text-xs text-white/90 leading-relaxed shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1 border-b border-blue-400/10 pb-1">
                      <span className="text-[10px] font-semibold text-blue-300">You</span>
                      <User className="h-3 w-3 text-blue-300/70" />
                    </div>
                    Build a modern Kanban board app with Todo, In Progress, and Done columns, card task skeletons, and tag labels.
                  </div>
                </div>

                {/* AI Response 1 */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[#141418] border border-white/8 px-3.5 py-2.5 text-xs text-white/80 leading-relaxed shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-blue-400 font-medium">
                      <Bot className="h-3 w-3" />
                      <span>AI Builder</span>
                    </div>
                    <p>
                      I&apos;ll craft a sleek dark-themed Kanban Board component with task columns, progress tags, and interactive card states. Setting up components now...
                    </p>
                  </div>
                </div>

                {/* AI Response 2 with Typing Indicator */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[#141418] border border-white/8 px-3.5 py-2.5 text-xs text-white/80 leading-relaxed shadow-sm">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-blue-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3 w-3" />
                        <span>AI Builder</span>
                      </div>
                      <span className="text-[9px] text-white/30">Generating code</span>
                    </div>
                    <p className="mb-2">
                      Rendering column components and compiling Kanban workspace layout...
                    </p>
                    {/* Animated Typing Indicator Dots */}
                    <div className="flex items-center gap-1 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Static Chat Input Box */}
            <div className="mt-4 pt-3 border-t border-white/6">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121216] px-3 py-2 text-xs text-white/30">
                <span>Ask AI to add features or modify code...</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/40 text-white/60">
                  <Send className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Code & Kanban Live Preview */}
          <div className="lg:col-span-8 bg-[#0d0d10] flex flex-col">
            {/* Tab Header Bar */}
            <div className="flex h-10 items-center justify-between border-b border-white/8 bg-[#111115] px-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 border-b-2 border-blue-500 bg-[#16161c] px-3 py-2 text-xs font-medium text-white rounded-t-md">
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                  <span>Preview</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/40 hover:text-white/70">
                  <Code2 className="h-3.5 w-3.5 text-white/30" />
                  <span>KanbanBoard.tsx</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/40 hover:text-white/70">
                  <Code2 className="h-3.5 w-3.5 text-white/30" />
                  <span>App.tsx</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 text-white/30" />
                <span className="text-[10px] font-mono text-white/30">localhost:3000</span>
              </div>
            </div>

            {/* Kanban Preview Area Canvas */}
            <div className="flex-1 p-5 bg-[#09090b] flex flex-col gap-4">
              {/* Kanban App Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/6">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Sprint Dashboard</h3>
                  <p className="text-[11px] text-white/40">AI App Builder Workspace • Roadmap Sprint #12</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                    <Plus className="h-3 w-3 text-white/50" />
                    <span>Add Card</span>
                  </div>
                </div>
              </div>

              {/* 3 Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                {/* Column 1: Todo */}
                <div className="rounded-xl border border-white/6 bg-[#111115] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="text-xs font-medium text-white/80">Todo</span>
                    </div>
                    <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-mono text-white/40">2</span>
                  </div>

                  {/* Card 1 */}
                  <div className="rounded-lg border border-white/8 bg-[#16161c] p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/20">
                        Frontend
                      </span>
                      <Clock className="h-3 w-3 text-white/20" />
                    </div>
                    <p className="text-xs font-medium text-white/80 leading-snug">
                      Design user authentication & Clerk integration
                    </p>
                    <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[10px] text-white/30">
                      <span>2 subtasks</span>
                      <div className="h-4 w-12 rounded bg-white/5" />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-lg border border-white/8 bg-[#16161c] p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold text-purple-400 border border-purple-500/20">
                        Database
                      </span>
                      <Clock className="h-3 w-3 text-white/20" />
                    </div>
                    <p className="text-xs font-medium text-white/80 leading-snug">
                      Setup PostgreSQL schema & Prisma ORM adapters
                    </p>
                    <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[10px] text-white/30">
                      <span>4 subtasks</span>
                      <div className="h-4 w-12 rounded bg-white/5" />
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="rounded-xl border border-white/6 bg-[#111115] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/80">In Progress</span>
                    </div>
                    <span className="rounded-full bg-amber-400/10 text-amber-400 px-2 py-0.5 text-[10px] font-mono border border-amber-400/20">2</span>
                  </div>

                  {/* Card 1 */}
                  <div className="rounded-lg border border-amber-500/20 bg-[#171720] p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                        AI Core
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    <p className="text-xs font-medium text-white/90 leading-snug">
                      Integrate Gemini LLM streaming code generator
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1 overflow-hidden">
                      <div className="bg-amber-400 h-1 rounded-full w-2/3" />
                    </div>
                    <div className="pt-1 border-t border-white/6 flex items-center justify-between text-[10px] text-white/40">
                      <span>In active generation...</span>
                      <div className="h-4 w-10 rounded bg-amber-400/20" />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-lg border border-white/8 bg-[#16161c] p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-pink-500/15 px-2 py-0.5 text-[9px] font-semibold text-pink-400 border border-pink-500/20">
                        UI Design
                      </span>
                      <Clock className="h-3 w-3 text-white/20" />
                    </div>
                    <p className="text-xs font-medium text-white/80 leading-snug">
                      Craft dark mode glassmorphism theme components
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1 overflow-hidden">
                      <div className="bg-pink-400 h-1 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>

                {/* Column 3: Done */}
                <div className="rounded-xl border border-white/6 bg-[#111115] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-medium text-white/80">Done</span>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 text-emerald-400 px-2 py-0.5 text-[10px] font-mono border border-emerald-400/20">2</span>
                  </div>

                  {/* Card 1 */}
                  <div className="rounded-lg border border-white/8 bg-[#16161c] p-3 flex flex-col gap-2 shadow-sm opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-500/15 px-2 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-500/20">
                        Setup
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium text-white/70 line-through leading-snug">
                      Initialize Next.js App Router codebase
                    </p>
                    <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[10px] text-emerald-400/70">
                      <span>Completed</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-lg border border-white/8 bg-[#16161c] p-3 flex flex-col gap-2 shadow-sm opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[9px] font-semibold text-indigo-300 border border-indigo-500/20">
                        Deployment
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium text-white/70 line-through leading-snug">
                      Deploy build to Vercel preview URL
                    </p>
                    <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[10px] text-emerald-400/70">
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
