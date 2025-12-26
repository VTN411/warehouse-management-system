package stu.kho.backend.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import stu.kho.backend.dto.BaoCaoNxtDTO;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    public ByteArrayInputStream exportBaoCaoNXT(List<BaoCaoNxtDTO> data, LocalDate from, LocalDate to) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Nhap_Xuat_Ton");

            // --- 1. TẠO STYLE CHO EXCEL (Đẹp hơn) ---

            // Style Tiêu đề lớn
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Style Header (Hàng tiêu đề cột)
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

            // Style Data (Có viền)
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);

            // Style Số tiền (Format currency)
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0 ₫"));

            // --- 2. VẼ TIÊU ĐỀ BÁO CÁO ---
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

            // Merge ô cho tiêu đề (Từ cột 0 đến cột 7)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

            // --- 3. TẠO HÀNG HEADER ---
            String[] columns = {"Mã SP", "Tên Sản Phẩm", "ĐVT", "Tồn Đầu", "Nhập", "Xuất", "Tồn Cuối", "Giá Trị Tồn"};
            Row headerRow = sheet.createRow(3);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // --- 4. ĐỔ DỮ LIỆU ---
            int rowIdx = 4;
            for (BaoCaoNxtDTO item : data) {
                Row row = sheet.createRow(rowIdx++);

                createCell(row, 0, item.getMaSP(), dataStyle);
                createCell(row, 1, item.getTenSP(), dataStyle);
                createCell(row, 2, item.getDonViTinh(), dataStyle);
                createCell(row, 3, item.getTonDau(), dataStyle);

                // Tô màu xanh cho cột Nhập
                createCell(row, 4, item.getSlNhap(), dataStyle);

                // Tô màu đỏ cho cột Xuất (nếu muốn cầu kỳ hơn thì setStyle riêng)
                createCell(row, 5, item.getSlXuat(), dataStyle);

                // Tô màu xanh đậm cho Tồn cuối
                createCell(row, 6, item.getTonCuoi(), dataStyle);

                // Cột giá trị tiền
                Cell moneyCell = row.createCell(7);
                moneyCell.setCellValue(item.getGiaTriTonCuoi().doubleValue());
                moneyCell.setCellStyle(currencyStyle);
            }

            // --- 5. AUTO RESIZE CỘT ---
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi tạo file Excel: " + e.getMessage());
        }
    }

    // Hàm phụ để tạo cell nhanh
    private void createCell(Row row, int col, Object value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Double) {
            cell.setCellValue((Double) value);
        } else {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }
}