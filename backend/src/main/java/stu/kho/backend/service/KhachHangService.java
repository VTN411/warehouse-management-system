package stu.kho.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.KhachHangRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.KhachHang;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.KhachHangRepository;
import stu.kho.backend.repository.NguoiDungRepository;

import java.util.List;

@Service
public class KhachHangService {

    private final KhachHangRepository khachHangRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public KhachHangService(KhachHangRepository khachHangRepository,
                            HoatDongRepository hoatDongRepository,
                            NguoiDungRepository nguoiDungRepository) {
        this.khachHangRepository = khachHangRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    public List<KhachHang> getAllKhachHang() {
        return khachHangRepository.findAll();
    }

    public KhachHang getKhachHangById(Integer id) {
        return khachHangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Khách hàng ID: " + id));
    }

    @Transactional
    public KhachHang createKhachHang(KhachHangRequest request, String tenNguoiTao) {
        KhachHang kh = new KhachHang();
        kh.setTenKH(request.getTenKH());
        kh.setSdt(request.getSdt());
        kh.setDiaChi(request.getDiaChi());
        kh.setEmail(request.getEmail());

        // Lưu và lấy ID mới
        int newId = khachHangRepository.save(kh);
        kh.setMaKH(newId);

        logActivity(tenNguoiTao, "Thêm khách hàng mới: " + request.getTenKH());
        return kh;
    }

    @Transactional
    public KhachHang updateKhachHang(Integer id, KhachHangRequest request, String tenNguoiSua) {
        KhachHang kh = getKhachHangById(id);

        kh.setTenKH(request.getTenKH());
        kh.setSdt(request.getSdt());
        kh.setDiaChi(request.getDiaChi());
        kh.setEmail(request.getEmail());

        khachHangRepository.update(kh);

        logActivity(tenNguoiSua, "Cập nhật thông tin khách hàng ID: " + id);
        return kh;
    }

    @Transactional
    public void deleteKhachHang(Integer id, String tenNguoiXoa) {
        if (!khachHangRepository.findById(id).isPresent()) {
            throw new RuntimeException("Khách hàng không tồn tại.");
        }
        try {
            khachHangRepository.deleteById(id);
            logActivity(tenNguoiXoa, "Xóa khách hàng ID: " + id);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa khách hàng này (đang có phiếu xuất liên quan).");
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
    public List<KhachHang> search(String keyword) {
        return khachHangRepository.search(keyword);
    }
}