// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../services/alerts_service.dart';

class HomeScreen extends StatefulWidget {
  final String accessToken;
  final VoidCallback onLogoutPressed;

  const HomeScreen({
    super.key,
    required this.accessToken,
    required this.onLogoutPressed,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initLocationFlow();
    });
  }

  void _triggerEmergencyReport(LatLng? location) async {
    if (location == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot send report: Location data not available.'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    debugPrint("EMERGENCY BUTTON PRESSED");
    debugPrint(
      "Current coordinates sent: ${location.latitude}, ${location.longitude}",
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Broadcasting emergency alert...'),
        duration: Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );

    bool isSuccess = await AlertService.sendEmergencyAlert(
      latitude: location.latitude,
      longitude: location.longitude,
      token: widget.accessToken,
    );

    // guard against context changes if the widget unmounted while waiting for the network
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isSuccess ? Icons.check_circle : Icons.error_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 10),
            Text(
              isSuccess
                  ? 'Emergency report sent successfully!'
                  : 'Failed to send report. Backend error.',
            ),
          ],
        ),
        backgroundColor: isSuccess ? Colors.green : Colors.red[900],
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogoutPressed,
          ),
        ],
      ),
      body: locationProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: locationProvider.currentLocation!,
                initialZoom: 15.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.alerts.nets_sandbox',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: locationProvider.currentLocation!,
                      width: 60,
                      height: 60,
                      child: const Icon(
                        Icons.my_location,
                        color: Colors.blueAccent,
                        size: 40,
                      ),
                    ),
                  ],
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            _triggerEmergencyReport(locationProvider.currentLocation),
        backgroundColor: Colors.blueAccent,
        icon: const Icon(
          Icons.warning_amber_rounded,
          color: Colors.white,
          size: 28,
        ),
        label: const Text(
          'EMERGENCY REPORT',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
