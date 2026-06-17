package com.smartWaste.project.service;

import com.smartWaste.project.model.Partner;
import com.smartWaste.project.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class PartnerService {
    
    private final PartnerRepository partnerRepository;
    
    /**
     * Create a new partner
     */
    public Partner createPartner(Partner partner, Long supervisorId) {
        // Validate required fields
        if (partner.getName() == null || partner.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Partner name is required");
        }
        if (partner.getEmail() == null || partner.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (partner.getPhone() == null || partner.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Phone is required");
        }
        if (partner.getAddress() == null || partner.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Address is required");
        }
        if (partner.getDepartment() == null || partner.getDepartment().trim().isEmpty()) {
            throw new IllegalArgumentException("Department is required");
        }
        
        // Check if partner code already exists
        if (partner.getPartnerCode() != null) {
            Optional<Partner> existing = partnerRepository.findByPartnerCode(partner.getPartnerCode());
            if (existing.isPresent()) {
                throw new IllegalArgumentException("Partner code already exists: " + partner.getPartnerCode());
            }
        } else {
            // Auto-generate partner code
            partner.setPartnerCode(generatePartnerCode());
        }
        
        // Set default status if not provided
        if (partner.getStatus() == null) {
            partner.setStatus("active");
        }
        
        // Set supervisor who created this partner
        partner.setCreatedBy(supervisorId);
        
        return partnerRepository.save(partner);
    }
    
    /**
     * Update an existing partner
     */
    public Partner updatePartner(Long partnerId, Partner partnerDetails) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found with ID: " + partnerId));
        
        // Update fields
        if (partnerDetails.getName() != null && !partnerDetails.getName().trim().isEmpty()) {
            partner.setName(partnerDetails.getName());
        }
        if (partnerDetails.getEmail() != null && !partnerDetails.getEmail().trim().isEmpty()) {
            partner.setEmail(partnerDetails.getEmail());
        }
        if (partnerDetails.getPhone() != null && !partnerDetails.getPhone().trim().isEmpty()) {
            partner.setPhone(partnerDetails.getPhone());
        }
        if (partnerDetails.getAddress() != null && !partnerDetails.getAddress().trim().isEmpty()) {
            partner.setAddress(partnerDetails.getAddress());
        }
        if (partnerDetails.getCategory() != null && !partnerDetails.getCategory().trim().isEmpty()) {
            partner.setCategory(partnerDetails.getCategory());
        }
        if (partnerDetails.getDescription() != null) {
            partner.setDescription(partnerDetails.getDescription());
        }
        if (partnerDetails.getStatus() != null && !partnerDetails.getStatus().trim().isEmpty()) {
            partner.setStatus(partnerDetails.getStatus());
        }
        
        return partnerRepository.save(partner);
    }
    
    /**
     * Get partner by ID
     */
    public Partner getPartnerById(Long partnerId) {
        return partnerRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found with ID: " + partnerId));
    }
    
    /**
     * Get partner by partner code
     */
    public Partner getPartnerByCode(String partnerCode) {
        return partnerRepository.findByPartnerCode(partnerCode)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found with code: " + partnerCode));
    }
    
    /**
     * Get all partners by department
     */
    public List<Partner> getPartnersByDepartment(String department) {
        return partnerRepository.findByDepartmentOrderByCreatedAtDesc(department);
    }
    
    /**
     * Get all active partners by department
     */
    public List<Partner> getActivePartnersByDepartment(String department) {
        return partnerRepository.findByDepartmentAndStatus(department, "active");
    }
    
    /**
     * Get all partners by category
     */
    public List<Partner> getPartnersByCategory(String category) {
        return partnerRepository.findByCategory(category);
    }
    
    /**
     * Get all partners created by a specific supervisor
     */
    public List<Partner> getPartnersByCreator(Long supervisorId) {
        return partnerRepository.findByCreatedBy(supervisorId);
    }
    
    /**
     * Delete a partner
     */
    public void deletePartner(Long partnerId) {
        if (!partnerRepository.existsById(partnerId)) {
            throw new IllegalArgumentException("Partner not found with ID: " + partnerId);
        }
        partnerRepository.deleteById(partnerId);
    }
    
    /**
     * Get all partners
     */
    public List<Partner> getAllPartners() {
        return partnerRepository.findAll();
    }
    
    /**
     * Generate unique partner code: PART-YYYY-XXXX
     */
    private String generatePartnerCode() {
        int year = java.time.Year.now().getValue();
        int randomSuffix = (int) (Math.random() * 9000) + 1000;
        return String.format("PART-%d-%d", year, randomSuffix);
    }
}
