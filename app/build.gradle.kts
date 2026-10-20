plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// numero di build da GitHub Actions: cresce a ogni build, serve per gli aggiornamenti dall'app
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "com.monastradario.gym"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.monastradario.gym"
        minSdk = 26
        targetSdk = 34
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
        buildConfigField("String", "UPDATE_REPO", "\"monastradario-cpu/GYM\"")
    }

    signingConfigs {
        create("release") {
            storeFile = rootProject.file("signing/gym-release.jks")
            storePassword = "gymRelease2026"
            keyAlias = "gym"
            keyPassword = "gymRelease2026"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.1")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
}
