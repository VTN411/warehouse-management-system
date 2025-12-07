package stu.kho.backend.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.ChiTietPhieuXuatRequest;
import stu.kho.backend.dto.PhieuXuatFilterRequest;
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
    private final KhachHangRepository khachHangRepository;


    public PhieuXuatService(PhieuXuatRepository phieuXuatRepository,
                            ChiTietPhieuXuatRepository chiTietPhieuXuatRepository,
                            ChiTietKhoRepository chiTietKhoRepository,
                            HoatDongRepository hoatDongRepository,
                            NguoiDungRepository nguoiDungRepository,
                            SanPhamRepository sanPhamRepository, KhachHangRepository khachHangRepository) {
        this.phieuXuatRepository = phieuXuatRepository;
        this.chiTietPhieuXuatRepository = chiTietPhieuXuatRepository;
        this.chiTietKhoRepository = chiTietKhoRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.sanPhamRepository = sanPhamRepository;
        this.khachHangRepository = khachHangRepository;
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
        Optional<ChiTietKho> tonKhoOpt = chiTietKhoRepository.findByIdForUpdate(maSP, maKho);
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

        // --- LOGIC MỚI ---
        if (phieuXuatCu.getTrangThai() == STATUS_DA_HUY) {
            throw new RuntimeException("Không thể sửa phiếu đã hủy.");
        }
// 2. KIỂM TRA THỜI HẠN (MỚI): Không cho sửa phiếu quá 30 ngày
        LocalDateTime limitDate = LocalDateTime.now().minusDays(30);
        if (phieuXuatCu.getNgayLapPhieu().isBefore(limitDate)) {
            throw new RuntimeException("Không thể sửa phiếu đã được tạo quá 30 ngày.");
        }
        if (phieuXuatCu.getTrangThai() == STATUS_DA_DUYET) {
            // Check quyền
            boolean hasPerm = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("PERM_PHIEUXUAT_EDIT_APPROVED"));

            if (!hasPerm) {
                throw new RuntimeException("Bạn không có quyền sửa phiếu xuất đã duyệt.");
            }

            // ROLLBACK KHO (Cộng lại số lượng cũ vào kho)
            for (ChiTietPhieuXuat ctCu : phieuXuatCu.getChiTiet()) {
                capNhatTonKho(phieuXuatCu.getMaKho(), ctCu.getMaSP(), ctCu.getSoLuong());
            }
        }
        // -----------------

        // Xóa chi tiết cũ
        chiTietPhieuXuatRepository.deleteByMaPhieuXuat(maPhieuXuat);

        // Tính tổng tiền mới & Update phiếu
        BigDecimal tongTienMoi = request.getChiTiet().stream()
                .map(ct -> ct.getDonGia().multiply(new BigDecimal(ct.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        phieuXuatCu.setMaKH(request.getMaKH());
        phieuXuatCu.setMaKho(request.getMaKho());
        phieuXuatCu.setChungTu(request.getChungTu());
        phieuXuatCu.setTongTien(tongTienMoi);

        phieuXuatRepository.update(phieuXuatCu);

        // Thêm chi tiết MỚI
        for (ChiTietPhieuXuatRequest ctRequest : request.getChiTiet()) {
            // Kiểm tra tồn kho (Rất quan trọng với phiếu xuất)
            // Nếu đang là Đã Duyệt, kho đã được cộng lại ở bước Rollback, giờ check xem có đủ để trừ mới không
            checkTonKhoDu(request.getMaKho(), ctRequest.getMaSP(), ctRequest.getSoLuong());

            ChiTietPhieuXuat chiTietMoi = new ChiTietPhieuXuat();
            chiTietMoi.setMaPhieuXuat(maPhieuXuat);
            chiTietMoi.setMaSP(ctRequest.getMaSP());
            chiTietMoi.setSoLuong(ctRequest.getSoLuong());
            chiTietMoi.setDonGia(ctRequest.getDonGia());
            chiTietMoi.setThanhTien(ctRequest.getDonGia().multiply(new BigDecimal(ctRequest.getSoLuong())));
            chiTietPhieuXuatRepository.save(chiTietMoi);

            // --- LOGIC MỚI: ÁP DỤNG LẠI KHO (Nếu đang là Đã Duyệt) ---
            if (phieuXuatCu.getTrangThai() == STATUS_DA_DUYET) {
                // Trừ kho (Số âm)
                capNhatTonKho(request.getMaKho(), ctRequest.getMaSP(), -ctRequest.getSoLuong());
            }
            // --------------------------------------------------------
        }

        logActivity(nguoiSua.getMaNguoiDung(), "Cập nhật Phiếu Xuất Hàng #" + maPhieuXuat + " (Trạng thái: " + phieuXuatCu.getTrangThai() + ")");
        return getPhieuXuatById(maPhieuXuat);
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

    public List<PhieuXuatHang> filter(PhieuXuatFilterRequest request) {
        return phieuXuatRepository.filter(request);
    }
    @Transactional
    public PhieuXuatHang createPhieuXuatForGiangVien(PhieuXuatRequest request, String username) {
        // 1. Lấy thông tin Giảng viên (User)
        NguoiDung giangVienUser = nguoiDungRepository.findByTenDangNhap(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Tìm hoặc Tạo Khách Hàng tương ứng với Giảng viên này
        // (Tìm theo email hoặc tên để tránh trùng lặp)
        Integer maKhachHang = findOrCreateCustomerFromUser(giangVienUser);

        // 3. Gán MaKH vào request và gọi hàm tạo phiếu chuẩn
        request.setMaKH(maKhachHang);

        // Gọi lại hàm create chuẩn
        return createPhieuXuat(request, username);
    }

    // Hàm tiện ích: Tìm hoặc Tạo Khách Hàng từ User
    private Integer findOrCreateCustomerFromUser(NguoiDung user) {
        // Tìm xem có KH nào trùng email không
        List<KhachHang> existing = khachHangRepository.search(user.getEmail());

        if (!existing.isEmpty()) {
            return existing.get(0).getMaKH();
        }

        // Nếu chưa có, tạo KH mới
        KhachHang newCus = new KhachHang();
        newCus.setTenKH(user.getHoTen() + " (GV)");
        newCus.setEmail(user.getEmail());
        newCus.setSdt(user.getSdt());
        newCus.setDiaChi("Trường học"); // Mặc định hoặc lấy từ user nếu có

        int newId = khachHangRepository.save(newCus);
        return newId;
    }
}