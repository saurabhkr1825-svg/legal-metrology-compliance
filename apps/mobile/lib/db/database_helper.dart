import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('slm_inspections.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Local inspections table for offline-first workflow
    await db.execute('''
      CREATE TABLE local_inspections (
        id TEXT PRIMARY KEY,
        client_uuid TEXT NOT NULL UNIQUE,
        officer_id TEXT NOT NULL,
        status TEXT NOT NULL,
        local_image_path TEXT NOT NULL,
        server_image_url TEXT,
        image_metadata TEXT,
        captured_at TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        sync_status TEXT NOT NULL,
        sync_attempts INTEGER NOT NULL DEFAULT 0,
        last_sync_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute(
      'CREATE INDEX idx_local_inspections_sync ON local_inspections(sync_status)',
    );
  }

  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }
}
