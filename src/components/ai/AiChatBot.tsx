import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  AlertCircle,
  CalendarDays,
  Dumbbell,
  Send,
  Sparkles,
  X,
  Mic,
  Paperclip,
  RotateCcw,
  PenLine,
  Plus,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBranchesApi, type BranchDto } from "@/api/branches";
import { getAllClassesApi, type ClassDto } from "@/api/classes";
import {
  AI_UNAVAILABLE_MESSAGE,
  chat,
  suggestClasses,
  suggestWorkout,
  type AISuggestionResponse,
} from "@/api/ai";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Maximize2, Minimize2 } from "lucide-react";
import { type SuggestionCardData, type BriefSuggestion, normalizeText, cleanAiText, buildBriefSuggestion } from "@/lib/aiUtils";

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  suggestions?: SuggestionCardData[];
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

const EMPTY_PROMPTS = [
  { id: "workout", icon: Dumbbell, title: "Gợi ý lịch tập", desc: "Phù hợp với mục tiêu của tôi" },
  { id: "classes", icon: CalendarDays, title: "Tìm lớp học", desc: "Gần nhất và phù hợp với tôi" },
  { id: "recovery", icon: RotateCcw, title: "Phục hồi cơ bắp", desc: "Sau buổi tập chân nặng" },
  { id: "nutrition", icon: PenLine, title: "Chế độ dinh dưỡng", desc: "Tăng cơ giảm mỡ hiệu quả" },
];

const AI_WIDGET_SIZE_KEY = "flexfit_ai_widget_size";
const DEFAULT_WIDGET_SIZE = { width: 420, height: 650 };
const MIN_WIDGET_SIZE = { width: 380, height: 480 };
const AI_RESPONSE_STYLE_INSTRUCTION =
  "Trả lời CỰC KỲ NGẮN GỌN (tối đa 150-200 từ), sử dụng gạch đầu dòng (bullet points). Tuyệt đối KHÔNG viết bài luận, KHÔNG dùng markdown table, KHÔNG dùng headers (###). Format ưu tiên: 1. Hôm nay nên tập gì, 2. Vì sao phù hợp, 3. Đề xuất lớp/gym, 4. Lời kêu gọi hành động (CTA). Ưu tiên JSON nếu phù hợp: {\"summary\":\"...\",\"workoutPlan\":[\"...\",\"...\",\"...\"],\"classSuggestions\":[\"...\",\"...\",\"...\"],\"tips\":[\"...\",\"...\",\"...\"]}.";

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

const getClassStartLabel = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const scoreBySuggestionText = (needle: string, values: Array<string | undefined>) => {
  const haystack = normalizeText(needle);
  return values.reduce((score, value) => {
    const normalized = normalizeText(value);
    if (!normalized) return score;
    if (haystack.includes(normalized)) return score + 4;
    return normalized
      .split(/\s+/)
      .filter((token) => token.length > 2 && haystack.includes(token)).length + score;
  }, 0);
};

const buildClassCards = (classes: ClassDto[], suggestionText: string): SuggestionCardData[] => {
  const now = Date.now();
  return classes
    .filter((cls) => Boolean(cls.classId))
    .map((cls) => ({
      cls,
      score: scoreBySuggestionText(suggestionText, [cls.className, cls.categoryName, cls.branchName, cls.coachName]),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.cls.startTime).getTime() - new Date(b.cls.startTime).getTime();
    })
    .filter(({ cls, score }, index) => score > 0 || (new Date(cls.startTime).getTime() >= now && index < 3))
    .slice(0, 3)
    .map(({ cls }) => ({
      id: cls.classId,
      kind: "class",
      title: cls.className,
      subtitle: cls.branchName || cls.categoryName || "Lớp học",
      image: cls.thumbnailUrl,
      creditCost: cls.creditCost,
      startTime: cls.startTime,
      classId: cls.classId,
      branchId: cls.branchId,
      routeState: {
        autoSelectName: cls.className,
        autoSelectGym: cls.branchName,
      },
    }));
};

