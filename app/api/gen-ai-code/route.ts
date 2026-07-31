import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import { db } from "@/lib/prisma";
import { FileData, Message } from "@/types/workspace";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { detectPromptInjection } from "@arcjet/next";
import { aj } from "@/lib/arcjet";

function trimHistory(messages: Message[]): Message[] {
    if (messages.length <= 10) return messages;
    return [messages[0], ...messages.slice(-8)];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Free/cheap models that work for new API keys.
 * Note: gemini-2.5-* is blocked for new users; gemini-3.5-flash is often 503 (high demand).
 * Verified working: 3.5-flash-lite, 3.1-flash-lite, flash-lite-latest.
 */
const GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
] as const;
const CONNECT_TIMEOUT_MS = 20_000;

function errorText(err: unknown): string {
    if (err && typeof err === "object" && "message" in err) {
        return String((err as { message: unknown }).message);
    }
    return String(err);
}

function isTransientGeminiError(err: unknown): boolean {
    return /503|UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED|429|timed out|timeout|ECONNRESET|fetch failed/i.test(
        errorText(err),
    );
}

function friendlyGeminiError(err: unknown): string {
    if (isTransientGeminiError(err)) {
        return "The AI model is busy right now. Please try again in a moment.";
    }
    const msg = errorText(err);
    // Avoid dumping huge nested JSON error blobs into the toast
    if (msg.length > 180 || msg.includes('"error"')) {
        return "AI request failed. Please try again.";
    }
    return msg || "Something went wrong. Please try again.";
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error(`Timed out connecting to ${label}`)),
                    ms,
                );
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function openGeminiStream(
    contents: ReturnType<typeof buildContents>,
    onStatus: (message: string) => void,
) {
    let lastError: unknown;

    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                onStatus(
                    attempt === 0
                        ? `Connecting (${model})...`
                        : `Retrying (${model})...`,
                );
                return await withTimeout(
                    ai.models.generateContentStream({
                        model,
                        contents,
                        config: {
                            systemInstruction: SYSTEM_PROMPT,
                            // lower temp = more reliable JSON for portfolio demos
                            temperature: 0.4,
                            maxOutputTokens: 65536,
                            responseMimeType: "application/json",
                        },
                    }),
                    CONNECT_TIMEOUT_MS,
                    model,
                );
            } catch (err) {
                lastError = err;
                console.error(`[gen-ai-code] ${model} attempt ${attempt + 1}:`, err);
                if (!isTransientGeminiError(err)) throw err;
                await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("The AI model is busy right now. Please try again in a moment.");
}

