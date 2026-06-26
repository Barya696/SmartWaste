package com.smartWaste.project.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CheckConstraintUpdater implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CheckConstraintUpdater.class);
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        updateAssignmentStatusCheckConstraint();
    }

    private void updateAssignmentStatusCheckConstraint() {
        try {
            log.info("[CheckConstraintUpdater] Checking assign_collector assignment_status check constraint");

            // Drop existing constraint if it exists
            jdbcTemplate.execute("ALTER TABLE assign_collector DROP CONSTRAINT IF EXISTS assign_collector_assignment_status_check");

            // Recreate constraint with all enum values including EMPTY
            jdbcTemplate.execute("""
                ALTER TABLE assign_collector 
                ADD CONSTRAINT assign_collector_assignment_status_check 
                CHECK (assignment_status IN (
                    'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 
                    'REJECTED', 'PENDING_CITIZEN_APPROVAL', 'RECYCLED', 'EMPTY'
                ))
                """);

            log.info("[CheckConstraintUpdater] Successfully updated assign_collector assignment_status check constraint");
        } catch (Exception e) {
            log.error("[CheckConstraintUpdater] Failed to update check constraint: {}", e.getMessage(), e);
        }
    }
}
