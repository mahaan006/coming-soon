import 'package:flutter/material.dart';
import 'api.dart';

class EmailOtpPage extends StatefulWidget {
  final String email;
  const EmailOtpPage({super.key, required this.email});

  @override
  State<EmailOtpPage> createState() => _EmailOtpPageState();
}

class _EmailOtpPageState extends State<EmailOtpPage> {
  final _codeCtrl = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() => _err = null);
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) {
      setState(() => _err = 'Enter the 6-digit code');
      return;
    }
    setState(() => _busy = true);
    try {
      final ok = await Api.verifyEmailOtp(widget.email, code);
      if (!ok) {
        setState(() => _err = 'Invalid or expired code');
        return;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Email verified!')));
      Navigator.pop(context); // or go to next page
    } catch (e) {
      setState(() => _err = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Email')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text('A code was sent to ${widget.email}'),
            const SizedBox(height: 12),
            TextField(
              controller: _codeCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-digit code'),
            ),
            const SizedBox(height: 12),
            if (_err != null) Text(_err!, style: const TextStyle(color: Colors.red)),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _verify,
                child: _busy
                    ? const SizedBox(
                  width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
                    : const Text('Verify'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
