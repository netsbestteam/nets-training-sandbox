// lib/auth_service.dart
import 'package:flutter/material.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const FlutterAppAuth _appAuth = FlutterAppAuth();
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  static const String _tokenKey = 'jwt_access_token';

  // Keycloak configurations
  static const String _clientId = 'public';

  static const String _redirectUrl = 'myflutterapp://oauthredirect';

  // Base URL pointing to the individual realm root for local emulator development
  static const String _realmUrl = 'http://10.0.2.2:8080/realms/nets-sandbox';
  static const List<String> _scopes = ['openid', 'profile', 'email'];

  static Future<String?> loginWithKeycloak() async {
    try {
      debugPrint("Initializing Keycloak request...");

      final AuthorizationTokenResponse? result = await _appAuth
          .authorizeAndExchangeCode(
            AuthorizationTokenRequest(
              _clientId,
              _redirectUrl,
              serviceConfiguration: const AuthorizationServiceConfiguration(
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

  /// Read the saved token from secure storage
  static Future<String?> getStoredToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  /// Logout and clear secure storage
  static Future<void> logout() async {
    await _secureStorage.delete(key: _tokenKey);
  }
}
