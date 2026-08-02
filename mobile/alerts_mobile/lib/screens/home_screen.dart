// lib/screens/sandbox_home_screen.dart
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  final String accessToken;
  final VoidCallback onLogoutPressed;

  const HomeScreen({
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
