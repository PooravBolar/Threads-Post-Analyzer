# Threads Post Analyzer - Premium Tool

A premium social media post analysis and enhancement tool specifically designed for Threads posts. This tool analyzes your posts using multiple metrics and provides AI-powered enhancements based on your own viral posts and reference materials.

## Features

### 🎯 Post Analysis

- **Engagement Potential**: Predicts likelihood of likes, comments, and shares
- **Readability Score**: Measures how easy your post is to read
- **Sentiment Analysis**: Evaluates positive sentiment
- **Hook Strength**: Analyzes the compelling power of your opening
- **CTA Quality**: Assesses call-to-action effectiveness
- **Visual Appeal**: Evaluates text structure and visual interest
- **Authenticity**: Measures how genuine your post sounds
- **Viral Score**: Overall composite score for viral potential

### ✨ Premium Features

- **AI-Powered Analysis**: Advanced analysis using Gemini AI
- **Smart Enhancement**: AI-enhanced post versions based on your viral posts
- **Reference Database**: Build a knowledge base with your viral posts and PDFs
- **Fine-Tuned Suggestions**: AI uses your reference database to provide personalized enhancements

### 🎨 Design

- Minimal, Threads-inspired UI
- Dark theme optimized for professional use
- Responsive design for all devices

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **AI/LLM**: Google Gemini API
- **Styling**: CSS3 with CSS Variables
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ and npm/yarn
- Firebase account (free tier works)
- Google Gemini API key

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Enable Storage
6. Copy your Firebase config values

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 5. Firebase Firestore Rules

Set up your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Reference Database
    match /referenceDatabase/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Analysis History
    match /analysisHistory/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 6. Firebase Storage Rules

Set up your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /pdfs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 7. Set Premium Users

To grant premium access to a user, add a document to the `users` collection in Firestore:

```javascript
{
  isPremium: true;
}
```

Document ID should be the user's UID.

### 8. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Usage

### Basic Analysis

1. Sign up or sign in
2. Paste or type your Threads post
3. Click "Analyze Post"
4. Review your scores and insights

### Premium Features

1. **Add Viral Posts**: Go to Reference Database → Add Viral Post
2. **Upload PDFs**: Upload reference PDFs to your database
3. **AI Enhancement**: After analyzing, click "Enhance with AI" to get improved versions based on your references

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.jsx       # Authentication
│   ├── Dashboard.jsx   # Main dashboard
│   ├── PostAnalyzer.jsx # Post analysis interface
│   ├── ScoreCard.jsx   # Score display component
│   ├── EnhancementPanel.jsx # AI enhancement display
│   └── ReferenceDatabase.jsx # Reference management
├── services/           # Business logic
│   ├── analysisEngine.js # Post scoring algorithms
│   ├── geminiService.js  # Gemini API integration
│   └── firebaseService.js # Firebase operations
├── firebase/           # Firebase configuration
│   └── config.js
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Customization

### Adjusting Metrics

Edit `src/services/analysisEngine.js` to modify scoring algorithms.

### Updating AI Prompts

Modify prompts in `src/services/geminiService.js` to change how the AI analyzes and enhances posts.

### Styling

All styles use CSS variables defined in `src/index.css`. Modify these to change the theme.

## Notes

- **No Cloud Functions**: This app uses client-side code only, compatible with Firebase free tier
- **PDF Processing**: PDF text extraction is a placeholder. For production, consider using a service or server-side processing
- **Premium Access**: Currently managed via Firestore `users` collection. Integrate with your payment system as needed

## License

Private - Premium Tool

## Support

For issues or questions, contact your development team.
