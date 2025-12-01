# دليل سريع لمبرمج لوحة التحكم (TrackingRequests)

## نقاط الدخول (مجموعة TrackingRequests)
- إحصاءات: `GET /api/stats/dashboard` — أرقام المستفيدين/الطلبات/الجهات.
- المستفيدون (إداري):
  - `GET /api/beneficiaries`
  - `POST /api/beneficiaries`
  - `PUT /api/beneficiaries/{national_id}`
  - `GET /api/beneficiaries/{beneficiary_id}/tracking-requests`
- طلبات التتبع:
  - `GET /api/tracking-requests`
  - `GET /api/tracking-requests/{id}`
  - `GET /api/tracking-requests/{id}/logs`
  - `GET /api/tracking-requests/{id}/full` (تفاصيل + سجلات في استجابة واحدة)
  - `POST /api/tracking-requests` (channel = API/SMS)
  - `POST /api/tracking-requests/sms`
  - WebSocket: `ws://host/ws/tracking-requests/{id}` — رسالة `init` بالحالة الحالية ثم `log_added` عند أي سجل جديد.
- دخول المستخدم الحكومي (تجريبي):
  - `POST /api/authority/auth/login`
    - مستخدم 1: جوال `0588888888`, كلمة `password`
    - مستخدم 2: جوال `0530090265`, كلمة `123`
  - `POST /api/authority/auth/logout` (شكلية)

## واجهة المستخدم المقترحة
- كروت عليا: إجمالي المستفيدين، مفعّلين/غير مفعّلين، مستفيدون استفادوا/لم يستفيدوا، إجمالي الطلبات (مع مخطط حسب الحالة)، إجمالي الجهات.
- جدول المستفيدين: إجراءا "تعديل" و"عرض الطلبات". رابط "عرض الطلبات" يستدعي `/api/beneficiaries/{id}/tracking-requests`.
- جدول الطلبات:
  - عند النقر: استدعِ `/api/tracking-requests/{id}/full` لتهيئة العرض، ثم اشترك في WebSocket لنفس `id` لتحديث السجلات فورياً.
  - تلوين الحالات: `new` رمادي، `in_progress` أزرق، `done` أخضر، `rejected` أحمر.
- خريطة: استعمل أحداث `log_added` لتحديث المسار الحي.

## ملاحظات
- CORS مفتوح، لا توجد جلسات حقيقية في الـMVP (التوكن نص تجريبي).
- المسار `full` يوفر استهلاكًا واحدًا بدلاً من مسارين للتفاصيل والسجلات.
