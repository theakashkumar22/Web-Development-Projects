# StudyDock

**StudyDock** is an offline-first study companion that helps you organize notes, create flashcards, generate quizzes, and track your study progress—all stored locally for privacy and offline access.

## Features

- **Smart Notes:** Organize your study materials with rich text notes, tags, and AI-powered suggestions.
- **Flashcards & Quizzes:** Create and study with AI-generated flashcards and quizzes to test your knowledge.
- **Study Planner:** Track your progress and maintain consistency with an integrated study planner and Pomodoro timer.
- **AI Study Assistant:** Get help with your studies using an AI-powered assistant.
- **Offline-First:** All your data is stored locally on your device for privacy and offline access.
- **Data Backup & Restore:** Export and import your data easily for peace of mind.
- **Free & Open Source:** No subscriptions or paywalls.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/theakashkumar22/studydock.git
   cd studydock
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```

4. **Open the app:**
   - Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```sh
npm run build
# or
yarn build
```

## Project Structure

- `src/` — Main source code (components, pages, hooks, db)
- `public/` — Static assets
- `package.json` — Scripts and dependencies

## Data Storage

All user data (notes, flashcards, quizzes, planner, etc.) is stored locally in your browser or Electron app using IndexedDB via [Dexie.js](https://dexie.org/).

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

MIT

---

**StudyDock** — Your Offline-First Study Companion
