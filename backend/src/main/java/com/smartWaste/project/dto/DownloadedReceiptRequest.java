package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DownloadedReceiptRequest {
    private String receiptNo;
    private Long partnerId;
    private String partnerName;
    private Integer entriesCount;
    private Double totalKg;
    private Double grossAmount;
    private Double netAmount;
    private Integer filterMonth;
    private Integer filterYear;
}
