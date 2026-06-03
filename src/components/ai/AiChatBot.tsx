import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  Dumbbell,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  AI_UNAVAILABLE_MESSAGE,
  chat,
  suggestClasses,
  suggestWorkout,
  type AISuggestionResponse,
} from "@/api/ai";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const EMPTY_PROMPTS = [
  "Hôm nay tôi nên tập gì?",
  "Gợi ý lớp phù hợp với mục tiêu của tôi",
  "Tôi cần phục hồi sau buổi tập nặng như thế nào?",
];

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${role}`,
    role,
    content,
  };
}

function readSuggestion(data: AISuggestionResponse): string {
  return typeof data?.suggestion === "string" ? data.suggestion.trim() : "";
}

export function AiChatBot() {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("flexfit:open-ai-chat", openChat);
    return () => window.removeEventListener("flexfit:open-ai-chat", openChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  if (role !== "member") {
    return null;
  }

  const appendAssistantMessage = (content: string) => {
    if (!content) {
      throw new Error("AI response is empty");
    }
    setMessages((current) => [...current, createMessage("assistant", content)]);
  };

  const sendChatMessage = async (message: string) => {
    const userMessage = message.trim();
    if (!userMessage || isLoading) return;

    setMessages((current) => [...current, createMessage("user", userMessage)]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const result = await chat({ message: userMessage });
      appendAssistantMessage(result.response?.trim());
    } catch (err) {
      console.error("AI chat failed", err);
      setError(AI_UNAVAILABLE_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const requestSuggestion = async (type: "workout" | "classes") => {
    if (isLoading) return;

    const label = type === "workout" ? "Gợi ý lịch tập cho tôi" : "Gợi ý lớp học phù hợp";
    setMessages((current) => [...current, createMessage("user", label)]);
    setError(null);
    setIsLoading(true);

    try {
      const result = type === "workout" ? await suggestWorkout() : await suggestClasses();
      appendAssistantMessage(readSuggestion(result));
    } catch (err) {
      console.error("AI suggestion failed", err);
      setError(AI_UNAVAILABLE_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendChatMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChatMessage(input);
    }
  };

  return (
    <>
      {isOpen && (
        <section
          className="fixed bottom-24 right-4 z-[70] flex h-[min(680px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-white/10 bg-secondary shadow-2xl shadow-black/50 sm:right-6"
          aria-label="AI Coach chatbot"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white">AI Coach</h2>
                <p className="truncate text-xs text-muted-foreground">Tư vấn lịch tập và lớp học</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng AI Coach"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex gap-2 border-b border-white/10 px-3 py-3">
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="h-9 flex-1 gap-2 rounded-md text-xs"
              onClick={() => void requestSuggestion("workout")}
              disabled={isLoading}
            >
              <Dumbbell className="h-4 w-4" />
              Lịch tập
            </Button>
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="h-9 flex-1 gap-2 rounded-md text-xs"
              onClick={() => void requestSuggestion("classes")}
              disabled={isLoading}
            >
              <CalendarDays className="h-4 w-4" />
              Lớp phù hợp
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-white">Bạn muốn hỏi AI Coach điều gì?</p>
                  <p className="mt-1 text-xs text-muted-foreground">Chọn một gợi ý hoặc nhập câu hỏi của bạn.</p>
                </div>
                <div className="space-y-2">
                  {EMPTY_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-gray-200 transition-colors hover:border-primary/40 hover:text-white disabled:opacity-60"
                      onClick={() => void sendChatMessage(prompt)}
                      disabled={isLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-white/10 bg-black/30 text-gray-100"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI đang trả lời...
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Nhập câu hỏi cho AI Coach..."
                className="max-h-28 min-h-[44px] resize-none rounded-md border-white/10 bg-black/20 text-white"
                disabled={isLoading}
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-md"
                disabled={isLoading || !input.trim()}
                aria-label="Gửi câu hỏi"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      )}

      <Button
        type="button"
        className="fixed bottom-5 right-4 z-[70] h-12 gap-2 rounded-md px-4 shadow-xl shadow-primary/20 sm:right-6"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Đóng AI Coach" : "Mở AI Coach"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        AI Coach
      </Button>
    </>
  );
}
