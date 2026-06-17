package com.smartWaste.project.service;

import com.smartWaste.project.model.Users;
import com.smartWaste.project.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UsersService {
    
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    
    public Users createUser(Users user) {
        if (usersRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + user.getUsername());
        }
        if (usersRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }
        
        // Hash the password before saving
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        return usersRepository.save(user);
    }
    
    public Users getUserById(Long id) {
        return usersRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }
    
    public Users getUserByUsername(String username) {
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));
    }
    
    public Users getUserByEmail(String email) {
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }
    
    public List<Users> getAllUsers() {
        return usersRepository.findAll();
    }
    
    public List<Users> getUsersByRole(Users.UserRole role) {
        return usersRepository.findByRole(role);
    }
    
    public Users updateUser(Long id, Users userDetails) {
        Users user = getUserById(id);
        
        if (userDetails.getFirstName() != null) {
            user.setFirstName(userDetails.getFirstName());
        }
        if (userDetails.getLastName() != null) {
            user.setLastName(userDetails.getLastName());
        }
        if (userDetails.getPhoneNumber() != null) {
            user.setPhoneNumber(userDetails.getPhoneNumber());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        if (userDetails.getDepartment() != null) {
            user.setDepartment(userDetails.getDepartment());
        }
        
        return usersRepository.save(user);
    }
    
    public Users updateProfile(Long id, Users profileData) {
        Users user = getUserById(id);
        
        if (profileData.getFirstName() != null) {
            user.setFirstName(profileData.getFirstName());
        }
        if (profileData.getLastName() != null) {
            user.setLastName(profileData.getLastName());
        }
        if (profileData.getPhoneNumber() != null) {
            user.setPhoneNumber(profileData.getPhoneNumber());
        }
        if (profileData.getDistrict() != null) {
            user.setDistrict(profileData.getDistrict());
        }
        if (profileData.getPhotoUrl() != null) {
            user.setPhotoUrl(profileData.getPhotoUrl());
        }
        if (user.getRole() == Users.UserRole.CITIZEN
                || user.getRole() == Users.UserRole.COLLECTOR) {
            String bankAccount = profileData.getBankAccountNumber();
            if (bankAccount == null || bankAccount.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Bank account number is required for citizens and collectors");
            }
            user.setBankAccountNumber(bankAccount.trim());
        } else if (profileData.getBankAccountNumber() != null) {
            user.setBankAccountNumber(profileData.getBankAccountNumber().trim());
        }
        // Never update email or role through profile endpoint
        
        return usersRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        if (!usersRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with id: " + id);
        }
        usersRepository.deleteById(id);
    }
    
    public void blockUser(Long id) {
        Users user = getUserById(id);
        user.setIsBlocked(true);
        usersRepository.save(user);
    }
    
    public void unblockUser(Long id) {
        Users user = getUserById(id);
        user.setIsBlocked(false);
        usersRepository.save(user);
    }
    
    public void changePassword(Long id, String currentPassword, String newPassword) {
        Users user = getUserById(id);
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Check that new password is not empty
        if (newPassword == null || newPassword.isEmpty()) {
            throw new IllegalArgumentException("New password cannot be empty");
        }
        
        // Encode and set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        usersRepository.save(user);
    }
}
