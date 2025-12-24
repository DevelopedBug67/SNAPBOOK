# Snapchat Clone - Design Guidelines

## Authentication Architecture
**Auth Required** - Social/multiplayer app with messaging and sharing features.

**Implementation:**
- Use SSO for login/signup (Apple Sign-In for iOS, Google Sign-In)
- Mock auth flow in prototype with local state
- **Screens:**
  - Welcome Screen: Full-screen gradient (yellow #FFFC00 to white), app logo, "Sign in with Apple" and "Sign in with Google" buttons, privacy policy & terms links at bottom
  - Account Screen: Profile avatar, display name, username, email, settings access, logout (with confirmation), delete account (nested under Settings > Account > Delete with double confirmation)

## Navigation Architecture
**Root Navigation: Horizontal Swipe Tabs** (Snapchat's signature pattern)

**Structure:**
- 3 main screens accessed by horizontal swipe gestures
- NO traditional tab bar - gesture-based navigation only
- Camera is the default landing screen (middle)
- Swipe left: Chats
- Swipe right: Stories/Discover
- Profile/Settings accessible via avatar tap in Camera screen

**Navigation Stacks:**
1. **Stories Stack** (swipe right from Camera)
2. **Camera Stack** (default/center)
3. **Chats Stack** (swipe left from Camera)
4. **Modals:** Profile/Settings, Add Friends, Story Viewer, Snap Viewer

## Screen Specifications

### 1. Camera Screen (Landing/Default)
**Purpose:** Capture photos/videos to send as snaps or post to stories

**Layout:**
- **Header:** Transparent, custom
  - Left: User avatar (tap to open Profile)
  - Right: Cog icon (Settings)
  - No search bar
- **Main Content:** Full-screen camera preview (not scrollable)
- **Floating Elements:**
  - Center bottom: Large circular capture button (white ring, 80px diameter)
  - Left of capture: Gallery icon (access camera roll)
  - Right of capture: Flash toggle icon
  - Bottom left corner: Stories icon
  - Bottom right corner: Chats icon with badge for unread count
  - Top center: Small toggle for front/back camera
- **Safe Area Insets:**
  - Top: insets.top + Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

### 2. Chats Screen
**Purpose:** View and manage conversations with friends

**Layout:**
- **Header:** Custom, opaque background (white)
  - Title: "Chats"
  - Left: Back to Camera gesture hint (or avatar)
  - Right: Add friend icon
  - Search bar: YES, below title
- **Main Content:** Scrollable list of chat conversations
  - Each row: Friend avatar (left), name, message preview, timestamp, unread indicator (blue dot), snap type icon (photo/video/text)
- **Safe Area Insets:**
  - Top: Spacing.xl (header is opaque)
  - Bottom: insets.bottom + Spacing.xl

**Components:** SearchBar, FlatList with chat preview cards

### 3. Stories/Discover Screen
**Purpose:** View friends' stories and discover content

**Layout:**
- **Header:** Custom, transparent initially
  - Title: "Stories"
  - Right: Search icon
- **Main Content:** Scrollable
  - "Friends" section: Horizontal scrollable row of circular story thumbnails with user avatars and names
  - "Discover" section: Vertical grid of publisher/brand content cards
- **Safe Area Insets:**
  - Top: headerHeight + Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

**Components:** Horizontal ScrollView, Grid layout, Story circles with gradient rings for unviewed

### 4. Snap Composer (Modal)
**Purpose:** Add text, drawings, stickers before sending snap

**Layout:**
- **Header:** Transparent
  - Left: X (close)
  - Right: Send icon (arrow)
- **Main Content:** Full-screen captured image/video
- **Floating Elements:**
  - Top right: Timer selector (3s, 5s, 10s, ∞)
  - Bottom: Text input tool, Draw tool, Sticker tool, Save button
- **Safe Area Insets:**
  - Top: insets.top + Spacing.md
  - Bottom: insets.bottom + Spacing.md

### 5. Snap Viewer (Modal)
**Purpose:** View received snap with tap-to-hold interaction

**Layout:**
- Full-screen snap display
- Top: Sender name, timestamp, countdown timer (progress bar)
- Bottom: Reply input (swipe up to reveal)
- Tap and hold to view, release to close
- **Safe Area Insets:** None (full immersive)

### 6. Story Viewer (Modal)
**Purpose:** View friends' 24-hour stories

**Layout:**
- Full-screen story segments with tap-to-advance
- Top: Progress bars (one per story segment), username, timestamp
- Tap right: Next segment
- Tap left: Previous segment
- Swipe down: Exit
- **Safe Area Insets:** None (full immersive)

### 7. Profile/Settings Screen (Modal)
**Purpose:** Manage account and app settings

**Layout:**
- **Header:** Custom
  - Title: User's display name
  - Left: X (close)
  - Right: Settings cog
- **Main Content:** Scrollable form
  - Avatar (tap to change)
  - Display name field
  - Username (read-only)
  - Snapcode (unique QR-style code)
  - Friends count
  - Settings sections: Account, Privacy, Notifications, Theme
- **Safe Area Insets:**
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

## Design System

### Color Palette
- **Primary:** Yellow #FFFC00 (Snapchat brand color)
- **Background:** White #FFFFFF
- **Surface:** Light Gray #F7F7F7
- **Text Primary:** Black #000000
- **Text Secondary:** Gray #666666
- **Accent:** Blue #0EADFF (for unread indicators)
- **Error:** Red #FF0000
- **Success:** Green #00D26A

### Typography
- **Header:** SF Pro Display Bold, 28px
- **Title:** SF Pro Display Semibold, 22px
- **Body:** SF Pro Text Regular, 16px
- **Caption:** SF Pro Text Regular, 14px
- **Button:** SF Pro Text Semibold, 16px

### Visual Design
- **Icons:** Feather icons from @expo/vector-icons, monochrome (black or white depending on background)
- **Floating Action Buttons:** Use subtle drop shadow
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- **Chat Rows:** No shadows, subtle border-bottom separator
- **Story Circles:** Gradient ring for unviewed (yellow to orange), gray ring for viewed
- **Touchable Feedback:** Scale animation (0.95) on press for buttons, opacity (0.7) for list items

### Critical Assets
1. **App Logo:** Ghost icon (Snapchat-style friendly ghost), yellow with white background
2. **User Avatars:** Generate 8 preset Bitmoji-style cartoon avatars in different skin tones, hairstyles, and accessories that users can select
3. **Snapcode:** Generate unique QR-code-style pattern for each user (yellow and black)
4. **Empty States:**
   - No chats: Friendly ghost illustration with "No chats yet"
   - No stories: "No new stories"
5. **Placeholder:** Gray camera icon for gallery previews

### Interaction Design
- **Haptic Feedback:** On snap capture, story post, message send
- **Gestures:**
  - Horizontal swipe: Navigate between main screens
  - Tap and hold: View snap (with timer)
  - Swipe down: Dismiss modals
  - Pinch: Zoom in camera
- **Animations:**
  - Screen transitions: Horizontal slide (300ms)
  - Snap timer: Circular countdown animation
  - Story progress: Linear progress bars at top
  - Send snap: Rocket launch animation

### Accessibility
- VoiceOver labels for all interactive elements
- Dynamic Type support for text scaling
- High contrast mode support
- Haptic feedback alternatives for visual cues
- Camera accessibility announcement for capture confirmation