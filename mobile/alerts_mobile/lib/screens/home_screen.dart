import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../providers/location_provider.dart';
import '../services/alerts_service.dart';
import '../services/routing_service.dart';
import '../services/websocket_service.dart';
import '../widgets/assignment_dialog.dart';

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
  final MapController _mapController = MapController();

  String? _keycloakId;
  LatLng? _alertLocation;
  List<LatLng> _routePoints = [];

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
    if (_keycloakId == null) return;
    final wsBaseUrl = dotenv.env['WS_BASE_URL'] ?? 'ws://10.0.2.2:3001/socket';

    _webSocketService.connect(
      wsUrl: '$wsBaseUrl?token=${widget.accessToken}',
      currentKeycloakId: _keycloakId!,
      onAssignmentReceived: _showAssignmentPopup,
    );
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
        onLocateOnMap: () => _focusOnAlertAndDrawRoute(x, y),
      ),
    );
  }

  Future<void> _focusOnAlertAndDrawRoute(double x, double y) async {
    // Note: Verify x and y order from your backend.
    // Usually x = Longitude, y = Latitude (or x = Lat, y = Lng).
    final alertTarget = LatLng(y, x);
    final userLocation = context.read<LocationProvider>().currentLocation;

    setState(() {
      _alertLocation = alertTarget;
    });

    if (userLocation != null) {
      // try fetching driving route from OSRM
      List<LatLng> route = await RoutingService.getRoute(
        start: userLocation,
        end: alertTarget,
      );

      // fallback: draw direct line
      if (route.isEmpty) {
        debugPrint('OSRM Route unavailable. Falling back to direct line.');
        route = [userLocation, alertTarget];
      }

      if (mounted) {
        setState(() {
          _routePoints = route;
        });

        // fit map camera so BOTH user and alert are visible simultaneously
        final bounds = LatLngBounds.fromPoints([userLocation, alertTarget]);
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: bounds,
            padding: const EdgeInsets.all(50.0), // Padding around edges
          ),
        );
      }
    } else {
      // if user location is not ready, just move camera to alert
      _mapController.move(alertTarget, 16.0);
    }
  }

  void _recenterOnUser() {
    final userLocation = context.read<LocationProvider>().currentLocation;
    if (userLocation != null) {
      _mapController.move(userLocation, 15.0);
    }
  }

  @override
  void dispose() {
    _webSocketService.disconnect();
    _mapController.dispose();
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
          : Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: locationProvider.currentLocation!,
                    initialZoom: 15.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.nets.mobile',
                    ),
                    // Draw Navigation Route Polyline
                    if (_routePoints.isNotEmpty)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: _routePoints,
                            strokeWidth: 4.0,
                            color: Colors.blueAccent,
                          ),
                        ],
                      ),
                    // Draw Markers
                    MarkerLayer(
                      markers: [
                        // User Current Location
                        Marker(
                          point: locationProvider.currentLocation!,
                          child: const Icon(
                            Icons.my_location,
                            color: Colors.blue,
                            size: 30,
                          ),
                        ),
                        // Alert Assignment Location
                        if (_alertLocation != null)
                          Marker(
                            point: _alertLocation!,
                            child: const Icon(
                              Icons.location_on,
                              color: Colors.red,
                              size: 40,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                // Recenter / My Location Floating Action Button
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: FloatingActionButton(
                    heroTag: 'recenter_btn',
                    backgroundColor: Colors.white,
                    onPressed: _recenterOnUser,
                    child: const Icon(Icons.gps_fixed, color: Colors.blue),
                  ),
                ),
              ],
            ),
    );
  }
}
