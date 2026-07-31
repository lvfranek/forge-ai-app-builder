"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CodePanel } from "./CodePanel";
import { FileData, Message, StatusStep, WorkspaceData } from '@/types/workspace';
import ChatPanel from './ChatPanel';
import { MIN_CREDITS_TO_GENERATE } from '@/lib/constants';
import { toast } from 'sonner';

interface WorkspaceClientProps {
    initialPrompt: string | null;
    userCredits: number;
    userId: string;
    userPlan: string;
    workspace: WorkspaceData | null;
}

function parseMessages(raw: unknown): Message[] {
    if (!Array.isArray(raw)) return [];

    return raw.filter(
        (m): m is Message =>
            typeof m === "object" && m !== null && "role" in m && "content" in m,
    );
}

function parseFileData(raw: unknown): FileData | null {
    if (!raw || typeof raw !== "object") return null;

    const f = raw as Record<string, unknown>;

    if (!f.files || !f.dependencies) return null;

    return raw as FileData;
}

const WorkspaceClient = ({ initialPrompt, userCredits, workspace, userId, userPlan }: WorkspaceClientProps) => {
    const [workspaceId, setWorkspaceId] = useState<string | null>(
        workspace?.id ?? null,
    );
    const [messages, setMessages] = useState<Message[]>(
        parseMessages(workspace?.messages),
    );
    const [fileData, setFileData] = useState<FileData | null>(
        parseFileData(workspace?.fileData),
    );

    const [credits, setCredits] = useState(userCredits);

    const [isGenerating, setisGenerating] = useState(false);
    const [statusLog, setStatusLog] = useState<StatusStep[]>([]);

    const messagesRef = useRef<Message[]>(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const fileDataRef = useRef<FileData | null>(fileData);
    useEffect(() => {
        fileDataRef.current = fileData;
    }, [fileData]);

    const workspaceIdRef = useRef<string | null>(workspaceId);
    useEffect(() => {
        workspaceIdRef.current = workspaceId;
    }, [workspaceId]);

    const handleFilePatch = useCallback((patches: FileData) => {
        setFileData(patches);
    }, []);

    const pushStep = (label: string) => {
        setStatusLog((prev) => [
            ...prev.map((s, i) =>
                i === prev.length - 1 ? { ...s, status: "done" as const } : s,
            ),
            { label, status: "running" as const },
        ]);
    };

    const completeSteps = () => {
        setStatusLog((prev) =>
            prev.map((s, i) =>
                i === prev.length - 1 ? { ...s, status: "done" as const } : s,
            ),
        );
    };

    const handleGenerate = useCallback(async (prompt: string, imageUrl?: string) => {
        if (isGenerating) return;
        if (credits < MIN_CREDITS_TO_GENERATE) return;

        const userMessage: Message = {
            role: "user",
            content: prompt,
            ...(imageUrl ? { imageUrl } : {}),
        };

        const currentMessages = messagesRef.current;
        const currentWorkspaceId = workspaceIdRef.current;

        setMessages((prev) => [...prev, userMessage]);
        setisGenerating(true);
        setStatusLog([{ label: "Thinking...", status: "running" }]);

        try {
            const res = await fetch("/api/gen-ai-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspaceId: currentWorkspaceId,
                    userId,
                    messages: [...currentMessages, userMessage],
                    fileData: fileDataRef.current,
                }),
            });

            if (res.status === 402) {
                toast.error("Not enough credits.");
                setMessages((prev) => prev.slice(0, -1));
                return;
            }
            if (res.status === 429) {
                toast.error("Too many requests. Please slow down.");
                setMessages((prev) => prev.slice(0, -1));
                return;
            }
            if (!res.ok || !res.body) {
                let detail = "Generation failed";
                try {
                    const errBody = await res.json();
                    if (errBody?.message) detail = errBody.message;
                } catch {
                    /* ignore non-JSON error bodies */
                }
                throw new Error(detail);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let receivedDone = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    let event: {
                        type: string;
                        message?: string;
                        workspaceId?: string;
                        assistantMessage?: string;
                        fileData?: FileData;
                        creditsRemaining?: number;
                    };

                    try {
                        event = JSON.parse(line.slice(6));
                    } catch {
                        continue;
                    }

                    if (event.type === "status" && event.message) {
                        pushStep(event.message);
                    } else if (event.type === "done") {
                        receivedDone = true;
                        completeSteps();
                        setWorkspaceId(event.workspaceId ?? null);
                        setFileData(event.fileData ?? null);
                        if (typeof event.creditsRemaining === "number") {
                            setCredits(event.creditsRemaining);
                        }
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: "assistant",
                                content: event.assistantMessage ?? "Done.",
                            },
                        ]);
                        if (event.workspaceId) {
                            window.history.replaceState(
                                null,
                                "",
                                `/workspace?id=${event.workspaceId}`,
                            );
                        }
                    } else if (event.type === "error") {
                        throw new Error(
                            event.message ?? "Something went wrong. Please try again.",
                        );
                    }
                }
            }

            if (!receivedDone) {
                throw new Error("Generation ended unexpectedly. Please try again.");
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Something went wrong.",
            );
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setisGenerating(false);
            setStatusLog([]);
        }
    },
        [credits, isGenerating, userId],
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a]">
            {/* Chat Panel - left */}
            <ChatPanel
                messages={messages}
                isGenerating={isGenerating}
                isImproving={false}
                statusLog={statusLog}
                credits={credits}
                initialPrompt={initialPrompt}
                onGenerate={handleGenerate}
                userId={userId}
                workspaceId={workspaceId}
                appTitle={fileData?.title ?? workspace?.title ?? null}
            />
            {/* Code Panel - right */}
            <CodePanel
                fileData={fileData}
                isGenerating={isGenerating}
                statusLog={statusLog}
                onFilePatch={handleFilePatch} />
        </div>
    )
}

export default WorkspaceClient