export type SuggestionKind = "class" | "gym";

export interface SuggestionCardData {
  id: string;
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  image?: string;
  creditCost?: number;
  startTime?: string;
  classId?: string;
  gymId?: string;
  branchId?: string;
  routeState?: {
    autoSelectName: string;
    autoSelectGym: string;
  };
}

export interface BriefSuggestion {
  title: string;
  summary: string;
  bullets: string[];
  ctaLabel: string;
  kind: "workout" | "classes" | "general";
}

export const normalizeText = (value: string | undefined | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const stripMarkdownLine = (line: string) =>
  line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}/g, "")
    .replace(/^[-*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

export const cleanAiText = (content: string) => {
  return content
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^[-=_]{3,}$/.test(line)) return false;
      if (/^\|(?:-|=|:|\s|\|)+\|?$/.test(line)) return false;
      if (line.startsWith("|") && line.endsWith("|")) return false;
      if (line.split("|").length >= 3) return false;
      return true;
    })
    .map(stripMarkdownLine)
    .filter(Boolean)
    .join("\n");
};

export const truncateText = (value: string, max = 120) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
};

export const uniqueShortBullets = (items: string[]) => {
  const seen = new Set<string>();
  return items
    .map((item) => truncateText(stripMarkdownLine(item), 72))
    .filter((item) => {
      if (!item) return false;
      const key = normalizeText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
};

export const ensureBullets = (items: string[], fallback: string[]) => {
  const merged = uniqueShortBullets([...items, ...fallback]);
  return merged.slice(0, 3);
};

export const parseJsonSuggestion = (content: string) => {
  const trimmed = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const raw = jsonMatch?.[0] || trimmed;
  try {
    return JSON.parse(raw) as {
      summary?: string;
      workoutPlan?: string[];
      classSuggestions?: string[];
      tips?: string[];
    };
  } catch {
    return null;
  }
};

export const buildBriefSuggestion = (content: string, suggestions?: SuggestionCardData[]): BriefSuggestion => {
  const parsed = parseJsonSuggestion(content);
  const cleaned = cleanAiText(content);
  const lines = cleaned.split("\n").map(stripMarkdownLine).filter(Boolean);
  const normalized = normalizeText(cleaned);
  const hasClassSuggestions = Boolean(suggestions?.some((item) => item.kind === "class" || item.kind === "gym"));
  const isClass = hasClassSuggestions || /\b(class|lop|yoga|hiit|boxing|pilates|zumba|circuit|gym|phong tap)\b/.test(normalized);
  const isWorkout = !isClass && /\b(workout|lich tap|cardio|strength|suc manh|giam can|tang co)\b/.test(normalized);

  const classBullets = uniqueShortBullets([
    ...(suggestions?.map((item) => item.title) || []),
    ...(parsed?.classSuggestions || []),
  ]);
  const workoutBullets = uniqueShortBullets([
    ...(parsed?.workoutPlan || []),
    ...(parsed?.tips || []),
    ...lines.filter((line) => !line.toLowerCase().includes("summary")),
  ]);

  if (isClass) {
    return {
      title: "Hôm nay nên tập gì",
      summary: truncateText(parsed?.summary || lines[0] || "Các lớp và phòng tập phù hợp với bạn hôm nay.", 150),
      bullets: ensureBullets(classBullets.length > 0 ? classBullets : lines, ["Lớp cường độ phù hợp", "Giúp cải thiện sức bền", "Đăng ký ngay qua FlexFit"]),
      ctaLabel: "Khám phá lớp học",
      kind: "classes",
    };
  }

  if (isWorkout) {
    return {
      title: "Gợi ý lịch tập hôm nay",
      summary: truncateText(parsed?.summary || lines[0] || "Một kế hoạch ngắn gọn để bạn bắt đầu buổi tập hiệu quả.", 150),
      bullets: ensureBullets(workoutBullets, ["Khởi động kỹ", "Tập theo sức của mình", "Nghỉ ngơi hợp lý"]),
      ctaLabel: "Xem kế hoạch chi tiết",
      kind: "workout",
    };
  }

  return {
    title: "AI gợi ý cho bạn",
    summary: truncateText(parsed?.summary || lines[0] || "Một phản hồi ngắn từ FlexFit AI Coach.", 150),
    bullets: ensureBullets([...(parsed?.tips || []), ...lines], ["Tóm tắt ý chính", "Ưu tiên an toàn", "Xem chi tiết khi cần"]),
    ctaLabel: "Xem chi tiết",
    kind: "general",
  };
};
