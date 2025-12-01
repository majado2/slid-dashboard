# دليل مختصر لبرمجة القوائم المنسدلة في لوحة التحكم

## الهدف
تجهيز بيانات المستفيدين والجهات (id + الاسم) لتمريرها إلى نموذج إنشاء طلب تتبع أو أي قوائم اختيار.

## المسارات (مجموعة TrackingRequests)
- المستفيدون (مختصر):
  - `GET /api/beneficiaries/options`
  - يعيد قائمة من العناصر: `{ "id": number, "name": string, "national_id": string }`
- الجهات:
  - `GET /api/authorities`
  - يعيد قائمة من العناصر: `{ "id": number, "name": string }`

## مثال استجابة
- `/api/beneficiaries/options`
```json
[
  { "id": 1, "name": "Test User", "national_id": "1234567890" }
]
```
- `/api/authorities`
```json
[
  { "id": 10, "name": "Interior" },
  { "id": 11, "name": "Health" }
]
```

## كيفية الاستخدام في UI
- نموذج إنشاء طلب تتبع:
  - حقل اختيار المستفيد: استخدم `/api/beneficiaries/options`.
  - حقل اختيار الجهة: استخدم `/api/authorities`.
- يمكن التخزين المؤقت (cache) للنتيجة على مستوى الصفحة لأن البيانات ثابتة في الـMVP.

## ملاحظات
- CORS مفتوح؛ يمكن الطلب مباشرة من المتصفح أثناء التطوير.
- في حالة توسيع المنظومة لاحقًا، يمكن إضافة بحث/ترقيم (pagination) حسب الحاجة.
