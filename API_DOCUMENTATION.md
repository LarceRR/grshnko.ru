# API Documentation — Devices & Animations

> Документация REST API для управления устройствами ESP32 и LED-анимациями

Base URL: `http://localhost:3000/api` (или ваш сервер)

---

## 🔐 Аутентификация

Большинство эндпоинтов требуют JWT токен в заголовке:

```
Authorization: Bearer <access_token>
```

Получить токен: `POST /api/auth/login`

---

## 📱 Devices API

### 1. Получить список всех устройств

**GET** `/api/devices`

**Auth:** Required

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "deviceId": "esp32_AABBCCDDEEFF",
    "name": "Living Room Strip",
    "location": "home",
    "status": "online",
    "firmwareVersion": "1.0.0",
    "ledCount": 300,
    "ipAddress": "192.168.1.100",
    "lastSeenAt": "2026-02-07T14:30:00.000Z",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-07T14:30:00.000Z",

    "freeHeap": 180000,
    "minFreeHeap": 150000,
    "rssi": -65,
    "wifiChannel": 6,
    "bssid": "AA:BB:CC:DD:EE:FF",

    "macAddress": "AA:BB:CC:DD:EE:FF",
    "chipModel": "ESP32",
    "chipRevision": 3,
    "cpuFreqMHz": 240,
    "flashSize": 4194304,
    "sketchSize": 1200000,
    "freeSketchSpace": 2994304,
    "sdkVersion": "v4.4.3",

    "playing": true,
    "brightness": 200,
    "currentAnimationId": "69873c0028275da21c0ab1c4",

    "uptime": 86400,
    "lastResetReason": "POWER_ON",
    "bootCount": 15
  }
]
```

---

### 2. Получить информацию о конкретном устройстве

**GET** `/api/devices/:id`

**Auth:** Required

**Params:**
- `id` — MongoDB ObjectId устройства

**Response:** Объект устройства (как выше) + последние 20 логов:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "deviceId": "esp32_AABBCCDDEEFF",
  "name": "Living Room Strip",
  "location": "home",
  "status": "online",
  "logs": [
    {
      "id": "507f1f77bcf86cd799439012",
      "severity": "INFO",
      "code": "ANIM_LOADED",
      "message": "Animation loaded successfully",
      "createdAt": "2026-02-07T14:30:00.000Z"
    }
  ]
}
```

**Errors:**
- `400` — Device id required
- `404` — Device not found

---

### 3. Запросить статус устройства (через MQTT RPC)

**GET** `/api/devices/:id/status`

**Auth:** Required

**Description:** Отправляет RPC команду `status` на устройство через MQTT, ждет ответ до 10 секунд.

**Params:**
- `id` — MongoDB ObjectId устройства

**Response:**
```json
{
  "ok": true,
  "deviceId": "esp32_AABBCCDDEEFF",
  "status": "online",
  "uptime": 86400,
  "freeHeap": 180000,
  "rssi": -65,
  "playing": true,
  "brightness": 200,
  "currentAnimationId": "69873c0028275da21c0ab1c4"
}
```

**Errors:**
- `400` — Device id required
- `404` — Device not found
- `504` — Device did not respond (timeout)

---

### 4. Обновить метаданные устройства

**PATCH** `/api/devices/:id`

**Auth:** Required

**Params:**
- `id` — MongoDB ObjectId устройства

**Body:**
```json
{
  "name": "Bedroom LED Strip",
  "location": "bedroom"
}
```

**Fields:**
- `name` (optional) — Человекочитаемое имя устройства
- `location` (optional) — Локация (используется в MQTT топиках)

**Response:** Обновленный объект устройства

**Note:** Если изменена `location` и устройство онлайн, на него отправляется RPC команда `set_location`.

**Errors:**
- `400` — Device id required / No fields to update
- `404` — Device not found

---

### 5. Удалить устройство

**DELETE** `/api/devices/:id`

**Auth:** Required

**Params:**
- `id` — MongoDB ObjectId устройства