function buildContents(messages: Message[], fileData: FileData | null) {
    const trimmed = trimHistory(messages);

    return trimmed.map((msg, idx) => {
        const role = msg.role === "assistant" ? "model" : "user";

        if (msg.role === "user") {
            const parts: object[] = [];

            let text = msg.content;

            if (msg.imageUrl) {
                text = `[The user has attached an image. Use this URL directly in the generated app where relevant (as img src, background-image, etc.): ${msg.imageUrl}]\n\n${text}`;
            }

            const isLast = idx === trimmed.length - 1;
            if (isLast && fileData) {
                text +=
                    "\n\nCurrent project files for context:\n" +
                    JSON.stringify(fileData, null, 2);
            }

            parts.push({ text });
            return { role, parts };
        }

        return { role, parts: [{ text: msg.content }] };
    });
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert React developer. Your job is to generate complete, working React applications based on user prompts.

RULES:
1. Respond with ONE valid JSON object only. No markdown fences, no commentary outside JSON.
2. The JSON must match this exact shape:
{
  "assistantMessage": "<brief explanation of what you built/changed>",
  "title": "<short 2-4 word title for the app, e.g. 'Todo List App'>",
  "files": {
    "/App.js": { "code": "<full file content>" },
    "/components/SomeComponent.js": { "code": "<full file content>" }
  },
  "dependencies": {
    "some-package": "latest"
  }
}
3. Use React (functional components + hooks). Do NOT use TypeScript in generated files.
4. Use Tailwind CSS for all styling. Do not use CSS modules or inline styles unless absolutely necessary.
5. The entry point must always be /App.js and must export a default component.
6. All imports must reference files you include in "files" or packages in "dependencies".
7. Do not include react, react-dom, or tailwindcss in "dependencies" — they are always available.
8. When modifying existing code, include ALL files (both changed and unchanged) in "files".
9. Keep apps compact: prefer 1–6 files, mock data instead of real scraping/APIs, no huge datasets.
10. JSON must be strictly valid: escape quotes/newlines inside "code" strings correctly. Do not truncate mid-string.
11. If the user attaches an image, use it as a design reference and match the layout/style as closely as possible.`;

type GeneratedApp = {
    assistantMessage: string;
    title?: string;
    files: Record<string, { code: string }>;
    dependencies: Record<string, string>;
};

function extractThoughtLabel(text: string): string | null {
    const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);
    if (boldMatch) return boldMatch[1].trim();

    const sentence = text.split(/[.\n]/)[0].trim();
    if (sentence.length >= 8 && sentence.length <= 80) return sentence;

    return null;
}

/** Parse model output that is usually JSON but sometimes fenced/truncated/messy. */
function parseAiJson(raw: string): GeneratedApp {
    let text = raw.trim();
    if (!text) throw new Error("empty");

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) text = fenced[1].trim();

    const attempts = [text];
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
        attempts.push(text.slice(start, end + 1));
    }

    let lastErr: unknown;
    for (const candidate of attempts) {
        for (const variant of [
            candidate,
            // common LLM JSON slip: trailing commas
            candidate.replace(/,\s*([\]}])/g, "$1"),
        ]) {
            try {
                const parsed = JSON.parse(variant) as Record<string, unknown>;
                if (!parsed || typeof parsed !== "object") continue;
                if (!parsed.files || typeof parsed.files !== "object") {
                    throw new Error("missing files");
                }
                return {
                    assistantMessage: String(
                        parsed.assistantMessage ?? "Done.",
                    ),
                    title:
                        typeof parsed.title === "string"
                            ? parsed.title
                            : undefined,
                    files: parsed.files as Record<string, { code: string }>,
                    dependencies:
                        (parsed.dependencies as Record<string, string>) ?? {},
                };
            } catch (err) {
                lastErr = err;
            }
        }
    }

    throw lastErr instanceof Error ? lastErr : new Error("invalid json");
}

function sseEvent(type: string, payload: unknown): string {
    return `data: ${JSON.stringify({ type, ...(payload as object) })}\n\n`;
}

async function validateDependencies(
    deps: Record<string, string>,
): Promise<Record<string, string>> {
    const valid: Record<string, string> = {};

    await Promise.all(
        Object.entries(deps).map(async ([pkg, version]) => {
            try {
                const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
                    signal: AbortSignal.timeout(1500),
                });
                if (res.ok) valid[pkg] = version;
            } catch {

            }
        }),
    );
    return valid;
}

export async function POST(request: NextRequest) {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, messages, fileData } = body as {
        workspaceId: string | null;
        messages: Message[];
        fileData: FileData | null;
    };

    if (!messages?.length) {
        return Response.json({ message: "No messages provided" }, { status: 400 });
    }

    const lastUserMessage =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const decision = await aj.protect(request, {
        requested: 1,
        userId: clerkId,
        detectPromptInjectionMessage: lastUserMessage,
    });
    if (decision.isDenied()) {
        return Response.json(
            { message: decision.reason?.type ?? "Request blocked" },
            { status: 429 },
        );
    }

    // User.id is a cuid; Clerk's id lives on clerkId (see actions/workspace.ts)
    const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true, credits: true },
    });

    if (!user)
        return Response.json({ message: "User not found" }, { status: 404 });
    if (user.credits < CREDIT_COST_PER_GENERATION) {
        return Response.json(
            { message: "Insufficient credits" },
            { status: 402 },
        );
    }

    const userId = user.id;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const enqueue = (chunk: string) =>
                controller.enqueue(encoder.encode(chunk));

            try {
                if (!process.env.GEMINI_API_KEY) {
                    throw new Error("GEMINI_API_KEY is not configured on the server.");
                }

                const contents = buildContents(messages, fileData);
                const onStatus = (message: string) =>
                    enqueue(sseEvent("status", { message }));

                async function collectModelJson(
                    streamContents: ReturnType<typeof buildContents>,
                    attemptLabel: string,
                ): Promise<GeneratedApp> {
                    const geminiStream = await openGeminiStream(
                        streamContents,
                        onStatus,
                    );

                    enqueue(
                        sseEvent("status", {
                            message:
                                attemptLabel === "retry"
                                    ? "Retrying generation..."
                                    : "Generating code...",
                        }),
                    );

                    let accumulated = "";
                    let lastEmitTime = 0;
                    let sawText = false;
                    let finishReason: string | undefined;

                    for await (const chunk of geminiStream) {
                        const candidate = chunk.candidates?.[0];
                        if (candidate?.finishReason) {
                            finishReason = String(candidate.finishReason);
                        }

                        const parts = candidate?.content?.parts ?? [];
                        let chunkText = "";

                        for (const part of parts) {
                            if (!part.text) continue;

                            if (part.thought) {
                                const now = Date.now();
                                if (now - lastEmitTime > 600) {
                                    const label = extractThoughtLabel(part.text);
                                    if (label) {
                                        enqueue(
                                            sseEvent("status", { message: label }),
                                        );
                                        lastEmitTime = now;
                                    }
                                }
                                continue;
                            }

                            chunkText += part.text;
                        }

                        // Some SDK chunks only expose text via the helper field
                        if (!chunkText && typeof chunk.text === "string") {
                            chunkText = chunk.text;
                        }

                        if (chunkText) {
                            accumulated += chunkText;
                            if (!sawText) {
                                sawText = true;
                                enqueue(
                                    sseEvent("status", {
                                        message: "Writing files...",
                                    }),
                                );
                            }
                        }
                    }

                    if (!accumulated.trim()) {
                        throw new Error(
                            "AI returned an empty response. Please try again.",
                        );
                    }

                    if (
                        finishReason &&
                        /MAX_TOKENS|LENGTH/i.test(finishReason)
                    ) {
                        console.error(
                            "[gen-ai-code] truncated response:",
                            finishReason,
                            "len=",
                            accumulated.length,
                        );
                        throw new Error(
                            "AI response was cut off (too long). Try a simpler prompt.",
                        );
                    }

                    try {
                        return parseAiJson(accumulated);
                    } catch (err) {
                        console.error(
                            "[gen-ai-code] JSON parse failed:",
                            err,
                            "len=",
                            accumulated.length,
                            "head=",
                            accumulated.slice(0, 200),
                            "tail=",
                            accumulated.slice(-200),
                        );
                        throw new Error("INVALID_JSON");
                    }
                }

                let parsed: GeneratedApp;
                try {
                    parsed = await collectModelJson(contents, "first");
                } catch (firstErr) {
                    const retriable =
                        firstErr instanceof Error &&
                        (firstErr.message === "INVALID_JSON" ||
                            firstErr.message.includes("cut off"));

                    if (!retriable) throw firstErr;

                    // One automatic retry with a stricter reminder + smaller app
                    try {
                        const retryContents = [
                            ...contents,
                            {
                                role: "user" as const,
                                parts: [
                                    {
                                        text: "Your previous response was invalid or truncated JSON. Reply again with a smaller app (max 4 files, mock data only) as a single valid JSON object matching the schema. No markdown.",
                                    },
                                ],
                            },
                        ];
                        parsed = await collectModelJson(
                            retryContents as ReturnType<typeof buildContents>,
                            "retry",
                        );
                    } catch (retryErr) {
                        if (
                            retryErr instanceof Error &&
                            retryErr.message === "INVALID_JSON"
                        ) {
                            throw new Error(
                                "AI returned invalid JSON twice. Please try a simpler prompt.",
                            );
                        }
                        throw retryErr;
                    }
                }

                const {
                    assistantMessage,
                    title: aiTitle,
                    files,
                    dependencies,
                } = parsed;

                enqueue(sseEvent("status", { message: "Validating packages..." }));
                const validatedDeps = await validateDependencies(dependencies ?? {});
                const newFileData: FileData = {
                    files,
                    dependencies: validatedDeps,
                    title: aiTitle,
                };

                enqueue(sseEvent("status", { message: "Saving..." }));

                const lastUserMsg = messages[messages.length - 1];
                const updatedMessages: Message[] = [
                    ...messages,
                    { role: "assistant", content: assistantMessage },
                ];

                const workspace = await db.$transaction(async (tx) => {
                    const ws = workspaceId
                        ? await tx.workspace.update({
                            where: { id: workspaceId, userId },
                            data: {
                                messages: updatedMessages as never,
                                fileData: newFileData as never,
                            },
                        })
                        : await tx.workspace.create({
                            data: {
                                userId,
                                title: aiTitle ?? lastUserMsg.content.slice(0, 80),
                                messages: updatedMessages as never,
                                fileData: newFileData as never,
                            },
                        });

                    await tx.user.update({
                        where: { id: userId },
                        data: { credits: { decrement: CREDIT_COST_PER_GENERATION } },
                    });

                    return ws;
                }, { timeout: 200000 });

                const updatedUser = await db.user.findUnique({
                    where: { id: userId },
                    select: { credits: true },
                });

                enqueue(
                    sseEvent("done", {
                        workspaceId: workspace.id,
                        assistantMessage,
                        fileData: newFileData,
                        creditsRemaining:
                            updatedUser?.credits ?? user.credits - CREDIT_COST_PER_GENERATION,
                    }),
                );
            } catch (err) {
                console.error("[gen-ai-code] stream error:", err);
                enqueue(
                    sseEvent("error", {
                        message: friendlyGeminiError(err),
                    }),
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel fluid, 300s timeout for long generation