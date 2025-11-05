package stu.kho.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kho")
public class KhoHangController {

    // Quy tắc: Chỉ ADMIN hoặc THUKHO mới được tạo phiếu nhập
    @PreAuthorize("hasAnyRole('ADMIN', 'THUKHO')")
    @PostMapping("/nhap")
    public String createPhieuNhap() {
        // Logic nghiệp vụ tạo phiếu nhập, gọi Service...
        return "SUCCESS: Thủ kho/Admin đã tạo phiếu nhập.";
    }

    // Quy tắc: Chỉ ADMIN hoặc THUKHO mới được xuất hàng
    @PreAuthorize("hasAnyRole('ADMIN', 'THUKHO')")
    @PostMapping("/xuat")
    public String createPhieuXuat() {
        // Logic nghiệp vụ tạo phiếu xuất...
        return "SUCCESS: Thủ kho/Admin đã tạo phiếu xuất.";
    }

    // Quy tắc: Chỉ THUKHO và ADMIN được thực hiện kiểm kê
    @PreAuthorize("hasAnyRole('ADMIN', 'THUKHO')")
    @PostMapping("/kiemke")
    public String initiateInventoryCheck() {
        return "SUCCESS: Bắt đầu kiểm kê kho.";
    }

    // Quy tắc: Chỉ ADMIN mới có quyền xóa (Hạn chế quyền của Thủ kho)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public String deleteKho(@PathVariable Long id) {
        return "SUCCESS: Xóa kho hàng (Chỉ Admin).";
    }
}