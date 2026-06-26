package com.smartWaste.project.repository;

import com.smartWaste.project.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    Optional<RolePermission> findByPermissionKey(String permissionKey);

    List<RolePermission> findAllByOrderByRoleAscIdAsc();
}
