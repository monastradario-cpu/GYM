package com.monastradario.gym

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId

/**
 * Health Connect (solo lettura): passi, sonno, peso e calorie attive da telefono, orologio o bilancia.
 * Coach li usa per il livello di attività, il check-in (sonno) e il peso. Nessun dato esce dal telefono.
 */
object Health {
    val PERMS = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class)
    )

    /** "ok", "install" (va installato o aggiornato Health Connect) o "no" (telefono non compatibile) */
    fun status(ctx: Context): String = when (HealthConnectClient.getSdkStatus(ctx)) {
        HealthConnectClient.SDK_AVAILABLE -> "ok"
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "install"
        else -> "no"
    }

    suspend fun granted(ctx: Context): Set<String> =
        HealthConnectClient.getOrCreate(ctx).permissionController.getGrantedPermissions()

    /** dati degli ultimi [days] giorni, giorno per giorno, in JSON per la pagina */
    suspend fun read(ctx: Context, days: Int): JSONObject {
        val c = HealthConnectClient.getOrCreate(ctx)
        val ok = c.permissionController.getGrantedPermissions()
        val zone = ZoneId.systemDefault()
        val start = LocalDate.now(zone).minusDays((days - 1).toLong()).atStartOfDay()
        val end = LocalDate.now(zone).plusDays(1).atStartOfDay()
        val range = TimeRangeFilter.between(start, end)
        val out = JSONObject().put("granted", JSONArray(ok.toList()))
        val perDay = JSONObject()
        fun day(k: String): JSONObject = perDay.optJSONObject(k) ?: JSONObject().also { perDay.put(k, it) }

        if (HealthPermission.getReadPermission(StepsRecord::class) in ok || HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class) in ok) {
            val metrics = mutableSetOf<androidx.health.connect.client.aggregate.AggregateMetric<*>>()
            if (HealthPermission.getReadPermission(StepsRecord::class) in ok) metrics.add(StepsRecord.COUNT_TOTAL)
            if (HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class) in ok) metrics.add(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
            val rows = c.aggregateGroupByPeriod(AggregateGroupByPeriodRequest(metrics, range, Period.ofDays(1)))
            for (r in rows) {
                val k = r.startTime.toLocalDate().toString()
                r.result[StepsRecord.COUNT_TOTAL]?.let { day(k).put("steps", it) }
                r.result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { day(k).put("kcal", Math.round(it.inKilocalories)) }
            }
        }
        if (HealthPermission.getReadPermission(SleepSessionRecord::class) in ok) {
            // il sonno conta nel giorno in cui ti svegli
            val sl = c.readRecords(ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(start.minusHours(12), end)))
            for (s in sl.records) {
                val k = s.endTime.atZone(zone).toLocalDate().toString()
                val min = Duration.between(s.startTime, s.endTime).toMinutes()
                val d = day(k); d.put("sleep", d.optLong("sleep", 0) + min)
            }
        }
        if (HealthPermission.getReadPermission(WeightRecord::class) in ok) {
            val wr = c.readRecords(ReadRecordsRequest(WeightRecord::class, range))
            val arr = JSONArray()
            for (w in wr.records) arr.put(JSONObject().put("t", w.time.toEpochMilli()).put("kg", Math.round(w.weight.inKilograms * 10) / 10.0))
            out.put("weights", arr)
        }
        return out.put("days", perDay)
    }
}
