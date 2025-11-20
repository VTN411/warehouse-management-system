package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.ChiTietPhieuNhapRequest;
import stu.kho.backend.dto.PhieuNhapRequest;
import stu.kho.backend.entity.*;
import stu.kho.backend.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PhieuNhapService {

    // Khai báo hằng số cho Trạng Thái
    private static final int STATUS_CHO_DUYET = 1;
    private static final int STATUS_DA_DUYET = 2;
    private static final int STATUS_DA_HUY = 3;

    private final PhieuNhapRepository phieuNhapRepository;
    private final ChiTietPhieuNhapRepository chiTietPhieuNhapRepository;
    private final ChiTietKhoRepository chiTietKhoRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final SanPhamRepository sanPhamRepository;

    public PhieuNhapService(PhieuNhapRepository phieuNhapRepository,
                            ChiTietPhieuNhapRepository chiTietPhieuNhapRepository,
                            ChiTietKhoRepository chiTietKhoRepository,
                            HoatDongRepository hoatDongRepository,
                            NguoiDungRepository nguoiDungRepository,
                            SanPhamRepository sanPhamRepository) {
        this.phieuNhapRepository = phieuNhapRepository;
        this.chiTietPhieuNhapRepository = chiTietPhieuNhapRepository;
        this.chiTietKhoRepository = chiTietKhoRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.sanPhamRepository = sanPhamRepository;
    }

    // =================================================================
    // 1. CREATE (Tạo phiếu - Chờ duyệt)
    // =================================================================
    @Transactional
    public PhieuNhapHang createPhieuNhap(PhieuNhapRequest request, String tenNguoiLap) {

        NguoiDung nguoiLap = nguoiDungRepository.findByTenDangNhap(tenNguoiLap)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng lập phiếu."));

        // 1. Tính toán tổng tiền
        BigDecimal tongTien = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Tạo Phiếu Nhập chính - Luôn set trạng thái là "Chờ duyệt"
        PhieuNhapHang phieuNhap = new PhieuNhapHang();
        phieuNhap.setTrangThai(STATUS_CHO_DUYET); // <-- CẬP NHẬT: Luôn là 1
        phieuNhap.setMaNCC(request.getMaNCC());
        phieuNhap.setMaKho(request.getMaKho());
        phieuNhap.setNguoiLap(nguoiLap.getMaNguoiDung());
        phieuNhap.setChungTu(request.getChungTu());
        phieuNhap.setTongTien(tongTien);
        phieuNhap.setNgayLapPhieu(LocalDateTime.now());
        // (Không set NguoiDuyet khi mới tạo)

        Integer maPhieuNhapMoi = phieuNhapRepository.save(phieuNhap);
        phieuNhap.setMaPhieuNhap(maPhieuNhapMoi);

        // 3. Lưu chi tiết
        for (ChiTietPhieuNhapRequest ctRequest : request.getChiTiet()) {
            if (!sanPhamRepository.findById(ctRequest.getMaSP()).isPresent()) {
                throw new RuntimeException("Sản phẩm với Mã SP: " + ctRequest.getMaSP() + " không tồn tại.");
            }

            ChiTietPhieuNhap chiTiet = new ChiTietPhieuNhap();
            chiTiet.setMaPhieuNhap(maPhieuNhapMoi);
            chiTiet.setMaSP(ctRequest.getMaSP());
            chiTiet.setSoLuong(ctRequest.getSoLuong());
            chiTiet.setDonGia(ctRequest.getDonGia());
            chiTiet.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuNhapRepository.save(chiTiet);

            // CẬP NHẬT: KHÔNG cập nhật tồn kho khi tạo mới
        }

        // 4. Ghi Log
        logActivity(nguoiLap.getMaNguoiDung(), "Tạo Phiếu Nhập Hàng #" + maPhieuNhapMoi + " (Chờ duyệt)");
        return phieuNhap;
    }

    // =================================================================
    // 2. APPROVE (Duyệt phiếu - Phương thức MỚI)
    // =================================================================
    @Transactional
    public PhieuNhapHang approvePhieuNhap(Integer maPhieuNhap, String tenNguoiDuyet) {
        NguoiDung nguoiDuyet = nguoiDungRepository.findByTenDangNhap(tenNguoiDuyet)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng (người duyệt)."));

        PhieuNhapHang phieuNhap = getPhieuNhapById(maPhieuNhap); // Lấy phiếu và chi tiết

        // 1. Chỉ duyệt phiếu đang "Chờ duyệt"
        if (phieuNhap.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Chỉ có thể duyệt phiếu đang ở trạng thái 'Chờ duyệt'.");
        }

        // 2. CẬP NHẬT TỒN KHO (TĂNG)
        for (ChiTietPhieuNhap ct : phieuNhap.getChiTiet()) {
            capNhatTonKho(phieuNhap.getMaKho(), ct.getMaSP(), ct.getSoLuong()); // Cộng số lượng
        }

        // 3. Cập nhật trạng thái phiếu
        phieuNhap.setTrangThai(STATUS_DA_DUYET);
        phieuNhap.setNguoiDuyet(nguoiDuyet.getMaNguoiDung());
        phieuNhapRepository.update(phieuNhap); // Cập nhật trạng thái và người duyệt

        // 4. Ghi Log
        logActivity(nguoiDuyet.getMaNguoiDung(), "Đã duyệt Phiếu Nhập Hàng #" + maPhieuNhap);
        return phieuNhap;
    }

    // =================================================================
    // 3. CANCEL (Hủy phiếu)
    // =================================================================
    @Transactional
    public PhieuNhapHang cancelPhieuNhap(Integer id, String tenNguoiHuy) {
        NguoiDung nguoiHuy = nguoiDungRepository.findByTenDangNhap(tenNguoiHuy)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuNhapHang phieuNhap = getPhieuNhapById(id);

        // Kiểm tra trạng thái hiện tại
        if (phieuNhap.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Phiếu này đã bị hủy trước đó.");
        }

        // --- LOGIC MỚI: CHẶN HỦY NẾU ĐÃ DUYỆT ---
        if (phieuNhap.getTrangThai() == STATUS_DA_DUYET) {
            throw new RuntimeException("Không thể hủy phiếu đã được duyệt (Hàng đã nhập kho). Vui lòng tạo phiếu xuất để trả hàng nếu cần điều chỉnh.");
        }
        // ----------------------------------------

        // Nếu phiếu đang CHỜ DUYỆT (1) -> Cho phép hủy
        phieuNhap.setTrangThai(STATUS_DA_HUY);
        phieuNhap.setNguoiDuyet(nguoiHuy.getMaNguoiDung()); // Ghi nhận người thực hiện hủy

        phieuNhapRepository.update(phieuNhap);

        logActivity(nguoiHuy.getMaNguoiDung(), "Hủy Phiếu Nhập #" + id);
        return phieuNhap;
    }

    // =================================================================
    // 4. UPDATE (Sửa phiếu - Đã sửa đổi logic)
    // =================================================================
    // 4. UPDATE (Sửa phiếu - Đã sửa đổi logic)
    // =================================================================
    @Transactional
    public PhieuNhapHang updatePhieuNhap(Integer maPhieuNhap, PhieuNhapRequest request, String tenNguoiSua) {
        NguoiDung nguoiSua = nguoiDungRepository.findByTenDangNhap(tenNguoiSua)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        PhieuNhapHang phieuNhapCu = getPhieuNhapById(maPhieuNhap);

        // CẬP NHẬT: Chỉ cho phép sửa khi phiếu đang "Chờ duyệt"
        if (phieuNhapCu.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Không thể sửa phiếu đã được duyệt hoặc đã hủy.");
        }

        // --- BƯỚC 1: Xóa các chi tiết cũ ---
        // (Bạn đã quên bước này trong code bị lỗi)
        chiTietPhieuNhapRepository.deleteByMaPhieuNhap(maPhieuNhap);

        // --- BƯỚC 2: Tính toán Tổng tiền MỚI ---
        // (Biến 'tongTienMoi' bị thiếu trong code bị lỗi)
        BigDecimal tongTienMoi = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // --- BƯỚC 3: Cập nhật Phiếu Nhập chính ---
        phieuNhapCu.setMaNCC(request.getMaNCC());
        phieuNhapCu.setMaKho(request.getMaKho());
        phieuNhapCu.setChungTu(request.getChungTu());
        phieuNhapCu.setTongTien(tongTienMoi); // <-- Sử dụng tổng tiền mới

        phieuNhapRepository.update(phieuNhapCu);

        // --- BƯỚC 4: Thêm chi tiết MỚI ---
        // (Code bị lỗi đã lặp 2 lần, đây là phiên bản đúng)
        for (ChiTietPhieuNhapRequest ctRequest : request.getChiTiet()) {
            // (Kiểm tra SP tồn tại)
            if (!sanPhamRepository.findById(ctRequest.getMaSP()).isPresent()) {
                throw new RuntimeException("Sản phẩm với Mã SP: " + ctRequest.getMaSP() + " không tồn tại.");
            }

            ChiTietPhieuNhap chiTietMoi = new ChiTietPhieuNhap();
            chiTietMoi.setMaPhieuNhap(maPhieuNhap);

            // (Các dòng này bị thiếu trong code bị lỗi)
            chiTietMoi.setMaSP(ctRequest.getMaSP());
            chiTietMoi.setSoLuong(ctRequest.getSoLuong());
            chiTietMoi.setDonGia(ctRequest.getDonGia());
            chiTietMoi.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuNhapRepository.save(chiTietMoi);

            // CẬP NHẬT: Không cập nhật tồn kho khi sửa (vì phiếu vẫn đang chờ duyệt)
        }

        // --- BƯỚC 5: Ghi Log ---
        logActivity(nguoiSua.getMaNguoiDung(), "Cập nhật Phiếu Nhập Hàng #" + maPhieuNhap + " (Chờ duyệt)");
        return phieuNhapCu;
    }
    // =================================================================
    // 5. DELETE (Xóa phiếu - Đã sửa đổi logic)
    // =================================================================
    @Transactional
    public void deletePhieuNhap(Integer maPhieuNhap, String tenNguoiXoa) {
        NguoiDung nguoiXoa = nguoiDungRepository.findByTenDangNhap(tenNguoiXoa)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        PhieuNhapHang phieuNhap = getPhieuNhapById(maPhieuNhap);

        // CẬP NHẬT: Chỉ hoàn trả tồn kho nếu phiếu đã được duyệt
        if (phieuNhap.getTrangThai() == STATUS_DA_DUYET) {
            // HOÀN TRẢ TỒN KHO (UNDO)
            for (ChiTietPhieuNhap ct : phieuNhap.getChiTiet()) {
                capNhatTonKho(phieuNhap.getMaKho(), ct.getMaSP(), -ct.getSoLuong());
            }
        }

        // 1. Xóa Chi Tiết
        chiTietPhieuNhapRepository.deleteByMaPhieuNhap(maPhieuNhap);

        // 2. Xóa Phiếu Chính
        phieuNhapRepository.deleteById(maPhieuNhap);

        // 3. Ghi Log
        logActivity(nguoiXoa.getMaNguoiDung(), "Xóa Phiếu Nhập Hàng #" + maPhieuNhap);
    }

    // =================================================================
    // 6. READ (Các hàm Get giữ nguyên)
    // =================================================================
    public List<PhieuNhapHang> getAllPhieuNhap() {
        return phieuNhapRepository.findAll();
    }

    public PhieuNhapHang getPhieuNhapById(Integer id) {
        PhieuNhapHang pnh = phieuNhapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu Nhập #" + id));

        List<ChiTietPhieuNhap> chiTiet = chiTietPhieuNhapRepository.findByMaPhieuNhap(id);
        pnh.setChiTiet(chiTiet);

        return pnh;
    }

    // =================================================================
    // HÀM TIỆN ÍCH (Private Helper Methods)
    // =================================================================

    /**
     * Hàm private xử lý logic cập nhật tồn kho (Cộng hoặc Trừ)
     */
    private void capNhatTonKho(Integer maKho, Integer maSP, Integer soLuongThayDoi) {
        if (soLuongThayDoi == 0) return;

        // 1. Cập nhật bảng ChiTietKho (Chi tiết từng kho)
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepository.findById(maSP, maKho);

        if (tonKhoOpt.isPresent()) {
            ChiTietKho tonKho = tonKhoOpt.get();
            int soLuongMoi = tonKho.getSoLuongTon() + soLuongThayDoi;
            if (soLuongMoi < 0) {
                throw new RuntimeException("Lỗi: Tồn kho không đủ để trừ.");
            }
            chiTietKhoRepository.updateSoLuongTon(maSP, maKho, soLuongMoi);
        } else {
            if (soLuongThayDoi < 0) {
                throw new RuntimeException("Lỗi: Sản phẩm chưa có trong kho để trừ.");
            }
            ChiTietKho tonKhoMoi = new ChiTietKho();
            tonKhoMoi.setMaSP(maSP);
            tonKhoMoi.setMaKho(maKho);
            tonKhoMoi.setSoLuongTon(soLuongThayDoi);
            chiTietKhoRepository.save(tonKhoMoi);
        }

        // 2. CẬP NHẬT TỔN KHO TỔNG (Bảng SanPham)
        // Logic: Tồn tổng = Tồn tổng cũ + Thay đổi
        SanPham sanPham = sanPhamRepository.findById(maSP)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        int tongTonMoi = (sanPham.getSoLuongTon() == null ? 0 : sanPham.getSoLuongTon()) + soLuongThayDoi;

        // Cập nhật lại vào đối tượng và lưu xuống DB
        sanPham.setSoLuongTon(tongTonMoi);
        sanPhamRepository.update(sanPham);
    }

    // Ghi Log Hoạt Động
    private void logActivity(Integer maNguoiDung, String hanhDong) {
        HoatDong log = new HoatDong();
        log.setMaNguoiDung(maNguoiDung);
        log.setHanhDong(hanhDong);
        hoatDongRepository.save(log);
    }
}