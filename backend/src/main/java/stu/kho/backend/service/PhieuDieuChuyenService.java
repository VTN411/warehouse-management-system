package stu.kho.backend.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.PhieuDieuChuyenRequest;
import stu.kho.backend.entity.*;
import stu.kho.backend.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PhieuDieuChuyenService {

    private static final int STATUS_CHO_DUYET = 1;
    private static final int STATUS_DA_DUYET = 2;
    private static final int STATUS_DA_HUY = 3;

    private final PhieuDieuChuyenRepository phieuDieuChuyenRepo;
    private final ChiTietDieuChuyenRepository chiTietDieuChuyenRepo;
    private final ChiTietKhoRepository chiTietKhoRepo;
    private final SanPhamRepository sanPhamRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final HoatDongRepository hoatDongRepo;

    public PhieuDieuChuyenService(PhieuDieuChuyenRepository phieuDieuChuyenRepo,
                                  ChiTietDieuChuyenRepository chiTietDieuChuyenRepo,
                                  ChiTietKhoRepository chiTietKhoRepo,
                                  SanPhamRepository sanPhamRepo,
                                  NguoiDungRepository nguoiDungRepo,
                                  HoatDongRepository hoatDongRepo) {
        this.phieuDieuChuyenRepo = phieuDieuChuyenRepo;
        this.chiTietDieuChuyenRepo = chiTietDieuChuyenRepo;
        this.chiTietKhoRepo = chiTietKhoRepo;
        this.sanPhamRepo = sanPhamRepo;
        this.nguoiDungRepo = nguoiDungRepo;
        this.hoatDongRepo = hoatDongRepo;
    }

    // 1. CREATE (Tạo phiếu - Kiểm tra tồn kho nguồn)
    @Transactional
    public PhieuDieuChuyen create(PhieuDieuChuyenRequest req, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getMaKhoXuat().equals(req.getMaKhoNhap())) {
            throw new RuntimeException("Kho xuất và Kho nhập không được trùng nhau.");
        }

        // Kiểm tra tồn kho nguồn (Chưa trừ, chỉ kiểm tra)
        for (var item : req.getChiTiet()) {
            checkTonKho(req.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());
        }

        // Lưu phiếu
        PhieuDieuChuyen pdc = new PhieuDieuChuyen();
        pdc.setMaKhoXuat(req.getMaKhoXuat());
        pdc.setMaKhoNhap(req.getMaKhoNhap());
        pdc.setNguoiLap(user.getMaNguoiDung());
        pdc.setGhiChu(req.getGhiChu());
        pdc.setChungTu(req.getChungTu());
        pdc.setTrangThai(STATUS_CHO_DUYET);

        int id = phieuDieuChuyenRepo.save(pdc);
        pdc.setMaPhieuDC(id);

        // Lưu chi tiết
        for (var item : req.getChiTiet()) {
            ChiTietDieuChuyen ct = new ChiTietDieuChuyen();
            ct.setMaPhieuDC(id);
            ct.setMaSP(item.getMaSP());
            ct.setSoLuong(item.getSoLuong());
            chiTietDieuChuyenRepo.save(ct);
        }

        logActivity(user.getMaNguoiDung(), "Tạo phiếu điều chuyển #" + id);
        return getById(id);
    }

    // 2. APPROVE (Duyệt - Thực hiện chuyển hàng)
    @Transactional
    public PhieuDieuChuyen approve(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username).orElseThrow();
        PhieuDieuChuyen pdc = getById(id);

        if (pdc.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Chỉ duyệt được phiếu đang chờ.");
        }

        for (ChiTietDieuChuyen ct : pdc.getChiTiet()) {
            // Kiểm tra lại tồn kho nguồn trước khi trừ
            checkTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), ct.getSoLuong());

            // A. Trừ Kho Xuất (Số lượng âm)
            capNhatTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), -ct.getSoLuong());

            // B. Cộng Kho Nhập (Số lượng dương)
            capNhatTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), ct.getSoLuong());
        }

        pdc.setTrangThai(STATUS_DA_DUYET);
        pdc.setNguoiDuyet(user.getMaNguoiDung());
        phieuDieuChuyenRepo.update(pdc);

        logActivity(user.getMaNguoiDung(), "Duyệt phiếu điều chuyển #" + id);
        return pdc;
    }

    // 3. CANCEL (Hủy phiếu - Hoàn trả nếu đã duyệt)
    @Transactional
    public PhieuDieuChuyen cancel(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username).orElseThrow();
        PhieuDieuChuyen pdc = getById(id);

        if (pdc.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Phiếu đã hủy.");
        }

        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            // Hoàn tác: Cộng lại kho Xuất, Trừ kho Nhập
            for (ChiTietDieuChuyen ct : pdc.getChiTiet()) {
                // Kiểm tra kho Nhập có đủ hàng để trả lại không
                checkTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), ct.getSoLuong());

                capNhatTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), ct.getSoLuong()); // Trả về Xuất
                capNhatTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), -ct.getSoLuong()); // Trừ khỏi Nhập
            }
        }

        pdc.setTrangThai(STATUS_DA_HUY);
        pdc.setNguoiDuyet(user.getMaNguoiDung());
        phieuDieuChuyenRepo.update(pdc);

        logActivity(user.getMaNguoiDung(), "Hủy phiếu điều chuyển #" + id);
        return pdc;
    }

    public PhieuDieuChuyen getById(Integer id) {
        PhieuDieuChuyen pdc = phieuDieuChuyenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu điều chuyển #" + id));
        pdc.setChiTiet(chiTietDieuChuyenRepo.findByMaPhieuDC(id));
        return pdc;
    }

    public List<PhieuDieuChuyen> getAll() {
        return phieuDieuChuyenRepo.findAll();
    }

    // --- HÀM TIỆN ÍCH ---

    private void checkTonKho(Integer maKho, Integer maSP, Integer soLuongCan) {
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepo.findById(maSP, maKho);
        if (tonKhoOpt.isEmpty() || tonKhoOpt.get().getSoLuongTon() < soLuongCan) {
            throw new RuntimeException("Kho #" + maKho + " không đủ hàng SP#" + maSP);
        }
    }

    private void capNhatTonKho(Integer maKho, Integer maSP, Integer soLuongThayDoi) {
        // Logic cập nhật ChiTietKho (giống PhieuNhapService)
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepo.findById(maSP, maKho);
        if (tonKhoOpt.isPresent()) {
            ChiTietKho ton = tonKhoOpt.get();
            ton.setSoLuongTon(ton.getSoLuongTon() + soLuongThayDoi);
            chiTietKhoRepo.updateSoLuongTon(maSP, maKho, ton.getSoLuongTon());
        } else {
            if (soLuongThayDoi < 0) throw new RuntimeException("Lỗi âm kho");
            ChiTietKho moi = new ChiTietKho();
            moi.setMaSP(maSP);
            moi.setMaKho(maKho);
            moi.setSoLuongTon(soLuongThayDoi);
            chiTietKhoRepo.save(moi);
        }

        // Lưu ý: Điều chuyển nội bộ KHÔNG làm thay đổi TỔNG TỒN KHO của sản phẩm
        // (Tổng = Kho1 + Kho2). Nếu Kho1 - 10 và Kho2 + 10 thì Tổng không đổi.
        // Nên KHÔNG cần cập nhật bảng SanPham ở đây.
    }
    @Transactional
    public PhieuDieuChuyen update(Integer id, PhieuDieuChuyenRequest req, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuDieuChuyen pdc = getById(id);
//      KIỂM TRA THỜI HẠN (MỚI): Không cho sửa phiếu quá 30 ngày
        LocalDateTime limitDate = LocalDateTime.now().minusDays(30);
        if (pdc.getNgayChuyen().isBefore(limitDate)) {
            throw new RuntimeException("Không thể sửa phiếu đã được tạo quá 30 ngày.");
        }
        // 1. Kiểm tra trạng thái và Quyền
        if (pdc.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Không thể sửa phiếu đã hủy.");
        }

        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            // Kiểm tra xem user hiện tại có quyền sửa phiếu đã duyệt không
            boolean hasPermission = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("PERM_TRANSFER_EDIT_APPROVED"));

            if (!hasPermission) {
                throw new RuntimeException("Bạn không có quyền sửa phiếu đã duyệt. Vui lòng liên hệ Admin.");
            }

            // --- LOGIC HOÀN TÁC TỒN KHO (ROLLBACK) ---
            // Vì phiếu đã duyệt, hàng đã chuyển đi. Giờ ta phải trả lại trạng thái cũ trước khi cập nhật.
            for (var item : pdc.getChiTiet()) {
                // Cộng lại vào kho Xuất
                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());
                // Trừ đi khỏi kho Nhập
                // (Cần check xem kho nhập còn đủ hàng để trừ không)
                checkTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), -item.getSoLuong());
            }
        }

        // 2. Xóa chi tiết cũ (Trong DB)
        chiTietDieuChuyenRepo.deleteByMaPhieuDC(id);

        // 3. Cập nhật thông tin phiếu chính
        if (!req.getMaKhoXuat().equals(pdc.getMaKhoXuat()) || !req.getMaKhoNhap().equals(pdc.getMaKhoNhap())) {
            // Nếu đổi kho, phải kiểm tra logic phức tạp hơn.
            // Ở đây ta cho phép cập nhật MaKho
            if (req.getMaKhoXuat().equals(req.getMaKhoNhap())) {
                throw new RuntimeException("Kho xuất và Kho nhập không được trùng nhau.");
            }
            pdc.setMaKhoXuat(req.getMaKhoXuat());
            pdc.setMaKhoNhap(req.getMaKhoNhap());
        }

        pdc.setGhiChu(req.getGhiChu());
        pdc.setChungTu(req.getChungTu());

        phieuDieuChuyenRepo.update(pdc);

        // 4. Thêm chi tiết MỚI và Áp dụng Tồn kho (Nếu đã duyệt)
        for (var item : req.getChiTiet()) {
            // Luôn kiểm tra tồn kho nguồn (cho dù là Chờ duyệt hay Đã duyệt)
            // Vì nếu là Đã duyệt, ta vừa hoàn trả hàng về kho xuất ở bước Rollback, giờ check lại xem có đủ cho số lượng mới không
            checkTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());

            // Lưu chi tiết mới
            ChiTietDieuChuyen ct = new ChiTietDieuChuyen();
            ct.setMaPhieuDC(id);
            ct.setMaSP(item.getMaSP());
            ct.setSoLuong(item.getSoLuong());
            chiTietDieuChuyenRepo.save(ct);

            // --- LOGIC ÁP DỤNG LẠI (RE-APPLY) ---
            if (pdc.getTrangThai() == STATUS_DA_DUYET) {
                // Trừ kho Xuất
                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), -item.getSoLuong());
                // Cộng kho Nhập
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());
            }
        }

        logActivity(user.getMaNguoiDung(), "Cập nhật phiếu điều chuyển #" + id + " (Trạng thái: " + pdc.getTrangThai() + ")");
        return getById(id);
    }

    // =================================================================
    // 5. DELETE (Xóa phiếu)
    // =================================================================
    @Transactional
    public void delete(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuDieuChuyen pdc = getById(id);

        // Nếu phiếu ĐÃ DUYỆT -> Phải HOÀN TRẢ tồn kho trước khi xóa
        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            for (var item : pdc.getChiTiet()) {
                // Logic hoàn trả: Cộng lại Kho Xuất, Trừ đi Kho Nhập
                // 1. Cộng lại Kho Xuất
                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());

                // 2. Trừ đi Kho Nhập (Cần kiểm tra xem kho nhập có đủ hàng để trừ không)
                checkTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), -item.getSoLuong());
            }
        }

        // 1. Xóa chi tiết
        chiTietDieuChuyenRepo.deleteByMaPhieuDC(id);

        // 2. Xóa phiếu chính
        phieuDieuChuyenRepo.deleteById(id);

        logActivity(user.getMaNguoiDung(), "Xóa phiếu điều chuyển #" + id);
    }
    private void logActivity(Integer maUser, String act) {
        HoatDong hd = new HoatDong();
        hd.setMaNguoiDung(maUser);
        hd.setHanhDong(act);
        hoatDongRepo.save(hd);
    }
}