import 'package:sqflite/sqflite.dart';
import 'database_helper.dart';

enum LocalSyncStatus {
  pendingSync,
  syncing,
  synced,
  syncFailed,
}

class LocalInspection {
  final String id;
  final String clientUuid;
  final String officerId;
  final String status;
  final String localImagePath;
  final String? serverImageUrl;
  final String? imageMetadataJson;
  final DateTime capturedAt;
  final String? locationJson;
  final String? notes;
  final LocalSyncStatus syncStatus;
  final int syncAttempts;
  final String? lastSyncError;
  final DateTime createdAt;
  final DateTime updatedAt;

  LocalInspection({
    required this.id,
    required this.clientUuid,
    required this.officerId,
    required this.status,
    required this.localImagePath,
    this.serverImageUrl,
    this.imageMetadataJson,
    required this.capturedAt,
    this.locationJson,
    this.notes,
    required this.syncStatus,
    this.syncAttempts = 0,
    this.lastSyncError,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'client_uuid': clientUuid,
      'officer_id': officerId,
      'status': status,
      'local_image_path': localImagePath,
      'server_image_url': serverImageUrl,
      'image_metadata': imageMetadataJson,
      'captured_at': capturedAt.toIso8601String(),
      'location': locationJson,
      'notes': notes,
      'sync_status': syncStatus.name,
      'sync_attempts': syncAttempts,
      'last_sync_error': lastSyncError,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory LocalInspection.fromMap(Map<String, dynamic> map) {
    return LocalInspection(
      id: map['id'],
      clientUuid: map['client_uuid'],
      officerId: map['officer_id'],
      status: map['status'],
      localImagePath: map['local_image_path'],
      serverImageUrl: map['server_image_url'],
      imageMetadataJson: map['image_metadata'],
      capturedAt: DateTime.parse(map['captured_at']),
      locationJson: map['location'],
      notes: map['notes'],
      syncStatus: LocalSyncStatus.values.byName(map['sync_status']),
      syncAttempts: map['sync_attempts'],
      lastSyncError: map['last_sync_error'],
      createdAt: DateTime.parse(map['created_at']),
      updatedAt: DateTime.parse(map['updated_at']),
    );
  }
}

class InspectionDao {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  Future<int> insertInspection(LocalInspection inspection) async {
    final db = await _dbHelper.database;
    return await db.insert(
      'local_inspections',
      inspection.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<LocalInspection?> getInspectionByClientUuid(String clientUuid) async {
    final db = await _dbHelper.database;
    final maps = await db.query(
      'local_inspections',
      where: 'client_uuid = ?',
      whereArgs: [clientUuid],
    );

    if (maps.isNotEmpty) {
      return LocalInspection.fromMap(maps.first);
    }
    return null;
  }

  Future<List<LocalInspection>> getPendingSyncInspections() async {
    final db = await _dbHelper.database;
    final maps = await db.query(
      'local_inspections',
      where: 'sync_status = ? OR sync_status = ?',
      whereArgs: [LocalSyncStatus.pendingSync.name, LocalSyncStatus.syncFailed.name],
      orderBy: 'created_at ASC',
    );

    return maps.map((map) => LocalInspection.fromMap(map)).toList();
  }

  Future<int> updateSyncStatus(String clientUuid, LocalSyncStatus status, {String? error}) async {
    final db = await _dbHelper.database;
    return await db.update(
      'local_inspections',
      {
        'sync_status': status.name,
        'last_sync_error': error,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'client_uuid = ?',
      whereArgs: [clientUuid],
    );
  }
}
