package stu.kho.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.KhoHangRequest;
import stu.kho.backend.dto.SanPhamTrongKhoResponse;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.KhoHang;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.ChiTietKhoRepository;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.KhoHangRepository;
import stu.kho.backend.repository.NguoiDungRepository;

import java.util.List;

@Service
public class KhoHangService {

    private final ChiTietKhoRepository chiTietKhoRepository;
    private final KhoHangRepository khoHangRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public KhoHangService(ChiTietKhoRepository chiTietKhoRepository, KhoHangRepository khoHangRepository,
                          HoatDongRepository hoatDongRepository,
                          NguoiDungRepository nguoiDungRepository) {
        this.chiTietKhoRepository = chiTietKhoRepository;
        this.khoHangRepository = khoHangRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    public List<KhoHang> getAllKhoHang() {
        return khoHangRepository.findAll();
    }

    public KhoHang getKhoHangById(Integer id) {
        return khoHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kho hàng ID: " + id));
    }

    @Transactional
    public KhoHang createKhoHang(KhoHangRequest request, String tenNguoiTao) {
        if (khoHangRepository.existsByTenKho(request.getTenKho(), null)) {
            throw new RuntimeException("Tên kho hàng '" + request.getTenKho() + "' đã tồn tại! Vui lòng chọn tên khác.");
        }
        KhoHang kho = new KhoHang();
        kho.setTenKho(request.getTenKho());
        kho.setDiaChi(request.getDiaChi());
        kho.setGhiChu(request.getGhiChu());

        int newId = khoHangRepository.save(kho);
        kho.setMaKho(newId);

        logActivity(tenNguoiTao, "Tạo kho hàng mới: " + kho.getTenKho());
        return kho;
    }

    @Transactional
    public KhoHang updateKhoHang(Integer id, KhoHangRequest request, String tenNguoiSua) {
        // 1. Kiểm tra tồn tại và lấy dữ liệu cũ lên (Lần gọi DB thứ 1)
        KhoHang existing = khoHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho hàng không tồn tại!"));

        // 2. Kiểm tra trùng tên (Lần gọi DB thứ 2 - count)
        if (khoHangRepository.existsByTenKho(request.getTenKho(), id)) {
            throw new RuntimeException("Tên kho hàng '" + request.getTenKho() + "' đã được sử dụng!");
        }

        // 3. Cập nhật thông tin trực tiếp vào đối tượng 'existing'
        // (KHÔNG CẦN gọi getKhoHangById(id) nữa)
        existing.setTenKho(request.getTenKho());
        existing.setDiaChi(request.getDiaChi());
        existing.setGhiChu(request.getGhiChu());

        // 4. Lưu xuống DB
        khoHangRepository.update(existing);

        // 5. Ghi log
        logActivity(tenNguoiSua, "Cập nhật kho hàng ID: " + id);

        return existing;
    }

    @Transactional
    public void deleteKhoHang(Integer id, String tenNguoiXoa) {
        if (!khoHangRepository.findById(id).isPresent()) {
            throw new RuntimeException("Kho hàng không tồn tại.");
        }
        try {
            khoHangRepository.deleteById(id);
            logActivity(tenNguoiXoa, "Xóa kho hàng ID: " + id);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa kho này vì đang chứa hàng hoặc có phiếu nhập/xuất liên quan.");
        }
    }

    private void logActivity(String tenDangNhap, String hanhDong) {
        NguoiDung user = nguoiDungRepository.findByTenDangNhap(tenDangNhap).orElse(null);
        if (user != null) {
            HoatDong log = new HoatDong();
            log.setMaNguoiDung(user.getMaNguoiDung());
            log.setHanhDong(hanhDong);
            hoatDongRepository.save(log);
        }
    }
    public List<SanPhamTrongKhoResponse> getSanPhamByKho(Integer maKho) {
        // Kiểm tra kho có tồn tại không
        if (!khoHangRepository.findById(maKho).isPresent()) {
            throw new RuntimeException("Kho hàng không tồn tại.");
        }
        return chiTietKhoRepository.findSanPhamByMaKho(maKho);
    }
    public List<KhoHang> search(String keyword) {
        return khoHangRepository.search(keyword);
    }
    public List<KhoHang> getTrash() {
        return khoHangRepository.findAllDeleted();
    }

    // THÊM: Khôi phục kho hàng
    public void restoreKhoHang(Integer id) {
        khoHangRepository.restoreById(id);
    }
}