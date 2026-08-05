import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../services/alerts_service.dart';
import '../services/websocket_service.dart';
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
  late final WebSocketService _webSocketService;
  String? _keycloakId;

  @override
  void initState() {
    super.initState();
    _webSocketService = WebSocketService();
    _extractKeycloakId();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initLocationFlow();
      _initWebSocket();
    });
  }

  void _extractKeycloakId() {
    try {
      Map<String, dynamic> decodedToken = JwtDecoder.decode(widget.accessToken);
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

    final wsBaseUrl = dotenv.env['WS_BASE_URL'] ?? 'ws://10.0.2.2:3001/socket';

    _webSocketService.connect(
      wsUrl: '$wsBaseUrl?token=${widget.accessToken}',
      currentKeycloakId: _keycloakId!,
      onAssignmentReceived: (alertType, x, y) {
        _showAssignmentPopup(alertType, x, y);
      },
    );
  }

  void _showAssignmentPopup(String alertType, double x, double y) {
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        actionsAlignment: MainAxisAlignment.center,
        title: const Row(
          mainAxisAlignment: MainAxisAlignment.center, // Centers title elements
          children: [
            Icon(Icons.assignment_turned_in, color: Colors.redAccent, size: 28),
            SizedBox(width: 8),
            Text('New alert!'),
          ],
        ),
        content: Text(
          'You have been assigned to handle an alert of type $alertType at location ($x, $y)!',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center, // Centers content body text
          textDirection: TextDirection.ltr,
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
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
