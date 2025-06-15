# FlexPlex

**The future of fitness meets rewards - Get paid for perfecting your poses!**
***Powered by PaymanAI***
> **FlexPlex** is an innovative web application that combines AI-powered pose detection with rewards. Master yoga poses, earn rewards, and gamify your wellness journey!

##Features

### 🎯 **Real-time Pose Detection**
- **MediaPipe Integration**: Advanced computer vision for accurate pose recognition
- **Live Feedback**: Real-time pose matching with visual indicators
- **33 Landmark Detection**: Precise body tracking using Google's state-of-the-art ML models
- **Webcam Integration**: Seamless camera access for pose analysis

### 🎮 **Gamified Experience**
- **Progressive Levels**: 4 challenging yoga poses across multiple difficulty levels
- **Scoring System**: Earn points based on pose accuracy and hold duration
- **Achievement Tracking**: Visual progress indicators and completion status
- **Customizable Challenges**: Adjustable hold times (3-30 seconds)

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Animations**: Smooth progress bars and visual feedback
- **Dark Mode Ready**: Modern design with gradient overlays
- **Accessibility**: Screen reader friendly with proper ARIA labels

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Webcam access** (for pose detection)
- **Payman Account** (for crypto rewards)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FlexPlex.git
cd FlexPlex
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
VITE_PAYMAN_CLIENT_ID=your_payman_client_id
VITE_PAYMAN_CLIENT_SECRET=your_payman_client_secret
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173` and start your yoga journey! 🧘‍♀️

## 🛠️ Tech Stack

### Frontend
- **React 19.1** - Modern UI framework with latest features
- **Vite 6.3** - Lightning-fast build tool and dev server
- **CSS3** - Custom styling with modern gradients and animations

### Computer Vision
- **MediaPipe Tasks Vision** - Google's ML framework for pose detection
- **Canvas API** - Real-time landmark rendering and pose visualization
- **WebRTC** - Webcam access and video processing

### PaymanAI Integration
- **Payman AI** - Secure payment infrastructure
- **TypeScript SDK** - Type-safe payment processing
- **TSD (Test Dollar)** - Test dollars for rewards

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **Vite Plugin React** - Hot reload and fast refresh


## Acknowledgments

- **Google MediaPipe Team** - For the incredible pose detection technology
- **Payman AI** - For secure crypto payment infrastructure
- **React Team** - For the amazing frontend framework
- **Yoga Community** - For inspiration and pose references


## 🌟 Star Us!

If you find FlexPlex helpful, please consider giving us a star ⭐ on GitHub! It helps us grow and reach more yoga enthusiasts.

---

**Made with 💜 by Surabhi**

*Namaste, and happy stretching! 🧘‍♀️✨*