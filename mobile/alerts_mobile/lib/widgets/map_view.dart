import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapView extends StatelessWidget {
  final LatLng currentLocation;

  const MapView({super.key, required this.currentLocation});

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      options: MapOptions(initialCenter: currentLocation, initialZoom: 15.0),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.alerts.nets_sandbox',
        ),
        MarkerLayer(
          markers: [
            Marker(
              point: currentLocation,
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
    );
  }
}
