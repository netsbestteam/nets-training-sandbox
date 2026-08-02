import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  static Future<bool> requestLocationPermission() async {
    try {
      debugPrint("checking location permission status...");

      // check current status
      var status = await Permission.location.status;

      if (status.isGranted) {
        debugPrint("Location permission already granted.");
        return true;
      }

      // request the permission
      debugPrint("prompting user for location permission...");
      var result = await Permission.location.request();

      if (result.isGranted) {
        debugPrint("location permission granted by user.");
        return true;
      } else if (result.isPermanentlyDenied) {
        debugPrint(
          "location permission permanently denied. Opening settings...",
        );
        // open app settings if permanently denied
        await openAppSettings();
        return false;
      }

      debugPrint("location permission denied.");
      return false;
    } catch (e) {
      debugPrint("failed to handle location permission: $e");
      return false;
    }
  }
}
