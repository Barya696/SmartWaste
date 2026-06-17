package com.smartWaste.project.service;

import com.smartWaste.project.dto.DownloadedReceiptRequest;
import com.smartWaste.project.model.DownloadedReceipt;
import com.smartWaste.project.repository.DownloadedReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DownloadedReceiptService {

    private final DownloadedReceiptRepository downloadedReceiptRepository;

    public List<DownloadedReceipt> getAllReceipts() {
        return downloadedReceiptRepository.findAllByOrderByIssuedAtDesc();
    }

    public List<DownloadedReceipt> getReceiptsByPartner(Long partnerId) {
        return downloadedReceiptRepository.findByPartnerIdOrderByIssuedAtDesc(partnerId);
    }

    public DownloadedReceipt createReceipt(DownloadedReceiptRequest request, Long supervisorId) {
        if (request.getReceiptNo() == null || request.getReceiptNo().isBlank()) {
            throw new IllegalArgumentException("Receipt number is required");
        }
        if (request.getPartnerId() == null) {
            throw new IllegalArgumentException("Partner ID is required");
        }
        if (downloadedReceiptRepository.existsByReceiptNo(request.getReceiptNo().trim())) {
            throw new IllegalArgumentException("Receipt number already exists: " + request.getReceiptNo());
        }

        DownloadedReceipt receipt = new DownloadedReceipt();
        receipt.setReceiptNo(request.getReceiptNo().trim());
        receipt.setPartnerId(request.getPartnerId());
        receipt.setPartnerName(
                request.getPartnerName() != null ? request.getPartnerName().trim() : "Unknown Partner");
        receipt.setSupervisorId(supervisorId);
        receipt.setEntriesCount(request.getEntriesCount() != null ? request.getEntriesCount() : 0);
        receipt.setTotalKg(request.getTotalKg() != null ? request.getTotalKg() : 0.0);
        receipt.setGrossAmount(request.getGrossAmount() != null ? request.getGrossAmount() : 0.0);
        receipt.setNetAmount(request.getNetAmount() != null ? request.getNetAmount() : 0.0);
        receipt.setFilterMonth(request.getFilterMonth());
        receipt.setFilterYear(request.getFilterYear());

        return downloadedReceiptRepository.save(receipt);
    }
}
