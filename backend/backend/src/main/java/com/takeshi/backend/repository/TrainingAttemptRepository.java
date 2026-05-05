package com.takeshi.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.takeshi.backend.entity.TrainingAttempt;

public interface TrainingAttemptRepository extends JpaRepository<TrainingAttempt, UUID> {

    List<TrainingAttempt> findByClientIdOrderByScoredAtDesc(UUID clientId, Pageable pageable);

    @Query(value = """
            SELECT DISTINCT ON (sentence_id) *
            FROM training_attempts
            WHERE client_id = :clientId
              AND sentence_id IS NOT NULL
              AND overall_score IS NOT NULL
            ORDER BY sentence_id, scored_at DESC
            """, nativeQuery = true)
    List<TrainingAttempt> findLatestBySentenceIdForClient(@Param("clientId") UUID clientId);

}
