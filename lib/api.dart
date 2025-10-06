// lib/api.dart
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;

class Api {
  static String _pickDefaultBase() {
    if (kIsWeb) return 'http://127.0.0.1:3000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    } catch (_) {}
    return 'http://127.0.0.1:3000';
  }

  static final String _base = (() {
    const fromEnv = String.fromEnvironment('API_URL', defaultValue: '');
    return fromEnv.isNotEmpty ? fromEnv : _pickDefaultBase();
  })();

  static Future<bool> sendEmailOtp(String email) async {
    final uri = Uri.parse('$_base/send-email-otp');
    try {
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return false;
      final b = jsonDecode(res.body);
      return b is Map && b['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> verifyEmailOtp(String email, String code) async {
    final uri = Uri.parse('$_base/verify-email-otp');
    try {
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'code': code}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return false;
      final b = jsonDecode(res.body);
      return b is Map && b['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Create account after OTP succeeded
  static Future<bool> signUp(String username, String email, String password) async {
    final uri = Uri.parse('$_base/signup');
    try {
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return false;
      final b = jsonDecode(res.body);
      return b is Map && b['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Login with username OR email + password
  static Future<bool> login(String id, String password) async {
    final uri = Uri.parse('$_base/login');
    try {
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'id': id, 'password': password}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode != 200) return false;
      final b = jsonDecode(res.body);
      return b is Map && b['ok'] == true;
    } catch (_) {
      return false;
    }
  }
}
