plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.alerts_mobile"
    compileSdk = 35 // Overridden to 35 as required by your jni plugins, keeping it central here
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Updated to prevent redirect loopback mismatches with appAuth
        applicationId = "com.example.nets_sandbox"
        
        minSdk = flutter.minSdkVersion
        targetSdk = 35 // Aligned with compileSdk 35
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        
        manifestPlaceholders.putAll(
            mapOf("appAuthRedirectScheme" to "myflutterapp")
        )
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

// --- DYNAMIC PLUGIN VERSION ALIGNMENT BLOCK ---
// This forces all subproject plugins (like flutter_appauth) to match your app's compileSdk
subprojects {
    afterEvaluate {
        extensions.findByType<com.android.build.gradle.BaseExtension>()?.apply {
            compileSdkVersion(project.rootProject.findProject(":app")?.extensions?.findByType<com.android.build.gradle.BaseExtension>()?.compileSdkVersion ?: "android-35")
        }
    }
}