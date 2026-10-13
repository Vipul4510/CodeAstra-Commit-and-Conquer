/**
 * UrbanPulse Mobile SMS & Native Push Notification Service
 * Supports:
 * 1. Direct Real Mobile Carrier SMS via backend /api/v1/sms/send (Fast2SMS Gateway)
 * 2. TextBee SMS Gateway (https://api.textbee.dev)
 * 3. Native Android & Browser Push Notifications (Web Notification API with device vibration)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TEXTBEE_API_KEY = import.meta.env.VITE_TEXTBEE_API_KEY || 'txb_PLc5bHHQ00HuyAOX6cKv0hClRvqA0oRo';
const TEXTBEE_BASE_URL = import.meta.env.VITE_TEXTBEE_BASE_URL || 'https://api.textbee.dev/api/v1/gateway';

// Track sent incident IDs to prevent repetitive spam
const sentAlertsSet = new Set();

/**
 * Storage helpers for user's recipient mobile phone number
 */
export function getSavedMobilePhone() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('urbanpulse_recipient_phone') || '';
}

export function saveMobilePhone(phone) {
  if (typeof window === 'undefined') return;
  const clean = (phone || '').trim().replace(/[^\d]/g, '');
  localStorage.setItem('urbanpulse_recipient_phone', clean);
}

/**
 * Checks if browser/device supports Web Notifications
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

/**
 * Requests permission for native Android/browser notifications
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return { ok: false, status: 'unsupported', message: 'Notifications not supported on this browser/device' };
  }
  try {
    const perm = await Notification.requestPermission();
    return { ok: perm === 'granted', status: perm };
  } catch (err) {
    return { ok: false, status: 'error', error: err.message };
  }
}

/**
 * Sends a REAL Mobile Carrier SMS to recipient phone number
 */
export async function sendCarrierMobileSMS({ phoneNumber, message }) {
  const phone = phoneNumber || getSavedMobilePhone();
  if (!phone || phone.length < 10) {
    return { ok: false, error: 'No 10-digit mobile phone number provided.' };
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone,
        message: message,
        provider: 'fast2sms',
      }),
    });

    const data = await res.json();
    const isOk = res.ok && data.success === true;
    return {
      ok: isOk,
      status: res.status,
      data,
      provider: data.provider,
      error: data.error || data.detail || (!isOk ? 'SMS gateway failed to process' : null),
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Failed to dispatch carrier SMS',
    };
  }
}

/**
 * Dispatches alert to TextBee gateway
 */
export async function sendTextBeeAlert({ locality, description, incidentId }) {
  if (!TEXTBEE_API_KEY) {
    return { ok: false, error: 'TextBee API key not configured' };
  }

  const message = `[URBANPULSE CRITICAL ALERT] ${locality}: ${description || 'Severe flooding or corridor obstruction detected'}. Avoid route!`;

  try {
    const response = await fetch(`${TEXTBEE_BASE_URL}/devices/alerts/sendSMS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        message,
        incident_id: incidentId,
        locality,
      }),
    });

    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data,
      message,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      message,
    };
  }
}

/**
 * Triggers a native system notification (Android Chrome / Desktop)
 */
export function sendAndroidNativeNotification({ title, body, incidentId, tag }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag: tag || incidentId || 'urbanpulse-critical-alert',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [300, 100, 300, 100, 300], // Vibration pattern for Android devices
      requireInteraction: true,
      data: { incidentId },
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Unified Critical Incident Alert Dispatcher
 * Dispatches via REAL Mobile Carrier SMS, Native Android Push, and TextBee Gateway
 */
export async function dispatchCriticalAlert(incident, targetPhone = null) {
  if (!incident) return null;

  const id = incident.incident_id || incident.event_id || `INC-${Date.now()}`;
  if (sentAlertsSet.has(id)) {
    return null; // Already alerted for this specific event ID
  }
  sentAlertsSet.add(id);

  const locality = incident.locality || 'Mumbai Western Suburbs';
  const desc = incident.description || incident.description_or_text || 'Critical Road Disruption';
  const title = `🚨 CRITICAL ALERT: ${locality}`;
  const body = `${desc} — Passability: ${incident.road_passability || 'CLOSED'}`;
  const smsText = `🚨 URBANPULSE ALERT: ${locality} - ${desc}. Status: ${incident.road_passability || 'CLOSED'}. Avoid corridor!`;

  const phone = targetPhone || getSavedMobilePhone();

  // 1. Send Real Mobile Carrier SMS
  let smsResult = null;
  if (phone && phone.length >= 10) {
    smsResult = await sendCarrierMobileSMS({
      phoneNumber: phone,
      message: smsText,
    });
  }

  // 2. Android / Browser Native Push
  const nativeSent = sendAndroidNativeNotification({
    title,
    body,
    incidentId: id,
    tag: id,
  });

  // 3. TextBee SMS Gateway Dispatch
  const textbeeResult = await sendTextBeeAlert({
    locality,
    description: desc,
    incidentId: id,
  });

  return {
    incidentId: id,
    locality,
    dispatchedAt: new Date().toLocaleTimeString(),
    phoneTarget: phone || 'Not configured',
    smsResult,
    nativeSent,
    textbeeResult,
  };
}

export default {
  getSavedMobilePhone,
  saveMobilePhone,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendCarrierMobileSMS,
  sendAndroidNativeNotification,
  sendTextBeeAlert,
  dispatchCriticalAlert,
};
