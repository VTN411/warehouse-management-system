package stu.kho.backend.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import stu.kho.backend.repository.NguoiDungRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final NguoiDungRepository nguoiDungRepository;

    public CustomUserDetailsService(NguoiDungRepository nguoiDungRepository) {
        this.nguoiDungRepository = nguoiDungRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String tenDangNhap) throws UsernameNotFoundException {
        // Gọi phương thức JDBC để tìm user
        return nguoiDungRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + tenDangNhap));
    }
}