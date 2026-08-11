import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../providers/location_provider.dart';
import '../services/alerts_service.dart';
import '../services/websocket_service.dart';
import '../utils/snackbar_utils.dart';
import '../widgets/assignment_dialog.dart';
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
  final WebSocketService _webSocketService = WebSocketService();
  String? _keycloakId;

  @override
  void initState() {
    super.initState();
    _extractKeycloakId();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initLocationFlow();
      _initWebSocket();
    });
  }

  void _extractKeycloakId() {
    try {
      final decodedToken = JwtDecoder.decode(widget.accessToken);
      _keycloakId = decodedToken['sub'];
    } catch (e) {
      debugPrint('Error decoding Keycloak token: $e');
    }
  }

  void _initWebSocket() {
    if (_keycloakId == null) {
      debugPrint('Cannot connect WebSocket: keycloak_id is null');
      return;
    }

    final wsBaseUrl = dotenv.env['WS_BASE_URL'];

    _webSocketService.connect(
      wsUrl: '$wsBaseUrl?token=${widget.accessToken}',
      currentKeycloakId: _keycloakId!,
      onAssignmentReceived: (alertType, x, y) {
        if (mounted) {
          AssignmentDialog.show(
            context: context,
            alertType: alertType,
            x: x,
            y: y,
          );
        }
      },
    );
  }

  void _showEmergencyDialog(LatLng? location) {
    if (location == null) {
      SnackBarUtils.showWarning(
        context,
        'Cannot send report: Location data not available.',
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

  Future<void> _submitEmergencyReport({
    required LatLng location,
    required String alertType,
    required int severity,
  }) async {
    SnackBarUtils.showInfo(context, 'Broadcasting emergency alert...');

    final isSuccess = await AlertService.sendEmergencyAlert(
      latitude: location.latitude,
      longitude: location.longitude,
      token: widget.accessToken,
      severity: severity,
      alertType: alertType,
    );

    if (!mounted) return;

    SnackBarUtils.showReportStatus(
      context,
      isSuccess: isSuccess,
      alertType: alertType,
    );
  }

  @override
  void dispose() {
    _webSocketService.disconnect();
    super.dispose();
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
