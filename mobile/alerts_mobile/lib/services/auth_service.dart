// lib/services/auth_service.dart
import 'package:flutter/material.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart'; // Import this
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const FlutterAppAuth _appAuth = FlutterAppAuth();
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  static const String _tokenKey = 'jwt_access_token';

  static final String _clientId = dotenv.env['KEYCLOAK_CLIENT_ID']!;
  static final String _redirectUrl = dotenv.env['KEYCLOAK_REDIRECT_URL']!;
  static final String _realmUrl = dotenv.env['KEYCLOAK_REALM_URL']!;

  static const List<String> _scopes = ['openid', 'profile', 'email'];

  static Future<String?> loginWithKeycloak() async {
    try {
      debugPrint("Initializing Keycloak request...");

      final AuthorizationTokenResponse? result = await _appAuth
          .authorizeAndExchangeCode(
            AuthorizationTokenRequest(
              _clientId,
              _redirectUrl,
              serviceConfiguration: AuthorizationServiceConfiguration(
                authorizationEndpoint:
                    '$_realmUrl/protocol/openid-connect/auth',
                tokenEndpoint: '$_realmUrl/protocol/openid-connect/token',
                endSessionEndpoint: '$_realmUrl/protocol/openid-connect/logout',
              ),
              scopes: _scopes,
              allowInsecureConnections: true,
            ),
          );

      debugPrint("Response received from AppAuth");

      if (result != null && result.accessToken != null) {
        debugPrint("Token acquired. Saving...");
        await _secureStorage.write(key: _tokenKey, value: result.accessToken);

        if (result.refreshToken != null) {
          debugPrint("Refresh token acquired. Saving...");
          await _secureStorage.write(
            key: 'refresh_token',
            value: result.refreshToken,
          );
        }

        return result.accessToken;
      } else {
        debugPrint("Authorization finished but token was null.");
      }
    } catch (e, stackTrace) {
      debugPrint("Error: Keycloak Authentication Failed!");
      debugPrint("Error details: $e");
      debugPrint("Stack Trace: $stackTrace");
    }
    return null;
  }

  static Future<String?> getStoredToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  static Future<void> logout() async {
    await _secureStorage.delete(key: _tokenKey);
  }
}
