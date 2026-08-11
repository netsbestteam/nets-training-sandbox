// lib/screens/login_screen.dart
import 'package:flutter/material.dart';

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
