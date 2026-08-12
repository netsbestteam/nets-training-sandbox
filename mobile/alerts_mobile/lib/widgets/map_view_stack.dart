import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../providers/dashboard_provider.dart';

class MapViewStack extends StatelessWidget {
  final LatLng currentLocation;

  const MapViewStack({super.key, required this.currentLocation});

  @override
  Widget build(BuildContext context) {
    final dashboard = context.watch<DashboardProvider>();

    return Stack(
      children: [
        FlutterMap(
          mapController: dashboard.mapController,
          options: MapOptions(
            initialCenter: currentLocation,
            initialZoom: 15.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.nets.mobile',
            ),
            if (dashboard.routePoints.isNotEmpty)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: dashboard.routePoints,
                    strokeWidth: 4.0,
                    color: Colors.blueAccent,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                Marker(
                  point: currentLocation,
                  child: const Icon(
                    Icons.my_location,
                    color: Colors.blue,
                    size: 30,
                  ),
                ),
                if (dashboard.alertLocation != null)
                  Marker(
                    point: dashboard.alertLocation!,
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
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton(
            heroTag: 'recenter_btn',
            backgroundColor: Colors.white,
            onPressed: () => dashboard.recenterOnUser(currentLocation),
            child: const Icon(Icons.gps_fixed, color: Colors.blue),
          ),
        ),
      ],
    );
  }
}
