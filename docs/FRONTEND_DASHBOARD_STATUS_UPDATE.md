# دليل مبرمج لوحة التحكم لتحديث حالة طلب التتبع

## المسار
- `PATCH /api/tracking-requests/{id}/status`
- الجسم:
```json
{ "status": "new" | "in_progress" | "done" | "rejected" }
```
- الاستجابة: `TrackingRequestOut` محدث.

## السلوك
- يحدث حالة الطلب في قاعدة البيانات.
- يبث رسالة WebSocket `request_updated` لكل المتصلين على `/ws/tracking-requests/{id}` بالقيمة الجديدة.

## الاستخدام في الواجهة
- أضف زر/قائمة لتغيير الحالة في صفحة تفاصيل الطلب.
- بعد الإرسال، حدّث العرض المحلي مباشرة أو انتظر حدث `request_updated`.
- في حال إرسال `done/rejected` يمكنك إغلاق WebSocket في الواجهة.

## ملاحظات
- الحالات المقبولة: `new`, `in_progress`, `done`, `rejected`.
- تأكد من صلاحية المستخدم (التنفيذ الحالي بلا مصادقة في الـMVP).  
