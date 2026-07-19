# Nova TV Android

Native Android client for Nova TV.

## Stack

- Kotlin
- Jetpack Compose
- Hilt
- Retrofit and OkHttp
- Room
- DataStore
- Coil
- Media3 ExoPlayer

## Local development

1. Open the `android` directory in Android Studio.
2. Allow Gradle sync.
3. Run the backend on port `3000`.
4. Run the `app` configuration on an emulator.

The debug build uses `http://10.0.2.2:3000/api/v1/`. Replace the release endpoint in `app/build.gradle.kts` before production builds.

## Status

The Android beta is being imported from the verified Sprint B project. Build success is not claimed until Gradle and Android SDK validation run in CI or Android Studio.
