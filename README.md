# Collablearn

Minimal, productivity-focused, AI-powered online learning platform built with Next.js (App Router), Tailwind CSS, and Firebase (Auth, Firestore, Storage, Realtime).

## Tech
- Next.js 14 App Router
- Tailwind CSS 3
- Firebase v10: Auth, Firestore, Storage
- WebRTC (mesh, Firestore signaling)

## Quickstart
1) Copy environment variables to `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abcdef123456
```

2) Install deps and run:
```
pnpm install
pnpm dev
# or: npm install && npm run dev
```

3) Open http://localhost:3000

## Features
- Study groups (public/private), membership, activity
- Real-time chat per group (Firestore listeners)
- Collaborative whiteboard (SVG strokes synced via Firestore)
- Group video calls (up to ~10 users, mesh P2P via WebRTC + Firestore signaling)
- Quizzes (create, deliver, instant scoring, submissions)
- Shared music player (playlist + synced controls via Firestore)
- Firebase Auth (email/password)

## Structure
- `app/` App Router pages
- `components/` Reusable UI and providers
- `lib/` Firebase init, types

## Firestore Data Model (high-level)
- `groups/{groupId}`
  - `name`, `isPrivate`, `ownerId`, `memberIds[]`, `createdAt`, `updatedAt`
  - `messages/{messageId}`: `text`, `uid`, `displayName`, `createdAt`
  - `boardStrokes/{strokeId}`: `path`, `color`, `width`, `uid`, `createdAt`
  - `peers/{uid}`: `online`, `updatedAt`
  - `signals/{signalId}`: `from`, `to`, `type(offer|answer|ice)`, `sdp|candidate`, `createdAt`
  - `quizzes/{quizId}`: `title`, `questions[]`
    - `submissions/{submissionId}`: `uid`, `answers[]`, `score`, `createdAt`
  - `player/state`: `tracks[]`, `currentIndex`, `isPlaying`, `updatedAt`

## Suggested Firestore Security Rules (sketch)
Adjust to your needs; this is a starting point:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isMember(groupId) {
      return exists(/databases/$(database)/documents/groups/$(groupId)) &&
        get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds.hasAny([request.auth.uid]);
    }

    match /groups/{groupId} {
      allow read: if true; // or restrict private groups
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && getAfter(/databases/$(database)/documents/groups/$(groupId)).data.ownerId == request.auth.uid;

      match /messages/{id} {
        allow read: if isMember(groupId);
        allow create: if isMember(groupId) && request.resource.data.uid == request.auth.uid;
      }
      match /boardStrokes/{id} {
        allow read, create: if isMember(groupId);
      }
      match /peers/{uid} {
        allow read: if isMember(groupId);
        allow write: if isMember(groupId) && uid == request.auth.uid;
      }
      match /signals/{id} {
        allow read, create: if isMember(groupId);
      }
      match /quizzes/{quizId} {
        allow read: if isMember(groupId);
        allow create: if isMember(groupId);
        match /submissions/{sid} {
          allow read: if isMember(groupId);
          allow create: if isMember(groupId) && request.resource.data.uid == request.auth.uid;
        }
      }
      match /player/{docId} {
        allow read, write: if isMember(groupId);
      }
    }
  }
}
```

## Notes
- This project uses App Router and client components where real-time interactivity is needed.
- WebRTC mesh scales to roughly 8–10 users depending on bandwidth/CPU.
- For production, consider a TURN server for NAT traversal, and an SFU (e.g., LiveKit) for larger rooms.
- Add server-side validation or Cloud Functions for stronger invariants as needed.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
