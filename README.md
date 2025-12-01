# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/cf339fe8-dac6-4370-b353-9be3fbef4b34

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/cf339fe8-dac6-4370-b353-9be3fbef4b34) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/cf339fe8-dac6-4370-b353-9be3fbef4b34) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## طريقة التشغيل محلياً
1) تأكد من وجود Node 18+.
2) ثبّت الاعتمادات (يوجد تعارض peer):
```sh
npm install --legacy-peer-deps
```
3) شغّل السيرفر المحلي:
```sh
npm run dev
```
4) افتح المتصفح على http://localhost:5173

### إعداد الاتصال بالـ API
- عنوان الـ API الحالي مضبوط على `https://slid.ethra2.com` في `src/lib/api.ts`. إذا كنت تعمل ضد خادم محلي (مثلاً `http://127.0.0.1:8000`) حدّث قيمة `API_BASE_URL`، وسيُحوّل WebSocket تلقائياً إلى `ws://...`.
- البيانات التجريبية في `useMockAPI`، إذا أردت تعطيل الـ mock تأكد من أن `useMockAPI = false`.

### الاختبارات السريعة
- تسجيل الدخول: جوال `0588888888` وكلمة مرور `password` (أو حساب تجريبي ثانٍ حسب الدليل).
- إنشاء طلب تتبع: من صفحة "طلبات التتبع" اضغط "إضافة طلب تتبع"، اختر مستفيداً وجهة من القوائم، وحدد القناة (API/SMS).
- عرض الطلب مع الخريطة: افتح أي طلب من الجدول، ستجد السجلات والبث الحي عبر WebSocket والخريطة التفاعلية.
