package stu.kho.backend.repository;

import stu.kho.backend.entity.VaiTro;
import java.util.Optional;

public interface VaiTroRepository {
    // Tim VaiTro theo ID
    Optional<VaiTro> findById(Integer maVaiTro);
}