package stu.kho.backend.entity;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Data
public class NguoiDung implements UserDetails {

    private Integer maNguoiDung;
    private String tenDangNhap;
    private String matKhau;
    private String hoTen;
    private String email;
    private String sdt;

    // NguoiDung sẽ chứa một đối tượng VaiTro
    private VaiTro vaiTro;

    // --- Các phương thức bắt buộc của UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Thêm tiền tố ROLE_ vào VaiTro từ CSDL
        return List.of(new SimpleGrantedAuthority("ROLE_" + vaiTro.getTenVaiTro()));
    }

    @Override
    public String getPassword() {
        return this.matKhau;
    }

    @Override
    public String getUsername() {
        return this.tenDangNhap;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Tài khoản không hết hạn
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Tài khoản không bị khóa
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Mật khẩu không hết hạn
    }

    @Override
    public boolean isEnabled() {
        return true; // Tài khoản được kích hoạt
    }
}