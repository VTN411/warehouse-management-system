package stu.kho.backend.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.PhieuDieuChuyenFilterRequest;
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

    // 1. CREATE
    @Transactional
    public PhieuDieuChuyen create(PhieuDieuChuyenRequest req, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (req.getMaKhoXuat().equals(req.getMaKhoNhap())) {
            throw new RuntimeException("Kho xuất và Kho nhập không được trùng nhau.");
        }

        // Validate tồn kho (Quan trọng: check trước khi lưu để tránh rác DB)
        for (var item : req.getChiTiet()) {
            checkTonKho(req.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());
        }

        PhieuDieuChuyen pdc = new PhieuDieuChuyen();
        pdc.setMaKhoXuat(req.getMaKhoXuat());
        pdc.setMaKhoNhap(req.getMaKhoNhap());
        pdc.setNguoiLap(user.getMaNguoiDung());
        pdc.setGhiChu(req.getGhiChu());
        pdc.setChungTu(req.getChungTu()); // Đảm bảo DTO có trường này
        pdc.setNgayChuyen(req.getNgayChuyen()); // Lưu ngày người dùng chọn
        pdc.setTrangThai(STATUS_CHO_DUYET);

        int id = phieuDieuChuyenRepo.save(pdc);
        pdc.setMaPhieuDC(id);

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

    // 2. APPROVE
    @Transactional
    public PhieuDieuChuyen approve(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PhieuDieuChuyen pdc = getById(id);

        if (pdc.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Chỉ duyệt được phiếu đang chờ (Trạng thái hiện tại: " + pdc.getTrangThai() + ")");
        }

        // Thực hiện trừ kho
        for (ChiTietDieuChuyen ct : pdc.getChiTiet()) {
            // Check lại lần cuối đề phòng lúc tạo thì đủ nhưng lúc duyệt đã hết
            checkTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), ct.getSoLuong());

            // Trừ Kho Xuất
            capNhatTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), -ct.getSoLuong());
            // Cộng Kho Nhập
            capNhatTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), ct.getSoLuong());
        }

        pdc.setTrangThai(STATUS_DA_DUYET);
        pdc.setNguoiDuyet(user.getMaNguoiDung());
        phieuDieuChuyenRepo.update(pdc);

        logActivity(user.getMaNguoiDung(), "Duyệt phiếu điều chuyển #" + id);
        return pdc;
    }

    // 3. CANCEL
    @Transactional
    public PhieuDieuChuyen cancel(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username).orElseThrow();
        PhieuDieuChuyen pdc = getById(id);

        if (pdc.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Phiếu này đã hủy rồi.");
        }

        // Nếu đã duyệt thì phải hoàn kho
        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            for (ChiTietDieuChuyen ct : pdc.getChiTiet()) {
                // Check xem kho Nhập có đủ hàng để trả lại không (tránh âm kho nhập)
                checkTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), ct.getSoLuong());

                capNhatTonKho(pdc.getMaKhoXuat(), ct.getMaSP(), ct.getSoLuong()); // Trả về Xuất
                capNhatTonKho(pdc.getMaKhoNhap(), ct.getMaSP(), -ct.getSoLuong()); // Trừ khỏi Nhập
            }
        }

        pdc.setTrangThai(STATUS_DA_HUY);
        // Có thể lưu người hủy vào trường NguoiDuyet hoặc 1 trường riêng
        pdc.setNguoiDuyet(user.getMaNguoiDung());
        phieuDieuChuyenRepo.update(pdc);

        logActivity(user.getMaNguoiDung(), "Hủy phiếu điều chuyển #" + id);
        return pdc;
    }

    // 4. UPDATE (SỬA)
    @Transactional
    public PhieuDieuChuyen update(Integer id, PhieuDieuChuyenRequest req, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuDieuChuyen pdc = getById(id);

        // Kiểm tra thời hạn 30 ngày
        LocalDateTime limitDate = LocalDateTime.now().minusDays(30);
        // SỬA: Dùng đúng getter của Entity (NgayDieuChuyen hoặc NgayTao)
        LocalDateTime ngayCheck = pdc.getNgayChuyen() != null ? pdc.getNgayChuyen() : LocalDateTime.now();
        if (ngayCheck.isBefore(limitDate)) {
            throw new RuntimeException("Không thể sửa phiếu đã quá hạn 30 ngày.");
        }

        if (pdc.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Không thể sửa phiếu đã hủy.");
        }

        // Xử lý phiếu ĐÃ DUYỆT
        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            boolean hasPermission = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("PERM_TRANSFER_EDIT_APPROVED"));

            if (!hasPermission) {
                throw new RuntimeException("Bạn không có quyền sửa phiếu đã duyệt.");
            }

            // ROLLBACK: Hoàn trả tồn kho về trạng thái cũ
            for (var item : pdc.getChiTiet()) {
                // Kiểm tra kho nhập đủ hàng để trả không
                checkTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());

                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong()); // Cộng lại Xuất
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), -item.getSoLuong()); // Trừ đi Nhập
            }
        }

        // Xóa chi tiết cũ
        chiTietDieuChuyenRepo.deleteByMaPhieuDC(id);

        // Cập nhật thông tin phiếu Master
        if (!req.getMaKhoXuat().equals(pdc.getMaKhoXuat()) || !req.getMaKhoNhap().equals(pdc.getMaKhoNhap())) {
            if (req.getMaKhoXuat().equals(req.getMaKhoNhap())) {
                throw new RuntimeException("Kho xuất và Kho nhập không được trùng nhau.");
            }
            pdc.setMaKhoXuat(req.getMaKhoXuat());
            pdc.setMaKhoNhap(req.getMaKhoNhap());
        }
        pdc.setGhiChu(req.getGhiChu());
        pdc.setChungTu(req.getChungTu());
        pdc.setNgayChuyen(req.getNgayChuyen());

        phieuDieuChuyenRepo.update(pdc);

        // Thêm chi tiết MỚI
        for (var item : req.getChiTiet()) {
            // Check tồn kho nguồn (Quan trọng)
            checkTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());

            ChiTietDieuChuyen ct = new ChiTietDieuChuyen();
            ct.setMaPhieuDC(id);
            ct.setMaSP(item.getMaSP());
            ct.setSoLuong(item.getSoLuong());
            chiTietDieuChuyenRepo.save(ct);

            // RE-APPLY: Nếu phiếu đang DUYỆT thì trừ kho ngay lập tức theo số liệu mới
            if (pdc.getTrangThai() == STATUS_DA_DUYET) {
                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), -item.getSoLuong());
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());
            }
        }

        logActivity(user.getMaNguoiDung(), "Cập nhật phiếu điều chuyển #" + id);
        return getById(id);
    }

    // 5. DELETE
    @Transactional
    public void delete(Integer id, String username) {
        NguoiDung user = nguoiDungRepo.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuDieuChuyen pdc = getById(id);

        // Nếu phiếu đã hủy, chỉ xóa dữ liệu, không cần hoàn kho
        if (pdc.getTrangThai() == STATUS_DA_HUY) {
            chiTietDieuChuyenRepo.deleteByMaPhieuDC(id);
            phieuDieuChuyenRepo.deleteById(id);
            logActivity(user.getMaNguoiDung(), "Xóa phiếu (đã hủy) #" + id);
            return;
        }

        // Nếu phiếu ĐÃ DUYỆT -> Hoàn kho
        if (pdc.getTrangThai() == STATUS_DA_DUYET) {
            for (var item : pdc.getChiTiet()) {
                checkTonKho(pdc.getMaKhoNhap(), item.getMaSP(), item.getSoLuong());

                capNhatTonKho(pdc.getMaKhoXuat(), item.getMaSP(), item.getSoLuong());
                capNhatTonKho(pdc.getMaKhoNhap(), item.getMaSP(), -item.getSoLuong());
            }
        }

        chiTietDieuChuyenRepo.deleteByMaPhieuDC(id);
        phieuDieuChuyenRepo.deleteById(id);

        logActivity(user.getMaNguoiDung(), "Xóa phiếu điều chuyển #" + id);
    }

    // --- HELPER METHODS ---

    public PhieuDieuChuyen getById(Integer id) {
        PhieuDieuChuyen pdc = phieuDieuChuyenRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu điều chuyển #" + id));
        pdc.setChiTiet(chiTietDieuChuyenRepo.findByMaPhieuDC(id));
        return pdc;
    }

    public List<PhieuDieuChuyen> getAll() {
        return phieuDieuChuyenRepo.findAll();
    }

    public List<PhieuDieuChuyen> filter(PhieuDieuChuyenFilterRequest request) {
        return phieuDieuChuyenRepo.filter(request);
    }

    private void checkTonKho(Integer maKho, Integer maSP, Integer soLuongCan) {
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepo.findById(maSP, maKho);
        if (tonKhoOpt.isEmpty() || tonKhoOpt.get().getSoLuongTon() < soLuongCan) {
            throw new RuntimeException("Kho (ID: " + maKho + ") không đủ hàng cho sản phẩm ID: " + maSP
                    + ". Hiện có: " + (tonKhoOpt.map(ChiTietKho::getSoLuongTon).orElse(0))
                    + ", Cần: " + soLuongCan);
        }
    }

    private void capNhatTonKho(Integer maKho, Integer maSP, Integer soLuongThayDoi) {
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepo.findById(maSP, maKho);
        if (tonKhoOpt.isPresent()) {
            ChiTietKho ton = tonKhoOpt.get();
            ton.setSoLuongTon(ton.getSoLuongTon() + soLuongThayDoi);
            // Nếu dùng JDBC
            chiTietKhoRepo.updateSoLuongTon(maSP, maKho, ton.getSoLuongTon());
            // Nếu dùng JPA: chiTietKhoRepo.save(ton);
        } else {
            if (soLuongThayDoi < 0) throw new RuntimeException("Lỗi dữ liệu: Kho chưa có hàng mà lại bị trừ.");
            ChiTietKho moi = new ChiTietKho();
            moi.setMaSP(maSP);
            moi.setMaKho(maKho);
            moi.setSoLuongTon(soLuongThayDoi);
            chiTietKhoRepo.save(moi);
        }
    }

    private void logActivity(Integer maUser, String act) {
        HoatDong hd = new HoatDong();
        hd.setMaNguoiDung(maUser);
        hd.setHanhDong(act);
        hd.setThoiGianThucHien(java.time.LocalDateTime.now()); // Lấy giờ Java (đã set UTC+7)
        hoatDongRepo.save(hd);
    }
}