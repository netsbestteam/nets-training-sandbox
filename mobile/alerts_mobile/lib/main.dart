// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/auth_service.dart';
import 'services/permission_service.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  String? _accessToken;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkExistingLogin();
  }

  Future<void> _checkExistingLogin() async {
    final token = await AuthService.getStoredToken();
    setState(() {
      _accessToken = token;
      _isLoading = false;
    });
  }

  void _handleLogin() async {
    setState(() => _isLoading = true);
    try {
      final token = await AuthService.loginWithKeycloak();

      if (token != null) {
        final bool gpsGranted =
            await PermissionService.requestLocationPermission();

        if (gpsGranted) {
          debugPrint("GPS Permission Granted by user.");
        } else {
          debugPrint(
            "GPS Permission Denied by user. Proceeding with limited features.",
          );
        }
      }

      setState(() {
        _accessToken = token;
      });
    } catch (e) {
      debugPrint("UI Login Error Catch: $e");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _handleLogout() async {
    setState(() => _isLoading = true);
    await AuthService.logout();
    setState(() {
      _accessToken = null;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: _isLoading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _accessToken == null
          ? LoginScreen(onLoginPressed: _handleLogin)
          : HomeScreen(
              accessToken: _accessToken!,
              onLogoutPressed: _handleLogout,
            ),
    );
  }
}
