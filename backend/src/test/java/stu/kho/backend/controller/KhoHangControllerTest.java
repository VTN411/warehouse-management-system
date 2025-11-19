package stu.kho.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import stu.kho.backend.dto.KhoHangRequest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest // Khởi động toàn bộ context ứng dụng (DB, Service, Security)
@AutoConfigureMockMvc // Cấu hình MockMvc để gọi API giả lập
@Transactional // Tự động Rollback (hoàn tác) DB sau mỗi bài test để không làm bẩn dữ liệu
public class KhoHangControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper; // Dùng để chuyển Object -> JSON string

    // =================================================================
    // TEST 1: TẠO KHO HÀNG (Thành công)
    // =================================================================
    @Test
    @WithMockUser(username = "admin_test", authorities = {"PERM_KHO_CREATE"}) // Giả lập user có quyền tạo kho
    public void testCreateKhoHang_Success() throws Exception {
        // 1. Chuẩn bị dữ liệu
        KhoHangRequest request = new KhoHangRequest();
        request.setTenKho("Kho Test Auto");
        request.setDiaChi("123 Test Street");
        request.setGhiChu("Test tự động");

        // 2. Thực hiện gọi API và Kiểm tra
        mockMvc.perform(post("/api/kho")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))) // Chuyển DTO thành JSON

                .andExpect(status().isOk()) // Mong đợi HTTP 200
                .andExpect(jsonPath("$.tenKho", is("Kho Test Auto"))) // Kiểm tra JSON trả về có đúng tên không
                .andExpect(jsonPath("$.maKho", notNullValue())); // Kiểm tra có trả về ID không
    }

    // =================================================================
    // TEST 2: TẠO KHO HÀNG (Thất bại - Không có quyền)
    // =================================================================
    @Test
    @WithMockUser(username = "staff_test", authorities = {"PERM_VIEW_REPORT"}) // User này KHÔNG có quyền tạo kho
    public void testCreateKhoHang_Forbidden() throws Exception {
        KhoHangRequest request = new KhoHangRequest();
        request.setTenKho("Kho Hack");

        mockMvc.perform(post("/api/kho")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isForbidden()); // Mong đợi HTTP 403
    }

    // =================================================================
    // TEST 3: LẤY DANH SÁCH (Thành công)
    // =================================================================
    @Test
    @WithMockUser(authorities = {"PERM_KHO_VIEW"}) // Quyền xem
    public void testGetAllKhoHang() throws Exception {
        mockMvc.perform(get("/api/kho"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(0)))); // Mong đợi trả về một mảng
    }

    // =================================================================
    // TEST 4: CẬP NHẬT KHO (Thành công)
    // =================================================================
    @Test
    @WithMockUser(authorities = {"PERM_KHO_EDIT"})
    public void testUpdateKhoHang() throws Exception {
        // Giả sử ID = 1 đã tồn tại (do bạn đã chạy SQL mẫu)
        // Nếu muốn chắc chắn, bạn có thể tạo mới 1 cái trong test này trước rồi mới update
        Integer idToUpdate = 1;

        KhoHangRequest request = new KhoHangRequest();
        request.setTenKho("Kho Chính (Updated)");
        request.setDiaChi("Dia chi moi");
        request.setGhiChu("Da update");

        mockMvc.perform(put("/api/kho/{id}", idToUpdate)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))

                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenKho", is("Kho Chính (Updated)")));
    }

    // =================================================================
    // TEST 5: XÓA KHO (Thành công)
    // =================================================================
    @Test
    @WithMockUser(username = "admin", authorities = {"PERM_KHO_DELETE", "PERM_KHO_CREATE"})
    public void testDeleteKhoHang() throws Exception {
        // 1. Tạo một kho tạm để xóa (tránh xóa dữ liệu thật gây lỗi khóa ngoại)
        KhoHangRequest newKho = new KhoHangRequest();
        newKho.setTenKho("Kho Tam De Xoa");
        String response = mockMvc.perform(post("/api/kho")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newKho)))
                .andReturn().getResponse().getContentAsString();

        // Lấy ID từ response (cắt chuỗi đơn giản hoặc dùng Jackson để parse)
        // Ở đây giả định response trả về JSON object có maKho
        Integer idToDelete = objectMapper.readTree(response).get("maKho").asInt();

        // 2. Thực hiện Xóa
        mockMvc.perform(delete("/api/kho/{id}", idToDelete))
                .andExpect(status().isOk());

        // 3. Kiểm tra lại xem còn tồn tại không (Mong đợi 404 hoặc lỗi)
        // Tùy thuộc vào cách bạn xử lý getById khi không tìm thấy
    }
}