package com.novatv.app.di

import android.content.Context
import androidx.room.Room
import com.novatv.app.BuildConfig
import com.novatv.app.data.local.TokenStore
import com.novatv.app.data.local.db.ChannelDao
import com.novatv.app.data.local.db.LibraryDao
import com.novatv.app.data.local.db.NovaDatabase
import com.novatv.app.data.network.AuthInterceptor
import com.novatv.app.data.network.NovaApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideTokenStore(@ApplicationContext context: Context) = TokenStore(context)

    @Provides
    @Singleton
    fun provideJson(): Json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    @Provides
    @Singleton
    fun provideOkHttp(authInterceptor: AuthInterceptor): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
        })
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    fun provideApi(client: OkHttpClient, json: Json): NovaApi = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(client)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(NovaApi::class.java)

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): NovaDatabase =
        Room.databaseBuilder(context, NovaDatabase::class.java, "nova-tv.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideChannelDao(database: NovaDatabase): ChannelDao = database.channelDao()
    @Provides fun provideLibraryDao(database: NovaDatabase): LibraryDao = database.libraryDao()
}
