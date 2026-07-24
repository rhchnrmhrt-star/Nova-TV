package com.novatv.app.data.network

import com.novatv.app.data.model.*
import retrofit2.http.*

interface NovaApi {
    @POST("auth/login") suspend fun login(@Body request: LoginRequest): TokenResponse
    @POST("auth/register") suspend fun register(@Body request: RegisterRequest): TokenResponse
    @POST("auth/refresh") suspend fun refresh(@Body request: RefreshRequest): TokenResponse
    @POST("auth/logout") suspend fun logout()
    @GET("me") suspend fun me(): User

    @GET("channels")
    suspend fun channels(
        @Query("search") search: String? = null,
        @Query("categoryId") categoryId: String? = null,
        @Query("country") country: String? = null,
        @Query("language") language: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100
    ): ChannelPage

    @GET("favorites") suspend fun favorites(): List<FavoriteRecord>
    @POST("favorites") suspend fun addFavorite(@Body request: FavoriteRequest)
    @DELETE("favorites/{channelId}") suspend fun removeFavorite(@Path("channelId") channelId: String)

    @GET("history") suspend fun history(): List<HistoryRecord>
    @POST("history") suspend fun saveHistory(@Body request: HistoryRequest)
}
