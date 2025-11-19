package stu.kho.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.KhoHangRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.KhoHang;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.KhoHangRepository;
import stu.kho.backend.repository.NguoiDungRepository;

import java.util.List;

@Service
public class KhoHangService {

    private final KhoHangRepository khoHangRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public KhoHangService(KhoHangRepository khoHangRepository,
                          HoatDongRepository hoatDongRepository,
                          NguoiDungRepository nguoiDungRepository) {
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
        KhoHang kho = getKhoHangById(id);
        kho.setTenKho(request.getTenKho());
        kho.setDiaChi(request.getDiaChi());
        kho.setGhiChu(request.getGhiChu());

        khoHangRepository.update(kho);

        logActivity(tenNguoiSua, "Cập nhật kho hàng ID: " + id);
        return kho;
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
}