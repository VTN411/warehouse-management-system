package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // <-- Import quan trọng
import stu.kho.backend.dto.SanPhamFilterRequest;
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
    private final CloudinaryService cloudinaryService;
    private final LoaiHangRepository loaiHangRepository; // Cần inject thêm cái này// Service upload ảnh

    public SanPhamService(SanPhamRepository sanPhamRepository,
                          NccSanPhamRepository nccSanPhamRepository,
                          HoatDongRepository hoatDongRepository,
                          NguoiDungRepository nguoiDungRepository,
                          CloudinaryService cloudinaryService, LoaiHangRepository loaiHangRepository) {
        this.sanPhamRepository = sanPhamRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.cloudinaryService = cloudinaryService;
        this.loaiHangRepository = loaiHangRepository;
    }

    // =================================================================
    // 1. CREATE (Thêm mới có ảnh)
    // =================================================================
    @Transactional
    public SanPham createSanPham(SanPhamRequest request, MultipartFile imageFile, String tenNguoiTao) {
        validateProductUniqueness(request);
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
        // 1. Kiểm tra tồn tại
        SanPham sp = sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại."));

        // --- BỔ SUNG: CHECK TỒN KHO TRƯỚC KHI XÓA ---
        // (Yêu cầu phải có hàm countTotalInventory trong Repository như đã hướng dẫn trước đó)
        int tongTon = sanPhamRepository.countTotalInventory(id);

        if (tongTon > 0) {
            throw new RuntimeException(
                    "CHẶN XÓA: Sản phẩm '" + sp.getTenSP() + "' đang còn tồn kho (" + tongTon + "). " +
                            "Vui lòng xuất kho hoặc điều chỉnh về 0 trước khi xóa."
            );
        }
        // 3. Xóa sản phẩm (Soft Delete: DaXoa = 1)
        sanPhamRepository.deleteById(id);

        // 4. Ghi log
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
    public List<SanPham> filterSanPham(SanPhamFilterRequest request) {
        return sanPhamRepository.filter(request);
    }

    private void validateProductUniqueness(SanPhamRequest request) {
        // BƯỚC 1: Tìm tất cả sản phẩm đang hoạt động (Chưa xóa) có cùng tên
        // Yêu cầu: Repository phải query "WHERE TenSP = ? AND DaXoa = 0"
        List<SanPham> existingProducts = sanPhamRepository.findByTenSP(request.getTenSP());

        // Nếu không có sản phẩm nào trùng tên -> Hợp lệ, kết thúc kiểm tra
        if (existingProducts.isEmpty()) {
            return;
        }

        // Nếu request không có danh sách NCC (null hoặc rỗng) -> Hợp lệ (vì không thể trùng cặp SP-NCC)
        if (request.getDanhSachMaNCC() == null || request.getDanhSachMaNCC().isEmpty()) {
            return;
        }

        // BƯỚC 2: Duyệt qua từng sản phẩm cũ để kiểm tra danh sách NCC
        List<Integer> newNccIds = request.getDanhSachMaNCC(); // List NCC người dùng đang chọn

        for (SanPham oldProduct : existingProducts) {
            // Lấy danh sách ID Nhà cung cấp của sản phẩm cũ này
            List<Integer> oldNccIds = nccSanPhamRepository.findMaNCCByMaSP(oldProduct.getMaSP());

            // BƯỚC 3: So sánh giao thoa (Intersection)
            // Nếu có bất kỳ NCC nào trong list MỚI nằm trong list CŨ -> BÁO LỖI
            for (Integer newId : newNccIds) {
                if (oldNccIds.contains(newId)) {
                    throw new RuntimeException(
                            "Lỗi trùng lặp: Sản phẩm '" + request.getTenSP() +
                                    "' hiện đang kinh doanh (chưa xóa) đã tồn tại với Nhà cung cấp ID " + newId +
                                    ". Vui lòng kiểm tra lại hoặc cập nhật số lượng cho sản phẩm cũ."
                    );
                }
            }
        }
        // Nếu chạy hết vòng lặp mà không ném lỗi -> Hợp lệ
    }
    public List<SanPham> getTrash() {
        return sanPhamRepository.findAllDeleted();
    }

    public void restoreSanPham(int id) {
        // 1. Tìm sản phẩm trong thùng rác để lấy MaLoai
        SanPham sp = sanPhamRepository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        // 2. Kiểm tra xem Loại hàng của nó có bị xóa không?
        if (loaiHangRepository.isDeleted(sp.getMaLoai())) {
            // NẾU CÓ: Chặn lại và báo lỗi
            throw new RuntimeException("Không thể khôi phục! Loại hàng của sản phẩm này đang bị xóa. Vui lòng khôi phục Loại hàng trước.");
        }

        // 3. Nếu Loại hàng vẫn Active, thì cho phép khôi phục sản phẩm
        sanPhamRepository.restoreById(id);
    }
}