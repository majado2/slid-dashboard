# تعليمات فرونت للمستفيدين (CRUD تحت مجموعة TrackingRequests)

## نظرة عامة
- المسارات تحت مجموعة `TrackingRequests` في `/docs`.
- المخزن بياناته في الذاكرة (MVP)، لا مصادقة حقيقية مطلوبة.

## نقاط الدخول
- إنشاء مستفيد: `POST /api/beneficiaries`
  - body: `name`, `mobile`, `national_id`, `password`, (اختياري) `latitude`, `longitude`, `accuracy_m`, `altitude_m`, `location_verification`.
- تعديل مستفيد: `PUT /api/beneficiaries/{national_id}`
  - body اختياري للحقل المراد تعديله.
- قائمة المستفيدين: `GET /api/beneficiaries`
- طلبات مستفيد محدد: `GET /api/beneficiaries/{beneficiary_id}/tracking-requests`
  - تستخدم `beneficiary_id` (من القائمة).

## أمثلة سريعة
- إنشاء:
```http
POST /api/beneficiaries
Content-Type: application/json
{
  "name": "New User",
  "mobile": "0550000000",
  "national_id": "1111111111",
  "password": "secret",
  "location_verification": "inactive"
}
```
- تعديل:
```http
PUT /api/beneficiaries/1111111111
Content-Type: application/json
{
  "mobile": "0551111111",
  "location_verification": "active"
}
```
- طلبات المستفيد:
```http
GET /api/beneficiaries/2/tracking-requests
```

## ملاحظات UI
- جدول مستفيدين مع إجراءي "تعديل" و"عرض الطلبات".
- نموذج إنشاء/تعديل يراعي الحقول الاختيارية (إحداثيات ودقة/ارتفاع).
- ارتباط سريع لفتح ملف طلبات المستفيد يضرب `GET /api/beneficiaries/{id}/tracking-requests` ويعرض جدول الطلبات.
