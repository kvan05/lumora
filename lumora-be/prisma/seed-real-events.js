/**
 * Seed script: Real events sourced from Ticketbox.vn (July 2026)
 * Events are seeded with status=APPROVED so they appear on the homepage immediately.
 *
 * Run: node prisma/seed-real-events.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Real event data sourced from ticketbox.vn (publicly listed events)
const realEvents = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. TRÚ:BÃO HÀ NỘI - Concert (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'TRÚ:BÃO HÀ NỘI',
    slug: 'tru-bao-ha-noi-2026',
    description: `TRÚ:BÃO là chuỗi sự kiện âm nhạc độc đáo mang phong cách underground sôi động, lần đầu tiên đặt chân đến Hà Nội sau thành công vang dội tại TP.HCM.

Đêm diễn sẽ là hành trình âm nhạc mãnh liệt với sự kết hợp của các nghệ sĩ indie, rap và electronic đang làm mưa làm gió trên sân khấu Việt Nam.

📍 Nhà hát Kịch Hà Nội, 42 Tràng Tiền, Hoàn Kiếm, Hà Nội
🎫 Vé từ 999.000đ - 1.299.000đ
⚠️ Dành cho khán giả từ 16 tuổi trở lên`,
    category: 'Âm nhạc',
    venue: 'Nhà hát Kịch Hà Nội',
    address: '42 Tràng Tiền, Hoàn Kiếm',
    city: 'Hà Nội',
    startDate: new Date('2026-08-01T12:00:00.000Z'), // 19:00 GMT+7
    endDate: new Date('2026-08-01T15:00:00.000Z'),   // 22:00 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
    ]),
    tags: JSON.stringify(['concert', 'underground', 'indie', 'Hà Nội']),
    isFeatured: true,
    refundPolicy: 'Vé đã mua không được hoàn lại theo chính sách của ban tổ chức.',
    ticketTypes: [
      { name: 'MƯA RÀO', price: 999000, quantity: 500 },
      { name: 'MƯA GIÔNG', price: 1299000, quantity: 200 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MẮT NHẮM MẮT MỞ CONCERT - HIEUTHUHAI (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'MẮT NHẮM MẮT MỞ CONCERT - HIEUTHUHAI',
    slug: 'mat-nham-mat-mo-concert-hieuthuhai-2026',
    description: `HIEUTHUHAI trở lại với concert solo quy mô lớn nhất sự nghiệp — "MẮT NHẮM MẮT MỞ" tại Nhà thi đấu Phú Thọ, TP.HCM.

Đêm diễn hứa hẹn là hành trình âm nhạc đầy cảm xúc với dàn bài hit của HIEUTHUHAI, từ những bản rap sâu sắc đến những giai điệu dịu dàng.

📍 Nhà thi đấu Phú Thọ, 1 Lữ Gia, Phường Phú Thọ, TP.HCM
🎫 Phân phối độc quyền bởi Ticketbox
🔞 Dành cho khán giả từ 14 tuổi trở lên`,
    category: 'Âm nhạc',
    venue: 'Nhà thi đấu Phú Thọ',
    address: '1 Lữ Gia, Phường Phú Thọ, Quận 11',
    city: 'TP. Hồ Chí Minh',
    startDate: new Date('2026-08-01T12:00:00.000Z'), // 19:00 GMT+7
    endDate: new Date('2026-08-01T14:30:00.000Z'),   // 21:30 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
    ]),
    tags: JSON.stringify(['concert', 'rap', 'HIEUTHUHAI', 'TP.HCM', 'hiphop']),
    isFeatured: true,
    refundPolicy: 'Vé đã mua không được hoàn lại. Có thể nhượng lại qua tính năng Resale của Ticketbox.',
    ticketTypes: [
      { name: 'Ban Công', price: 1600000, quantity: 300 },
      { name: 'Mái Nhà', price: 2500000, quantity: 200 },
      { name: 'Tâm Trí', price: 4500000, quantity: 100 },
      { name: 'Sân Trước - VIP', price: 6500000, quantity: 50 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Phùng Khánh Linh - GIỮA MỘT VẠN TOUR (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Phùng Khánh Linh - GIỮA MỘT VẠN TOUR (Chapter 3)',
    slug: 'phung-khanh-linh-giua-mot-van-tour-ch3-2026',
    description: `"GIỮA MỘT VẠN TOUR" — Phùng Khánh Linh tiếp tục hành trình âm nhạc cảm xúc của mình với Chapter 3 tại Hà Nội.

Đây là một trải nghiệm âm nhạc live hoàn toàn khác biệt, kết hợp giữa âm nhạc, hình ảnh nghệ thuật và câu chuyện cá nhân đầy chân thực.

📍 Trung tâm Hội nghị Quốc gia, 57 Phạm Hùng, Mễ Trì, Hà Nội
🎫 Vé từ 860.000đ - 10.000.000đ (hạng Blackswan)
👤 Dành cho mọi lứa tuổi`,
    category: 'Âm nhạc',
    venue: 'Trung tâm Hội nghị Quốc gia',
    address: '57 Phạm Hùng, Mễ Trì, Nam Từ Liêm',
    city: 'Hà Nội',
    startDate: new Date('2026-08-08T12:00:00.000Z'), // 19:00 GMT+7
    endDate: new Date('2026-08-08T15:00:00.000Z'),   // 22:00 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    ]),
    tags: JSON.stringify(['concert', 'indie', 'Phùng Khánh Linh', 'Hà Nội', 'pop']),
    isFeatured: true,
    refundPolicy: 'Không hoàn vé sau khi đặt mua. Xem chi tiết tại trang sự kiện.',
    ticketTypes: [
      { name: 'Standard', price: 860000, quantity: 600 },
      { name: 'Premium', price: 1500000, quantity: 300 },
      { name: 'VIP', price: 3000000, quantity: 100 },
      { name: 'Blackswan', price: 10000000, quantity: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BỐC FEST 2026 (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'BỐC FEST 2026 - Nhà Máy Xe Lửa Gia Lâm',
    slug: 'boc-fest-2026-ha-noi',
    description: `BỐC FEST — Music Festival lớn nhất Hà Nội năm 2026, diễn ra tại không gian độc đáo của Nhà máy xe lửa Gia Lâm đầy huyền bí!

Lễ hội âm nhạc kéo dài từ chiều đến đêm với nhiều sân khấu, nhiều thể loại nhạc từ indie, pop, EDM đến rap, phục vụ hàng nghìn khán giả.

📍 Nhà máy xe lửa Gia Lâm, 551 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội
🎫 Vé từ 799.000đ - 1.199.000đ
🕔 17:00 - 23:00`,
    category: 'Lễ hội',
    venue: 'Nhà máy xe lửa Gia Lâm',
    address: '551 Nguyễn Văn Cừ, Bồ Đề, Long Biên',
    city: 'Hà Nội',
    startDate: new Date('2026-09-19T10:00:00.000Z'), // 17:00 GMT+7
    endDate: new Date('2026-09-19T16:00:00.000Z'),   // 23:00 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    ]),
    tags: JSON.stringify(['festival', 'music', 'indie', 'EDM', 'Hà Nội', 'outdoor']),
    isFeatured: true,
    refundPolicy: 'Vé không hoàn lại. Vui lòng đến đúng giờ.',
    ticketTypes: [
      { name: 'BỐC NHIỆT', price: 799000, quantity: 1000 },
      { name: 'BỐC ĐẦU - VIP', price: 1199000, quantity: 300 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Sports Festival 2026 - NovaWorld (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Sports Festival 2026 - NovaWorld Phan Thiết',
    slug: 'sports-festival-2026-novaworld',
    description: `Chuỗi sự kiện thể thao quy mô lớn nhất năm 2026 tại NovaWorld Phan Thiết với 12 bộ môn thi đấu hàng đầu!

Bao gồm: Triathlon, Tennis, Golf, Pickleball, Bóng chuyền bãi biển, Đua xe đạp, Bơi lội, Cầu lông, và nhiều hoạt động thể thao biển hấp dẫn khác.

📍 NovaWorld Phan Thiết, Lâm Đồng
🏃 Khai mạc: 01/08/2026 tại sân khấu chính NovaWorld
🏆 Kết thúc: 22/09/2026`,
    category: 'Thể thao',
    venue: 'NovaWorld Phan Thiết',
    address: 'NovaWorld, Hàm Tiến',
    city: 'Phan Thiết',
    startDate: new Date('2026-08-01T05:00:00.000Z'), // 12:00 GMT+7
    endDate: new Date('2026-09-22T16:00:00.000Z'),
    bannerUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    ]),
    tags: JSON.stringify(['sports', 'festival', 'triathlon', 'golf', 'outdoor', 'biển']),
    isFeatured: false,
    refundPolicy: 'Chính sách hoàn vé theo từng hạng mục thi đấu. Liên hệ BTC để biết thêm.',
    ticketTypes: [
      { name: 'Vé Tham Quan', price: 150000, quantity: 2000 },
      { name: 'Vé Thi Đấu Triathlon', price: 850000, quantity: 500 },
      { name: 'Vé Thi Đấu Tennis', price: 650000, quantity: 300 },
      { name: 'Gói VIP Khán Giả', price: 1200000, quantity: 100 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Workshop Làm Nến Thơm - Flower 1969's (nguồn: ticketbox.vn)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Workshop Làm Nến Thơm Nghệ Thuật - Flower 1969\'s',
    slug: 'workshop-lam-nen-thom-flower-1969s-2026',
    description: `Khám phá nghệ thuật làm nến thơm handmade với những kỹ thuật độc đáo tại workshop của Flower 1969's — không gian sáng tạo nổi tiếng tại TP.HCM!

✅ Bạn sẽ tự tay làm 2 cây nến thơm thiên nhiên mang về nhà
✅ Được hướng dẫn bởi nghệ nhân có kinh nghiệm 10+ năm
✅ Bộ kit nguyên liệu cao cấp được cung cấp đầy đủ
✅ Khu vực chụp hình aesthetic miễn phí

📍 Flower 1969's Studio, Quận 3, TP.HCM
⏰ 2 tiếng thực hành
☕ Có nước uống và snack`,
    category: 'Workshop',
    venue: "Flower 1969's Studio",
    address: '68 Võ Thị Sáu, Phường Tân Định, Quận 3',
    city: 'TP. Hồ Chí Minh',
    startDate: new Date('2026-08-15T03:00:00.000Z'), // 10:00 GMT+7
    endDate: new Date('2026-08-15T05:00:00.000Z'),   // 12:00 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1602928309985-59a4b8afae75?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1602928309985-59a4b8afae75?w=800&q=80',
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    ]),
    tags: JSON.stringify(['workshop', 'handmade', 'nến', 'thủ công', 'sáng tạo', 'TP.HCM']),
    isFeatured: false,
    refundPolicy: 'Hoàn tiền 100% nếu hủy trước 48 giờ. Không hoàn tiền khi hủy muộn hơn.',
    ticketTypes: [
      { name: 'Vé Tham Gia (1 người)', price: 280000, quantity: 20 },
      { name: 'Vé Cặp Đôi (2 người)', price: 520000, quantity: 10 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Lễ hội Việt Nam - Hàn Quốc 2026 tại Đà Nẵng (nguồn: search)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Lễ Hội Giao Lưu Văn Hóa Việt Nam - Hàn Quốc 2026',
    slug: 'le-hoi-viet-han-da-nang-2026',
    description: `Lễ hội giao lưu văn hóa Việt Nam - Hàn Quốc 2026 — sự kiện quốc tế lớn nhất miền Trung với các hoạt động văn hóa, thể thao và nghệ thuật đặc sắc!

🇻🇳🇰🇷 Chương trình bao gồm:
• Biểu diễn nghệ thuật truyền thống Việt Nam và Hàn Quốc
• Giao lưu bóng đá hữu nghị Việt Nam - Hàn Quốc
• Đồng diễn Vovinam & Taekwondo
• Giải Golf hữu nghị quốc tế
• Ẩm thực và văn hóa truyền thống hai nước

📍 Công viên Biển Đông, Đà Nẵng`,
    category: 'Lễ hội',
    venue: 'Công viên Biển Đông',
    address: 'Đường Võ Nguyên Giáp, Quận Ngũ Hành Sơn',
    city: 'Đà Nẵng',
    startDate: new Date('2026-08-06T02:00:00.000Z'), // 09:00 GMT+7
    endDate: new Date('2026-08-09T15:00:00.000Z'),
    bannerUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
      'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800&q=80',
    ]),
    tags: JSON.stringify(['festival', 'văn hóa', 'Hàn Quốc', 'Đà Nẵng', 'quốc tế', 'thể thao']),
    isFeatured: false,
    refundPolicy: 'Sự kiện miễn phí cho khách tham quan. Vé thi đấu theo từng bộ môn.',
    ticketTypes: [
      { name: 'Vé Khán Giả (miễn phí)', price: 0, quantity: 5000 },
      { name: 'Vé VIP Khán Đài', price: 200000, quantity: 500 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. AV Show HCM 2026 - Triển lãm âm thanh (nguồn: ticketbox.vn search)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'AV Show HCM 2026 - Triển Lãm Thiết Bị Âm Thanh Hình Ảnh',
    slug: 'av-show-hcm-2026',
    description: `AV Show HCM 2026 — Sự kiện triển lãm thiết bị âm thanh và hình ảnh cao cấp lớn nhất TP.HCM!

Quy tụ hàng trăm thương hiệu âm thanh nổi tiếng thế giới: Sony, JBL, Bose, Sennheiser, Yamaha, và nhiều thương hiệu Hi-Fi cao cấp khác.

🎵 Các hoạt động nổi bật:
• Demo trải nghiệm thiết bị loa, ampli, DAC cao cấp
• Buổi nghe nhạc audiophile với hệ thống million-dollar
• Hội thảo về xu hướng âm thanh 2026-2027
• Gặp gỡ chuyên gia và kỹ sư âm thanh hàng đầu

📍 Khách sạn Saigon Prince, 63 Nguyễn Huệ, Quận 1, TP.HCM`,
    category: 'Triển lãm',
    venue: 'Khách sạn Saigon Prince',
    address: '63 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    city: 'TP. Hồ Chí Minh',
    startDate: new Date('2026-09-18T02:00:00.000Z'), // 09:00 GMT+7
    endDate: new Date('2026-09-20T10:00:00.000Z'),
    bannerUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ]),
    tags: JSON.stringify(['triển lãm', 'âm thanh', 'hi-fi', 'audiophile', 'TP.HCM', 'công nghệ']),
    isFeatured: false,
    refundPolicy: 'Vé có thể hoàn trước 7 ngày, mất 10% phí xử lý.',
    ticketTypes: [
      { name: 'Vé 1 Ngày', price: 150000, quantity: 1000 },
      { name: 'Vé 3 Ngày (Trọn Gói)', price: 350000, quantity: 500 },
      { name: 'VIP Pass (3 ngày + Workshop)', price: 800000, quantity: 100 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Workshop Làm Gốm Mini - Lâu Space (nguồn: ticketbox.vn search)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Workshop Làm Gốm Mini Cùng Lâu Space',
    slug: 'workshop-lam-gom-mini-lau-space-2026',
    description: `Trải nghiệm nghệ thuật làm gốm thủ công tại Lâu Space — không gian sáng tạo vintage độc đáo giữa lòng Hà Nội!

👐 Bạn sẽ được:
• Học cách tạo hình đất sét trên bàn xoay
• Tạo ra sản phẩm gốm mini độc đáo của riêng bạn
• Được hướng dẫn bởi nghệ nhân gốm chuyên nghiệp
• Sản phẩm sau khi nung sẽ được giao sau 2 tuần

✨ Phù hợp cho: cặp đôi, nhóm bạn, gia đình, team building

📍 Lâu Space, Tây Hồ, Hà Nội`,
    category: 'Workshop',
    venue: 'Lâu Space',
    address: '28 Xuân Diệu, Tây Hồ',
    city: 'Hà Nội',
    startDate: new Date('2026-08-22T03:30:00.000Z'), // 10:30 GMT+7
    endDate: new Date('2026-08-22T06:00:00.000Z'),   // 13:00 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
    ]),
    tags: JSON.stringify(['workshop', 'gốm', 'thủ công', 'sáng tạo', 'Hà Nội', 'couple']),
    isFeatured: false,
    refundPolicy: 'Hoàn tiền 100% nếu hủy trước 24 giờ.',
    ticketTypes: [
      { name: 'Vé Cá Nhân', price: 250000, quantity: 15 },
      { name: 'Vé Cặp Đôi', price: 450000, quantity: 8 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Hương Tràm - Phao Cứu Sinh Concert (nguồn: ticketbox.vn search)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Hương Tràm - PHAO CỨU SINH Concert',
    slug: 'huong-tram-phao-cuu-sinh-concert-2026',
    description: `Hương Tràm — nữ ca sĩ với giọng hát nội lực bậc nhất Việt Nam — trở lại sân khấu với concert solo đầy cảm xúc "PHAO CỨU SINH" tại Hà Nội!

Đêm diễn hứa hẹn là hành trình âm nhạc từ những bản ballad da diết đến những ca khúc pop sôi động, mang đến cảm xúc thật sự cho hàng nghìn khán giả.

📍 Hà Nội
🎙️ Live band full HD sound system
🎫 Vé từ 500.000đ`,
    category: 'Âm nhạc',
    venue: 'Cung Văn hóa Hữu nghị Việt Xô',
    address: '91 Trần Hưng Đạo, Hoàn Kiếm',
    city: 'Hà Nội',
    startDate: new Date('2026-08-01T12:30:00.000Z'), // 19:30 GMT+7
    endDate: new Date('2026-08-01T15:30:00.000Z'),   // 22:30 GMT+7
    bannerUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&q=80',
    imageUrls: JSON.stringify([
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80',
      'https://images.unsplash.com/photo-1501238295340-c810d3c156d2?w=800&q=80',
    ]),
    tags: JSON.stringify(['concert', 'ballad', 'Hương Tràm', 'Hà Nội', 'pop']),
    isFeatured: false,
    refundPolicy: 'Không hoàn vé sau khi thanh toán.',
    ticketTypes: [
      { name: 'Hạng Thường', price: 500000, quantity: 800 },
      { name: 'Hạng Bạc', price: 900000, quantity: 300 },
      { name: 'Hạng Vàng', price: 1500000, quantity: 100 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding real events from Ticketbox.vn...\n');

  // Get seller account (must exist - run main seed.js first)
  const seller = await prisma.user.findUnique({
    where: { email: 'seller@lumora.vn' },
  });

  if (!seller) {
    throw new Error('❌ Tài khoản seller@lumora.vn chưa tồn tại. Hãy chạy "npm run seed" trước!');
  }

  // Get admin account for approval
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@lumora.vn' },
  });

  if (!admin) {
    throw new Error('❌ Tài khoản admin@lumora.vn chưa tồn tại. Hãy chạy "npm run seed" trước!');
  }

  let created = 0;
  let skipped = 0;

  for (const eventData of realEvents) {
    const { ticketTypes, ...eventFields } = eventData;

    // Check if event already exists
    const existing = await prisma.event.findUnique({
      where: { slug: eventFields.slug },
    });

    if (existing) {
      console.log(`⏭️  Bỏ qua (đã tồn tại): ${eventFields.title}`);
      skipped++;
      continue;
    }

    // Create event with PUBLISHED status (approved by admin)
    const event = await prisma.event.create({
      data: {
        ...eventFields,
        sellerId: seller.id,
        status: 'PUBLISHED',
        approvedAt: new Date(),
        approvedById: admin.id,
        approvalNote: 'Duyệt tự động - sự kiện nhập từ Ticketbox.vn',
        ticketTypes: {
          create: ticketTypes.map((tt, index) => ({
            name: tt.name,
            price: tt.price,
            quantity: tt.quantity,
            maxPerOrder: 8,
            sortOrder: index,
            status: 'ACTIVE',
            inventory: {
              create: {
                totalQty: tt.quantity,
                reservedQty: 0,
                soldQty: 0,
              },
            },
          })),
        },
      },
    });

    console.log(`✅ Đã tạo: ${event.title}`);
    created++;
  }

  console.log(`\n🎉 Hoàn tất!`);
  console.log(`   ✅ Tạo mới: ${created} sự kiện`);
  console.log(`   ⏭️  Bỏ qua:  ${skipped} sự kiện (đã tồn tại)`);
  console.log(`\n👉 Các sự kiện đã được công khai (PUBLISHED) và sẽ hiển thị trên trang chủ ngay!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