**Response:**
```json
{
  "ok": true,
  "message": "Device esp32_AABBCCDDEEFF deleted"
}
```

**Note:** Также удаляет все логи устройства.

**Errors:**
- `400` — Device id required
- `404` — Device not found

---

### 6. Отправить RPC команду на устройство

**POST** `/api/devices/:id/rpc`

**Auth:** Required

**Params:**
- `id` — MongoDB ObjectId устройства

**Body:**
```json
{
  "method": "play",
  "params": {}
}
```

**Available RPC methods:**
- `play` — Запустить анимацию
- `pause` — Остановить анимацию
- `set_brightness` — `{ "brightness": 0-255 }`
- `status` — Запросить полный статус
- `set_location` — `{ "location": "new_location" }`
- `reboot` — Перезагрузить устройство

**Response:**
```json
{
  "ok": true,
  "message": "RPC command \"play\" sent to esp32_AABBCCDDEEFF",
  "topic": "factory/home/esp32_AABBCCDDEEFF/rpc/request"
}
```

**Errors:**
- `400` — Device id required / method is required
- `404` — Device not found
- `409` — Device is offline

---

### 7. Получить логи устройства

**GET** `/api/devices/:deviceId/logs`

**Auth:** Required

**Params:**
- `deviceId` — MongoDB ObjectId устройства

**Query Parameters:**
- `severity` (optional) — Фильтр по уровню: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- `from` (optional) — ISO дата начала
- `to` (optional) — ISO дата окончания
- `limit` (optional) — Количество записей (по умолчанию 50)
- `offset` (optional) — Сдвиг для пагинации (по умолчанию 0)

**Example:**
```
GET /api/devices/507f1f77bcf86cd799439011/logs?severity=ERROR&limit=20
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "deviceId": "507f1f77bcf86cd799439011",
    "severity": "ERROR",
    "code": "ANIM_PARSE_FAIL",
    "message": "Failed to parse animation JSON",
    "metadata": {
      "error": "Invalid JSON at position 45"
    },
    "uptime": 1234,
    "freeHeap": 180000,
    "createdAt": "2026-02-07T14:30:00.000Z"
  }
]
```

**Errors:**
- `400` — deviceId required
- `404` — Device not found

---

### 8. Очистить логи устройства

**DELETE** `/api/devices/:deviceId/logs`

**Auth:** Required

**Params:**
- `deviceId` — MongoDB ObjectId устройства

**Response:**
```json
{
  "ok": true,
  "deleted": 156
}
```

**Errors:**
- `400` — deviceId required
- `404` — Device not found

---

## 🎨 Animations API

### 1. Создать анимацию (через LLM)

**POST** `/api/animations`

**Auth:** Required

**Body:**
```json
{
  "prompt": "Создай радужную волну с переходом в огонь",
  "ledCount": 300
}
```

**Fields:**
- `prompt` (optional) — Текстовое описание анимации. Если не указано, LLM создаст случайную.
- `ledCount` (optional) — Количество светодиодов (по умолчанию 300)

**Response:**
```json
{
  "id": "69873c0028275da21c0ab1c4",
  "body": "{\"engineVersion\":\"2.0\",\"ledCount\":300,\"fps\":60,\"brightness\":200,\"steps\":[...]}",
  "schemaVersion": "2.0",
  "animationHardness": 45,
  "authorId": "68cd66eac74d2fc6be2a808f",
  "createdAt": "2026-02-07T13:20:00.095Z",
  "updatedAt": "2026-02-07T13:20:00.095Z"
}
```

**Note:**
- LLM (DeepSeek) генерирует JSON анимации на основе промпта
- `animationHardness` (0-100) — сложность анимации (CPU/память)
- `body` — JSON строка с полным описанием анимации (engine v2.0)

**Errors:**
- `401` — User not authorized
- `500` — Failed to create animation (LLM error, JSON parse error)

---

### 2. Получить JSON тело анимации

**GET** `/api/animations/:id`

**Auth:** Not required (используется ESP32 для загрузки)

