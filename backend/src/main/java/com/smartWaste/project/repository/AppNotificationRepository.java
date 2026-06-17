package com.smartWaste.project.repository;

import com.smartWaste.project.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

    List<AppNotification> findByUserIdOrderByEventAtDesc(Long userId);

    @Query("SELECT COUNT(n) FROM AppNotification n WHERE n.userId = :userId AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    Optional<AppNotification> findByIdAndUserId(Long id, Long userId);

    Optional<AppNotification> findByUserIdAndSourceKey(Long userId, String sourceKey);

    @Modifying
    @Query("DELETE FROM AppNotification n WHERE n.userId = :userId AND n.sourceKey NOT IN :sourceKeys")
    void deleteByUserIdAndSourceKeyNotIn(
            @Param("userId") Long userId,
            @Param("sourceKeys") Collection<String> sourceKeys
    );
}
