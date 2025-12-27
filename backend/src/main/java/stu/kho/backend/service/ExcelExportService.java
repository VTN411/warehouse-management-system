package stu.kho.backend.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import stu.kho.backend.dto.BaoCaoNxtDTO;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    public ByteArrayInputStream exportBaoCaoNXT(List<BaoCaoNxtDTO> data, LocalDate from, LocalDate to) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Nhap_Xuat_Ton");

            // --- 1. KHỞI TẠO STYLE ---
            // Style Tiêu đề
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Style Header (Bold, nền xám)
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Style Data thường
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);

            // Style Tiền tệ (Format currency)
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0 ₫"));

            // Style Footer (Dòng Tổng cộng - Đậm)
            CellStyle footerStyle = workbook.createCellStyle();
            footerStyle.cloneStyleFrom(headerStyle); // Mượn style header để có in đậm và nền xám
            footerStyle.setAlignment(HorizontalAlignment.RIGHT); // Chữ "Tổng cộng" căn phải

            // Style Tiền tệ cho Footer (Vừa đậm vừa có format tiền)
            CellStyle footerCurrencyStyle = workbook.createCellStyle();
            footerCurrencyStyle.cloneStyleFrom(footerStyle);
            footerCurrencyStyle.setDataFormat(format.getFormat("#,##0 ₫"));

            // --- 2. VẼ TIÊU ĐỀ ---
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO NHẬP - XUẤT - TỒN");
            titleCell.setCellStyle(titleStyle);

            Row dateRow = sheet.createRow(1);
            Cell dateCell = dateRow.createCell(0);
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            dateCell.setCellValue("Kỳ báo cáo: Từ " + from.format(fmt) + " đến " + to.format(fmt));
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.setAlignment(HorizontalAlignment.CENTER);
            dateCell.setCellStyle(centerStyle);

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

            // --- 3. HEADER CỘT ---
            String[] columns = {"Mã SP", "Tên Sản Phẩm", "ĐVT", "Tồn Đầu", "Nhập", "Xuất", "Tồn Cuối", "Giá Trị Tồn"};
            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // --- 4. ĐỔ DỮ LIỆU & TÍNH TỔNG ---
            int rowIdx = 4;

            // Biến tích lũy tổng
            long totalNhap = 0;
            long totalXuat = 0;
            BigDecimal totalGiaTri = BigDecimal.ZERO;

            for (BaoCaoNxtDTO item : data) {
                Row row = sheet.createRow(rowIdx++);

                createCell(row, 0, item.getMaSP(), dataStyle);
                createCell(row, 1, item.getTenSP(), dataStyle);
                createCell(row, 2, item.getDonViTinh(), dataStyle);
                createCell(row, 3, item.getTonDau(), dataStyle);
                createCell(row, 4, item.getSlNhap(), dataStyle);
                createCell(row, 5, item.getSlXuat(), dataStyle);
                createCell(row, 6, item.getTonCuoi(), dataStyle);

                Cell moneyCell = row.createCell(7);
                moneyCell.setCellValue(item.getGiaTriTonCuoi().doubleValue());
                moneyCell.setCellStyle(currencyStyle);

                // CỘNG DỒN TỔNG
                totalNhap += item.getSlNhap();
                totalXuat += item.getSlXuat();
                if (item.getGiaTriTonCuoi() != null) {
                    totalGiaTri = totalGiaTri.add(item.getGiaTriTonCuoi());
                }
            }

            // --- 5. VẼ HÀNG TỔNG CỘNG (MỚI THÊM) ---
            Row footerRow = sheet.createRow(rowIdx); // Hàng nằm ngay sau dòng dữ liệu cuối cùng

            // Ô Label "Tổng cộng" (Merge từ cột 0 đến 3)
            Cell cellTotalLabel = footerRow.createCell(0);
            cellTotalLabel.setCellValue("Tổng cộng");
            cellTotalLabel.setCellStyle(footerStyle);

            // Tạo các ô trống để kẻ viền cho đẹp (Cột 1, 2, 3)
            for(int k=1; k<=3; k++){ footerRow.createCell(k).setCellStyle(footerStyle); }
            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 3));

            // Ô Tổng Nhập (Cột 4)
            createCell(footerRow, 4, totalNhap, footerStyle);

            // Ô Tổng Xuất (Cột 5)
            createCell(footerRow, 5, totalXuat, footerStyle);

            // Ô Tồn Cuối (Cột 6) - Thường không cộng tổng cột này vì khác đơn vị tính, để trống nhưng vẫn kẻ viền
            createCell(footerRow, 6, "", footerStyle);

            // Ô Tổng Giá Trị (Cột 7)
            Cell cellTotalValue = footerRow.createCell(7);
            cellTotalValue.setCellValue(totalGiaTri.doubleValue());
            cellTotalValue.setCellStyle(footerCurrencyStyle); // Dùng style tiền tệ đậm

            // --- 6. AUTO RESIZE ---
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi Excel: " + e.getMessage());
        }
    }

    private void createCell(Row row, int col, Object value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Long) {
            cell.setCellValue((Long) value);
        } else if (value instanceof Double) {
            cell.setCellValue((Double) value);
        } else {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }
}