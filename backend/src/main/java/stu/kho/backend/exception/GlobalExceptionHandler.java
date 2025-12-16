package stu.kho.backend.exception;

import lombok.extern.slf4j.Slf4j; // Import Lombok
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j // 1. Thêm log vào đây
public class GlobalExceptionHandler {

    // Xử lý RuntimeException (Lỗi nghiệp vụ: Trùng tên, không tìm thấy ID...)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntimeException(RuntimeException ex) {
        log.error("Lỗi nghiệp vụ (Bad Request): {}", ex.getMessage()); // Log lỗi ngắn gọn

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", 400);
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // Xử lý các lỗi hệ thống không mong muốn (NullPointer, SQL...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception ex) {
        log.error("Lỗi hệ thống (Internal Server Error): ", ex); // Log full stack trace để debug

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", 500);
        body.put("error", "Internal Server Error");
        body.put("message", "Đã xảy ra lỗi hệ thống: " + ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}