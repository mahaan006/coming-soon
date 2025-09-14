import 'package:flutter/material.dart';

void main() => runApp(const ComingSoonApp());

class ComingSoonApp extends StatelessWidget {
  const ComingSoonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Coming Soon',
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(
          child: Text(
            'Coming Soon',
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }
}
