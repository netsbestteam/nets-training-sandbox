import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';
import '../providers/location_provider.dart';
import '../widgets/assignment_dialog.dart';
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
    );
  }
}
