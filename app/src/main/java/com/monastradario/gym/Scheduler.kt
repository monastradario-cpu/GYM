package com.monastradario.gym

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import java.util.Calendar

object Notify {
    const val CH_REST = "rest"
    const val CH_REM = "reminders"
    const val ID_REST = 1
    const val ID_WORKOUT = 2
    const val ID_WATER = 3
    const val ID_WEIGH = 4

    fun channels(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CH_REST, "Fine recupero", NotificationManager.IMPORTANCE_HIGH).apply {
            enableVibration(true); vibrationPattern = longArrayOf(0, 400, 200, 400)
        })
        nm.createNotificationChannel(NotificationChannel(CH_REM, "Promemoria", NotificationManager.IMPORTANCE_DEFAULT))
    }

    fun show(ctx: Context, id: Int, channel: String, title: String, text: String) {
        channels(ctx)
        val open = PendingIntent.getActivity(ctx, id, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(ctx, channel)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(title).setContentText(text)
            .setAutoCancel(true).setContentIntent(open)
            .setPriority(if (channel == CH_REST) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(if (channel == CH_REST) NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_REMINDER)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(id, n) } catch (_: SecurityException) { }
    }

    fun cancel(ctx: Context, id: Int) = NotificationManagerCompat.from(ctx).cancel(id)
}

object Scheduler {
    private fun am(ctx: Context) = ctx.getSystemService(AlarmManager::class.java)

    private fun pi(ctx: Context, type: String, extra: String = ""): PendingIntent {
        val i = Intent(ctx, AlarmReceiver::class.java).setAction("gym.$type").putExtra("type", type).putExtra("label", extra)
        return PendingIntent.getBroadcast(ctx, type.hashCode(), i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }

    private fun setAt(ctx: Context, at: Long, p: PendingIntent) {
        val a = am(ctx)
        val exact = Build.VERSION.SDK_INT < 31 || a.canScheduleExactAlarms()
        if (exact) a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p)
        else a.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p)
    }

    fun scheduleRest(ctx: Context, secs: Int, label: String) {
        if (secs <= 0) return
        setAt(ctx, System.currentTimeMillis() + secs * 1000L, pi(ctx, "rest", label))
    }

    fun cancelRest(ctx: Context) {
        am(ctx).cancel(pi(ctx, "rest"))
        Notify.cancel(ctx, Notify.ID_REST)
    }

    private fun cfg(ctx: Context): JSONObject? =
        ctx.getSharedPreferences("gym", Context.MODE_PRIVATE).getString("reminders", null)?.let {
            try { JSONObject(it) } catch (_: Exception) { null }
        }

    fun scheduleAll(ctx: Context) {
        listOf("workout", "water", "weigh").forEach { schedule(ctx, it) }
    }

    fun schedule(ctx: Context, type: String) {
        val p = pi(ctx, type)
        am(ctx).cancel(p)
        val c = cfg(ctx)?.optJSONObject(type) ?: return
        if (!c.optBoolean("on")) return
        val next = nextTime(type, c) ?: return
        setAt(ctx, next, p)
    }

    /** prossimo orario utile per il promemoria */
    fun nextTime(type: String, c: JSONObject, now: Long = System.currentTimeMillis()): Long? {
        val cal = Calendar.getInstance().apply { timeInMillis = now; set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
        when (type) {
            "workout" -> {
                val days = c.optJSONArray("days") ?: return null
                if (days.length() == 0) return null
                val set = (0 until days.length()).map { days.getInt(it) }.toSet()
                for (add in 0..7) {
                    val t = cal.clone() as Calendar
                    t.add(Calendar.DAY_OF_YEAR, add)
                    t.set(Calendar.HOUR_OF_DAY, c.optInt("hour", 18)); t.set(Calendar.MINUTE, c.optInt("min", 0))
                    if (t.get(Calendar.DAY_OF_WEEK) in set && t.timeInMillis > now) return t.timeInMillis
                }
            }
            "weigh" -> {
                for (add in 0..7) {
                    val t = cal.clone() as Calendar
                    t.add(Calendar.DAY_OF_YEAR, add)
                    t.set(Calendar.HOUR_OF_DAY, c.optInt("hour", 8)); t.set(Calendar.MINUTE, c.optInt("min", 0))
                    if (t.get(Calendar.DAY_OF_WEEK) == c.optInt("day", 2) && t.timeInMillis > now) return t.timeInMillis
                }
            }
            "water" -> {
                val from = c.optInt("from", 9).coerceIn(0, 23)
                val to = c.optInt("to", 21).coerceIn(from, 23)
                val every = c.optInt("every", 2).coerceIn(1, 12)
                for (add in 0..1) {
                    var h = from
                    while (h <= to) {
                        val t = cal.clone() as Calendar
                        t.add(Calendar.DAY_OF_YEAR, add)
                        t.set(Calendar.HOUR_OF_DAY, h); t.set(Calendar.MINUTE, 0)
                        if (t.timeInMillis > now) return t.timeInMillis
                        h += every
                    }
                }
            }
        }
        return null
    }
}

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        when (val type = intent.getStringExtra("type")) {
            "rest" -> {
                // in primo piano ci pensa l'app (suono + vibrazione)
                if (!MainActivity.inForeground) {
                    val label = intent.getStringExtra("label").orEmpty()
                    Notify.show(ctx, Notify.ID_REST, Notify.CH_REST, "Recupero finito!", if (label.isNotEmpty()) "Pronto per la prossima serie: $label" else "Pronto per la prossima serie")
                }
            }
            "workout" -> {
                val c = ctxCfg(ctx)?.optJSONObject("workout")
                val dow = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK)
                val name = c?.optJSONObject("names")?.optString(dow.toString()).orEmpty()
                Notify.show(ctx, Notify.ID_WORKOUT, Notify.CH_REM, "È ora di allenarsi 💪", if (name.isNotEmpty()) "Oggi: $name" else "Apri GYM e inizia l'allenamento di oggi")
                Scheduler.schedule(ctx, type)
            }
            "water" -> {
                Notify.show(ctx, Notify.ID_WATER, Notify.CH_REM, "Bevi un bicchiere d'acqua 💧", "Restare idratati aiuta l'allenamento e il recupero")
                Scheduler.schedule(ctx, type)
            }
            "weigh" -> {
                Notify.show(ctx, Notify.ID_WEIGH, Notify.CH_REM, "Pesata settimanale ⚖️", "Pesati e registra il peso in GYM")
                Scheduler.schedule(ctx, type)
            }
        }
    }

    private fun ctxCfg(ctx: Context): JSONObject? =
        ctx.getSharedPreferences("gym", Context.MODE_PRIVATE).getString("reminders", null)?.let {
            try { JSONObject(it) } catch (_: Exception) { null }
        }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        Scheduler.scheduleAll(ctx)
    }
}
