package com.takeshi.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyScoreTrendResponse(
        LocalDate practiceDate,
        BigDecimal overallAverage,
        BigDecimal accuracyAverage,
        BigDecimal fluencyAverage,
        BigDecimal completenessAverage,
        BigDecimal prosodyAverage,
        BigDecimal overallMovingAverage5Days,
        BigDecimal overallMovingAverage20Days) {
}