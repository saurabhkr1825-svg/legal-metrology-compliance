import 'package:flutter/material.dart';
import 'package:slm_mobile/screens/login_screen.dart';

class SlmApp extends StatelessWidget {
  const SlmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Legal Metrology',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
