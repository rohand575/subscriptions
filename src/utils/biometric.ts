/**
 * Local biometric "app lock" built on WebAuthn platform authenticators
 * (Face ID / Touch ID / Windows Hello).
 *
 * IMPORTANT: this is a *local privacy gate*, not a real authentication factor.
 * There is no server-side challenge verification (Firebase has no native
 * WebAuthn), so the actual security boundary remains the persisted Firebase
 * session. The biometric only controls whether the app UI is revealed on this
 * device. Credential ids are stored in localStorage, namespaced per Firebase uid.
 */

const STORAGE_PREFIX = 'biometric:credId:'

function storageKey(uid: string): string {
  return STORAGE_PREFIX + uid
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str)
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const str = atob(b64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes.buffer
}

function randomBytes(len: number): ArrayBuffer {
  const buf = new ArrayBuffer(len)
  crypto.getRandomValues(new Uint8Array(buf))
  return buf
}

function stringToBuffer(str: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(str)
  const buf = new ArrayBuffer(encoded.length)
  new Uint8Array(buf).set(encoded)
  return buf
}

/** True when the browser exposes WebAuthn and a platform authenticator is available. */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** True when this device has an enrolled biometric credential for the given user. */
export function isBiometricEnabled(uid: string): boolean {
  return Boolean(localStorage.getItem(storageKey(uid)))
}

/**
 * Enroll the device's platform authenticator (prompts Face ID / Touch ID) and
 * persist the resulting credential id. Returns true on success.
 */
export async function enrollBiometric(uid: string, name: string): Promise<boolean> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'Subscriptions' },
      user: {
        id: stringToBuffer(uid),
        name,
        displayName: name,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null

  if (!cred) return false
  localStorage.setItem(storageKey(uid), bufferToBase64(cred.rawId))
  return true
}

/**
 * Prompt the enrolled biometric (Face ID / Touch ID) to unlock. Returns true
 * when the user verifies successfully, false/throws otherwise.
 */
export async function verifyBiometric(uid: string): Promise<boolean> {
  const stored = localStorage.getItem(storageKey(uid))
  if (!stored) return false

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [
        { type: 'public-key', id: base64ToBuffer(stored) },
      ],
      userVerification: 'required',
      timeout: 60_000,
    },
  })

  return Boolean(assertion)
}

/** Remove the enrolled biometric credential for this user on this device. */
export function disableBiometric(uid: string): void {
  localStorage.removeItem(storageKey(uid))
}
