plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")      // use the official id
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    // Google Services plugin (required for google-services.json)
    id("com.google.gms.google-services")
}

android {
    namespace = "com.example.coming_soon"
    compileSdk = flutter.compileSdkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.example.coming_soon"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        getByName("release") {
            // Sign with debug for now so `flutter run --release` works
            signingConfig = signingConfigs.getByName("debug")
            // Uncomment when you’re ready for ProGuard/shrinking:
            // isMinifyEnabled = true
            // proguardFiles(
            //     getDefaultProguardFile("proguard-android-optimize.txt"),
            //     "proguard-rules.pro"
            // )
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Firebase Bill of Materials to keep versions in sync
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))

    // Firebase Auth
    implementation("com.google.firebase:firebase-auth")

    // Firestore if you’re using it
    implementation("com.google.firebase:firebase-firestore")

    // Add more Firebase products here if needed, e.g. Analytics, Storage:
    // implementation("com.google.firebase:firebase-analytics-ktx")
}
