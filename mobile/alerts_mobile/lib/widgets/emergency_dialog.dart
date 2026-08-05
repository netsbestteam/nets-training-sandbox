import 'package:flutter/material.dart';

class EmergencyDialog extends StatefulWidget {
  final Function(String alertType, int severity) onSubmit;

  const EmergencyDialog({super.key, required this.onSubmit});

  static const Map<int, String> sevLabels = {
    1: 'Minor',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Critical',
  };

  @override
  State<EmergencyDialog> createState() => _EmergencyDialogState();
}

class _EmergencyDialogState extends State<EmergencyDialog> {
  final _formKey = GlobalKey<FormState>();
  final _typeController = TextEditingController();
  int _selectedSeverity = 5;

  @override
  void dispose() {
    _typeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
          SizedBox(width: 8),
          Text('New Emergency Alert'),
        ],
      ),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: _typeController,
              decoration: const InputDecoration(
                labelText: 'Alert Type',
                hintText: 'e.g., Fire, Medical, Intruder',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter an alert type';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Severity Level:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Text(
                  '$_selectedSeverity - ${EmergencyDialog.sevLabels[_selectedSeverity]}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.redAccent,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(5, (index) {
                int level = index + 1;
                bool isSelected = _selectedSeverity == level;

                return SizedBox(
                  width: 42,
                  height: 42,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.zero,
                      backgroundColor: isSelected
                          ? Colors.redAccent
                          : Colors.transparent,
                      foregroundColor: isSelected
                          ? Colors.white
                          : Colors.black87,
                      side: BorderSide(
                        color: isSelected
                            ? Colors.redAccent
                            : Colors.grey.shade400,
                        width: isSelected ? 2 : 1,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () {
                      setState(() {
                        _selectedSeverity = level;
                      });
                    },
                    child: Text(
                      '$level',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
          ),
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final type = _typeController.text.trim();
              Navigator.of(context).pop();
              widget.onSubmit(type, _selectedSeverity);
            }
          },
          child: const Text('Send Alert'),
        ),
      ],
    );
  }
}
