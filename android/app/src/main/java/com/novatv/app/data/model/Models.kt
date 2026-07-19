package com.novatv.app.data.model

import kotlinx.serialization.Serializable

@Serializable data class LoginRequest(val email: String, val password: String)
@Serializable data class RegisterRequest(val name: String, val email: String, val password: String)
@Serializable data class TokenResponse(val accessToken: String, val refreshToken: String, val tokenType: String = "Bearer")
@Serializable data class RefreshRequest(val refreshToken: String)
@Serializable data class UserProfile(val name: String? = null, val avatarUrl: String? = null)
@Serializable data class User(val id: String, val email: String, val role: String, val profile: UserProfile? = null)
@Serializable data class Category(val id: String, val name: String)

@Serializable
data class Channel(
    val id: String,
    val name: String,
    val streamUrl: String,
    val backupUrl: String? = null,
    val logoUrl: String? = null,
    val country: String? = null,
    val language: String? = null,
    val quality: String? = null,
    val category: Category? = null
)

@Serializable data class ChannelPage(val items: List<Channel>, val total: Int, val page: Int, val limit: Int)
@Serializable data class FavoriteRequest(val channelId: String)
@Serializable data class FavoriteRecord(val id: String? = null, val channelId: String? = null, val channel: Channel)
@Serializable data class HistoryRequest(val channelId: String, val positionSeconds: Int = 0, val durationSeconds: Int? = null)
@Serializable data class HistoryRecord(
    val id: String? = null,
    val channelId: String? = null,
    val positionSeconds: Int = 0,
    val durationSeconds: Int? = null,
    val watchedAt: String? = null,
    val channel: Channel
)
@Serializable data class ApiError(val error: String, val message: String? = null, val requestId: String? = null)
