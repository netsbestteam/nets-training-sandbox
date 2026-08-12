import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:latlong2/latlong.dart';

import '../services/routing_service.dart';
import '../services/websocket_service.dart';

class DashboardProvider extends ChangeNotifier {
  final WebSocketService _webSocketService = WebSocketService();
  final MapController mapController = MapController();

  String? _keycloakId;
  LatLng? _alertLocation;
  List<LatLng> _routePoints = [];

  LatLng? get alertLocation => _alertLocation;
  List<LatLng> get routePoints => _routePoints;

  void init({
    required String accessToken,
    required Function(String alertType, double x, double y)
    onAssignmentReceived,
  }) {
    _extractKeycloakId(accessToken);
    _initWebSocket(accessToken, onAssignmentReceived);
  }

  void _extractKeycloakId(String accessToken) {
    try {
      final decodedToken = JwtDecoder.decode(accessToken);
      _keycloakId = decodedToken['sub'];
    } catch (e) {
      debugPrint('Error decoding Keycloak token: $e');
    }
  }

  void _initWebSocket(
    String accessToken,
    Function(String alertType, double x, double y) onAssignmentReceived,
  ) {
    if (_keycloakId == null) return;
    final wsBaseUrl = dotenv.env['WS_BASE_URL'] ?? 'ws://10.0.2.2:3001/socket';

    _webSocketService.connect(
      wsUrl: '$wsBaseUrl?token=$accessToken',
      currentKeycloakId: _keycloakId!,
      onAssignmentReceived: onAssignmentReceived,
    );
  }

  Future<void> focusOnAlertAndDrawRoute({
    required double x,
    required double y,
    required LatLng? userLocation,
  }) async {
    final alertTarget = LatLng(y, x);
    _alertLocation = alertTarget;
    notifyListeners();

    if (userLocation != null) {
      List<LatLng> route = await RoutingService.getRoute(
        start: userLocation,
        end: alertTarget,
      );

      if (route.isEmpty) {
        debugPrint('OSRM Route unavailable. Falling back to direct line.');
        route = [userLocation, alertTarget];
      }

      _routePoints = route;
      notifyListeners();

      final bounds = LatLngBounds.fromPoints([userLocation, alertTarget]);
      mapController.fitCamera(
        CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50.0)),
      );
    } else {
      mapController.move(alertTarget, 16.0);
    }
  }

  void recenterOnUser(LatLng? userLocation) {
    if (userLocation != null) {
      mapController.move(userLocation, 15.0);
    }
  }

  @override
  void dispose() {
    _webSocketService.disconnect();
    mapController.dispose();
    super.dispose();
  }
}
