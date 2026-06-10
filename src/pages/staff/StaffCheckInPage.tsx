import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Search, CheckCircle, Loader2, Camera, Upload, Keyboard, X, ShieldAlert, User, Calendar, Clock, MapPin, Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkInGymApi, checkInClassApi, getLogsForManagerApi, type CheckInLogDto } from "@/api/checkInLog";
import { getPartnerGymBookingsApi, getPartnerClassBookingsApi } from "@/api/bookings";
import { EmptyState } from "@/components/ui/empty-state";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type LooseRecord = Record<string, unknown>;
type EnrichedCheckInLog = CheckInLogDto & LooseRecord;

const getStringValue = (source: unknown, keys: string[]) => {
  const record = source as LooseRecord | null | undefined;
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
};

const normalizeLookupValue = (value: string) => value.trim().toUpperCase();

const getLookupTokens = (source: unknown) =>
  [
    getStringValue(source, ["bookingId", "BookingId", "id"]),
    getStringValue(source, ["gymBookingId", "GymBookingId"]),
    getStringValue(source, ["classBookingId", "ClassBookingId"]),
    getStringValue(source, ["bookingCode", "BookingCode"]),
    getStringValue(source, ["code", "Code"]),
    getStringValue(source, ["gymBookingCode", "GymBookingCode"]),
    getStringValue(source, ["classBookingCode", "ClassBookingCode"]),
    getStringValue(source, ["qrToken", "QrToken"]),
  ]
    .filter(Boolean)
    .map(normalizeLookupValue);

const findRelatedBooking = (log: unknown, bookings: LooseRecord[]) => {
  const logTokens = new Set(getLookupTokens(log));
  if (logTokens.size === 0) return null;

  return bookings.find((booking) => getLookupTokens(booking).some((token) => logTokens.has(token))) ?? null;
};

const enrichLogWithBooking = (log: CheckInLogDto, booking: LooseRecord | null): EnrichedCheckInLog => {
  if (!booking) return log as EnrichedCheckInLog;

  return {
    ...log,
    userName: log.userName || getStringValue(booking, ["userName", "customerName", "userFullName", "fullName"]),
    customerName: log.customerName || getStringValue(booking, ["customerName", "userFullName", "userName", "fullName"]),
    userFullName: log.userFullName || getStringValue(booking, ["userFullName", "customerName", "userName", "fullName"]),
    bookingCode: getStringValue(log, ["bookingCode", "code", "gymBookingCode", "classBookingCode"]) ||
      getStringValue(booking, ["bookingCode", "BookingCode", "code"]),
    branchName: log.branchName || getStringValue(booking, ["branchName", "BranchName"]),
    gymName: log.gymName || getStringValue(booking, ["gymName", "GymName"]),
    className: log.className || getStringValue(booking, ["className", "ClassName"]),
    sessionName: log.sessionName || getStringValue(booking, ["sessionName", "SessionName"]),
    name: log.name || getStringValue(booking, ["name", "sessionName", "className"]),
    bookingType: log.bookingType || getStringValue(booking, ["_type", "bookingType", "type"]),
  };
};

