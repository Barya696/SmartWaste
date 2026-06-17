package com.smartWaste.project.repository;

import com.smartWaste.project.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByUsername(String username);
    
    Optional<Users> findByEmail(String email);
    
    List<Users> findByRole(Users.UserRole role);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
}