**Params:**
- `id` — MongoDB ObjectId анимации

**Response:** Raw JSON (Content-Type: application/json)
```json
{
  "engineVersion": "2.0",
  "ledCount": 300,
  "fps": 60,
  "brightness": 200,
  "steps": [
    {
      "op": "rainbow",
      "speed": 30,
      "duration": 5000
    },
    {
      "op": "transition",
      "colorFrom": "#FF0000",
      "colorTo": "#FF8800",
      "duration": 1000
    },
    {
      "op": "fire",
      "cooling": 55,
      "sparking": 120,
      "duration": 10000
    },
    {
      "op": "loop",
      "targetStep": 0,
      "count": 0
    }
  ]
}
```

**Errors:**
- `400` — Animation id required
- `404` — Animation not found

---

### 3. Отправить анимацию на устройство

**POST** `/api/animations/select/:animationId`

**Auth:** Required

**Params:**
- `animationId` — MongoDB ObjectId анимации

**Body (новый формат):**
```json
{
  "deviceId": "esp32_AABBCCDDEEFF",
  "location": "home"
}
```

**Body (альтернатива — location auto-resolve):**
```json
{
  "deviceId": "esp32_AABBCCDDEEFF"
}
```
Location будет автоматически найдена из реестра устройств.

**Body (legacy формат):**
```json
{
  "device": "factory/home/esp32_AABBCCDDEEFF/animation/load"
}
```
Прямой MQTT топик (не рекомендуется).

**How it works:**
1. Проверяет что анимация существует
2. Находит устройство по `deviceId` (если `location` не указана)
3. Публикует в MQTT топик `factory/{location}/{deviceId}/animation/load`:
   ```json
   {
     "animationId": "69873c0028275da21c0ab1c4",
     "url": "http://your-server.com/api/animations/69873c0028275da21c0ab1c4"
   }
   ```
4. ESP32 получает сообщение, скачивает JSON через HTTP, загружает и запускает анимацию

**Response (новый формат):**
```json
{
  "ok": true,
  "message": "Animation trigger sent to device",
  "animationId": "69873c0028275da21c0ab1c4",
  "location": "home",
  "deviceId": "esp32_AABBCCDDEEFF",
  "topic": "factory/home/esp32_AABBCCDDEEFF/animation/load"
}
```

**Response (legacy формат):**
```json
{
  "ok": true,
  "message": "Animation ID sent to device (legacy)",
  "animationId": "69873c0028275da21c0ab1c4",
  "topic": "factory/home/esp32_AABBCCDDEEFF/animation/load"
}
```

**Errors:**
- `400` — animationId is required / Provide deviceId or device
- `404` — Animation not found / Device not found

---

## 🔄 OTA (Over-The-Air) Firmware Update API

### 1. Загрузить прошивку

**POST** `/api/ota/upload`

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Fields:**
- `firmware` (file, required) — .bin файл прошивки (макс. 4MB)
- `version` (string, optional) — версия прошивки (по умолчанию "0.0.0")

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/ota/upload \
  -H "Authorization: Bearer <token>" \
  -F "firmware=@firmware.bin" \
  -F "version=1.2.3"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('firmware', file); // file from <input type="file">
formData.append('version', '1.2.3');

