import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketChannel? _channel;

  void connect({
    required String wsUrl,
    required String currentKeycloakId,
    required Function(String alertType, double x, double y)
    onAssignmentReceived,
  }) {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      debugPrint("WebSocket connected to $wsUrl");

      _channel!.stream.listen(
        (message) {
          debugPrint("WS Received Raw Message: $message");

          final data = jsonDecode(message);

          if (data['event'] == 'alerts.assigned' ||
              data['type'] == 'alerts.assigned') {
            final payload = data['data'] ?? data['payload'] ?? data;

            bool isAssignedToMe = false;

            final assignedId =
                payload['investigatorId'] ?? payload['keycloak_id'];

            if (assignedId == currentKeycloakId) {
              isAssignedToMe = true;
            }

            if (payload['investigatorIds'] is List) {
              final List idsList = payload['investigatorIds'];
              if (idsList.contains(currentKeycloakId)) {
                isAssignedToMe = true;
              }
            }

            debugPrint(
              "Assignment match result: $isAssignedToMe (Expected ID: $currentKeycloakId, Received ID: $assignedId)",
            );

            if (isAssignedToMe) {
              final alertType =
                  payload['alertType'] ?? payload['alertId'] ?? 'Emergency';
              final loc = payload['location'] ?? {};
              final double x = (loc['x'] as num?)?.toDouble() ?? 0.0;
              final double y = (loc['y'] as num?)?.toDouble() ?? 0.0;

              onAssignmentReceived(alertType, x, y);
            }
          }
        },
        onError: (error) {
          debugPrint("WebSocket Error: $error");
        },
      );
    } catch (e) {
      debugPrint("WebSocket connection failed: $e");
    }
  }

  void disconnect() {
    _channel?.sink.close();
  }
}
