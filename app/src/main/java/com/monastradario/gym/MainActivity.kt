package com.monastradario.gym

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.MediaStore
import android.provider.Settings
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    companion object {
        @Volatile var inForeground = false
        const val ORIGIN = "https://appassets.androidplatform.net"
    }

    private lateinit var web: WebView
    private val main = Handler(Looper.getMainLooper())

    private var pendingSaveText: String? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var cameraUri: Uri? = null

    private val createDoc = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val uri = res.data?.data
        val text = pendingSaveText
        pendingSaveText = null
        if (uri != null && text != null) {
            try {
                contentResolver.openOutputStream(uri)?.use { it.write(text.toByteArray(Charsets.UTF_8)) }
                js("toast('File salvato')")
            } catch (e: Exception) {
                js("toast(${JSONObject.quote("Errore salvataggio: " + e.message)})")
            }
        }
    }

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val cb = fileCallback ?: return@registerForActivityResult
        fileCallback = null
        var result: Array<Uri>? = null
        if (res.resultCode == RESULT_OK) {
            val data = res.data?.data
            result = when {
                data != null -> arrayOf(data)
                res.data?.clipData != null -> {
                    val c = res.data!!.clipData!!
                    Array(c.itemCount) { c.getItemAt(it).uri }
                }
                cameraUri != null && File(cacheDir, "camera.jpg").length() > 0 -> arrayOf(cameraUri!!)
                else -> null
            }
        }
        cb.onReceiveValue(result)
    }

    private val askPerm = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Notify.channels(this)
        web = WebView(this)
        setContentView(web)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.host == "appassets.androidplatform.net") return false
                openExternal(u.toString())
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = cb
                val wantsImage = params.acceptTypes.any { it.startsWith("image") }
                val content = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (wantsImage) "image/*" else "*/*"
                }
                val chooser = Intent.createChooser(content, if (wantsImage) "Scegli foto" else "Scegli file")
                cameraUri = null
                if (wantsImage && packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)) {
                    val f = File(cacheDir, "camera.jpg"); f.delete()
                    val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
                    cameraUri = uri
                    val cam = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                        putExtra(MediaStore.EXTRA_OUTPUT, uri)
                        addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cam))
                }
                return try { pickFile.launch(chooser); true } catch (e: Exception) { fileCallback = null; false }
            }
        }
        web.addJavascriptInterface(Bridge(), "Android")
        web.loadUrl("$ORIGIN/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.appBack ? window.appBack() : false") { r ->
                    if (r != "true") { isEnabled = false; onBackPressedDispatcher.onBackPressed(); isEnabled = true }
                }
            }
        })
    }

    override fun onResume() { super.onResume(); inForeground = true; Notify.cancel(this, Notify.ID_REST) }
    override fun onPause() { super.onPause(); inForeground = false }

    private fun js(code: String) = main.post { web.evaluateJavascript(code, null) }

    private fun openExternal(url: String) {
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) { }
    }

    private fun currentVersionCode(): Long =
        if (Build.VERSION.SDK_INT >= 28) packageManager.getPackageInfo(packageName, 0).longVersionCode
        else @Suppress("DEPRECATION") packageManager.getPackageInfo(packageName, 0).versionCode.toLong()

    /** Funzioni chiamate dall'interfaccia (window.Android.*) */
    inner class Bridge {
        @JavascriptInterface fun version(): String = "${BuildConfig.VERSION_NAME} (build ${currentVersionCode()})"

        @JavascriptInterface fun saveFile(name: String, mime: String, text: String) {
            pendingSaveText = text
            main.post {
                val i = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE); type = mime; putExtra(Intent.EXTRA_TITLE, name)
                }
                createDoc.launch(i)
            }
        }

        @JavascriptInterface fun keepScreenOn(on: Boolean) {
            main.post {
                if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }

        @JavascriptInterface fun vibrate(ms: Int) {
            val v: Vibrator = if (Build.VERSION.SDK_INT >= 31)
                (getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            else @Suppress("DEPRECATION") (getSystemService(VIBRATOR_SERVICE) as Vibrator)
            v.vibrate(VibrationEffect.createOneShot(ms.toLong().coerceIn(10, 2000), VibrationEffect.DEFAULT_AMPLITUDE))
        }

        @JavascriptInterface fun restTimer(secs: Int, label: String) = Scheduler.scheduleRest(this@MainActivity, secs, label)
        @JavascriptInterface fun cancelRest() = Scheduler.cancelRest(this@MainActivity)

        @JavascriptInterface fun setReminders(json: String) {
            getSharedPreferences("gym", MODE_PRIVATE).edit().putString("reminders", json).apply()
            Scheduler.scheduleAll(this@MainActivity)
        }

        @JavascriptInterface fun askNotifications() {
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                main.post { askPerm.launch(Manifest.permission.POST_NOTIFICATIONS) }
            }
        }

        /** scansione codice a barre (scanner di Google, senza permesso fotocamera) */
        @JavascriptInterface fun scanBarcode() {
            main.post {
                try {
                    val opts = GmsBarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_CODE_128)
                        .enableAutoZoom()
                        .build()
                    GmsBarcodeScanning.getClient(this@MainActivity, opts).startScan()
                        .addOnSuccessListener { b -> js("window.onBarcode(${JSONObject.quote(b.rawValue ?: "")})") }
                        .addOnCanceledListener { }
                        .addOnFailureListener { e -> js("window.onBarcodeError(${JSONObject.quote(e.message ?: "")})") }
                } catch (e: Exception) {
                    js("window.onBarcodeError(${JSONObject.quote(e.message ?: "")})")
                }
            }
        }

        /** copia un testo negli appunti (es. lista della spesa) */
        @JavascriptInterface fun copyText(text: String) {
            main.post {
                try {
                    val cm = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
                    cm.setPrimaryClip(android.content.ClipData.newPlainText("GYM", text))
                } catch (_: Exception) { }
            }
        }

        /** testo negli appunti (per incollare la chiave API) */
        @JavascriptInterface fun clipboard(): String {
            var out = ""
            val latch = java.util.concurrent.CountDownLatch(1)
            main.post {
                try {
                    val cm = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
                    val clip = cm.primaryClip
                    if (clip != null && clip.itemCount > 0) out = clip.getItemAt(0).coerceToText(this@MainActivity)?.toString() ?: ""
                } catch (_: Exception) { }
                latch.countDown()
            }
            latch.await(2, java.util.concurrent.TimeUnit.SECONDS)
            return out
        }

        @JavascriptInterface fun openUrl(url: String) {
            main.post { openExternal(url) }
        }

        /** Richiesta HTTP senza limiti CORS (per il coach AI) */
        @JavascriptInterface fun http(id: String, method: String, url: String, headersJson: String, body: String) {
            thread {
                val out = JSONObject().put("id", id)
                try {
                    val c = URL(url).openConnection() as HttpURLConnection
                    c.requestMethod = method; c.connectTimeout = 20000; c.readTimeout = 90000
                    val h = JSONObject(headersJson)
                    h.keys().forEach { k -> c.setRequestProperty(k, h.getString(k)) }
                    if (body.isNotEmpty()) { c.doOutput = true; c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) } }
                    val code = c.responseCode
                    val text = (if (code >= 400) c.errorStream else c.inputStream)?.bufferedReader()?.use { it.readText() } ?: ""
                    out.put("status", code).put("body", text)
                } catch (e: Exception) {
                    out.put("status", 0).put("body", "").put("error", e.message ?: e.toString())
                }
                js("window.onNativeHttp && window.onNativeHttp(${JSONObject.quote(out.toString())})")
            }
        }

        /** Aggiornamenti: legge l'ultima Release su GitHub */
        @JavascriptInterface fun checkUpdate() {
            thread {
                val out = JSONObject()
                try {
                    val c = URL("https://api.github.com/repos/${BuildConfig.UPDATE_REPO}/releases/latest").openConnection() as HttpURLConnection
                    c.setRequestProperty("Accept", "application/vnd.github+json")
                    c.setRequestProperty("User-Agent", "GYM-app")
                    c.connectTimeout = 15000; c.readTimeout = 20000
                    val code = c.responseCode
                    if (code == 404) { out.put("available", false).put("none", true) }
                    else if (code != 200) { out.put("error", "GitHub non risponde (codice $code). Riprova più tardi.") }
                    else {
                        val r = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
                        val tag = r.optString("tag_name")
                        val remote = Regex("(\\d+)$").find(tag)?.groupValues?.get(1)?.toLongOrNull() ?: 0L
                        var apk = ""
                        val assets = r.optJSONArray("assets")
                        if (assets != null) for (i in 0 until assets.length()) {
                            val a = assets.getJSONObject(i)
                            if (a.optString("name").endsWith(".apk")) { apk = a.optString("browser_download_url"); break }
                        }
                        out.put("available", remote > currentVersionCode() && apk.isNotEmpty())
                            .put("name", r.optString("name", tag)).put("notes", r.optString("body"))
                            .put("url", apk).put("remote", remote).put("local", currentVersionCode())
                    }
                } catch (e: Exception) {
                    out.put("error", "Nessuna connessione o errore: ${e.message}")
                }
                js("window.onUpdateInfo && window.onUpdateInfo(${JSONObject.quote(out.toString())})")
            }
        }

        @JavascriptInterface fun downloadUpdate(url: String) {
            if (Build.VERSION.SDK_INT >= 26 && !packageManager.canRequestPackageInstalls()) {
                main.post {
                    js("toast('Consenti a GYM di installare app, poi premi di nuovo Scarica')")
                    js("UI.update.state='available';render()")
                    startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName")))
                }
                return
            }
            thread {
                try {
                    val f = File(cacheDir, "gym-update.apk"); f.delete()
                    var link = url
                    var c: HttpURLConnection
                    var hops = 0
                    while (true) { // segue i reindirizzamenti di GitHub
                        c = URL(link).openConnection() as HttpURLConnection
                        c.instanceFollowRedirects = false
                        c.setRequestProperty("User-Agent", "GYM-app")
                        c.connectTimeout = 20000; c.readTimeout = 60000
                        val code = c.responseCode
                        if (code in 300..399 && hops++ < 6) { link = c.getHeaderField("Location"); continue }
                        if (code != 200) throw Exception("download fallito (codice $code)")
                        break
                    }
                    val total = c.contentLengthLong
                    var done = 0L; var lastPct = -1
                    c.inputStream.use { inp ->
                        f.outputStream().use { o ->
                            val buf = ByteArray(64 * 1024)
                            while (true) {
                                val n = inp.read(buf); if (n < 0) break
                                o.write(buf, 0, n); done += n
                                if (total > 0) {
                                    val pct = (done * 100 / total).toInt()
                                    if (pct != lastPct) { lastPct = pct; js("window.onUpdateProgress($pct)") }
                                }
                            }
                        }
                    }
                    main.post {
                        val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
                        val i = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(uri, "application/vnd.android.package-archive")
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(i)
                        js("UI.update={state:'idle',info:null,progress:0};if(current().v==='settings')render()")
                    }
                } catch (e: Exception) {
                    js("window.onUpdateError(${JSONObject.quote("Errore: " + (e.message ?: ""))})")
                }
            }
        }
    }
}