const response = await fetch('/api/ota/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

**Response:**
```json
{
  "ok": true,
  "message": "Firmware uploaded",
  "filename": "firmware_v1.2.3_1675890123.bin",
  "version": "1.2.3",
  "sha256": "a3d5f8e9b2c1...",
  "size": 1234567,
  "url": "http://localhost:3000/api/ota/firmware/firmware_v1.2.3_1675890123.bin"
}
```

**Note:**
- Файл сохраняется в `firmware-bin/` с уникальным именем
- Вычисляется SHA256 хеш для проверки целостности
- Метаданные сохраняются в БД (таблица `OtaFirmware`)

**Errors:**
- `400` — No file uploaded / Only .bin files allowed
- `401` — Not authorized
- `500` — Failed to upload firmware

---

### 2. Скачать прошивку (для ESP32)

**GET** `/api/ota/firmware/:filename`

**Auth:** Not required (ESP32 использует этот эндпоинт)

**Params:**
- `filename` — имя файла прошивки

**Response:** Binary stream (application/octet-stream)

**Example:**
```
GET /api/ota/firmware/firmware_v1.2.3_1675890123.bin
```

**Errors:**
- `400` — filename required
- `404` — Firmware file not found

---

### 3. Список всех прошивок

**GET** `/api/ota/list`

**Auth:** Required

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "filename": "firmware_v1.2.3_1675890123.bin",
    "version": "1.2.3",
    "sha256": "a3d5f8e9b2c1d4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1",
    "size": 1234567,
    "uploadedBy": "68cd66eac74d2fc6be2a808f",
    "createdAt": "2026-02-07T10:00:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "filename": "firmware_v1.2.2_1675880000.bin",
    "version": "1.2.2",
    "sha256": "b4e6g9h3d2f5h8j0k2m4n6p8q0r2s4t6u8v0w2x4y6z8a0b2c4d6e8f0g2h4i6j8",
    "size": 1230000,
    "uploadedBy": "68cd66eac74d2fc6be2a808f",
    "createdAt": "2026-02-06T10:00:00.000Z"
  }
]
```

---

### 4. Запустить OTA обновление на устройстве

**POST** `/api/ota/trigger/:deviceId`

**Auth:** Required

**Params:**
- `deviceId` — MongoDB ObjectId устройства

**Body (опционально):**
```json
{
  "firmware": "firmware_v1.2.3_1675890123.bin"
}
```

**Fields:**
- `firmware` (optional) — имя конкретного файла прошивки. Если не указано, будет выбрана последняя загруженная.

**How it works:**
1. Проверяет что устройство онлайн
2. Находит файл прошивки (последний или указанный)
3. Публикует в MQTT топик `factory/{location}/{deviceId}/ota/trigger`:
   ```json
   {
     "url": "http://your-server.com/api/ota/firmware/firmware_v1.2.3_1675890123.bin",
     "version": "1.2.3",
     "sha256": "a3d5f8e9b2c1..."
   }
   ```
4. ESP32 получает команду, скачивает прошивку, проверяет хеш, устанавливает и перезагружается

**Response:**
```json
{
  "ok": true,
  "message": "OTA trigger sent",
  "deviceId": "esp32_AABBCCDDEEFF",
  "firmware": "firmware_v1.2.3_1675890123.bin",
  "version": "1.2.3",
  "topic": "factory/home/esp32_AABBCCDDEEFF/ota/trigger"
}
```

**Errors:**
- `400` — deviceId required
- `404` — Device not found / No firmware available
- `409` — Device is offline
- `500` — Failed to trigger OTA

---

### 5. Запустить OTA на всех онлайн устройствах

**POST** `/api/ota/trigger-all`

**Auth:** Required

**Body:** None

**Description:** Отправляет OTA команду на ВСЕ онлайн устройства с последней загруженной прошивкой.

**Response:**
```json
{
  "ok": true,
  "message": "OTA triggered on 5 devices",
  "triggered": 5,
  "skipped": 2,
  "devices": [
    "esp32_AABBCCDDEEFF",
    "esp32_112233445566",
    "esp32_AABBCC112233",
    "esp32_DDEEFF445566",
    "esp32_112233AABBCC"
  ]
}
```

**Note:**
- Пропускает офлайн устройства
- Использует последнюю загруженную прошивку
- Полезно для массового обновления

**Errors:**
- `500` — Failed to trigger OTA / No firmware available

---

## 📊 Database Models

### Device
```typescript
{
  id: string;                    // MongoDB ObjectId
  deviceId: string;              // MAC-based: "esp32_AABBCCDDEEFF" (unique)
  name?: string;                 // Human-friendly name
  location: string;              // Default "default"
  status: string;                // "online" | "offline" | "error"
  firmwareVersion?: string;
  ledCount?: number;
  ipAddress?: string;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Memory
  freeHeap?: number;
  minFreeHeap?: number;

  // WiFi
  rssi?: number;
  wifiChannel?: number;
  bssid?: string;

  // Hardware
  macAddress?: string;
  chipModel?: string;
  chipRevision?: number;
  cpuFreqMHz?: number;
  flashSize?: number;
  sketchSize?: number;
  freeSketchSpace?: number;
  sdkVersion?: string;

  // Animation
  playing?: boolean;
  brightness?: number;
  currentAnimationId?: string;

  // System
  uptime?: number;
  lastResetReason?: string;
  bootCount?: number;
}
```

### Animation
```typescript
{
  id: string;                    // MongoDB ObjectId
  body: string;                  // JSON string (animation engine v2.0)
  schemaVersion: string;         // "2.0"
  animationHardness?: number;    // 0-100 (CPU/memory complexity)
  authorId: string;              // User ObjectId
  author: User;                  // Relation
  createdAt: Date;
  updatedAt: Date;
}
```

### DeviceLog
```typescript
{
  id: string;
  deviceId: string;              // Device ObjectId
  severity: string;              // "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"
  code: string;                  // e.g. "ANIM_PARSE_FAIL"
  message: string;
  metadata?: any;                // JSON additional context
  uptime?: number;
  freeHeap?: number;
  createdAt: Date;
}
```

### OtaFirmware
```typescript
{
  id: string;                    // MongoDB ObjectId
  filename: string;              // Unique filename (e.g. "firmware_v1.2.3_1675890123.bin")
  version: string;               // Semantic version
  sha256: string;                // SHA256 hash for integrity check
  size: number;                  // File size in bytes
  uploadedBy: string;            // User ObjectId
  createdAt: Date;
}
```

---

## 🔗 MQTT Topics (for reference)

### Device → Server

```
factory/{location}/{deviceId}/heartbeat       — Heartbeat every 30s
factory/{location}/{deviceId}/discovery       — Device registration on boot
factory/{location}/{deviceId}/status          — Full status update
factory/{location}/{deviceId}/log             — Log messages
factory/{location}/{deviceId}/rpc/response    — RPC command response
factory/{location}/{deviceId}/ota/progress    — OTA progress updates (0-100%)
factory/{location}/{deviceId}/ota/result      — OTA completion status (success/fail)
```

### Server → Device

```
factory/{location}/{deviceId}/animation/load  — Load animation (animationId + url)
factory/{location}/{deviceId}/rpc/request     — RPC command
factory/{location}/{deviceId}/ota/trigger     — OTA update trigger (url + version + sha256)
```

**OTA Flow:**
1. Server: `ota/trigger` → `{"url": "...", "version": "1.2.3", "sha256": "..."}`
2. Device: Downloads firmware via HTTP
3. Device: `ota/progress` → `{"percent": 25}` (multiple times)
4. Device: Verifies SHA256, installs, reboots
5. Device: `ota/result` → `{"success": true, "version": "1.2.3"}`

---

## 🎯 Frontend Integration Examples

### Получить список устройств и отобразить

```typescript
async function fetchDevices() {
  const response = await fetch('/api/devices', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const devices = await response.json();

  devices.forEach(device => {
    console.log(`${device.name} (${device.deviceId})`);
    console.log(`Status: ${device.status}`);
    console.log(`LED Count: ${device.ledCount}`);
    console.log(`Brightness: ${device.brightness}`);
  });
}
```

### Создать анимацию и отправить на устройство

```typescript
async function createAndSendAnimation(deviceId: string, prompt: string) {
  // 1. Создать анимацию через LLM
  const animResponse = await fetch('/api/animations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      ledCount: 300
    })
  });
  const animation = await animResponse.json();

  console.log('Animation created:', animation.id);

  // 2. Отправить на устройство
  const sendResponse = await fetch(`/api/animations/select/${animation.id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId: deviceId
    })
  });
  const result = await sendResponse.json();

  console.log('Animation sent:', result);
}

// Usage
createAndSendAnimation(
  'esp32_AABBCCDDEEFF',
  'Создай радужную волну с плавным переходом в огонь'
);
```

### Отправить RPC команду (управление яркостью)

```typescript
async function setBrightness(deviceId: string, brightness: number) {
  const response = await fetch(`/api/devices/${deviceId}/rpc`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'set_brightness',
      params: { brightness }
    })
  });
  return response.json();
}

// Usage
setBrightness('507f1f77bcf86cd799439011', 100);
```

### Получить логи устройства с фильтрацией

```typescript
async function getErrorLogs(deviceId: string) {
  const response = await fetch(
    `/api/devices/${deviceId}/logs?severity=ERROR&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  const logs = await response.json();

  logs.forEach(log => {
    console.error(`[${log.code}] ${log.message}`);
    if (log.metadata) {
      console.error('Details:', log.metadata);
    }
  });
}
```

### Загрузить прошивку и обновить устройство

```typescript
async function uploadAndUpdateFirmware(file: File, deviceId: string) {
  // 1. Загрузить .bin файл
  const formData = new FormData();
  formData.append('firmware', file);
  formData.append('version', '1.2.3');

  const uploadResponse = await fetch('/api/ota/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });
  const firmware = await uploadResponse.json();

  console.log('Firmware uploaded:', firmware.filename);

  // 2. Запустить OTA на устройстве
  const otaResponse = await fetch(`/api/ota/trigger/${deviceId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firmware: firmware.filename
    })
  });
  const result = await otaResponse.json();

  console.log('OTA triggered:', result);
}

// Usage
const fileInput = document.getElementById('firmware-input') as HTMLInputElement;
const file = fileInput.files[0];
uploadAndUpdateFirmware(file, '507f1f77bcf86cd799439011');
```

### Обновить все устройства сразу

```typescript
async function updateAllDevices(file: File) {
  // 1. Загрузить прошивку
  const formData = new FormData();
  formData.append('firmware', file);
  formData.append('version', '1.3.0');

  await fetch('/api/ota/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  // 2. Запустить OTA на всех устройствах
  const response = await fetch('/api/ota/trigger-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const result = await response.json();

  console.log(`Updated ${result.triggered} devices`);
  console.log('Updated devices:', result.devices);
}
```

---

## 📝 Notes

1. **Автодискавери**: Устройства автоматически регистрируются при первом подключении через MQTT топик `factory/{location}/{deviceId}/discovery`

2. **Heartbeat**: Устройства отправляют heartbeat каждые 30 секунд. Если heartbeat не получен 60 секунд, статус меняется на `offline`

3. **Location**: Используется для группировки устройств. По умолчанию `default`. Меняется через PATCH `/api/devices/:id`

4. **Animation URL**: При отправке анимации на устройство, передается не только `animationId`, но и полный URL для HTTP загрузки. Это позволяет ESP32 скачать JSON напрямую.

5. **RPC Timeout**: GET `/api/devices/:id/status` ждет ответа от устройства 10 секунд. Если timeout — устройство считается offline.

6. **Animation Schema**: Поддерживается только `schemaVersion: "2.0"` (procedural engine). Legacy schema 1.0 (frame-based) deprecated.

---

## 🚀 Quick Start Checklist

### Базовые операции
1. ✅ Получить access token: `POST /api/auth/login`
2. ✅ Проверить список устройств: `GET /api/devices`
3. ✅ Создать анимацию: `POST /api/animations` с промптом
4. ✅ Отправить анимацию на устройство: `POST /api/animations/select/:id`
5. ✅ Управлять устройством через RPC: `POST /api/devices/:id/rpc`
6. ✅ Мониторить логи: `GET /api/devices/:id/logs`

### OTA обновления
7. ✅ Загрузить прошивку: `POST /api/ota/upload` (multipart/form-data)
8. ✅ Список прошивок: `GET /api/ota/list`
9. ✅ Обновить устройство: `POST /api/ota/trigger/:deviceId`
10. ✅ Обновить все устройства: `POST /api/ota/trigger-all`
