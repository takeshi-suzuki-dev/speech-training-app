package com.takeshi.backend.repository;

import com.takeshi.backend.entity.TrainingAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrainingAttemptRepository extends JpaRepository<TrainingAttempt, UUID> {

    List<TrainingAttempt> findByClientIdOrderByScoredAtDesc(UUID clientId, Pageable pageable);
}
