# تعليمات فرونت لعرض طلب تتبع (تفاصيل + سجلات + بث حي)

## المسارات (تحت مجموعة TrackingRequests)
- `GET /api/tracking-requests/{id}/full`
  - يعيد كائن يحتوي على:
  ```json
  {
    "request": { ...طلب... },
    "logs": [ ...سجلات... ]
  }
  ```
- `POST /api/tracking-requests/{id}/logs`
  - لإضافة سجل جديد (للاختبار أو لجهة أخرى تضيفه).

## WebSocket للتحديث اللحظي
- `ws://127.0.0.1:8000/ws/tracking-requests/{id}`
- البروتوكول:
  - عند الاتصال: رسالة افتتاحية
  ```json
  {
    "event": "init",
    "data": {
      "request": { ...تفاصيل الطلب... },
      "logs": [ ...السجلات الحالية... ]
    }
  }
  ```
  - عند إضافة سجل جديد عبر REST: رسالة
  ```json
  {
    "event": "log_added",
    "data": { ...السجل الجديد... }
  }
  ```
  - الأخطاء:
  ```json
  { "event": "error", "message": "Tracking request not found" }
  ```
  - لا حاجة لإرسال رسائل من العميل حالياً (يمكن تجاهل `receive`).

## عرض الطلب
- استخدم `GET /api/tracking-requests/{id}/full` لتهيئة الصفحة الأولى.
- اشترك بـ WebSocket لنفس `id` لتحديث السجلات فورياً.
- هيكل العرض المقترح:
  - بطاقة الطلب: `id`, `beneficiary_id`, `authority_id`, `channel`, `status`, `created_at`.
  - جدول السجلات: `captured_at`, `latitude`, `longitude`, `accuracy_m`, `altitude_m`.
  - خريطة حية: حدث `log_added` يضيف نقطة جديدة.

## أمثلة استهلاك (JavaScript)
```js
// REST init
const res = await fetch(`/api/tracking-requests/1/full`);
const data = await res.json();
renderRequest(data.request);
renderLogs(data.logs);

// WebSocket
const ws = new WebSocket(`ws://127.0.0.1:8000/ws/tracking-requests/1`);
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.event === 'init') {
    renderRequest(msg.data.request);
    renderLogs(msg.data.logs);
  }
  if (msg.event === 'log_added') {
    appendLog(msg.data);
    plotOnMap(msg.data);
  }
};
```

## ملاحظات
- الـAPI مفتوح CORS (`*`) للـMVP.
- لا توجد مصادقة حقيقية؛ يمكنك التجريب مباشرة.
- إضافة سجلات عبر REST ستُبث فوراً على WebSocket.