export default function StaffCheckInPage() {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("manual");
  const [searchCode, setSearchCode] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const [recentCheckIns, setRecentCheckIns] = useState<EnrichedCheckInLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [scannedBookingId, setScannedBookingId] = useState<string | null>(null);
  const [scannedBookingType, setScannedBookingType] = useState<"GYM" | "CLASS" | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(true);

  const fetchRecentLogs = async (bookingsOverride = allBookings) => {
    try {
      setLoadingLogs(true);
      const data = await getLogsForManagerApi();
      console.log("CHECKIN HISTORY RESPONSE", data);

      const todayStr = new Date().toDateString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const todayLogs = data.filter((log: any) => {
        const timeStr = log.checkInTime || log.checkInAt || log.scannedAt;
        if (!timeStr) return false;
        const d = new Date(timeStr);
        if (Number.isNaN(d.getTime())) return false;
        return d.toDateString() === todayStr;
      });

      const bookingRecords = bookingsOverride as LooseRecord[];
      const enrichedLogs = todayLogs.map((log) => enrichLogWithBooking(log, findRelatedBooking(log, bookingRecords)));
      setRecentCheckIns(enrichedLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Lỗi khi dừng camera", e);
      }
      setIsScanning(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      setIsBookingsLoading(true);
      const [gymRes, classRes] = await Promise.all([
        getPartnerGymBookingsApi().catch(() => []),
        getPartnerClassBookingsApi().catch(() => [])
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizeArray = (res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.items)) return res.items;
        if (res && Array.isArray(res.bookings)) return res.bookings;
        return [];
      };

      const gymArray = normalizeArray(gymRes);
      const classArray = normalizeArray(classRes);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gymBookings = gymArray.map((b: any) => ({ ...b, _type: "GYM" }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const classBookings = classArray.map((b: any) => ({ ...b, _type: "CLASS" }));
      const combined = [...gymBookings, ...classBookings];

      if (import.meta.env.DEV) {
        console.log("API RESPONSE", { gymRes, classRes });
        console.log("SET BOOKINGS", combined);
      }

      setAllBookings(combined);
      return combined;
    } catch (err) {
      console.error("Failed to fetch all bookings:", err);
      return [];
    } finally {
      setIsBookingsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const bookings = await fetchAllBookings();
      await fetchRecentLogs(bookings);
    };

    loadInitialData();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleQrScanSuccess(decodedText);
          stopCamera();
        },
        () => {
          // Ignore scanning errors while there is no QR code in frame.
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      setCameraError("Không thể truy cập camera. Vui lòng cấp quyền hoặc thử lại.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-upload");
      const decodedText = await html5QrCode.scanFile(file, false);
      handleQrScanSuccess(decodedText);
      toast.success("Đọc mã QR thành công!");
    } catch (err) {
      toast.error("Không tìm thấy mã QR trong ảnh. Vui lòng thử ảnh khác.");
      console.error(err);
    }

    e.target.value = "";
  };

  const parseQrPayload = (rawText: string) => {
    let bookingCode = rawText.trim();
    let type: "GYM" | "CLASS" | undefined = undefined;
    let bookingId: string | undefined = undefined;

    try {
      const parsed = JSON.parse(rawText);
      if (parsed.bookingCode) bookingCode = parsed.bookingCode;
      if (parsed.bookingId) bookingId = parsed.bookingId;
      if (parsed.type) type = parsed.type;
    } catch {
      try {
        if (rawText.includes("?")) {
          const url = new URL(rawText.startsWith("http") ? rawText : `http://localhost${rawText}`);
          const codeParam = url.searchParams.get("bookingCode") || url.searchParams.get("code");
          const typeParam = url.searchParams.get("type");
          if (codeParam) bookingCode = codeParam;
          if (typeParam) type = typeParam.toUpperCase() as "GYM" | "CLASS";
        }
      } catch {
        // Raw booking code.
      }
    }

    return { bookingCode, type, bookingId };
  };

  const isGuid = (value?: string | null) =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const handleQrScanSuccess = (decodedText: string) => {
    const { bookingCode } = parseQrPayload(decodedText);
    setSearchCode(bookingCode);
    handleSearchBooking(decodedText);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSearchBooking = async (rawQr: string | null = null, bookingsOverride: any[] | null = null) => {
    const codeToSearch = rawQr ? parseQrPayload(rawQr).bookingCode : searchCode.trim();
    if (!codeToSearch) return toast.error("Vui lòng nhập mã đặt chỗ / check-in");

    setIsFetchingDetail(true);
    setBookingDetail(null);
    setScannedBookingId(null);
    setScannedBookingType(null);

    let currentType: "GYM" | "CLASS" | null = null;
    let payloadBookingId = codeToSearch;

    if (rawQr) {
      const parsed = parseQrPayload(rawQr);
      if (parsed.type) currentType = parsed.type;
      if (parsed.bookingId) payloadBookingId = parsed.bookingId;
      else payloadBookingId = parsed.bookingCode;
    }

    let currentBookings = bookingsOverride || allBookings;
    if (currentBookings.length === 0) {
      currentBookings = (await fetchAllBookings()) || [];
    }

    try {
      if (import.meta.env.DEV) {
        console.log("SEARCH INPUT", payloadBookingId);
      }

      const normalizedInput = String(payloadBookingId ?? "").trim().toUpperCase();
      let foundType: "GYM" | "CLASS" | null = null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundDetail = currentBookings.find((b: any) => {
        const id1 = String(b.bookingId ?? "").trim().toUpperCase();
        const id2 = String(b.BookingId ?? "").trim().toUpperCase();
        const id3 = String(b.id ?? "").trim().toUpperCase();
        const id4 = String(b.gymBookingId ?? "").trim().toUpperCase();
        const id5 = String(b.classBookingId ?? "").trim().toUpperCase();
        const code1 = String(b.bookingCode ?? "").trim().toUpperCase();
        const code2 = String(b.BookingCode ?? "").trim().toUpperCase();
        const code3 = String(b.code ?? "").trim().toUpperCase();
        const qr1 = String(b.qrToken ?? "").trim().toUpperCase();
        const qr2 = String(b.QrToken ?? "").trim().toUpperCase();
        const matchesId = [id1, id2, id3, id4, id5, code1, code2, code3, qr1, qr2].includes(normalizedInput);

        if (currentType && b._type !== currentType) return false;
        return matchesId;
      });

      if (foundDetail) {
        foundType = foundDetail._type as "GYM" | "CLASS";
      }

      if (!foundDetail) {
        if (import.meta.env.DEV) {
          console.log("--- SEARCH FAILED ---");
          console.log("Search Input:", payloadBookingId);
        }
        throw new Error("Không tìm thấy mã booking. Vui lòng kiểm tra lại mã BK hoặc QR.");
      }

      setBookingDetail(foundDetail);
      setScannedBookingType(foundType);
      setScannedBookingId(foundDetail.bookingId || foundDetail.gymBookingId || foundDetail.classBookingId || foundDetail.id || foundDetail.bookingCode);
      toast.success("Đã tìm thấy thông tin Booking!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);

      if (err?.status === 401 || err?.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn hoặc thiếu token. Vui lòng đăng nhập lại.");
      } else if (err?.status === 403 || err?.response?.status === 403) {
        toast.error("Tài khoản không có quyền Staff/GymPartner.");
      } else if (err?.status === 404 || err?.response?.status === 404) {
        toast.error("Không tìm thấy booking.");
      } else if (err?.status === 400 || err?.response?.status === 400) {
        toast.error(err.message || err.data?.message || err.data?.Message || "Yêu cầu không hợp lệ.");
      } else {
        toast.error(err instanceof Error ? err.message : "Tìm kiếm thất bại");
      }
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const processCheckIn = async () => {
    if (!scannedBookingId || !scannedBookingType) return;

    setIsCheckingIn(true);

    try {
      if (bookingDetail.checkInStatus === "CheckedIn") {
        toast.info("Booking này đã được check-in trước đó.");
        setIsCheckingIn(false);
        return;
      }

      if (scannedBookingType === "GYM") {
        const candidateBookingId = bookingDetail.bookingId || bookingDetail.gymBookingId || scannedBookingId;
        const safeBookingId = isGuid(candidateBookingId) ? candidateBookingId : undefined;
        const payload = {
          userId: bookingDetail.userId,
          gymBookingId: safeBookingId,
          bookingId: safeBookingId,
          bookingCode: bookingDetail.bookingCode || (!safeBookingId ? scannedBookingId : searchCode.trim()),
          qrToken: bookingDetail.qrToken,
          status: "Success",
          message: "Staff check-in bằng QR/Mã"
        };
        console.log("CHECKIN PAYLOAD", payload);
        await checkInGymApi(payload);
        toast.success("Check-in Gym thành công!");
      } else {
        const payload = {
          userId: bookingDetail.userId,
          classBookingId: scannedBookingId,
          status: "Success",
          message: "Staff check-in bằng QR/Mã"
        };
        console.log("CHECKIN PAYLOAD", payload);
        await checkInClassApi(payload);
        toast.success("Check-in Lớp học thành công!");
      }

      setSearchCode("");
      setBookingDetail(null);
      setScannedBookingId(null);
      setScannedBookingType(null);
      fetchRecentLogs(allBookings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("BACKEND ERROR RESPONSE:", err);
      if (err?.status === 401 || err?.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn hoặc thiếu token. Vui lòng đăng nhập lại.");
      } else if (err?.status === 403 || err?.response?.status === 403) {
        toast.error("Tài khoản không có quyền Staff/GymPartner.");
      } else if (err?.status === 404 || err?.response?.status === 404) {
        toast.error("Không tìm thấy booking.");
      } else if (err?.status === 400 || err?.response?.status === 400) {
        toast.error(err.message || err.data?.message || err.data?.Message || "Yêu cầu không hợp lệ.");
      } else {
        toast.error(err instanceof Error ? err.message : "Điểm danh thất bại");
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getLogMemberName = (log: EnrichedCheckInLog) =>
    log.userName || log.customerName || log.userFullName || "Hội viên";

  const getLogInitial = (log: EnrichedCheckInLog) =>
    getLogMemberName(log).trim().charAt(0).toUpperCase() || "H";

  const getLogIsSuccess = (log: EnrichedCheckInLog) =>
    String(log.status || "").toLowerCase() === "success";

  const getLogBookingCode = (log: EnrichedCheckInLog) =>
    getStringValue(log, ["bookingCode", "code", "gymBookingCode", "classBookingCode"]);

  const getLogBookingType = (log: EnrichedCheckInLog) => {
    const rawType = String(log.type || log.bookingType || "").toUpperCase();
    if (rawType === "GYM") return "Gym tự do";
    if (rawType === "CLASS") return "Lớp học";
    return log.className ? "Lớp học" : "Gym tự do";
  };

  const getLogBranchName = (log: EnrichedCheckInLog) =>
    log.branchName || log.gymName || "";

  const getLogServiceName = (log: EnrichedCheckInLog) => {
    const rawType = String(log.type || log.bookingType || "").toUpperCase();
    const branchName = getLogBranchName(log);

    if (rawType === "GYM") {
      return branchName ? `Open Gym - ${branchName}` : (log.sessionName || log.name || "Open Gym");
    }

    if (rawType === "CLASS") {
      return log.className || log.name || log.sessionName || "";
    }

    if (log.className) return log.className;
    if (log.sessionName) return branchName ? `Open Gym - ${branchName}` : log.sessionName;
    return log.name || "";
  };

  const getLogDate = (log: EnrichedCheckInLog) => {
    const value = log.checkInTime || log.checkInAt || log.scannedAt;
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getLogTime = (log: EnrichedCheckInLog) => {
    const date = getLogDate(log);
    return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
  };

  const renderBookingCard = () => {
    if (!bookingDetail) return null;

    const now = new Date();
    const startTime = new Date(bookingDetail.startTime);
    const endTime = new Date(bookingDetail.endTime);
    const minCheckInTime = new Date(startTime.getTime() - 15 * 60000);
    const maxCheckInTime = new Date(endTime.getTime() + 10 * 60000);

    const isTooEarly = now < minCheckInTime;
    const isTooLate = now > maxCheckInTime;
    const isCheckedIn = bookingDetail.checkInStatus === "CheckedIn" || bookingDetail.checkInStatus === "Đã check-in";
    const isCancelled = bookingDetail.status === "Cancelled";

    let badgeText: string;
    let badgeColor: string;
    let statusMessage = "";

    if (isCancelled) {
      badgeText = "ĐÃ HỦY";
      badgeColor = "bg-red-500/20 text-red-400";
      statusMessage = "Booking này đã bị hủy.";
    } else if (isCheckedIn) {
      badgeText = "ĐÃ CHECK-IN";
      badgeColor = "bg-blue-500/20 text-blue-400";
      statusMessage = "Booking này đã được check-in trước đó.";
    } else if (isTooEarly) {
      badgeText = "CHƯA ĐẾN GIỜ";
      badgeColor = "bg-orange-500/20 text-orange-400";
      statusMessage = `Chưa đến giờ check-in. Có thể check-in từ ${minCheckInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(/AM|PM/i, "").trim()}.`;
    } else if (isTooLate) {
      badgeText = "HẾT HẠN";
      badgeColor = "bg-red-500/20 text-red-400";
      statusMessage = "Booking đã hết thời gian check-in.";
    } else {
      badgeText = "HỢP LỆ";
      badgeColor = "bg-emerald-500/20 text-emerald-400";
    }

    const canCheckIn = !isTooEarly && !isTooLate && !isCheckedIn && !isCancelled;

    return (
      <div className="space-y-6 mt-6 animate-fade-in border-t border-white/10 pt-6">
        <h3 className="text-xl font-bold text-white mb-4">Thông tin Booking</h3>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Khách hàng</span>
                <div className="flex items-center gap-2">
                  {bookingDetail.avatarUrl && (
                    <img src={bookingDetail.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                  )}
                  <span className="text-white font-bold text-lg">{bookingDetail.userFullName || bookingDetail.customerName || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-white font-medium">{bookingDetail.userEmail || bookingDetail.customerEmail || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Booking Code</span>
                <span className="text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded">{bookingDetail.bookingCode || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Phân loại</span>
                <Badge variant="outline" className="border-white/10">{scannedBookingType === "GYM" ? "Gym tự do" : "Lớp học"}</Badge>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dịch vụ</span>
                <span className="text-white font-bold">{bookingDetail.name || bookingDetail.sessionName || bookingDetail.className || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Chi nhánh</span>
                <span className="text-white font-medium">{bookingDetail.branchName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Thời gian</span>
                <span className="text-white font-medium">
                  {bookingDetail.startTime ? format(new Date(bookingDetail.startTime), "dd/MM/yyyy", { locale: vi }) : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Khung giờ</span>
                <span className="text-white font-medium">
                  {bookingDetail.startTime ? format(new Date(bookingDetail.startTime), "HH:mm") : ""} - {bookingDetail.endTime ? format(new Date(bookingDetail.endTime), "HH:mm") : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Trạng thái Check-in</span>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${badgeColor}`}>
                {badgeText}
              </span>
              {statusMessage && <span className="text-[13px] text-muted-foreground">{statusMessage}</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-xl border-white/10 text-white hover:bg-white/5"
            onClick={() => {
              setBookingDetail(null);
              setScannedBookingId(null);
              setScannedBookingType(null);
              setSearchCode("");
            }}
          >
            Hủy / Quét lại
          </Button>
          <Button
            onClick={processCheckIn}
            disabled={isCheckingIn || !canCheckIn}
            className={`flex-1 h-14 rounded-xl shadow-lg text-lg font-bold ${canCheckIn ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-600 text-gray-300 cursor-not-allowed"}`}
          >
            {isCheckingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN CHECK-IN"}
          </Button>
        </div>
      </div>
    );
  };

  const successfulCheckIns = recentCheckIns.filter(getLogIsSuccess).length;
  const failedCheckIns = recentCheckIns.length - successfulCheckIns;
  const latestCheckInDate = recentCheckIns
    .map(getLogDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestCheckInTime = latestCheckInDate
    ? latestCheckInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Điểm danh hội viên</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-secondary border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Xác minh Check-in
                </div>
              </CardTitle>
              <CardDescription>Chọn phương thức đọc mã QR hoặc nhập tay</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!bookingDetail && (
                <>
                  <div className="flex border-b border-white/5 bg-black/20">
                    <button
                      onClick={() => { setActiveTab("manual"); stopCamera(); }}
                      className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "manual" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                      <Keyboard className="w-4 h-4" /> Nhập mã
                    </button>
                    <button
                      onClick={() => { setActiveTab("camera"); setCameraError(null); }}
                      className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "camera" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                      <Camera className="w-4 h-4" /> Camera
                    </button>
                    <button
                      onClick={() => { setActiveTab("upload"); stopCamera(); }}
                      className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "upload" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                      <Upload className="w-4 h-4" /> Tải ảnh
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {activeTab === "camera" && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-4 bg-black/20 min-h-[300px]">
                        <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl bg-black" />

                        {cameraError && (
                          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
                            <ShieldAlert className="w-5 h-5 shrink-0" />
                            <p>{cameraError}</p>
                          </div>
                        )}

                        <div className="mt-6">
                          {!isScanning ? (
                            <Button onClick={startCamera} className="bg-primary hover:bg-primary/90 rounded-xl">
                              <Camera className="w-4 h-4 mr-2" /> Bật Camera Quét QR
                            </Button>
                          ) : (
                            <Button onClick={stopCamera} variant="destructive" className="rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20">
                              <X className="w-4 h-4 mr-2" /> Dừng quét
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "upload" && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 bg-black/20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">Tải ảnh QR Code lên</h4>
                          <p className="text-sm text-muted-foreground">Hỗ trợ định dạng PNG, JPG, JPEG</p>
                        </div>
                        <div id="qr-reader-upload" className="hidden" />
                        <div className="relative overflow-hidden inline-block">
                          <Button className="bg-white hover:bg-gray-200 text-black rounded-xl">
                            Chọn tệp ảnh
                          </Button>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="text"
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value)}
                          placeholder="Mã Booking (Ví dụ: BK846043)"
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-muted-foreground font-mono font-bold tracking-widest focus:border-primary transition-all text-sm uppercase"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleSearchBooking()}
                          disabled={isFetchingDetail || !searchCode || isBookingsLoading}
                          className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white font-bold"
                        >
                          {isBookingsLoading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải booking...</>
                          ) : isFetchingDetail ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "TRA CỨU BOOKING"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {bookingDetail && (
                <div className="p-6 bg-black/30">
                  {renderBookingCard()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#182235] border-white/10 h-full rounded-2xl shadow-none">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    Lịch sử hôm nay
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-400">
                    {recentCheckIns.length} lượt check-in hôm nay
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fetchRecentLogs(allBookings)}
                  disabled={loadingLogs}
                  className="h-9 w-9 rounded-xl border-white/10 bg-[#101827] text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Tải lại lịch sử check-in"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#101827] p-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <p className="text-sm text-slate-400">Đang tải lịch sử check-in...</p>
                </div>
              ) : recentCheckIns.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#101827] p-8">
                  <EmptyState
                    icon={CheckCircle}
                    title="Chưa có lượt check-in hôm nay"
                    description="Các lượt check-in thành công sẽ hiển thị tại đây."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-[#101827] p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Thành công</p>
                      <p className="mt-1 text-xl font-bold text-emerald-400">{successfulCheckIns}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#101827] p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Thất bại</p>
                      <p className="mt-1 text-xl font-bold text-red-400">{failedCheckIns}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#101827] p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Gần nhất</p>
                      <p className="mt-1 text-xl font-bold text-white">{latestCheckInTime}</p>
                    </div>
                  </div>

                  {recentCheckIns.map((log, idx) => (
                    <div
                      key={log.checkInId ?? idx}
                      className="rounded-2xl border border-white/10 bg-[#101827] p-4 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/15 text-sm font-bold text-emerald-400">
                            {getLogInitial(log)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-white">{getLogMemberName(log)}</p>
                              {getLogBookingCode(log) && (
                                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                                  {getLogBookingCode(log)}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-white/10 bg-slate-500/15 text-slate-300">
                                {getLogBookingType(log)}
                              </Badge>
                              {getLogServiceName(log) && (
                                <span className="min-w-0 truncate text-sm font-medium text-white">
                                  {getLogServiceName(log)}
                                </span>
                              )}
                            </div>

                            {getLogBranchName(log) && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="truncate">{getLogBranchName(log)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="mb-2 flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {getLogTime(log)}
                          </div>
                          <Badge
                            className={
                              getLogIsSuccess(log)
                                ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400"
                                : "border-red-500/20 bg-red-500/15 text-red-400"
                            }
                          >
                            {getLogIsSuccess(log) ? "Hợp lệ" : "Thất bại"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
