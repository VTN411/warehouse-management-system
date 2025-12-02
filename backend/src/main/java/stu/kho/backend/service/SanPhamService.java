package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // <-- Import quan trọng
import stu.kho.backend.dto.SanPhamRequest;
import stu.kho.backend.entity.HoatDong;
import stu.kho.backend.entity.SanPham;
import stu.kho.backend.repository.*;

import java.util.List;

@Service
public class SanPhamService {

    private final SanPhamRepository sanPhamRepository;
    private final NccSanPhamRepository nccSanPhamRepository;
    private final HoatDongRepository hoatDongRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final CloudinaryService cloudinaryService; // Service upload ảnh

    public SanPhamService(SanPhamRepository sanPhamRepository,
                          NccSanPhamRepository nccSanPhamRepository,
                          HoatDongRepository hoatDongRepository,
                          NguoiDungRepository nguoiDungRepository,
                          CloudinaryService cloudinaryService) {
        this.sanPhamRepository = sanPhamRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // =================================================================
    // 1. CREATE (Thêm mới có ảnh)
    // =================================================================
    @Transactional
    public SanPham createSanPham(SanPhamRequest request, MultipartFile imageFile, String tenNguoiTao) {
        // 1. Tạo đối tượng SanPham
        SanPham sp = new SanPham();
        sp.setTenSP(request.getTenSP());
        sp.setDonViTinh(request.getDonViTinh());
        sp.setGiaNhap(request.getGiaNhap());
        sp.setMucTonToiThieu(request.getMucTonToiThieu());
        sp.setMucTonToiDa(request.getMucTonToiDa());
        sp.setMaLoai(request.getMaLoai());
        sp.setSoLuongTon(0); // Mặc định tồn kho là 0

        // --- XỬ LÝ ẢNH ---
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(imageFile);
            sp.setHinhAnh(imageUrl); // Lưu URL ảnh vào DB
        }
        // -----------------

        // 2. Lưu vào bảng 'sanpham' và lấy ID
        int maSP = sanPhamRepository.save(sp);
        sp.setMaSP(maSP);

        // 3. Lưu liên kết N:M với Nhà Cung Cấp
        if (request.getDanhSachMaNCC() != null) {
            for (Integer maNCC : request.getDanhSachMaNCC()) {
                nccSanPhamRepository.linkNccToSanPham(maNCC, maSP);
            }
        }

        // 4. Ghi log
        logActivity(tenNguoiTao, "Thêm sản phẩm mới: " + sp.getTenSP());

        // Trả về đầy đủ thông tin (bao gồm cả list NCC vừa thêm)
        return getSanPhamById(maSP);
    }

    // =================================================================
    // 2. UPDATE (Cập nhật có ảnh)
    // =================================================================
    @Transactional
    public SanPham updateSanPham(Integer id, SanPhamRequest request, MultipartFile imageFile, String tenNguoiSua) {
        SanPham spCu = sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        // 1. Cập nhật thông tin cơ bản
        spCu.setTenSP(request.getTenSP());
        spCu.setDonViTinh(request.getDonViTinh());
        spCu.setGiaNhap(request.getGiaNhap());
        spCu.setMucTonToiThieu(request.getMucTonToiThieu());
        spCu.setMucTonToiDa(request.getMucTonToiDa());
        spCu.setMaLoai(request.getMaLoai());

        // --- XỬ LÝ ẢNH (Chỉ cập nhật nếu có file mới gửi lên) ---
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(imageFile);
            spCu.setHinhAnh(imageUrl);
        }
        // --------------------------------------------------------

        sanPhamRepository.update(spCu);

        // 2. Cập nhật liên kết NCC (Xóa cũ -> Thêm mới)
        List<Integer> oldNccIds = nccSanPhamRepository.findNccIdsByMaSP(id);
        for (Integer oldNccId : oldNccIds) {
            nccSanPhamRepository.unlinkNccFromSanPham(oldNccId, id);
        }

        if (request.getDanhSachMaNCC() != null) {
            for (Integer maNCC : request.getDanhSachMaNCC()) {
                nccSanPhamRepository.linkNccToSanPham(maNCC, id);
            }
        }

        logActivity(tenNguoiSua, "Cập nhật sản phẩm ID: " + id);

        return getSanPhamById(id);
    }

    // =================================================================
    // 3. DELETE
    // =================================================================
    @Transactional
    public void deleteSanPham(Integer id, String tenNguoiXoa) {
        if (!sanPhamRepository.findById(id).isPresent()) {
            throw new RuntimeException("Sản phẩm không tồn tại.");
        }

        // 1. Xóa liên kết N:M trước
        List<Integer> nccIds = nccSanPhamRepository.findNccIdsByMaSP(id);
        for (Integer nccId : nccIds) {
            nccSanPhamRepository.unlinkNccFromSanPham(nccId, id);
        }

        // 2. Xóa sản phẩm
        sanPhamRepository.deleteById(id);

        logActivity(tenNguoiXoa, "Xóa sản phẩm ID: " + id);
    }

    // =================================================================
    // 4. READ
    // =================================================================
    public List<SanPham> getAllSanPham() {
        return sanPhamRepository.findAll();
    }

    public SanPham getSanPhamById(Integer id) {
        return sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
    }

    // Hàm ghi log
    private void logActivity(String tenDangNhap, String hanhDong) {
        var user = nguoiDungRepository.findByTenDangNhap(tenDangNhap).orElse(null);
        if (user != null) {
            HoatDong log = new HoatDong();
            log.setMaNguoiDung(user.getMaNguoiDung());
            log.setHanhDong(hanhDong);
            hoatDongRepository.save(log);
        }
    }
    public List<SanPham> searchSanPham(String keyword) {
        return sanPhamRepository.search(keyword);
    }
}