package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Đảm bảo đã import
import stu.kho.backend.dto.ChiTietPhieuNhapRequest;
import stu.kho.backend.dto.PhieuNhapRequest;
import stu.kho.backend.entity.ChiTietKho;
import stu.kho.backend.entity.ChiTietPhieuNhap;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.PhieuNhapHang;
import stu.kho.backend.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PhieuNhapService {

    private final PhieuNhapRepository phieuNhapRepository;
    private final ChiTietPhieuNhapRepository chiTietPhieuNhapRepository;
    private final ChiTietKhoRepository chiTietKhoRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final SanPhamRepository sanPhamRepository; // Cần để kiểm tra

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
    // 1. CREATE (Tạo mới Phiếu Nhập)
    // =================================================================
    @Transactional
    public PhieuNhapHang createPhieuNhap(PhieuNhapRequest request, String tenNguoiLap) {

        NguoiDung nguoiLap = nguoiDungRepository.findByTenDangNhap(tenNguoiLap)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng lập phiếu."));

        // 1. Tính toán tổng tiền từ chi tiết
        BigDecimal tongTien = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Tạo và Lưu Phiếu Nhập chính
        PhieuNhapHang phieuNhap = new PhieuNhapHang();
        phieuNhap.setTrangThai(request.getTrangThai());
        phieuNhap.setMaNCC(request.getMaNCC());
        phieuNhap.setMaKho(request.getMaKho());
        phieuNhap.setNguoiLap(nguoiLap.getMaNguoiDung());
        phieuNhap.setNguoiDuyet(request.getNguoiDuyet());
        phieuNhap.setChungTu(request.getChungTu());
        phieuNhap.setTongTien(tongTien);
        phieuNhap.setNgayLapPhieu(LocalDateTime.now());

        Integer maPhieuNhapMoi = phieuNhapRepository.save(phieuNhap);
        phieuNhap.setMaPhieuNhap(maPhieuNhapMoi);

        // 3. Lặp qua danh sách chi tiết và xử lý
        for (ChiTietPhieuNhapRequest ctRequest : request.getChiTiet()) {
            // Kiểm tra sản phẩm tồn tại
            if (!sanPhamRepository.findById(ctRequest.getMaSP()).isPresent()) {
                throw new RuntimeException("Sản phẩm với Mã SP: " + ctRequest.getMaSP() + " không tồn tại.");
            }

            // 3a. Lưu Chi Tiết Phiếu Nhập
            ChiTietPhieuNhap chiTiet = new ChiTietPhieuNhap();
            chiTiet.setMaPhieuNhap(maPhieuNhapMoi);
            chiTiet.setMaSP(ctRequest.getMaSP());
            chiTiet.setSoLuong(ctRequest.getSoLuong());
            chiTiet.setDonGia(ctRequest.getDonGia());
            chiTiet.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuNhapRepository.save(chiTiet);

            // 3b. Cập nhật Tồn Kho (ChiTietKho) - TĂNG SỐ LƯỢNG
            capNhatTonKho(request.getMaKho(), ctRequest.getMaSP(), ctRequest.getSoLuong());
        }

        // 4. Ghi Log Hoạt Động
        logActivity(nguoiLap.getMaNguoiDung(), "Tạo Phiếu Nhập Hàng mới #" + maPhieuNhapMoi);

        return phieuNhap;
    }

    // =================================================================
    // 2. READ (Lấy danh sách)
    // =================================================================
    public List<PhieuNhapHang> getAllPhieuNhap() {
        return phieuNhapRepository.findAll();
    }

    // =================================================================
    // 3. READ (Lấy chi tiết 1 phiếu)
    // =================================================================
    public PhieuNhapHang getPhieuNhapById(Integer id) {
        PhieuNhapHang pnh = phieuNhapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu Nhập #" + id));

        // Tải các chi tiết đính kèm
        List<ChiTietPhieuNhap> chiTiet = chiTietPhieuNhapRepository.findByMaPhieuNhap(id);
        pnh.setChiTiet(chiTiet); // (Đã thêm trường List<ChiTietPhieuNhap> chiTiet vào PhieuNhapHang.java)

        return pnh;
    }

    // =================================================================
    // 4. UPDATE (Sửa phiếu)
    // =================================================================
    @Transactional
    public PhieuNhapHang updatePhieuNhap(Integer maPhieuNhap, PhieuNhapRequest request, String tenNguoiSua) {
        NguoiDung nguoiSua = nguoiDungRepository.findByTenDangNhap(tenNguoiSua)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        // 1. Lấy phiếu nhập cũ và chi tiết cũ
        PhieuNhapHang phieuNhapCu = getPhieuNhapById(maPhieuNhap);

        // 2. HOÀN TRẢ TỒN KHO (UNDO)
        // Trừ đi số lượng của phiếu nhập CŨ khỏi tồn kho
        for (ChiTietPhieuNhap ctCu : phieuNhapCu.getChiTiet()) {
            capNhatTonKho(phieuNhapCu.getMaKho(), ctCu.getMaSP(), -ctCu.getSoLuong()); // Trừ đi số lượng
        }

        // 3. Xóa các chi tiết cũ
        chiTietPhieuNhapRepository.deleteByMaPhieuNhap(maPhieuNhap);

        // 4. Tính toán và Cập nhật Phiếu Nhập chính
        BigDecimal tongTienMoi = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Cập nhật các trường trên phiếu cũ
        phieuNhapCu.setTrangThai(request.getTrangThai());
        phieuNhapCu.setMaNCC(request.getMaNCC());
        phieuNhapCu.setMaKho(request.getMaKho());
        phieuNhapCu.setNguoiDuyet(request.getNguoiDuyet());
        phieuNhapCu.setChungTu(request.getChungTu());
        phieuNhapCu.setTongTien(tongTienMoi);

        phieuNhapRepository.update(phieuNhapCu);

        // 5. Thêm chi tiết MỚI và Cập nhật Tồn kho MỚI
        for (ChiTietPhieuNhapRequest ctRequest : request.getChiTiet()) {
            // Kiểm tra SP tồn tại
            if (!sanPhamRepository.findById(ctRequest.getMaSP()).isPresent()) {
                throw new RuntimeException("Sản phẩm với Mã SP: " + ctRequest.getMaSP() + " không tồn tại.");
            }

            ChiTietPhieuNhap chiTietMoi = new ChiTietPhieuNhap();
            chiTietMoi.setMaPhieuNhap(maPhieuNhap);
            chiTietMoi.setMaSP(ctRequest.getMaSP());
            chiTietMoi.setSoLuong(ctRequest.getSoLuong());
            chiTietMoi.setDonGia(ctRequest.getDonGia());
            chiTietMoi.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuNhapRepository.save(chiTietMoi);

            // Cập nhật Tồn Kho (Cộng số lượng MỚI)
            capNhatTonKho(request.getMaKho(), ctRequest.getMaSP(), ctRequest.getSoLuong());
        }

        // 6. Ghi Log
        logActivity(nguoiSua.getMaNguoiDung(), "Cập nhật Phiếu Nhập Hàng #" + maPhieuNhap);
        return phieuNhapCu;
    }

    // =================================================================
    // 5. DELETE (Xóa phiếu)
    // =================================================================
    @Transactional
    public void deletePhieuNhap(Integer maPhieuNhap, String tenNguoiXoa) {
        NguoiDung nguoiXoa = nguoiDungRepository.findByTenDangNhap(tenNguoiXoa)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        // 1. Lấy phiếu nhập và chi tiết
        PhieuNhapHang phieuNhap = getPhieuNhapById(maPhieuNhap);

        // 2. HOÀN TRẢ TỒN KHO (UNDO)
        // Trừ đi số lượng của phiếu nhập khỏi tồn kho
        for (ChiTietPhieuNhap ct : phieuNhap.getChiTiet()) {
            capNhatTonKho(phieuNhap.getMaKho(), ct.getMaSP(), -ct.getSoLuong());
        }

        // 3. Xóa Chi Tiết (Phải làm trước do ràng buộc FK)
        chiTietPhieuNhapRepository.deleteByMaPhieuNhap(maPhieuNhap);

        // 4. Xóa Phiếu Chính
        phieuNhapRepository.deleteById(maPhieuNhap);

        // 5. Ghi Log
        logActivity(nguoiXoa.getMaNguoiDung(), "Xóa Phiếu Nhập Hàng #" + maPhieuNhap);
    }


    // =================================================================
    // HÀM TIỆN ÍCH (Private Helper Methods)
    // =================================================================

    /**
     * Hàm private xử lý logic cập nhật tồn kho (Cộng hoặc Trừ)
     */
    private void capNhatTonKho(Integer maKho, Integer maSP, Integer soLuongThayDoi) {
        if (soLuongThayDoi == 0) return;

        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepository.findById(maSP, maKho);

        if (tonKhoOpt.isPresent()) {
            ChiTietKho tonKho = tonKhoOpt.get();
            int soLuongMoi = tonKho.getSoLuongTon() + soLuongThayDoi;

            if (soLuongMoi < 0) {
                throw new RuntimeException("Lỗi nghiệp vụ: Tồn kho sản phẩm SP#" + maSP + " không đủ để thực hiện thao tác (Sẽ âm kho).");
            }
            chiTietKhoRepository.updateSoLuongTon(maSP, maKho, soLuongMoi);
        } else {
            if (soLuongThayDoi < 0) {
                throw new RuntimeException("Lỗi nghiệp vụ: Sản phẩm SP#" + maSP + " không có trong kho #" + maKho + " để trừ.");
            }
            ChiTietKho tonKhoMoi = new ChiTietKho();
            tonKhoMoi.setMaSP(maSP);
            tonKhoMoi.setMaKho(maKho);
            tonKhoMoi.setSoLuongTon(soLuongThayDoi);
            // (Bạn có thể thêm logic nhập SoLo, NgayHetHan từ DTO nếu cần)
            chiTietKhoRepository.save(tonKhoMoi);
        }
    }

    // Ghi Log Hoạt Động
    private void logActivity(Integer maNguoiDung, String hanhDong) {
        HoatDong log = new HoatDong();
        log.setMaNguoiDung(maNguoiDung);
        log.setHanhDong(hanhDong);
        hoatDongRepository.save(log);
    }
}