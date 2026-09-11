/// Domain models mirroring packages/shared/src/types.ts
/// FROZEN after Phase 0 approval

enum UserRole {
  fieldOfficer,
  supervisor,
  admin,
}

enum InspectionStatus {
  draft,
  pendingUpload,
  queued,
  processing,
  reviewRequired,
  completed,
  synced,
}

enum InspectionResult {
  pass,
  fail,
  review,
}

enum Severity {
  critical,
  high,
  medium,
  low,
}

class User {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? phone;
  final String? region;
  final String? department;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.region,
    this.department,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      role: UserRole.values.byName(json['role']),
      phone: json['phone'],
      region: json['region'],
      department: json['department'],
      isActive: json['isActive'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role.name,
      'phone': phone,
      'region': region,
      'department': department,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class Inspection {
  final String id;
  final String clientUuid;
  final String officerId;
  final InspectionStatus status;
  final InspectionResult? result;
  final String imageUrl;
  final ImageMetadata imageMetadata;
  final Declaration? declaration;
  final Declaration? reviewedDeclaration;
  final List<Violation> violations;
  final String ruleVersion;
  final DateTime capturedAt;
  final DateTime? uploadedAt;
  final DateTime? processedAt;
  final DateTime? reviewedAt;
  final DateTime? completedAt;
  final GeoLocation? location;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Inspection({
    required this.id,
    required this.clientUuid,
    required this.officerId,
    required this.status,
    this.result,
    required this.imageUrl,
    required this.imageMetadata,
    this.declaration,
    this.reviewedDeclaration,
    required this.violations,
    required this.ruleVersion,
    required this.capturedAt,
    this.uploadedAt,
    this.processedAt,
    this.reviewedAt,
    this.completedAt,
    this.location,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientUuid': clientUuid,
      'officerId': officerId,
      'status': status.name,
      'result': result?.name,
      'imageUrl': imageUrl,
      'imageMetadata': imageMetadata.toJson(),
      'declaration': declaration?.toJson(),
      'reviewedDeclaration': reviewedDeclaration?.toJson(),
      'violations': violations.map((v) => v.toJson()).toList(),
      'ruleVersion': ruleVersion,
      'capturedAt': capturedAt.toIso8601String(),
      'uploadedAt': uploadedAt?.toIso8601String(),
      'processedAt': processedAt?.toIso8601String(),
      'reviewedAt': reviewedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'location': location?.toJson(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class ImageMetadata {
  final int width;
  final int height;
  final String format;
  final int sizeBytes;
  final String captureMode;

  ImageMetadata({
    required this.width,
    required this.height,
    required this.format,
    required this.sizeBytes,
    required this.captureMode,
  });

  Map<String, dynamic> toJson() {
    return {
      'width': width,
      'height': height,
      'format': format,
      'sizeBytes': sizeBytes,
      'captureMode': captureMode,
    };
  }
}

class GeoLocation {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final DateTime? timestamp;

  GeoLocation({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'timestamp': timestamp?.toIso8601String(),
    };
  }
}

class Declaration {
  final FieldValue? manufacturerName;
  final FieldValue? manufacturerAddress;
  final FieldValue? commodityName;
  final FieldValue? netQuantity;
  final FieldValue? mrp;
  final FieldValue? manufactureDate;
  final FieldValue? bestBefore;
  final FieldValue? consumerCare;

  Declaration({
    this.manufacturerName,
    this.manufacturerAddress,
    this.commodityName,
    this.netQuantity,
    this.mrp,
    this.manufactureDate,
    this.bestBefore,
    this.consumerCare,
  });

  Map<String, dynamic> toJson() {
    return {
      'manufacturerName': manufacturerName?.toJson(),
      'manufacturerAddress': manufacturerAddress?.toJson(),
      'commodityName': commodityName?.toJson(),
      'netQuantity': netQuantity?.toJson(),
      'mrp': mrp?.toJson(),
      'manufactureDate': manufactureDate?.toJson(),
      'bestBefore': bestBefore?.toJson(),
      'consumerCare': consumerCare?.toJson(),
    };
  }
}

class FieldValue {
  final String value;
  final double confidence;
  final String source;

  FieldValue({
    required this.value,
    required this.confidence,
    required this.source,
  });

  Map<String, dynamic> toJson() {
    return {
      'value': value,
      'confidence': confidence,
      'source': source,
    };
  }
}

class Violation {
  final String id;
  final String ruleId;
  final String ruleVersion;
  final String ruleName;
  final Severity severity;
  final String? field;
  final String? expectedValue;
  final String? actualValue;
  final String message;
  final bool requiresReview;

  Violation({
    required this.id,
    required this.ruleId,
    required this.ruleVersion,
    required this.ruleName,
    required this.severity,
    this.field,
    this.expectedValue,
    this.actualValue,
    required this.message,
    required this.requiresReview,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ruleId': ruleId,
      'ruleVersion': ruleVersion,
      'ruleName': ruleName,
      'severity': severity.name,
      'field': field,
      'expectedValue': expectedValue,
      'actualValue': actualValue,
      'message': message,
      'requiresReview': requiresReview,
    };
  }
}
