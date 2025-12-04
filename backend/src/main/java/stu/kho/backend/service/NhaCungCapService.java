package stu.kho.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.NhaCungCapRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.NguoiDung;
import stu.kho.backend.entity.NhaCungCap;
import stu.kho.backend.repository.HoatDongRepository;
import stu.kho.backend.repository.NguoiDungRepository;
import stu.kho.backend.repository.NhaCungCapRepository;

import java.util.List;

@Service
public class NhaCungCapService {

    private final NhaCungCapRepository nhaCungCapRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public NhaCungCapService(NhaCungCapRepository nhaCungCapRepository,
                             HoatDongRepository hoatDongRepository,
                             NguoiDungRepository nguoiDungRepository) {
        this.nhaCungCapRepository = nhaCungCapRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    public List<NhaCungCap> getAllNhaCungCap() {
        return nhaCungCapRepository.findAll();
    }

    public NhaCungCap getNhaCungCapById(Integer id) {
        return nhaCungCapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp ID: " + id));
    }

    @Transactional
    public NhaCungCap createNhaCungCap(NhaCungCapRequest request, String tenNguoiTao) {
        NhaCungCap ncc = new NhaCungCap();
        ncc.setTenNCC(request.getTenNCC());
        ncc.setNguoiLienHe(request.getNguoiLienHe());
        ncc.setSdt(request.getSdt());
        ncc.setDiaChi(request.getDiaChi());
        ncc.setEmail(request.getEmail());

        // Gọi repository.save(), nó sẽ trả về ID (int) vừa tạo
        int newId = nhaCungCapRepository.save(ncc);

        // Gán ID đó vào đối tượng ncc
        ncc.setMaNCC(newId);



        logActivity(tenNguoiTao, "Thêm Nhà cung cấp mới: " + request.getTenNCC());

        return ncc;
    }

    @Transactional
    public NhaCungCap updateNhaCungCap(Integer id, NhaCungCapRequest request, String tenNguoiSua) {
        NhaCungCap ncc = getNhaCungCapById(id);

        ncc.setTenNCC(request.getTenNCC());
        ncc.setNguoiLienHe(request.getNguoiLienHe());
        ncc.setSdt(request.getSdt());
        ncc.setDiaChi(request.getDiaChi());
        ncc.setEmail(request.getEmail());

        nhaCungCapRepository.update(ncc); // Cần đảm bảo interface có hàm update

        logActivity(tenNguoiSua, "Cập nhật Nhà cung cấp ID: " + id);
        return ncc;
    }

    @Transactional
    public void deleteNhaCungCap(Integer id, String tenNguoiXoa) {
        if (!nhaCungCapRepository.findById(id).isPresent()) {
            throw new RuntimeException("Nhà cung cấp không tồn tại.");
        }

        try {
            nhaCungCapRepository.deleteById(id); // Cần đảm bảo interface có hàm deleteById
            logActivity(tenNguoiXoa, "Xóa Nhà cung cấp ID: " + id);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa NCC này vì đã có dữ liệu liên kết (Sản phẩm/Phiếu nhập).");
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
    public List<NhaCungCap> search(String keyword) {
        return nhaCungCapRepository.search(keyword);
    }
}