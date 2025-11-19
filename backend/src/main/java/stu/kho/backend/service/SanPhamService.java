package stu.kho.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    public SanPhamService(SanPhamRepository sanPhamRepository,
                          NccSanPhamRepository nccSanPhamRepository,
                          HoatDongRepository hoatDongRepository,
                          NguoiDungRepository nguoiDungRepository) {
        this.sanPhamRepository = sanPhamRepository;
        this.nccSanPhamRepository = nccSanPhamRepository;
        this.hoatDongRepository = hoatDongRepository;
        this.nguoiDungRepository = nguoiDungRepository;
    }

    // =================================================================
    // 1. CREATE
    // =================================================================
    @Transactional
    public SanPham createSanPham(SanPhamRequest request, String tenNguoiTao) {
        // 1. Tạo đối tượng SanPham
        SanPham sp = new SanPham();
        sp.setTenSP(request.getTenSP());
        sp.setDonViTinh(request.getDonViTinh());
        sp.setGiaNhap(request.getGiaNhap());
        sp.setMucTonToiThieu(request.getMucTonToiThieu());
        sp.setMucTonToiDa(request.getMucTonToiDa());
        sp.setMaLoai(request.getMaLoai());
        sp.setSoLuongTon(0); // Mặc định tồn kho là 0

        // 2. Lưu vào bảng 'sanpham' và lấy ID
        int maSP = sanPhamRepository.save(sp);
        sp.setMaSP(maSP);

        // 3. Lưu liên kết N:M với Nhà Cung Cấp (bảng 'ncc_sanpham')
        if (request.getDanhSachMaNCC() != null) {
            for (Integer maNCC : request.getDanhSachMaNCC()) {
                nccSanPhamRepository.linkNccToSanPham(maNCC, maSP);
            }
        }

        // 4. Ghi log
        logActivity(tenNguoiTao, "Thêm sản phẩm mới: " + sp.getTenSP());
        return sp;
    }

    // =================================================================
    // 2. UPDATE
    // =================================================================
    @Transactional
    public SanPham updateSanPham(Integer id, SanPhamRequest request, String tenNguoiSua) {
        SanPham spCu = sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        // 1. Cập nhật thông tin cơ bản
        spCu.setTenSP(request.getTenSP());
        spCu.setDonViTinh(request.getDonViTinh());
        spCu.setGiaNhap(request.getGiaNhap());
        spCu.setMucTonToiThieu(request.getMucTonToiThieu());
        spCu.setMucTonToiDa(request.getMucTonToiDa());
        spCu.setMaLoai(request.getMaLoai());

        sanPhamRepository.update(spCu);

        // 2. Cập nhật liên kết NCC (Xóa cũ -> Thêm mới)
        // Lưu ý: Đây là cách đơn giản nhất. Cách tối ưu hơn là so sánh list cũ/mới.

        // Xóa tất cả liên kết cũ của SP này (Bạn cần thêm hàm này vào Repo hoặc loop xóa từng cái)
        // Giả sử ta loop qua danh sách NCC cũ để xóa (cần lấy danh sách cũ trước)
        List<Integer> oldNccIds = nccSanPhamRepository.findNccIdsByMaSP(id);
        for (Integer oldNccId : oldNccIds) {
            nccSanPhamRepository.unlinkNccFromSanPham(oldNccId, id);
        }

        // Thêm liên kết mới
        if (request.getDanhSachMaNCC() != null) {
            for (Integer maNCC : request.getDanhSachMaNCC()) {
                nccSanPhamRepository.linkNccToSanPham(maNCC, id);
            }
        }

        logActivity(tenNguoiSua, "Cập nhật sản phẩm ID: " + id);
        return spCu;
    }

    // =================================================================
    // 3. DELETE
    // =================================================================
    @Transactional
    public void deleteSanPham(Integer id, String tenNguoiXoa) {
        if (!sanPhamRepository.findById(id).isPresent()) {
            throw new RuntimeException("Sản phẩm không tồn tại.");
        }

        // 1. Xóa liên kết N:M trước (nếu chưa set ON DELETE CASCADE trong DB)
        List<Integer> nccIds = nccSanPhamRepository.findNccIdsByMaSP(id);
        for (Integer nccId : nccIds) {
            nccSanPhamRepository.unlinkNccFromSanPham(nccId, id);
        }

        // 2. Xóa sản phẩm
        sanPhamRepository.deleteById(id);

        logActivity(tenNguoiXoa, "Xóa sản phẩm ID: " + id);
    }

    // =================================================================
    // 4. READ (Get All / Get By ID)
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
}