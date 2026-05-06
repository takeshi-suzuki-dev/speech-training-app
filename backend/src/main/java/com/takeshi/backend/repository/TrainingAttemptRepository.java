package com.takeshi.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.takeshi.backend.entity.TrainingAttempt;
import com.takeshi.backend.repository.projection.DailyScoreTrendProjection;

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

    @Query(value = """
            WITH ranked_attempts AS (
                SELECT
                    (scored_at AT TIME ZONE 'Asia/Tokyo')::date AS practice_date,
                    overall_score,
                    accuracy_score,
                    fluency_score,
                    completeness_score,
                    prosody_score,
                    ROW_NUMBER() OVER (
                        PARTITION BY (scored_at AT TIME ZONE 'Asia/Tokyo')::date
                        ORDER BY scored_at DESC, id DESC
                    ) AS attempt_rank
                FROM training_attempts
                WHERE client_id = :clientId
                  AND scored_at >= now() - interval '1 year'
                  AND overall_score IS NOT NULL
            ),
            daily_averages AS (
                SELECT
                    practice_date,
                    AVG(overall_score) AS overall_average,
                    AVG(accuracy_score) AS accuracy_average,
                    AVG(fluency_score) AS fluency_average,
                    AVG(completeness_score) AS completeness_average,
                    AVG(prosody_score) AS prosody_average
                FROM ranked_attempts
                WHERE attempt_rank <= 5
                GROUP BY practice_date
            )
            SELECT
                practice_date AS practiceDate,
                overall_average AS overallAverage,
                accuracy_average AS accuracyAverage,
                fluency_average AS fluencyAverage,
                completeness_average AS completenessAverage,
                prosody_average AS prosodyAverage,
                AVG(overall_average) OVER (
                    ORDER BY practice_date
                    ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
                ) AS overallMovingAverage5Days,
                AVG(overall_average) OVER (
                    ORDER BY practice_date
                    ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
                ) AS overallMovingAverage20Days
            FROM daily_averages
            ORDER BY practice_date
            """, nativeQuery = true)
    List<DailyScoreTrendProjection> findDailyScoreTrends(@Param("clientId") UUID clientId);
}
