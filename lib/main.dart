// lib/main.dart
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import 'api.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ComingSoonApp());
}

class ComingSoonApp extends StatelessWidget {
  const ComingSoonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Coming Soon',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        useMaterial3: true,
      ),
      home: const LoginSignUpPage(),
    );
  }
}

/// After successful login
class ComingSoonPage extends StatelessWidget {
  const ComingSoonPage({super.key});

  @override
  Widget build(BuildContext context) {
    final onWindows = !kIsWeb && Platform.isWindows;
    return Scaffold(
      appBar: AppBar(title: const Text('Coming Soon')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Coming Soon',
                style: TextStyle(fontSize: 36, fontWeight: FontWeight.w700)),
            if (onWindows)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: Text(
                  'Note: Phone auth is not implemented in this build.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Tabs: Login | Sign up
class LoginSignUpPage extends StatefulWidget {
  final int initialIndex;
  const LoginSignUpPage({super.key, this.initialIndex = 0});

  @override
  State<LoginSignUpPage> createState() => _LoginSignUpPageState();
}

class _LoginSignUpPageState extends State<LoginSignUpPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tab =
  TabController(length: 2, vsync: this, initialIndex: widget.initialIndex);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Welcome'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [Tab(text: 'Login'), Tab(text: 'Sign up')],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          const _LoginTab(),
          _SignUpTab(onSignedUpGoToLogin: () => _tab.animateTo(0)),
        ],
      ),
    );
  }
}

/// LOGIN TAB: username/email + password -> ComingSoonPage
class _LoginTab extends StatefulWidget {
  const _LoginTab();

  @override
  State<_LoginTab> createState() => _LoginTabState();
}

class _LoginTabState extends State<_LoginTab> {
  final _form = GlobalKey<FormState>();
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _idCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _err = null);
    if (!_form.currentState!.validate()) return;

    final id = _idCtrl.text.trim(); // username or email
    final pass = _passCtrl.text;

    setState(() => _busy = true);
    final ok = await Api.login(id, pass); // POSitional params
    setState(() => _busy = false);

    if (!ok) {
      setState(() => _err = 'Invalid credentials');
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ComingSoonPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AbsorbPointer(
      absorbing: _busy,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _form,
          child: Column(
            children: [
              TextFormField(
                controller: _idCtrl,
                decoration: const InputDecoration(labelText: 'Username or Email'),
                validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              if (_err != null)
                Text(_err!, style: const TextStyle(color: Colors.red)),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _busy ? null : _login,
                  child: _busy
                      ? const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                      : const Text('Login'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// SIGN UP TAB: username + email + password -> OTP -> signUp -> back to Login
class _SignUpTab extends StatefulWidget {
  final VoidCallback onSignedUpGoToLogin;
  const _SignUpTab({required this.onSignedUpGoToLogin});

  @override
  State<_SignUpTab> createState() => _SignUpTabState();
}

class _SignUpTabState extends State<_SignUpTab> {
  final _form = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _startSignUp() async {
    setState(() => _err = null);
    if (!_form.currentState!.validate()) return;

    final username = _usernameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;

    setState(() => _busy = true);

    // 1) send OTP
    final sent = await Api.sendEmailOtp(email);
    setState(() => _busy = false);

    if (!sent) {
      setState(() => _err = 'Failed to send verification code.');
      return;
    }

    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _EmailOtpPage(
          email: email,
          username: username,
          password: password,
          onSuccess: () {
            // After successful sign-up, go back to Login tab
            widget.onSignedUpGoToLogin();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Account created. Please log in.')),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AbsorbPointer(
      absorbing: _busy,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _form,
          child: Column(
            children: [
              TextFormField(
                controller: _usernameCtrl,
                decoration: const InputDecoration(labelText: 'Username'),
                validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              if (_err != null)
                Text(_err!, style: const TextStyle(color: Colors.red)),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _busy ? null : _startSignUp,
                  child: _busy
                      ? const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                      : const Text('Create account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmailOtpPage extends StatefulWidget {
  final String email;
  final String username;
  final String password;
  final VoidCallback onSuccess;
  const _EmailOtpPage({
    required this.email,
    required this.username,
    required this.password,
    required this.onSuccess,
  });

  @override
  State<_EmailOtpPage> createState() => _EmailOtpPageState();
}

class _EmailOtpPageState extends State<_EmailOtpPage> {
  final _codeCtrl = TextEditingController();
  String? _err;
  bool _busy = false;

  Future<void> _verify() async {
    setState(() => _err = null);
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) {
      setState(() => _err = 'Code is required');
      return;
    }

    setState(() => _busy = true);

    // 1) verify OTP
    final ok = await Api.verifyEmailOtp(widget.email, code);
    if (!ok) {
      setState(() {
        _busy = false;
        _err = 'Invalid or expired code';
      });
      return;
    }

    // 2) create user in DB
    final created =
    await Api.signUp(widget.username, widget.email, widget.password);

    setState(() => _busy = false);

    if (!created) {
      setState(() => _err = 'Failed to create account (maybe already exists).');
      return;
    }

    if (!mounted) return;
    Navigator.of(context).pop(); // back to tabs page
    widget.onSuccess(); // switch to Login tab + snackbar
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Enter OTP for ${widget.email}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _codeCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-digit code'),
            ),
            const SizedBox(height: 12),
            if (_err != null)
              Text(_err!, style: const TextStyle(color: Colors.red)),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _verify,
                child: _busy
                    ? const Padding(
                  padding: EdgeInsets.all(8.0),
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
