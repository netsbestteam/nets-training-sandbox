// lib/services/alert_service.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AlertService {
  static final String _baseUrl =
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3000';

  static Future<bool> sendEmergencyAlert({
    required double latitude,
    required double longitude,
    required String token,
  }) async {
    final url = Uri.parse('$_baseUrl/alerts');

    try {
      debugPrint("Sending POST request to $url...");

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          "severity": 5,
          "status": "open",
          "location": {"x": longitude, "y": latitude},
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint("Alert broadcasted successfully: ${response.body}");
        return true;
      } else {
        debugPrint(
          "Server rejected alert. Status: ${response.statusCode}, Body: ${response.body}",
        );
        return false;
      }
    } catch (e) {
      debugPrint("Failed to dispatch emergency network call: $e");
      return false;
    }
  }
}
