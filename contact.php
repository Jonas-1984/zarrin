<?php
/*
 * Contact form handler for www.zarrin7.com
 * Receives the POST from contact.html (js/main.js) and sends it as an
 * e-mail to the company address. Needs PHP with a working mail() on the host.
 *
 * Nothing is stored on the server. The visitor's IP address is only used,
 * hashed, for a short rate limit (one message per 30 seconds) and is never
 * written into the e-mail.
 */

const MAIL_TO   = 'info@zarrin7.com';
const MAIL_FROM = 'noreply@zarrin7.com';          // must be an address of the same domain (SPF/DKIM)
const SITE_HOST = 'zarrin7.com';                  // requests from other sites are refused
const MIN_SECONDS_BETWEEN_MESSAGES = 30;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $ok, string $error = '')
{
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'method');
}

// Only accept submissions that come from this website
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origin !== '') {
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    if ($host !== SITE_HOST && $host !== 'www.' . SITE_HOST) {
        respond(403, false, 'origin');
    }
}

// Honeypot: real visitors never see or fill this field
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(200, true);
}

function field(string $name, int $max, bool $singleLine): string
{
    $v = trim((string) ($_POST[$name] ?? ''));
    $v = str_replace("\0", '', $v);
    if ($singleLine) {
        $v = trim(preg_replace('/[\r\n\t]+/', ' ', $v));
    } else {
        $v = str_replace(["\r\n", "\r"], "\n", $v);
    }
    return mb_substr($v, 0, $max, 'UTF-8');
}

$name    = field('name', 100, true);
$contact = field('contact', 150, true);
$subject = field('subject', 150, true);
$message = field('message', 5000, false);
$consent = ($_POST['consent'] ?? '') !== '';
$lang    = (($_POST['lang'] ?? '') === 'en') ? 'en' : 'fa';

if ($name === '' || $contact === '' || $message === '') {
    respond(422, false, 'required');
}
if (!$consent) {
    respond(422, false, 'consent');
}

// Simple rate limit (hashed IP, temp file, no personal data kept)
$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$lock = sys_get_temp_dir() . '/zarrin_contact_' . hash('sha256', $ip . __FILE__);
if (is_file($lock) && (time() - (int) @filemtime($lock)) < MIN_SECONDS_BETWEEN_MESSAGES) {
    respond(429, false, 'rate');
}

$encode = static fn (string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';

$subjectLine = '[zarrin7.com] ' . ($subject !== '' ? $subject : ($lang === 'en' ? 'New message' : 'پیام جدید'));

$body = "Neue Nachricht über das Kontaktformular / New contact form message\n"
      . "------------------------------------------------------------\n"
      . "Name:     $name\n"
      . "Contact:  $contact\n"
      . "Subject:  " . ($subject !== '' ? $subject : '-') . "\n"
      . "Language: $lang\n"
      . "Time:     " . gmdate('Y-m-d H:i:s') . " UTC\n"
      . "Consent:  privacy policy accepted\n"
      . "------------------------------------------------------------\n\n"
      . $message . "\n";

$headers = [
    'From: ' . $encode('Zarrin Website') . ' <' . MAIL_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: zarrin7.com contact form',
];
// Reply goes straight to the visitor when they gave an e-mail address
if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $contact;
}

$sent = mail(MAIL_TO, $encode($subjectLine), $body, implode("\r\n", $headers));

if (!$sent) {
    respond(500, false, 'mail');
}

@touch($lock);
respond(200, true);
