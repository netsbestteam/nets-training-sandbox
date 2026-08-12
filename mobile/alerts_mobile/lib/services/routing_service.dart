import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class RoutingService {
  static Future<List<LatLng>> getRoute({
    required LatLng start,
    required LatLng end,
  }) async {
    final url = Uri.parse(
      'https://router.project-osrm.org/route/v1/driving/'
      '${start.longitude},${start.latitude};${end.longitude},${end.latitude}'
      '?overview=full&geometries=geojson',
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final coordinates =
            data['routes'][0]['geometry']['coordinates'] as List;

        return coordinates
            .map(
              (coord) => LatLng(
                (coord[1] as num).toDouble(),
                (coord[0] as num).toDouble(),
              ),
            )
            .toList();
      }
    } catch (e) {
      print('Error fetching route: $e');
    }
    return [];
  }
}
