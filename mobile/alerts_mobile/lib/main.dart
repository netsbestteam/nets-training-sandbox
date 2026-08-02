// lib/main.dart
import 'package:flutter/material.dart';
import 'services/auth_service.dart';
import 'services/permission_service.dart'; // IMPORTED: Your permission service file

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
          debugPrint("📍 GPS Permission Granted by user.");
        } else {
          debugPrint(
            "⚠️ GPS Permission Denied by user. Proceeding with limited features.",
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
          : SandboxHomeScreen(
              accessToken: _accessToken!,
              onLogoutPressed: _handleLogout,
            ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  final VoidCallback onLoginPressed;
  const LoginScreen({super.key, required this.onLoginPressed});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: ElevatedButton.icon(
          icon: const Icon(Icons.lock_open),
          label: const Text('Login with Keycloak'),
          onPressed: onLoginPressed,
        ),
      ),
    );
  }
}

class SandboxHomeScreen extends StatelessWidget {
  final String accessToken;
  final VoidCallback onLogoutPressed;

  const SandboxHomeScreen({
    super.key,
    required this.accessToken,
    required this.onLogoutPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NETS_SANDBOX'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: onLogoutPressed,
          ),
        ],
      ),
      body: const Center(child: Text('Hello World! You are authenticated.')),
    );
  }
}
