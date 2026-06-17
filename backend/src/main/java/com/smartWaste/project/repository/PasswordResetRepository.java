package com.smartWaste.project.repository;

import com.smartWaste.project.model.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    Optional<PasswordReset> findByEmailAndCode(String email, String code);
    Optional<PasswordReset> findByEmail(String email);
}
