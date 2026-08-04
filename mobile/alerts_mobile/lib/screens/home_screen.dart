// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../services/alerts_service.dart';

class HomeScreen extends StatefulWidget {
  final String accessToken;
  final VoidCallback onLogoutPressed;

  const HomeScreen({
    super.key,
    required this.accessToken,
    required this.onLogoutPressed,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LocationProvider>().initLocationFlow();
    });
  }

  /// Opens the dialog form to collect alert_type and severity level
  void _showEmergencyDialog(LatLng? location) {
    if (location == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot send report: Location data not available.'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final formKey = GlobalKey<FormState>();
    final typeController = TextEditingController();
    int selectedSeverity = 5; // Default highest severity level

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
                  SizedBox(width: 8),
                  Text('New Emergency Alert'),
                ],
              ),
              content: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Alert Type Input
                    TextFormField(
                      controller: typeController,
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

                    // Severity Selector Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Severity Level:',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          '$selectedSeverity - ${sevLabels[selectedSeverity]}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.redAccent,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // 1-5 Number Buttons Selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(5, (index) {
                        int level = index + 1;
                        bool isSelected = selectedSeverity == level;

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
                              setDialogState(() {
                                selectedSeverity = level;
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
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    if (formKey.currentState!.validate()) {
                      final alertType = typeController.text.trim();
                      Navigator.of(dialogContext).pop(); // Close modal
                      _submitEmergencyReport(
                        location: location,
                        alertType: alertType,
                        severity: selectedSeverity,
                      );
                    }
                  },
                  child: const Text('Send Alert'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// Helper map for human-readable severity descriptions
  static const Map<int, String> sevLabels = {
    1: 'Minor',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Critical',
  };

  /// Dispatches the final network call
  void _submitEmergencyReport({
    required LatLng location,
    required String alertType,
    required int severity,
  }) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Broadcasting emergency alert...'),
        duration: Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );

    bool isSuccess = await AlertService.sendEmergencyAlert(
      latitude: location.latitude,
      longitude: location.longitude,
      token: widget.accessToken,
      severity: severity,
      alertType: alertType,
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isSuccess ? Icons.check_circle : Icons.error_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 10),
            Text(
              isSuccess
                  ? 'Emergency report ($alertType) sent!'
                  : 'Failed to send report. Backend error.',
            ),
          ],
        ),
        backgroundColor: isSuccess ? Colors.green : Colors.grey[900],
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogoutPressed,
          ),
        ],
      ),
      body: locationProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: locationProvider.currentLocation!,
                initialZoom: 15.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.alerts.nets_sandbox',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: locationProvider.currentLocation!,
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
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEmergencyDialog(locationProvider.currentLocation),
        backgroundColor: Colors.blueAccent,
        icon: const Icon(
          Icons.warning_amber_rounded,
          color: Colors.white,
          size: 28,
        ),
        label: const Text(
          'EMERGENCY REPORT',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
