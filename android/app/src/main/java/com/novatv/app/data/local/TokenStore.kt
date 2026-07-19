package com.novatv.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("nova_session")

class TokenStore(private val context: Context) {
    private val accessKey = stringPreferencesKey("access_token")
    private val refreshKey = stringPreferencesKey("refresh_token")

    val accessToken: Flow<String?> = context.dataStore.data.map { it[accessKey] }

    suspend fun readAccessToken(): String? = accessToken.first()
    suspend fun readRefreshToken(): String? = context.dataStore.data.map { it[refreshKey] }.first()

    suspend fun save(accessToken: String, refreshToken: String) {
        context.dataStore.edit {
            it[accessKey] = accessToken
            it[refreshKey] = refreshToken
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
