package com.smartWaste.project.repository;

import com.smartWaste.project.model.DownloadedReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DownloadedReceiptRepository extends JpaRepository<DownloadedReceipt, Long> {

    List<DownloadedReceipt> findAllByOrderByIssuedAtDesc();

    List<DownloadedReceipt> findByPartnerIdOrderByIssuedAtDesc(Long partnerId);

    boolean existsByReceiptNo(String receiptNo);
}
