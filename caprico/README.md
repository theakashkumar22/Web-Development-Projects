# [Caprico - AI Chat Assistant](caprico.vercel.app)

**visit site at -** [caprico.vercel.app](https://caprico.vercel.app)

A modern, feature-rich chat interface powered by Google's Gemini 2.0 Flash model. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

### 🤖 AI-Powered Conversations
- **Google Gemini 2.0 Integration**: Advanced AI responses with natural language understanding
- **Real-time Streaming**: Fast, responsive chat experience
- **Context Awareness**: Maintains conversation context across messages

### 📁 Organization & Management
- **Chat Folders**: Organize conversations into custom folders
- **Smart Titles**: Auto-generated chat titles (limited to 2-3 words for clean UI)
- **Search Functionality**: Find messages across all conversations
- **Export/Import**: Backup and restore your chat history

### 📎 File Support
- **File Upload**: Support for images, documents, and text files
- **Drag & Drop**: Easy file attachment with visual feedback
- **Multiple Formats**: Images (JPG, PNG), Documents (PDF, DOC), Text files
- **File Preview**: Visual previews for uploaded images

### 🎨 User Experience
- **Dark/Light Mode**: Seamless theme switching
- **Mobile Responsive**: Optimized for all screen sizes
- **Syntax Highlighting**: Code blocks with language-specific highlighting
- **Rich Text Copy**: Copy messages with formatting preserved
- **Auto-resize Input**: Textarea expands as you type

### 🚀 Performance
- **Local Storage**: Persistent chat history
- **Optimized Rendering**: Efficient message display
- **Keyboard Shortcuts**: Quick actions with keyboard
- **Auto-scroll**: Smooth scrolling to new messages

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **AI Integration**: Google Gemini 2.0 Flash API
- **State Management**: React hooks
- **Storage**: Browser localStorage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/theakashkumar22/caprico.git
   cd caprico-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### API Setup
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your `.env.local` file
3. The app will automatically use the API for chat responses

### Customization
- **Theme Colors**: Modify `app/globals.css` for custom color schemes
- **Chat Suggestions**: Edit conversation suggestions in `app/page.tsx`
- **File Types**: Adjust supported file types in `components/file-upload.tsx`

## 📱 Usage

### Basic Chat
1. Click "New Chat" to start a conversation
2. Type your message and press Enter to send
3. Use Shift+Enter for new lines

### File Upload
1. Click the paperclip icon to open file upload
2. Drag and drop files or click to browse
3. Supported formats: Images, PDFs, text files, documents

### Organization
1. Create folders using the folder+ icon
2. Move chats between folders using the dropdown menu
3. Use search to find specific messages

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line
- **Ctrl/Cmd + B**: Toggle sidebar (when implemented)

## 🏗️ Project Structure

```
caprico-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Gemini API integration
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   ├── loading.tsx              # Loading component
│   └── page.tsx                 # Main chat interface
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── file-upload.tsx          # File upload component
│   ├── markdown-renderer.tsx    # Message rendering
│   └── theme-provider.tsx       # Theme management
├── types/
│   └── speech.d.ts             # TypeScript definitions
├── public/
│   └── v0-reference.png        # App screenshot
└── README.md
```

## 🔒 Privacy & Security

- **Local Storage**: All chat data is stored locally in your browser
- **No Data Collection**: We don't collect or store your conversations
- **API Security**: Gemini API calls are made server-side to protect your API key
- **File Handling**: Uploaded files are processed locally and not stored permanently

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `GEMINI_API_KEY` to environment variables
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: For providing the AI capabilities
- **Vercel**: For the excellent Next.js framework and deployment platform
- **Radix UI**: For accessible UI primitives
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/theakashkumar22/caprico/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible about your issue

---

**Made with ❤️ using Next.js and Google Gemini 2.0**
```

This README provides comprehensive documentation for the Caprico chat application, including:

- **Feature overview** with emojis for visual appeal
- **Complete installation instructions**
- **Configuration details** for the Gemini API
- **Usage guidelines** for all features
- **Project structure** explanation
- **Deployment options**
- **Contributing guidelines**
- **Privacy and security information**

The README is well-structured and includes all the necessary information for users and developers to understand, install, and contribute to the project!
