import 'package:flutter/material.dart';

class AssignmentDialog extends StatelessWidget {
  final String alertType;
  final double x;
  final double y;
  final VoidCallback onLocateOnMap;
  final VoidCallback onDismiss;

  const AssignmentDialog({
    super.key,
    required this.alertType,
    required this.x,
    required this.y,
    required this.onLocateOnMap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      actionsAlignment: MainAxisAlignment.center,
      title: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_turned_in, color: Colors.redAccent, size: 28),
          SizedBox(width: 8),
          Text('New Assignment!'),
        ],
      ),
      content: Text(
        'You have been assigned to handle an alert ($alertType) at location ($x, $y).',
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        textAlign: TextAlign.center,
      ),
      actions: [
        OutlinedButton.icon(
          onPressed: () {
            Navigator.of(context).pop();
            onDismiss();
          },
          icon: const Icon(Icons.close),
          label: const Text('Dismiss'),
        ),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
          ),
          onPressed: () {
            Navigator.of(context).pop();
            onLocateOnMap();
          },
          icon: const Icon(Icons.map),
          label: const Text('Locate on Map'),
        ),
      ],
    );
  }
}
