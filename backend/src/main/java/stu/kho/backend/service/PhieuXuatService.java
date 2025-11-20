package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.ChiTietPhieuXuatRequest;
import stu.kho.backend.dto.PhieuXuatRequest;
import stu.kho.backend.entity.*;
import stu.kho.backend.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PhieuXuatService {

    private static final int STATUS_CHO_DUYET = 1;
    private static final int STATUS_DA_DUYET = 2;
    private static final int STATUS_DA_HUY = 3;

    private final PhieuXuatRepository phieuXuatRepository;
    private final ChiTietPhieuXuatRepository chiTietPhieuXuatRepository;
    private final ChiTietKhoRepository chiTietKhoRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final SanPhamRepository sanPhamRepository;

    public PhieuXuatService(PhieuXuatRepository phieuXuatRepository,
                            ChiTietPhieuXuatRepository chiTietPhieuXuatRepository,
                            ChiTietKhoRepository chiTietKhoRepository,
                            HoatDongRepository hoatDongRepository,
                            NguoiDungRepository nguoiDungRepository,
                            SanPhamRepository sanPhamRepository) {
        this.phieuXuatRepository = phieuXuatRepository;
        this.chiTietPhieuXuatRepository = chiTietPhieuXuatRepository;
        this.chiTietKhoRepository = chiTietKhoRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.sanPhamRepository = sanPhamRepository;
    }

    // =================================================================
    // 1. CREATE (Tạo phiếu - CHƯA TRỪ KHO)
    // =================================================================
    @Transactional
    public PhieuXuatHang createPhieuXuat(PhieuXuatRequest request, String tenNguoiLap) {
        NguoiDung nguoiLap = nguoiDungRepository.findByTenDangNhap(tenNguoiLap)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        // 1. Kiểm tra xem kho có đủ hàng để xuất không (Kiểm tra trước)
        for (ChiTietPhieuXuatRequest item : request.getChiTiet()) {
            checkTonKhoDu(request.getMaKho(), item.getMaSP(), item.getSoLuong());
        }

        // 2. Tính tổng tiền
        BigDecimal tongTien = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Lưu Phiếu Chính (Trạng thái = 1)
        PhieuXuatHang phieuXuat = new PhieuXuatHang();
        phieuXuat.setTrangThai(STATUS_CHO_DUYET);
        phieuXuat.setMaKH(request.getMaKH());
        phieuXuat.setMaKho(request.getMaKho());
        phieuXuat.setNguoiLap(nguoiLap.getMaNguoiDung());
        phieuXuat.setChungTu(request.getChungTu());
        phieuXuat.setTongTien(tongTien);
        phieuXuat.setNgayLapPhieu(LocalDateTime.now());

        Integer maPhieuXuatMoi = phieuXuatRepository.save(phieuXuat);
        phieuXuat.setMaPhieuXuat(maPhieuXuatMoi);

        // 4. Lưu Chi Tiết
        for (ChiTietPhieuXuatRequest ctRequest : request.getChiTiet()) {
            ChiTietPhieuXuat chiTiet = new ChiTietPhieuXuat();
            chiTiet.setMaPhieuXuat(maPhieuXuatMoi);
            chiTiet.setMaSP(ctRequest.getMaSP());
            chiTiet.setSoLuong(ctRequest.getSoLuong());
            chiTiet.setDonGia(ctRequest.getDonGia());
            chiTiet.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuXuatRepository.save(chiTiet);
        }

        logActivity(nguoiLap.getMaNguoiDung(), "Tạo Phiếu Xuất Hàng #" + maPhieuXuatMoi);
        return phieuXuat;
    }

    // =================================================================
    // 2. APPROVE (Duyệt - TRỪ TỒN KHO)
    // =================================================================
    @Transactional
    public PhieuXuatHang approvePhieuXuat(Integer id, String tenNguoiDuyet) {
        NguoiDung nguoiDuyet = nguoiDungRepository.findByTenDangNhap(tenNguoiDuyet)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuXuatHang phieuXuat = getPhieuXuatById(id);

        if (phieuXuat.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Chỉ duyệt được phiếu đang chờ.");
        }

        // 1. Trừ Tồn Kho
        for (ChiTietPhieuXuat ct : phieuXuat.getChiTiet()) {
            // Số lượng ÂM (-) để trừ đi
            capNhatTonKho(phieuXuat.getMaKho(), ct.getMaSP(), -ct.getSoLuong());
        }

        // 2. Cập nhật trạng thái
        phieuXuat.setTrangThai(STATUS_DA_DUYET);
        phieuXuat.setNguoiDuyet(nguoiDuyet.getMaNguoiDung());
        phieuXuatRepository.update(phieuXuat);

        logActivity(nguoiDuyet.getMaNguoiDung(), "Duyệt Phiếu Xuất #" + id);
        return phieuXuat;
    }

    // =================================================================
    // 3. CANCEL (Hủy - KHÔNG HOÀN TRẢ TỒN KHO)
    // =================================================================
    @Transactional
    public PhieuXuatHang cancelPhieuXuat(Integer id, String tenNguoiHuy) {
        NguoiDung nguoiHuy = nguoiDungRepository.findByTenDangNhap(tenNguoiHuy)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PhieuXuatHang phieuXuat = getPhieuXuatById(id);

        // Kiểm tra trạng thái hiện tại
        if (phieuXuat.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Phiếu này đã bị hủy trước đó.");
        }

        // --- LOGIC MỚI: CHẶN HỦY NẾU ĐÃ DUYỆT ---
        if (phieuXuat.getTrangThai() == STATUS_DA_DUYET) {
            throw new RuntimeException("Không thể hủy phiếu đã được duyệt (Hàng đã xuất). Vui lòng tạo phiếu nhập hàng nếu cần điều chỉnh.");
        }
        // ----------------------------------------

        // Nếu phiếu đang CHỜ DUYỆT (1) -> Cho phép hủy
        phieuXuat.setTrangThai(STATUS_DA_HUY);
        phieuXuat.setNguoiDuyet(nguoiHuy.getMaNguoiDung()); // Ghi nhận người thực hiện hủy

        phieuXuatRepository.update(phieuXuat);

        logActivity(nguoiHuy.getMaNguoiDung(), "Hủy Phiếu Xuất #" + id);
        return phieuXuat;
    }

    public PhieuXuatHang getPhieuXuatById(Integer id) {
        PhieuXuatHang pxh = phieuXuatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu xuất " + id));
        pxh.setChiTiet(chiTietPhieuXuatRepository.findByMaPhieuXuat(id));
        return pxh;
    }

    public List<PhieuXuatHang> getAllPhieuXuat() {
        return phieuXuatRepository.findAll();
    }

    // =================================================================
    // HÀM TIỆN ÍCH (CẬP NHẬT ĐỒNG BỘ)
    // =================================================================

    private void checkTonKhoDu(Integer maKho, Integer maSP, Integer soLuongCan) {
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepository.findById(maSP, maKho);
        if (tonKhoOpt.isEmpty() || tonKhoOpt.get().getSoLuongTon() < soLuongCan) {
            throw new RuntimeException("Sản phẩm SP#" + maSP + " không đủ hàng trong kho #" + maKho + " để xuất.");
        }
    }

    private void capNhatTonKho(Integer maKho, Integer maSP, Integer soLuongThayDoi) {
        // 1. Cập nhật ChiTietKho (Tồn kho chi tiết)
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepository.findById(maSP, maKho);

        if (tonKhoOpt.isPresent()) {
            ChiTietKho tonKho = tonKhoOpt.get();
            int moi = tonKho.getSoLuongTon() + soLuongThayDoi;

            if (moi < 0) throw new RuntimeException("Lỗi: Tồn kho bị âm sau khi xuất!");

            chiTietKhoRepository.updateSoLuongTon(maSP, maKho, moi);
        } else {
            // Trường hợp xuất mà không có dòng tồn kho (không thể xảy ra nếu đã checkTonKhoDu)
            if (soLuongThayDoi < 0) throw new RuntimeException("Lỗi dữ liệu: Không tìm thấy bản ghi tồn kho để trừ.");
        }

        // 2. Cập nhật SanPham (Tổng tồn kho) - ĐỒNG BỘ DỮ LIỆU
        SanPham sp = sanPhamRepository.findById(maSP).orElseThrow();
        int tongHienTai = (sp.getSoLuongTon() == null) ? 0 : sp.getSoLuongTon();
        sp.setSoLuongTon(tongHienTai + soLuongThayDoi);

        sanPhamRepository.update(sp);
    }

    private void logActivity(Integer maUser, String act) {
        HoatDong hd = new HoatDong();
        hd.setMaNguoiDung(maUser);
        hd.setHanhDong(act);
        hoatDongRepository.save(hd);
    }
    // =================================================================
    // 4. UPDATE (Sửa phiếu xuất)
    // =================================================================
    @Transactional
    public PhieuXuatHang updatePhieuXuat(Integer maPhieuXuat, PhieuXuatRequest request, String tenNguoiSua) {
        NguoiDung nguoiSua = nguoiDungRepository.findByTenDangNhap(tenNguoiSua)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        PhieuXuatHang phieuXuatCu = getPhieuXuatById(maPhieuXuat);

        // LOGIC: Chỉ cho phép sửa khi phiếu đang "Chờ duyệt"
        if (phieuXuatCu.getTrangThai() != STATUS_CHO_DUYET) {
            throw new RuntimeException("Không thể sửa phiếu đã được duyệt hoặc đã hủy.");
        }

        // 1. Xóa các chi tiết cũ
        chiTietPhieuXuatRepository.deleteByMaPhieuXuat(maPhieuXuat);

        // 2. Tính toán lại Tổng tiền MỚI
        BigDecimal tongTienMoi = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Cập nhật Phiếu Chính
        phieuXuatCu.setMaKH(request.getMaKH());
        phieuXuatCu.setMaKho(request.getMaKho());
        phieuXuatCu.setChungTu(request.getChungTu());
        phieuXuatCu.setTongTien(tongTienMoi);

        phieuXuatRepository.update(phieuXuatCu);

        // 4. Thêm chi tiết MỚI
        for (ChiTietPhieuXuatRequest ctRequest : request.getChiTiet()) {
            // Kiểm tra xem kho có đủ hàng cho số lượng mới không
            checkTonKhoDu(request.getMaKho(), ctRequest.getMaSP(), ctRequest.getSoLuong());

            ChiTietPhieuXuat chiTietMoi = new ChiTietPhieuXuat();
            chiTietMoi.setMaPhieuXuat(maPhieuXuat);
            chiTietMoi.setMaSP(ctRequest.getMaSP());
            chiTietMoi.setSoLuong(ctRequest.getSoLuong());
            chiTietMoi.setDonGia(ctRequest.getDonGia());
            chiTietMoi.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));

            chiTietPhieuXuatRepository.save(chiTietMoi);

            // LƯU Ý: Vẫn chưa trừ tồn kho ở đây (vì vẫn là Chờ duyệt)
        }

        logActivity(nguoiSua.getMaNguoiDung(), "Cập nhật Phiếu Xuất Hàng #" + maPhieuXuat + " (Chờ duyệt)");
        return phieuXuatCu;
    }

    // =================================================================
    // 5. DELETE (Xóa phiếu xuất)
    // =================================================================
    @Transactional
    public void deletePhieuXuat(Integer maPhieuXuat, String tenNguoiXoa) {
        NguoiDung nguoiXoa = nguoiDungRepository.findByTenDangNhap(tenNguoiXoa)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        PhieuXuatHang phieuXuat = getPhieuXuatById(maPhieuXuat);

        // LOGIC: Nếu phiếu ĐÃ DUYỆT -> Phải HOÀN TRẢ TỒN KHO trước khi xóa
        if (phieuXuat.getTrangThai() == STATUS_DA_DUYET) {
            for (ChiTietPhieuXuat ct : phieuXuat.getChiTiet()) {
                // Số lượng DƯƠNG (+) để cộng lại vào kho
                capNhatTonKho(phieuXuat.getMaKho(), ct.getMaSP(), ct.getSoLuong());
            }
        }

        // 1. Xóa Chi Tiết
        chiTietPhieuXuatRepository.deleteByMaPhieuXuat(maPhieuXuat);

        // 2. Xóa Phiếu Chính
        phieuXuatRepository.deleteById(maPhieuXuat);

        logActivity(nguoiXoa.getMaNguoiDung(), "Xóa Phiếu Xuất Hàng #" + maPhieuXuat);
    }
}