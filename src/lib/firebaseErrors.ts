import type { FirebaseError } from 'firebase/app'

function isFirebaseError(err: unknown): err is FirebaseError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as FirebaseError).code === 'string'
  )
}

export function formatAuthError(err: unknown): string {
  if (!isFirebaseError(err)) {
    return 'Something went wrong. Check your connection and try again.'
  }
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'That email is already registered — sign in instead.'
    case 'auth/user-not-found':
      return 'No account for this email — create one first.'
    case 'auth/weak-password':
      return 'Password is too weak.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups for this site or try again.'
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in pop-up at a time. Close the other window and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    default:
      return err.message || 'Could not authenticate. Check the console for details.'
  }
}

export function formatFirestoreError(err: unknown): string {
  if (!isFirebaseError(err)) {
    return 'Could not reach Firestore. Check your network and try again.'
  }
  switch (err.code as string) {
    case 'permission-denied': {
      const pid = import.meta.env.VITE_FIREBASE_PROJECT_ID || '(set VITE_FIREBASE_PROJECT_ID in .env)'
      return [
        `Firestore permission denied — rules are blocking users/{userId}. Your web app project id is: ${pid}.`,
        'Fix: Firebase Console → select that same project → Build → Firestore Database → Rules.',
        'Paste the rules from the firestore.rules file in this repo (allow read, write on users/{userId} when request.auth.uid == userId), then click Publish.',
        'Or from this folder run: npx firebase login && npx firebase use ' +
          pid +
          ' && npx firebase deploy --only firestore:rules',
        'Also confirm Firestore is created (Database tab) — not only Authentication.',
      ].join(' ')
    }
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Firestore is temporarily unavailable or the request timed out. Check your network.'
    case 'failed-precondition':
      return 'Firestore may not be enabled for this project yet.'
    default:
      return err.message || 'Could not save data. Check Firestore rules and your connection.'
  }
}
