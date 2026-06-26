package com.smartWaste.project.repository;

import com.smartWaste.project.model.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {

    Optional<NotificationSetting> findBySettingKey(String settingKey);

    List<NotificationSetting> findAllByOrderByCategoryAscIdAsc();
}