const buildGymCards = (branches: BranchDto[], suggestionText: string): SuggestionCardData[] => {
  return branches
    .filter((branch) => Boolean(branch.branchId))
    .map((branch) => ({
      branch,
      score: scoreBySuggestionText(suggestionText, [
        branch.branchName,
        branch.address,
        branch.district,
        branch.city,
      ]),
    }))
    .sort((a, b) => b.score - a.score)
    .filter(({ score }, index) => score > 0 || index < 3)
    .slice(0, 3)
    .map(({ branch }) => ({
      id: branch.branchId,
      kind: "gym",
      title: branch.branchName,
      subtitle: [branch.district, branch.city].filter(Boolean).join(", ") || branch.address || "Phòng tập",
      image: branch.thumbnailUrl,
      creditCost: branch.creditCost,
      gymId: branch.gymId,
      branchId: branch.branchId,
      routeState: {
        autoSelectName: `Open Gym - ${branch.branchName}`,
        autoSelectGym: branch.branchName,
      },
    }));
};

function SuggestionCards({
  suggestions,
  onOpenSuggestion,
  onExplore,
}: {
  suggestions?: SuggestionCardData[];
  onOpenSuggestion: (suggestion: SuggestionCardData) => void;
  onExplore: () => void;
}) {
  if (!suggestions?.length) return null;

  const classItems = suggestions.filter((item) => item.kind === "class");
  const gymItems = suggestions.filter((item) => item.kind === "gym");
  const groups = [
    classItems.length > 0 && {
      key: "classes",
      title: "Lớp học đề xuất",
      summary: "Top lớp phù hợp từ lịch học thật trên FlexFit.",
      icon: CalendarDays,
      items: classItems,
    },
    gymItems.length > 0 && {
      key: "gyms",
      title: "Phòng tập đề xuất",
      summary: "Chi nhánh phù hợp để đặt lịch tập tự do.",
      icon: Dumbbell,
      items: gymItems,
    },
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    summary: string;
    icon: typeof CalendarDays;
    items: SuggestionCardData[];
  }>;

  return (
    <>
      {groups.map((group) => {
        const firstClickable = group.items.find((item) => item.routeState && (item.classId || item.branchId || item.gymId));
        const Icon = group.icon;

        return (
          <div
            key={group.key}
            className="max-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{group.title}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#22c55e]">AI</span>
                </div>
              </div>
              <span className="rounded-full bg-[#22c55e]/15 px-2 py-1 text-[10px] font-bold text-[#22c55e]">
                {group.items.length} gợi ý
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-zinc-400">{group.summary}</p>
            <ul className="mb-4 space-y-2">
              {group.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex gap-2 text-xs text-zinc-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22c55e]" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-white">{item.title}</span>
                    <span className="block truncate text-zinc-500">
                      {item.creditCost !== undefined ? `${item.creditCost} credits · ` : ""}
                      {item.startTime ? getClassStartLabel(item.startTime) : item.subtitle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="h-9 w-full rounded-xl bg-[#22c55e] text-xs font-bold text-black hover:bg-green-400"
              onClick={() => (firstClickable ? onOpenSuggestion(firstClickable) : onExplore())}
            >
              Khám phá lớp học
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </>
  );
}

function BriefSuggestionCard({
  brief,
  onExplore,
  onToggleDetails,
  expanded,
}: {
  brief: BriefSuggestion;
  onExplore: () => void;
  onToggleDetails: () => void;
  expanded: boolean;
}) {
  const Icon = brief.kind === "classes" ? CalendarDays : brief.kind === "workout" ? Dumbbell : Sparkles;
  const shouldNavigate = brief.kind === "classes";

  return (
    <div className="max-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{brief.title}</h4>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#22c55e]">AI gợi ý</span>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-300">
          Preview
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-zinc-400">{brief.summary}</p>
      <ul className="mb-4 space-y-2">
        {brief.bullets.slice(0, 3).map((bullet) => (
          <li key={bullet} className="flex gap-2 text-xs leading-relaxed text-zinc-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22c55e]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-9 flex-1 rounded-xl bg-[#22c55e] text-xs font-bold text-black hover:bg-green-400"
          onClick={shouldNavigate ? onExplore : onToggleDetails}
        >
          {brief.ctaLabel}
          {shouldNavigate ? <ExternalLink className="ml-1 h-3.5 w-3.5" /> : <ChevronRight className="ml-1 h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-xl border border-white/10 px-3 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
          onClick={onToggleDetails}
        >
          {expanded ? "Thu gọn" : "Xem chi tiết"}
        </Button>
      </div>
    </div>
  );
}

// Parses content to render custom cards and clean up markdown
function MessageContent({
  content,
  suggestions,
  onOpenSuggestion,
  onExplore,
}: {
  content: string;
  suggestions?: SuggestionCardData[];
  onOpenSuggestion: (suggestion: SuggestionCardData) => void;
  onExplore: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cleanText = cleanAiText(content);
  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
  const brief = buildBriefSuggestion(content, suggestions);
  const showSuggestionCards = Boolean(suggestions?.length && brief.kind === "classes");
  
  // Conditionally use 1 or 2 cols based on container context if possible, 
  // but standard grid depends on parent. The AiChatBot parent gives it enough width, 
  // but when squished we want it to adapt.
  return (
    <div className="space-y-4 w-full @container">
      <div className="grid grid-cols-1 @[500px]:grid-cols-2 gap-3 w-full">
        <BriefSuggestionCard
          brief={brief}
          expanded={expanded}
          onExplore={onExplore}
          onToggleDetails={() => setExpanded((value) => !value)}
        />
        {showSuggestionCards && (
          <SuggestionCards
            suggestions={suggestions}
            onOpenSuggestion={onOpenSuggestion}
            onExplore={onExplore}
          />
        )}
      </div>

      {expanded && lines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-h-[260px] overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-zinc-300"
        >
          <div className="space-y-2">
            {lines.slice(0, 18).map((line, i) => (
              <p key={`${line}-${i}`}>{line}</p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Main Component ---

const getTimestamp = () => Date.now();

interface AiChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiChatBot({ isOpen, onClose }: AiChatBotProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // History State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Current Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming State
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;
  const [isMaximized, setIsMaximized] = useState(false);

  const [widgetSize, setWidgetSize] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDGET_SIZE;
    try {
      const saved = localStorage.getItem(AI_WIDGET_SIZE_KEY);
      if (!saved) return DEFAULT_WIDGET_SIZE;
      const parsed = JSON.parse(saved) as { width?: number; height?: number };
      return {
        width: Math.max(MIN_WIDGET_SIZE.width, Number(parsed.width) || DEFAULT_WIDGET_SIZE.width),
        height: Math.max(MIN_WIDGET_SIZE.height, Number(parsed.height) || DEFAULT_WIDGET_SIZE.height),
      };
    } catch {
      return DEFAULT_WIDGET_SIZE;
    }
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isOpen || isMobile()) return;
    const el = widgetRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width < MIN_WIDGET_SIZE.width || height < MIN_WIDGET_SIZE.height) return;
      const next = { width, height };
      setWidgetSize(next);
      localStorage.setItem(AI_WIDGET_SIZE_KEY, JSON.stringify(next));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);


  // Initialize History
  useEffect(() => {
    const saved = localStorage.getItem("flexfit_ai_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Save History
  const saveSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem("flexfit_ai_sessions", JSON.stringify(newSessions));
  };

  // Event Listeners moved to AiCoachGlobal

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (!isMobile()) {
        inputRef.current?.focus();
      }
    }
  }, [isOpen, messages, isLoading, streamingText]);



  // Role check is now handled in AiCoachGlobal

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };



  const updateCurrentSession = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    
    let sessionId = currentSessionId;
    let newSessions = [...sessions];
    const now = getTimestamp();

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      setCurrentSessionId(sessionId);
      const title = newMessages[0]?.content.slice(0, 30) + "..." || "New Chat";
      const newSession: ChatSession = { id: sessionId, title, updatedAt: now, messages: newMessages };
      newSessions = [newSession, ...newSessions];
    } else {
      const idx = newSessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        newSessions[idx] = { ...newSessions[idx], messages: newMessages, updatedAt: now };
        // Move to top
        const [session] = newSessions.splice(idx, 1);
        newSessions.unshift(session);
      }
    }
    saveSessions(newSessions);
  };

  const simulateStreaming = (fullText: string, suggestions?: SuggestionCardData[]) => {
    setStreamingText("");
    let i = 0;
    // Premium typing speed (approx 30 chars per tick for fast SaaS feel)
    const charsPerTick = 3; 
    
    if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
    
    streamingIntervalRef.current = setInterval(() => {
      i += charsPerTick;
      if (i >= fullText.length) {
        setStreamingText(null);
        updateCurrentSession([
          ...messagesRef.current,
          { ...createMessage("assistant", fullText), suggestions },
        ]);
        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
      } else {
        setStreamingText(fullText.slice(0, i));
      }
    }, 15);
  };

  const sendChatMessage = async (message: string) => {
    const userMessage = message.trim();
    if (!userMessage || isLoading || streamingText !== null) return;

    const newMessages = [...messages, createMessage("user", userMessage)];
    updateCurrentSession(newMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setError(null);
    setIsLoading(true);

    try {
      // Inject User Context for Personalization
      const contextPrefix = user
        ? `[Ngữ cảnh hệ thống: Tên người dùng là ${user.fullName}. ${AI_RESPONSE_STYLE_INSTRUCTION}]\n`
        : `[Ngữ cảnh hệ thống: ${AI_RESPONSE_STYLE_INSTRUCTION}]\n`;
      const prompt = contextPrefix + userMessage;
      
      const result = await chat({ message: prompt });
      setIsLoading(false);
      
      if (result.response) {
        const responseText = result.response.trim();
        const suggestions = await buildSuggestionCardsForResponse(responseText);
        simulateStreaming(responseText, suggestions);
      }
    } catch (err) {
      console.error("AI chat failed", err);
      setIsLoading(false);
      setError(AI_UNAVAILABLE_MESSAGE);
    }
  };

  const buildSuggestionCardsForResponse = async (
    responseText: string,
    explicitType?: "classes" | "workout"
  ): Promise<SuggestionCardData[]> => {
    const normalized = normalizeText(responseText);
    const mentionsClass =
      explicitType === "classes" ||
      /\b(class|lop|yoga|hiit|boxing|pilates|zumba|coach|hlv)\b/.test(normalized);
    const mentionsGym =
      /\b(gym|phong tap|chi nhanh|branch|tap tu do|open gym)\b/.test(normalized);

    if (!mentionsClass && !mentionsGym) return [];

    try {
      const [classes, branches] = await Promise.all([
        mentionsClass ? getAllClassesApi().catch(() => [] as ClassDto[]) : Promise.resolve([] as ClassDto[]),
        mentionsGym ? getAllBranchesApi().catch(() => [] as BranchDto[]) : Promise.resolve([] as BranchDto[]),
      ]);

      return [
        ...buildClassCards(classes, responseText),
        ...buildGymCards(branches, responseText),
      ].slice(0, 4);
    } catch (err) {
      console.error("Failed to map AI suggestions to real booking data", err);
      return [];
    }
  };

  const requestSuggestion = async (type: "workout" | "classes") => {
    if (isLoading || streamingText !== null) return;

    const label = type === "workout" ? "Gợi ý lịch tập cho tôi" : "Gợi ý lớp học phù hợp";
    const newMessages = [...messages, createMessage("user", label)];
    updateCurrentSession(newMessages);
    setError(null);
    setIsLoading(true);

    try {
      const result = type === "workout" ? await suggestWorkout() : await suggestClasses();
      setIsLoading(false);
      const text = readSuggestion(result);
      if (text) {
        const suggestions = await buildSuggestionCardsForResponse(text, type);
        simulateStreaming(text, suggestions);
      }
    } catch (err) {
      console.error("AI suggestion failed", err);
      setIsLoading(false);
      setError(AI_UNAVAILABLE_MESSAGE);
    }
  };

  const handleSuggestionClick = (id: string, title: string) => {
    if (id === "workout") void requestSuggestion("workout");
    else if (id === "classes") void requestSuggestion("classes");
    else void sendChatMessage(title);
  };

  const handleExploreClasses = () => {
    try {
      navigate("/explore");
      onClose();
    } catch (err) {
      console.error("AI explore navigation failed", err);
      toast.error("Không thể mở trang khám phá lớp học. Vui lòng thử lại.");
    }
  };

  const handleOpenSuggestion = (suggestion: SuggestionCardData) => {
    if (!suggestion.routeState || !(suggestion.classId || suggestion.branchId || suggestion.gymId)) {
      handleExploreClasses();
      return;
    }

    try {
      if (suggestion.kind === "gym" && suggestion.gymId) {
        navigate('/explore', { state: { selectedGymId: suggestion.gymId, selectedBranchId: suggestion.branchId } });
      } else {
        navigate("/explore", { state: suggestion.routeState });
      }
      onClose();
    } catch (err) {
      console.error("AI suggestion navigation failed", err);
      toast.error("Không thể mở trang đặt lịch. Vui lòng thử lại.");
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

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    const target = event.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={widgetRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={
              isMobile()
                ? undefined
                : isMaximized
                ? {
                    position: "fixed",
                    right: 24,
                    bottom: 16,
                    width: "90vw",
                    height: "90vh",
                    resize: "none",
                  }
                : {
                    position: "fixed",
                    right: 24,
                    bottom: 16,
                    width: widgetSize.width,
                    height: widgetSize.height,
                    minWidth: MIN_WIDGET_SIZE.width,
                    minHeight: MIN_WIDGET_SIZE.height,
                    maxWidth: "min(90vw, 520px)",
                    maxHeight: "calc(100vh - 40px)",
                    resize: "both",
                  }
            }
            className={cn(
              "z-[100] flex flex-col bg-[#000000] text-zinc-100 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl @container overflow-hidden",
              isMobile() && "fixed inset-4 bottom-24 max-h-[calc(100vh-120px)]"
            )}
          >
            {/* Main Area */}
            <div className="flex min-h-0 flex-1 flex-col bg-black h-full">
              {/* Header */}
              <header 
                className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/10 bg-gradient-to-b from-black/80 to-transparent"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] flex items-center justify-center p-0.5">
                    <div className="bg-black rounded-full h-full w-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[#22c55e]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm font-semibold text-white">FlexFit AI Coach</span>
                    <span className="text-[10px] text-black font-bold bg-[#22c55e] px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Pro</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 w-8 rounded-full"
                    onClick={startNewSession}
                    title="Đoạn chat mới"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {!isMobile() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 w-8 rounded-full hidden sm:flex"
                      onClick={() => setIsMaximized(!isMaximized)}
                      title={isMaximized ? "Thu nhỏ" : "Phóng to"}
                    >
                      {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 w-8 rounded-full"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              {/* Chat Scroll Area */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4">
                <div className="w-full flex flex-col h-full">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center mt-4">
                      <div className="relative mb-6 h-16 w-16">
                         <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] animate-spin-slow opacity-80 blur-md" />
                         <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] shadow-lg" />
                         <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-[#22c55e]" />
                         </div>
                      </div>

                      <h1 className="text-lg font-semibold text-white mb-2 tracking-tight text-center px-4">
                        Chào {user?.fullName?.split(" ")[0] || "bạn"}, hôm nay tập gì?
                      </h1>
                      <p className="text-zinc-400 mb-6 text-center text-xs px-6">
                        Sẵn sàng thiết kế lịch tập và tư vấn dinh dưỡng chuẩn xác.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2 w-full">
                        {EMPTY_PROMPTS.map((prompt) => (
                          <button
                            key={prompt.id}
                            className="flex items-center p-3 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-[#22c55e]/30 transition-all text-left group"
                            onClick={() => handleSuggestionClick(prompt.id, prompt.title)}
                            disabled={isLoading || streamingText !== null}
                          >
                            <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-[#22c55e]/10 transition-colors mr-3">
                              <prompt.icon className="h-4 w-4 text-zinc-400 group-hover:text-[#22c55e] transition-colors" />
                            </div>
                            <div className="flex-1">
                              <span className="block text-sm font-semibold text-zinc-200">{prompt.title}</span>
                              <span className="block text-[11px] text-zinc-500">{prompt.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex w-full",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.role === "assistant" && (
                            <div className="h-6 w-6 shrink-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] flex items-center justify-center mr-2 mt-1 shadow-md">
                              <div className="h-[22px] w-[22px] rounded-full bg-black flex items-center justify-center">
                                <Sparkles className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "px-3.5 py-2.5 text-sm leading-relaxed relative group",
                              message.role === "user"
                                ? "max-w-[85%] bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm shadow-sm"
                                : "max-w-[96%] text-zinc-200 rounded-2xl rounded-tl-sm bg-transparent"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <MessageContent
                                content={message.content}
                                suggestions={message.suggestions}
                                onOpenSuggestion={handleOpenSuggestion}
                                onExplore={handleExploreClasses}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Streaming Message Bubble */}
                      {streamingText !== null && (
                        <div className="flex w-full justify-start">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] flex items-center justify-center mr-2 mt-1 shadow-md animate-pulse">
                            <div className="h-[22px] w-[22px] rounded-full bg-black flex items-center justify-center">
                              <Sparkles className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          <div className="max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed text-zinc-200 rounded-2xl rounded-tl-sm bg-transparent">
                            <span className="whitespace-pre-wrap">{streamingText}</span>
                            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-[#22c55e]" />
                          </div>
                        </div>
                      )}
                      
                      {/* Loading State before streaming begins */}
                      {isLoading && (
                        <div className="flex w-full justify-start">
                          <div className="h-6 w-6 shrink-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#22c55e_0deg,#14b8a6_180deg,#3b82f6_360deg)] flex items-center justify-center mr-2 shadow-md">
                            <div className="h-[22px] w-[22px] rounded-full bg-black flex items-center justify-center">
                              <Sparkles className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          <div className="px-2 py-2 text-zinc-400 flex items-center gap-1.5">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                          </div>
                        </div>
                      )}
                      
                      {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-200 mt-2 w-full">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          <div className="flex-1">
                            <p className="font-medium text-red-400 mb-0.5">Connection Error</p>
                            <p className="text-red-300/80">{error}</p>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} className="h-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="shrink-0 bg-[#121212] border-t border-white/10 p-3">
                <form 
                  onSubmit={handleSubmit}
                  className="relative flex flex-col w-full rounded-xl border border-white/10 bg-[#262626] focus-within:border-[#22c55e]/50 focus-within:ring-1 focus-within:ring-[#22c55e]/50 transition-all overflow-hidden"
                >
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Hỏi AI Coach..."
                    className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isLoading || streamingText !== null}
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white rounded-md hover:bg-white/10">
                        <Paperclip className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white rounded-md hover:bg-white/10">
                        <Mic className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "h-7 w-7 rounded-md transition-all",
                        input.trim() && !isLoading && streamingText === null
                          ? "bg-[#22c55e] text-black hover:bg-green-400 shadow-[0_0_10px_rgb(34,197,94,0.3)]"
                          : "bg-white/10 text-zinc-500 cursor-not-allowed"
                      )}
                      disabled={isLoading || !input.trim() || streamingText !== null}
                      aria-label="Send message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Visual resize handle on desktop to make it obvious */}
            {!isMobile() && !isMaximized && (
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-50 flex items-end justify-end p-[2px] pointer-events-none"
              >
                <div className="w-[10px] h-[10px] border-r-2 border-b-2 border-zinc-500 rounded-br-[2px]" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
