import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../services/alerts_service.dart';
import '../widgets/emergency_dialog.dart';
import '../widgets/map_view.dart';

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

  void _showEmergencyDialog(LatLng? location) {
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

    showDialog(
      context: context,
      builder: (context) => EmergencyDialog(
        onSubmit: (alertType, severity) => _submitEmergencyReport(
          location: location,
          alertType: alertType,
          severity: severity,
        ),
      ),
    );
  }

  void _submitEmergencyReport({
    required LatLng location,
    required String alertType,
    required int severity,
  }) async {
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
      severity: severity,
      alertType: alertType,
    );

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
                  ? 'Emergency report ($alertType) sent!'
                  : 'Failed to send report. Backend error.',
            ),
          ],
        ),
        backgroundColor: isSuccess ? Colors.green : Colors.grey[900],
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
          : MapView(currentLocation: locationProvider.currentLocation!),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEmergencyDialog(locationProvider.currentLocation),
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
