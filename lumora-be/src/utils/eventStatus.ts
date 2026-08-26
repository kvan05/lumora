/**
 * Utility: Tính trạng thái hết hạn của sự kiện dựa theo endDate.
 *
 * Quy tắc:
 *  - endDate chưa qua              → ONGOING      (canPurchase = true, isHidden = false, hiddenFromSearch = false)
 *  - endDate qua <= 7 ngày         → ENDED_RECENT (canPurchase = false, isHidden = false, hiddenFromSearch = false)
 *  - endDate qua > 7 và <= 30 ngày → ENDED        (canPurchase = false, isHidden = true, hiddenFromSearch = false)
 *  - endDate qua > 30 ngày         → ARCHIVED     (canPurchase = false, isHidden = true, hiddenFromSearch = true)
 */
export type EventExpiryStatus = "ONGOING" | "ENDED_RECENT" | "ENDED" | "ARCHIVED";

export interface EventExpiryInfo {
  /** Trạng thái hết hạn tính theo thời gian thực */
  eventStatus: EventExpiryStatus;
  /** Khách hàng có thể mua vé hay không */
  canPurchase: boolean;
  /** Ẩn khỏi danh sách công khai / trang chủ (kết thúc > 7 ngày) */
  isHidden: boolean;
  /** Ẩn hoàn toàn khỏi tìm kiếm (kết thúc > 30 ngày) */
  hiddenFromSearch: boolean;
  /** Số ngày đã kết thúc (0 nếu chưa kết thúc) */
  daysSinceEnd: number;
}

/**
 * Tính thông tin hết hạn từ endDate của sự kiện.
 * @param endDate - Thời điểm kết thúc sự kiện
 * @param now     - Thời điểm hiện tại (mặc định = Date.now())
 */
export function computeEventExpiry(endDate: Date, now: Date = new Date()): EventExpiryInfo {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = now.getTime() - new Date(endDate).getTime();
  const daysSinceEnd = Math.max(0, Math.floor(diffMs / msPerDay));

  if (diffMs <= 0) {
    // Sự kiện đang mở hoặc sắp diễn ra
    return {
      eventStatus: "ONGOING",
      canPurchase: true,
      isHidden: false,
      hiddenFromSearch: false,
      daysSinceEnd: 0,
    };
  }

  if (daysSinceEnd <= 7) {
    // Đã kết thúc trong vòng 7 ngày: Khóa mua vé, hiển thị đã kết thúc, vẫn thấy trong danh sách
    return {
      eventStatus: "ENDED_RECENT",
      canPurchase: false,
      isHidden: false,
      hiddenFromSearch: false,
      daysSinceEnd,
    };
  }

  if (daysSinceEnd <= 30) {
    // Đã kết thúc > 7 ngày và <= 30 ngày: Ẩn khỏi trang chủ & danh sách đang bán, có thể tìm kiếm hoặc link trực tiếp
    return {
      eventStatus: "ENDED",
      canPurchase: false,
      isHidden: true,
      hiddenFromSearch: false,
      daysSinceEnd,
    };
  }

  // Đã kết thúc > 30 ngày: Chuyển thành Đã kết thúc (ARCHIVED), ẩn hoàn toàn khỏi tìm kiếm công khai, chỉ link trực tiếp
  return {
    eventStatus: "ARCHIVED",
    canPurchase: false,
    isHidden: true,
    hiddenFromSearch: true,
    daysSinceEnd,
  };
}

/**
 * Prisma where condition để lọc sự kiện hiển thị trên trang chủ / danh sách mặc định.
 * (Ẩn sự kiện kết thúc > 7 ngày)
 */
export function activeEventWhereClause() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return { endDate: { gte: cutoff } };
}

/**
 * Prisma where condition để lọc sự kiện cho tìm kiếm công khai.
 * (Ẩn sự kiện kết thúc > 30 ngày)
 */
export function searchableEventWhereClause() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return { endDate: { gte: cutoff } };
}
