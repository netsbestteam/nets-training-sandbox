import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';
import '../providers/location_provider.dart';
import '../services/alerts_service.dart';
import '../widgets/assignment_dialog.dart';
import '../widgets/emergency_dialog.dart';
import '../widgets/map_view_stack.dart';

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
    return ChangeNotifierProvider(
      create: (_) => DashboardProvider(),
      child: _HomeScreenBody(
        accessToken: accessToken,
        onLogoutPressed: onLogoutPressed,
      ),
    );
  }
}

class _HomeScreenBody extends StatefulWidget {
  final String accessToken;
  final VoidCallback onLogoutPressed;

  const _HomeScreenBody({
    required this.accessToken,
    required this.onLogoutPressed,
  });

  @override
  State<_HomeScreenBody> createState() => _HomeScreenBodyState();
}

class _HomeScreenBodyState extends State<_HomeScreenBody> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initLocationFlow();
      context.read<DashboardProvider>().init(
        accessToken: widget.accessToken,
        onAssignmentReceived: _showAssignmentPopup,
      );
    });
  }

  void _showAssignmentPopup(String alertType, double x, double y) {
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AssignmentDialog(
        alertType: alertType,
        x: x,
        y: y,
        onDismiss: () {},
        onLocateOnMap: () {
          final userLocation = context.read<LocationProvider>().currentLocation;
          context.read<DashboardProvider>().focusOnAlertAndDrawRoute(
            x: x,
            y: y,
            userLocation: userLocation,
          );
        },
      ),
    );
  }

  void _openEmergencyReportDialog() {
    final location = context.read<LocationProvider>().currentLocation;

    if (location == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location unavailable. Cannot report emergency.'),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (dialogContext) => EmergencyDialog(
        onSubmit: (alertType, severity) => _handleEmergencySubmit(
          alertType: alertType,
          severity: severity,
          latitude: location.latitude,
          longitude: location.longitude,
        ),
      ),
    );
  }

  Future<void> _handleEmergencySubmit({
    required String alertType,
    required int severity,
    required double latitude,
    required double longitude,
  }) async {
    final success = await AlertService.sendEmergencyAlert(
      latitude: latitude,
      longitude: longitude,
      token: widget.accessToken,
      severity: severity,
      alertType: alertType,
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Emergency alert sent successfully!'
              : 'Failed to send alert.',
        ),
        backgroundColor: success ? Colors.green : Colors.red,
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
          : MapViewStack(currentLocation: locationProvider.currentLocation!),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openEmergencyReportDialog,
        backgroundColor: Colors.red,
        icon: const Icon(Icons.warning_amber_rounded, color: Colors.white),
        label: const Text(
          'REPORT EMERGENCY',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
