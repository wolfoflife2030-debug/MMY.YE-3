#!/usr/bin/env python3
"""يضيف صلاحيات أندرويد اللازمة بعد `npx cap add android`:
- USE_BIOMETRIC: الدخول ببصمة الجوال.
- صلاحيات التخزين للأندرويد القديم + requestLegacyExternalStorage: حفظ النسخ الاحتياطية في مجلد Documents.
- largeHeap: التعامل مع ملفات PDF الكبيرة."""
import re, sys
P = 'android/app/src/main/AndroidManifest.xml'
s = open(P, encoding='utf-8').read()
perms = [
    '<uses-permission android:name="android.permission.USE_BIOMETRIC" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
]
add = ''.join('    %s\n' % p for p in perms if p.split('"')[1] not in s)
if add:
    s = s.replace('<application', add + '    <application', 1)
for attr in ('android:largeHeap="true"', 'android:requestLegacyExternalStorage="true"'):
    if attr.split('=')[0] not in s:
        s = s.replace('<application', '<application ' + attr, 1)
open(P, 'w', encoding='utf-8').write(s)
print(s)
