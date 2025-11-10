# Firebase Setup Guide

## 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project: `ezstudy-54a07`
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable **Email/Password** provider
   - Enable **Email link (passwordless)** if desired (optional)

4. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **Production mode** (we'll add rules)
   - Choose your preferred location

## 2. Firestore Security Rules

Copy the contents of `firestore.rules` and paste into Firebase Console:
- Go to Firestore Database > Rules
- Paste the rules
- Click "Publish"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the Web icon (`</>`) if you haven't created a web app
4. Register your app with a nickname (e.g., "ezstudy-web")
5. Copy the Firebase configuration object

## 4. Environment Variables

### Local Development (.env.local)

Create `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCUoqq9KbpoaT3M2kAgzMytXgRhW3Hh_Z4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ezstudy-54a07.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ezstudy-54a07
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ezstudy-54a07.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=483916833539
NEXT_PUBLIC_FIREBASE_APP_ID=1:483916833539:web:5a7ce57586b49764f63f36
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCUoqq9KbpoaT3M2kAgzMytXgRhW3Hh_Z4` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `ezstudy-54a07.firebaseapp.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ezstudy-54a07` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `ezstudy-54a07.firebasestorage.app` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `483916833539` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:483916833539:web:5a7ce57586b49764f63f36` | Production, Preview, Development |

**Note:** All Firebase variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## 5. Firebase Authentication Setup

### Email/Password Authentication

1. Go to Authentication > Sign-in method
2. Click on **Email/Password**
3. Enable **Email/Password** (first toggle)
4. Enable **Email link (passwordless)** if desired (optional)
5. Click **Save**

### Authorized Domains

1. Go to Authentication > Settings
2. Scroll to **Authorized domains**
3. Add your Vercel domain (e.g., `ezstudy.vercel.app`)
4. Add `localhost` for local development (should already be there)

## 6. Firestore Indexes (Optional)

If you plan to query tutors with multiple filters, you may need to create composite indexes:

1. Go to Firestore Database > Indexes
2. Click "Create Index"
3. Collection: `tutors`
4. Fields:
   - `available` (Ascending)
   - `rating` (Descending)
5. Click "Create"

## 7. Testing

1. Start your dev server: `npm run dev`
2. Navigate to `/tutoring`
3. Try signing up with a new email
4. Check Firebase Console > Authentication to see the new user
5. Try creating a tutor profile
6. Check Firestore Database > `tutors` collection

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Authorized domains in Firebase Console

### "Missing or insufficient permissions"
- Check Firestore security rules are published
- Verify user is authenticated
- Check that rules match your data structure

### Environment variables not working
- Ensure variables start with `NEXT_PUBLIC_`
- Restart dev server after adding variables
- Check Vercel environment variables are set correctly

## Security Notes

- Never commit `.env.local` to Git (already in `.gitignore`)
- Firebase API keys are safe to expose (they're public by design)
- Security is enforced through Firestore rules, not API keys
- Always use Firestore rules to restrict data access

