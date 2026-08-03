// lib/providers/location_provider.dart
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/permission_service.dart';

class LocationProvider extends ChangeNotifier {
  LatLng? _currentLocation;
  bool _isLoading = true;
  String? _errorMessage;

  LatLng? get currentLocation => _currentLocation;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  static const LatLng _fallbackLocation = LatLng(32.0853, 34.7818);

  Future<void> initLocationFlow() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      bool hasPermission = await PermissionService.requestLocationPermission();

      if (!hasPermission) {
        debugPrint("Location provider: Permission denied. Setting fallback.");
        _useFallback("Permission not granted.");
        return;
      }

      // double-check if the hardware location toggles are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint("Location provider: Device GPS toggle is turned off.");
        _useFallback("Device location services are disabled.");
        return;
      }

      debugPrint("Location provider: fetching current position...");
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      _currentLocation = LatLng(position.latitude, position.longitude);
      _isLoading = false;
      notifyListeners();

      debugPrint(
        "Location provider success: ${_currentLocation!.latitude}, ${_currentLocation!.longitude}",
      );
    } catch (e) {
      debugPrint("Location provider error: $e");
      _useFallback("Error occurred resolving coordinates.");
    }
  }

  void _useFallback(String reason) {
    _currentLocation = _fallbackLocation;
    _errorMessage = reason;
    _isLoading = false;
    notifyListeners();
  }
}
