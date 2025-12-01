# تعليمات للمبرمج الفرونت (لوحة تحكم TrackingRequests)

## نظرة عامة
- الـAPI: FastAPI (OpenAPI جاهز على `/docs`).
- التوثيق الأهم للداشبورد: `GET /api/stats/dashboard`.
- بيانات تجريبية داخل الذاكرة، لا حاجة لاتصال فعلي بـMySQL.
- مصادقة المستفيد OTP ثابت (0000)، والمستخدم الحكومي بكلمة مرور تجريبية (انظر أدناه).

## نقاط الدخول الأساسية (جميعها تحت مجموعة TrackingRequests)
- الإحصاءات: `GET /api/stats/dashboard`
  - يعطيك كل الأرقام التي ستعرضها الكروت/المخططات.
- طلبات التتبع:
  - `GET /api/tracking-requests` — قائمة الطلبات.
  - `GET /api/tracking-requests/{id}` — تفاصيل طلب.
  - `GET /api/tracking-requests/{id}/logs` — سجلات التتبع لطلب محدد.
  - `POST /api/tracking-requests` — إنشاء طلب (channel = API/SMS).
  - `POST /api/tracking-requests/sms` — إنشاء طلب عبر SMS (محاكاة).
- دخول المستخدم الحكومي:
  - `POST /api/authority/auth/login` — بيانات تجريبية: `mobile="0588888888"`, `password="password"`.
  - `POST /api/authority/auth/logout` — شكلية في الـMVP (لا جلسات).

## شكل الاستجابة للإحصاءات (GET /api/stats/dashboard)
```json
{
  "users": {
    "total_users": 10,
    "active_location_users": 6,
    "inactive_location_users": 4,
    "benefited_users": 5,
    "not_benefited_users": 5
  },
  "tracking": {
    "total_requests": 12,
    "requests_by_status": {
      "new": 3,
      "in_progress": 5,
      "done": 3,
      "rejected": 1
    }
  },
  "authorities": {
    "total_authorities": 4
  }
}
```

## ملاحظات واجهة المستخدم
- كروت أرقام عليا:
  - إجمالي المستفيدين.
  - مفعّلين/غير مفعّلين.
  - مستفيدون استفادوا / لم يستفيدوا (حسب وجود سجلات تتبع).
  - إجمالي الطلبات + مخطط حسب الحالة (bar/pie).
  - إجمالي الجهات.
- جدول الطلبات:
  - الأعمدة: `id`, `beneficiary_id`, `authority_id`, `channel`, `status`, `created_at`.
  - عند النقر: اجلب `/api/tracking-requests/{id}` و`/logs` لعرض التفاصيل/الخريطة.
- تلوين الحالات:
  - `new`: رمادي، `in_progress`: أزرق، `done`: أخضر، `rejected`: أحمر.
- المصادقة التجريبية:
  - لا يوجد JWT حقيقي؛ التوكن يعاد كنص ثابت. يمكن تخزينه في الذاكرة/حالة التطبيق فقط.

## أمثلة سريعة
- إنشاء طلب:
```http
POST /api/tracking-requests
Content-Type: application/json
{
  "beneficiary_id": 1,
  "authority_id": 10,
  "channel": "API"
}
```
- إضافة سجل تتبع:
```http
POST /api/tracking-requests/1/logs
Content-Type: application/json
{
  "latitude": 24.7,
  "longitude": 46.67,
  "accuracy_m": 5,
  "altitude_m": 612,
  "captured_at": "2025-01-01T12:00:00Z"
}
```
- جلب الإحصاءات:
```http
GET /api/stats/dashboard
```

## تشغيل محلي
- من مجلد المشروع: `uvicorn main:app --reload`
- التوثيق: افتح `https://slid.ethra2.com/docs`
