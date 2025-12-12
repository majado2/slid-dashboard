# دليل لمبرمج الـ API — تدفق تتبع الـ SMS

ملخص عملي لتنفيذ تدفق طلب التتبع عبر SMS مع صفحة القبول، استناداً إلى ملف `docs/SMS_TRACKING_FLOW.md`.

## 1) إنشاء طلب تتبع عبر SMS
- المسار: `POST /api/tracking-requests/sms`
- الجسم:
```json
{
  "beneficiary_id": 2,
  "authority_id": 10,
  "channel": "SMS"
}
```
- النتيجة: إنشاء سجل طلب بحالة `new` مربوط بالمستفيد والجهة.

## 2) إرسال رسالة SMS للمستفيد (بعد الإنشاء مباشرة)
- تحتاج لاستدعاء API مزود الـ SMS (سيُزود لاحقاً) مع:
  - رقم جوال المستفيد (من قاعدة البيانات).
  - رابط القبول يحوي البرامترات:
    ```
    https://slid-ksa.netlify.app/consent?request_id={REQUEST_ID}&national_id={NATIONAL_ID}
    ```
- قالب الرسالة المقترح (ثابت):
```
وردنا بلاغكم رقم ({REQUEST_CODE}) عبر منصة أبشر،

ونأمل منكم الدخول فورا عبر الرابط التالي

والسماح بتحديد موقعكم الجغرافي لتسريع

وصول فرق الطوارئ في أسرع وقت ممكن:
{TODAY}
{CONSENT_LINK}
مع تمنياتنا لكم بالسلامة
```
  - `{REQUEST_CODE}`: معرف الطلب (مثلاً SL456 أو request_id).
  - `{TODAY}`: تاريخ اليوم.
  - `{CONSENT_LINK}`: الرابط أعلاه بعد الاستبدال.
- عند توفر مواصفات مزود SMS (URL/Headers/Body)، أضف الاستدعاء داخل مسار الإنشاء أو خدمة منفصلة post-create.

## 3) صفحة القبول (منفصلة عن اللوحة)
- مسار الواجهة: `https://slid-ksa.netlify.app/consent?request_id={REQUEST_ID}&national_id={NATIONAL_ID}`
- المنطق المطلوب في الـ FE (أنت تحتاج مسارات الـ API فقط):
  1. قراءة `request_id` و`national_id` من الـ query.
  2. طلب إذن الموقع من المستخدم.
  3. عند النجاح: استدعاء الـ API أدناه لتخزين الإحداثيات.
  4. (اختياري) فتح WebSocket للبث الحي.

## 4) API استلام الإحداثيات (القبول)
- المسار: `POST /api/location/consent/{national_id}`
- الجسم:
```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "accuracy_m": 5,
  "altitude_m": 612
}
```
- النتيجة: تفعيل المشاركة المكانية وتحديث الإحداثيات للمستفيد/الطلب.

## 5) بث حي (اختياري)
- WebSocket: `/ws/tracking-requests/{request_id}`
- أرسل الحدث:
```json
{
  "event": "location_update",
  "data": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracy_m": 5,
    "altitude_m": 612,
    "captured_at": "2025-12-02T12:00:00Z"
  }
}
```
- إذا لم تستخدم WS، نقطة واحدة عبر `/consent` كافية.

## 6) عرض الطلب والسجلات (لوحة التحكم)
- `GET /api/tracking-requests` — قائمة الطلبات مع المستفيد/الجهة.
- `GET /api/tracking-requests/{id}/logs` أو `/full` — تفاصيل الطلب + السجلات.
- WebSocket `/ws/tracking-requests/{id}` — لتحديثات السجلات الحية.

## نقاط تكامل الـ SMS (TODO)
- بانتظار تفاصيل مزود الـ SMS (URL/Headers/Body).
- عند التزويد:
  1) بعد نجاح `POST /api/tracking-requests/sms` تولّد الرابط بالبرامترات.
  2) ترسل القالب أعلاه عبر مزود الـ SMS إلى جوال المستفيد.
  3) سجّل نتيجة الإرسال (نجاح/فشل) في الطلب أو جدول منفصل للتتبع.
