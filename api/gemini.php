<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed', 'message' => 'Tumia POST.']);
    exit;
}

$configPath = __DIR__ . '/config.local.php';
$localConfig = is_file($configPath) ? require $configPath : [];
$apiKey = getenv('GEMINI_API_KEY') ?: ($localConfig['GEMINI_API_KEY'] ?? '');
$model = $localConfig['GEMINI_MODEL'] ?? getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash';

if (!$apiKey) {
    http_response_code(500);
    echo json_encode([
        'error' => 'missing_api_key',
        'message' => 'Gemini API key haijawekwa. Weka GEMINI_API_KEY kwenye environment au api/config.local.php.'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'bad_json', 'message' => 'Ombi halina JSON sahihi.']);
    exit;
}

$system = trim((string)($input['system'] ?? ''));
$messages = $input['messages'] ?? [];
if (!is_array($messages) || count($messages) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'empty_messages', 'message' => 'Hakuna ujumbe uliotumwa.']);
    exit;
}

$contents = [];
foreach ($messages as $message) {
    if (!is_array($message)) continue;
    $role = ($message['role'] ?? '') === 'assistant' ? 'model' : 'user';
    $text = trim((string)($message['content'] ?? ''));
    if ($text === '') continue;
    $contents[] = [
        'role' => $role,
        'parts' => [['text' => $text]],
    ];
}

if (!$contents) {
    http_response_code(400);
    echo json_encode(['error' => 'empty_messages', 'message' => 'Ujumbe hauna maandishi.']);
    exit;
}

$payload = [
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.35,
        'topP' => 0.9,
        'maxOutputTokens' => 1000,
    ],
];

if ($system !== '') {
    $payload['systemInstruction'] = [
        'parts' => [['text' => $system]],
    ];
}

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
$jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);

$status = 0;
$rawResponse = false;
$curlError = '';

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 45,
    ]);
    $rawResponse = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $jsonPayload,
            'timeout' => 45,
            'ignore_errors' => true,
        ],
    ]);
    $rawResponse = file_get_contents($url, false, $context);
    $statusLine = $http_response_header[0] ?? '';
    if (preg_match('/\s(\d{3})\s/', $statusLine, $match)) {
        $status = (int)$match[1];
    }
}

if ($rawResponse === false) {
    http_response_code(502);
    echo json_encode([
        'error' => 'gemini_connection_failed',
        'message' => 'Imeshindikana kuwasiliana na Gemini.',
        'detail' => $curlError,
    ]);
    exit;
}

$data = json_decode((string)$rawResponse, true);
if ($status < 200 || $status >= 300) {
    http_response_code($status ?: 502);
    echo json_encode([
        'error' => 'gemini_error',
        'message' => $data['error']['message'] ?? 'Gemini imerudisha hitilafu.',
        'status' => $status,
    ]);
    exit;
}

$reply = '';
foreach (($data['candidates'][0]['content']['parts'] ?? []) as $part) {
    $reply .= (string)($part['text'] ?? '');
}

if (trim($reply) === '') {
    http_response_code(502);
    echo json_encode(['error' => 'empty_reply', 'message' => 'Gemini haikurudisha jibu.']);
    exit;
}

echo json_encode(['reply' => $reply], JSON_UNESCAPED_UNICODE);
