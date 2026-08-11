import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  bool _isLoading = false;
  String? _errorMessage;

  String? get accessToken => _accessToken;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _accessToken != null;

  Future<void> checkExistingAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await AuthService.getStoredToken();
      if (token != null) {
        _accessToken = token;
      }
    } catch (e) {
      _errorMessage = "Failed to load saved authentication state.";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final token = await AuthService.loginWithKeycloak();

    _isLoading = false;
    if (token != null) {
      _accessToken = token;
      notifyListeners();
      return true;
    } else {
      _errorMessage = "Authentication failed. Please try again.";
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await AuthService.logout();
    _accessToken = null;
    _errorMessage = null;

    _isLoading = false;
    notifyListeners();
  }
}
