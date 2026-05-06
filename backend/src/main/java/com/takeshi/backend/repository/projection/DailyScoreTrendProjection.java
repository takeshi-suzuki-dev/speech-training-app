package com.takeshi.backend.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyScoreTrendProjection {
    LocalDate getPracticeDate();

    BigDecimal getOverallAverage();

    BigDecimal getAccuracyAverage();

    BigDecimal getFluencyAverage();

    BigDecimal getCompletenessAverage();

    BigDecimal getProsodyAverage();

    BigDecimal getOverallMovingAverage5Days();

    BigDecimal getOverallMovingAverage20Days();
}