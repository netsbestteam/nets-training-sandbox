import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/location_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: ".env");
    debugPrint("env configuration loaded successfully.");
  } catch (e) {
    debugPrint("env Configuration Error: Could not load .env file -> $e");
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider()..checkExistingAuth(),
        ),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
      ],
      child: const MainApp(),
    ),
  );
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Listen to the auth state to decide which screen to show automatically!
    final authProvider = context.watch<AuthProvider>();

    if (authProvider.isLoading && !authProvider.isAuthenticated) {
      return const MaterialApp(
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    return MaterialApp(
      title: 'NETS Sandbox',
      home: authProvider.isAuthenticated
          ? HomeScreen(
              accessToken: authProvider.accessToken!,
              onLogoutPressed: () => authProvider.logout(),
            )
          : LoginScreen(
              onLoginPressed: () async {
                await context.read<AuthProvider>().login();
              },
            ),
    );
  }
}
