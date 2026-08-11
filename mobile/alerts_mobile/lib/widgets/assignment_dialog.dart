import 'package:flutter/material.dart';

class AssignmentDialog extends StatelessWidget {
  final String alertType;
  final double x;
  final double y;
  final VoidCallback onConfirm;

  const AssignmentDialog({
    super.key,
    required this.alertType,
    required this.x,
    required this.y,
    required this.onConfirm,
  });

  static Future<void> show({
    required BuildContext context,
    required String alertType,
    required double x,
    required double y,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AssignmentDialog(
        alertType: alertType,
        x: x,
        y: y,
        onConfirm: () => Navigator.of(dialogContext).pop(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      actionsAlignment: MainAxisAlignment.center,
      title: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_turned_in, color: Colors.redAccent, size: 28),
          SizedBox(width: 8),
          Text('New alert!'),
        ],
      ),
      content: Text(
        'You have been assigned to handle an alert of type $alertType at location ($x, $y)!',
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        textAlign: TextAlign.center,
        textDirection: TextDirection.ltr,
      ),
      actions: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
          ),
          onPressed: onConfirm,
          child: const Text('OK'),
        ),
      ],
    );
  }
}
