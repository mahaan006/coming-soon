import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:coming_soon/main.dart'; // package name must match pubspec.yaml 'name:'

void main() {
  testWidgets('Coming Soon screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const ComingSoonApp());
    expect(find.text('Coming Soon'), findsOneWidget);
  });
}
