package stu.kho.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.LoaiHangRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.LoaiHang;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.LoaiHangRepository;
import stu.kho.backend.repository.NguoiDungRepository;

import java.util.List;

@Service
public class LoaiHangService {

    private final LoaiHangRepository loaiHangRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public LoaiHangService(LoaiHangRepository loaiHangRepository,
                           HoatDongRepository hoatDongRepository,
                           NguoiDungRepository nguoiDungRepository) {
        this.loaiHangRepository = loaiHangRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    public List<LoaiHang> getAllLoaiHang() {
        return loaiHangRepository.findAll();
    }

    public LoaiHang getLoaiHangById(Integer id) {
        return loaiHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loại hàng không tồn tại ID: " + id));
    }

    @Transactional
    public LoaiHang createLoaiHang(LoaiHangRequest request, String tenNguoiTao) {
        if (loaiHangRepository.existsByTenLoai(request.getTenLoai(), null)) {
            throw new RuntimeException("Tên loại hàng '" + request.getTenLoai() + "' đã tồn tại! Vui lòng chọn tên khác.");
        }
        LoaiHang lh = new LoaiHang();
        lh.setTenLoai(request.getTenLoai());
        lh.setMoTa(request.getMoTa());

        int newId = loaiHangRepository.save(lh);
        lh.setMaLoai(newId);

        logActivity(tenNguoiTao, "Thêm loại hàng mới: " + request.getTenLoai());
        return lh;
    }

    @Transactional
    public LoaiHang updateLoaiHang(Integer id, LoaiHangRequest request, String tenNguoiSua) {
        // Kiểm tra tồn tại
        LoaiHang existing = loaiHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loại hàng không tồn tại!"));

        // --- CHECK TRÙNG TÊN (Truyền ID hiện tại để loại trừ) ---
        if (loaiHangRepository.existsByTenLoai(request.getTenLoai(), id)) {
            throw new RuntimeException("Tên loại hàng '" + request.getTenLoai() + "' đã được sử dụng bởi loại hàng khác!");
        }
        existing.setTenLoai(request.getTenLoai());
        existing.setMoTa(request.getMoTa());

        loaiHangRepository.update(existing);
        logActivity(tenNguoiSua, "Cập nhật loại hàng ID: " + id);
        return existing;
    }

    @Transactional
    public void deleteLoaiHang(Integer id, String tenNguoiXoa) {
        getLoaiHangById(id); // Check tồn tại
        try {
            loaiHangRepository.deleteById(id);
            logActivity(tenNguoiXoa, "Xóa loại hàng ID: " + id);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa loại hàng này vì đang có sản phẩm thuộc loại này.");
        }
    }

    private void logActivity(String username, String action) {
        var user = nguoiDungRepository.findByTenDangNhap(username).orElse(null);
        if (user != null) {
            HoatDong log = new HoatDong();
            log.setMaNguoiDung(user.getMaNguoiDung());
            log.setHanhDong(action);
            log.setThoiGianThucHien(java.time.LocalDateTime.now()); // Lấy giờ Java (đã set UTC+7)
            hoatDongRepository.save(log);
        }
    }
    public List<LoaiHang> search(String keyword) {
        return loaiHangRepository.search(keyword);
    }
    public List<LoaiHang> getTrash() {
        return loaiHangRepository.findAllDeleted();
    }

    public void restoreLoaiHang(int id) {
        loaiHangRepository.restoreById(id);
    }

}