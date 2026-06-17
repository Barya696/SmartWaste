package com.smartWaste.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportWasteRequest {
    private Long userId;
    private String category;
    private String district;
    private String location;
    private String description;
    private String quantity; // small, medium, large
    private String photoUrl; // optional - path to uploaded photo or null
}
