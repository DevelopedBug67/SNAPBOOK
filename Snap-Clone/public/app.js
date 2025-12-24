// SnapClone Application

// State
let currentUser = null;
let currentScreen = 'camera';
let selectedFriends = [];
let capturedImage = null;
let snapDuration = 3;
let cameraStream = null;
let facingMode = 'user';
let currentChatFriend = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const swipeContainer = document.getElementById('swipe-container');
const navDots = document.querySelectorAll('.nav-dot');
const headerTitle = document.getElementById('header-title');

// Camera Elements
const cameraPreview = document.getElementById('camera-preview');
const cameraCanvas = document.getElementById('camera-canvas');
const cameraPermission = document.getElementById('camera-permission');
const captureBtn = document.getElementById('capture-btn');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const enableCameraBtn = document.getElementById('enable-camera-btn');

// Modal Elements
const snapPreviewModal = document.getElementById('snap-preview-modal');
const snapPreviewImage = document.getElementById('snap-preview-image');
const sendToModal = document.getElementById('send-to-modal');
const storyViewer = document.getElementById('story-viewer');
const snapViewer = document.getElementById('snap-viewer');
const profileModal = document.getElementById('profile-modal');
const addFriendModal = document.getElementById('add-friend-modal');
const chatModal = document.getElementById('chat-modal');

// API Helper
async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API Error');
  }
  
  return response.json();
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Authentication
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  
  if (!username) return;
  
  try {
    const { user } = await api('/auth/login', {
      method: 'POST',
      body: { username },
    });
    
    currentUser = user;
    loginScreen.classList.remove('active');
    mainApp.classList.remove('hidden');
    
    initializeApp();
  } catch (error) {
    showToast('Login failed. Please try again.');
  }
});

async function checkAuth() {
  try {
    const { user } = await api('/auth/me');
    currentUser = user;
    loginScreen.classList.remove('active');
    mainApp.classList.remove('hidden');
    initializeApp();
  } catch {
    // Not authenticated, show login
  }
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
    currentUser = null;
    mainApp.classList.add('hidden');
    loginScreen.classList.add('active');
    usernameInput.value = '';
    profileModal.classList.add('hidden');
    stopCamera();
  } catch (error) {
    showToast('Logout failed');
  }
}

// Initialize App
function initializeApp() {
  initCamera();
  loadChats();
  loadStories();
  updateProfile();
  setupNavigation();
  setupEventListeners();
}

// Navigation
function setupNavigation() {
  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const screen = dot.dataset.screen;
      navigateTo(screen);
    });
  });
  
  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  swipeContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  swipeContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    
    if (Math.abs(diff) < threshold) return;
    
    const screens = ['chats', 'camera', 'stories'];
    const currentIndex = screens.indexOf(currentScreen);
    
    if (diff > 0 && currentIndex < screens.length - 1) {
      navigateTo(screens[currentIndex + 1]);
    } else if (diff < 0 && currentIndex > 0) {
      navigateTo(screens[currentIndex - 1]);
    }
  }
}

function navigateTo(screen) {
  currentScreen = screen;
  
  const screens = ['chats', 'camera', 'stories'];
  const index = screens.indexOf(screen);
  swipeContainer.style.transform = `translateX(-${index * 100}%)`;
  
  navDots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.screen === screen);
  });
  
  const titles = { chats: 'Chats', camera: '', stories: 'Stories' };
  headerTitle.textContent = titles[screen];
  
  const header = document.getElementById('app-header');
  if (screen === 'camera') {
    header.style.background = 'transparent';
    header.style.color = 'white';
  } else {
    header.style.background = 'var(--background)';
    header.style.color = 'var(--text-primary)';
  }
}

// Camera
async function initCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false
    });
    cameraPreview.srcObject = cameraStream;
    cameraPermission.classList.add('hidden');
  } catch (error) {
    cameraPermission.classList.remove('hidden');
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

enableCameraBtn.addEventListener('click', initCamera);

flipCameraBtn.addEventListener('click', async () => {
  stopCamera();
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  await initCamera();
});

captureBtn.addEventListener('click', () => {
  if (!cameraStream) {
    showToast('Camera not available');
    return;
  }
  
  const context = cameraCanvas.getContext('2d');
  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;
  
  if (facingMode === 'user') {
    context.translate(cameraCanvas.width, 0);
    context.scale(-1, 1);
  }
  
  context.drawImage(cameraPreview, 0, 0);
  capturedImage = cameraCanvas.toDataURL('image/jpeg', 0.8);
  
  snapPreviewImage.src = capturedImage;
  snapPreviewModal.classList.remove('hidden');
});

// Gallery button
document.getElementById('gallery-btn').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        capturedImage = e.target.result;
        snapPreviewImage.src = capturedImage;
        snapPreviewModal.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
});

// Snap Preview Controls
document.getElementById('close-preview').addEventListener('click', () => {
  snapPreviewModal.classList.add('hidden');
  capturedImage = null;
});

document.querySelectorAll('.timer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    snapDuration = parseInt(btn.dataset.time);
  });
});

document.getElementById('send-snap-btn').addEventListener('click', async () => {
  selectedFriends = [];
  await loadFriendsList();
  sendToModal.classList.remove('hidden');
});

document.getElementById('add-to-story').addEventListener('click', async () => {
  if (!capturedImage) return;
  
  try {
    await api('/stories', {
      method: 'POST',
      body: { mediaUrl: capturedImage, mediaType: 'image' },
    });
    
    snapPreviewModal.classList.add('hidden');
    capturedImage = null;
    showToast('Added to your story!');
    loadStories();
  } catch (error) {
    showToast('Failed to add story');
  }
});

document.getElementById('save-snap').addEventListener('click', () => {
  if (!capturedImage) return;
  
  const link = document.createElement('a');
  link.download = `snap-${Date.now()}.jpg`;
  link.href = capturedImage;
  link.click();
  showToast('Saved to device');
});

// Send To Modal
document.getElementById('close-send-modal').addEventListener('click', () => {
  sendToModal.classList.add('hidden');
});

async function loadFriendsList() {
  const friendsList = document.getElementById('friends-list');
  
  try {
    const friends = await api('/friends');
    
    if (friends.length === 0) {
      friendsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <p>Add friends to send snaps</p>
        </div>
      `;
      return;
    }
    
    friendsList.innerHTML = friends.map(friend => `
      <div class="friend-item" data-id="${friend.id}">
        <div class="avatar-small"></div>
        <span class="friend-name">${friend.displayName || friend.username}</span>
        <div class="friend-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
    `).join('');
    
    friendsList.querySelectorAll('.friend-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('selected');
        const friendId = item.dataset.id;
        
        if (item.classList.contains('selected')) {
          selectedFriends.push(friendId);
        } else {
          selectedFriends = selectedFriends.filter(id => id !== friendId);
        }
      });
    });
  } catch (error) {
    showToast('Failed to load friends');
  }
}

document.getElementById('confirm-send').addEventListener('click', async () => {
  if (selectedFriends.length === 0) {
    showToast('Select at least one friend');
    return;
  }
  
  if (!capturedImage) return;
  
  try {
    for (const friendId of selectedFriends) {
      await api('/snaps', {
        method: 'POST',
        body: {
          receiverId: friendId,
          mediaUrl: capturedImage,
          mediaType: 'image',
          duration: snapDuration,
        },
      });
    }
    
    sendToModal.classList.add('hidden');
    snapPreviewModal.classList.add('hidden');
    capturedImage = null;
    selectedFriends = [];
    showToast(`Sent to ${selectedFriends.length > 1 ? 'friends' : 'friend'}!`);
  } catch (error) {
    showToast('Failed to send snap');
  }
});

// Chats
async function loadChats() {
  const chatsList = document.getElementById('chats-list');
  
  try {
    const [chatPreviews, snaps] = await Promise.all([
      api('/chats'),
      api('/snaps'),
    ]);
    
    const items = [];
    
    // Add pending snaps
    const snapsBySender = {};
    snaps.forEach(snap => {
      if (!snapsBySender[snap.senderId]) {
        snapsBySender[snap.senderId] = [];
      }
      snapsBySender[snap.senderId].push(snap);
    });
    
    for (const [senderId, senderSnaps] of Object.entries(snapsBySender)) {
      items.push({
        type: 'snap',
        friendId: senderId,
        snaps: senderSnaps,
        time: new Date(senderSnaps[0].createdAt),
      });
    }
    
    // Add chat previews
    chatPreviews.forEach(preview => {
      if (!snapsBySender[preview.friend.id]) {
        items.push({
          type: 'chat',
          friend: preview.friend,
          lastMessage: preview.lastMessage,
          unreadCount: preview.unreadCount,
          time: new Date(preview.lastMessage.createdAt),
        });
      }
    });
    
    // Sort by time
    items.sort((a, b) => b.time - a.time);
    
    if (items.length === 0) {
      chatsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No chats yet. Add friends to start chatting!</p>
        </div>
      `;
      return;
    }
    
    chatsList.innerHTML = items.map(item => {
      if (item.type === 'snap') {
        return `
          <div class="chat-item" data-type="snap" data-snap-id="${item.snaps[0].id}">
            <div class="chat-avatar">
              <div class="avatar-small"></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">New Snap</div>
              <div class="chat-preview">${item.snaps.length} new snap${item.snaps.length > 1 ? 's' : ''}</div>
            </div>
            <div class="chat-meta">
              <span class="chat-time">${formatTime(item.time)}</span>
              <div class="snap-indicator new">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="chat-item" data-type="chat" data-friend-id="${item.friend.id}" data-friend-name="${item.friend.displayName || item.friend.username}">
            <div class="chat-avatar">
              <div class="avatar-small"></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">${item.friend.displayName || item.friend.username}</div>
              <div class="chat-preview">${item.lastMessage.message}</div>
            </div>
            <div class="chat-meta">
              <span class="chat-time">${formatTime(item.time)}</span>
              ${item.unreadCount > 0 ? '<div class="unread-badge"></div>' : ''}
            </div>
          </div>
        `;
      }
    }).join('');
    
    chatsList.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', async () => {
        if (item.dataset.type === 'snap') {
          await viewSnap(item.dataset.snapId);
        } else {
          openChat(item.dataset.friendId, item.dataset.friendName);
        }
      });
    });
  } catch (error) {
    console.error('Failed to load chats:', error);
  }
}

async function viewSnap(snapId) {
  try {
    const snaps = await api('/snaps');
    const snap = snaps.find(s => s.id === snapId);
    
    if (!snap) return;
    
    const snapImage = document.getElementById('snap-image');
    const countdownBar = document.getElementById('snap-countdown-bar');
    const senderName = document.getElementById('snap-sender-name');
    
    snapImage.src = snap.mediaUrl;
    snapImage.classList.remove('visible');
    senderName.textContent = 'Friend';
    
    snapViewer.classList.remove('hidden');
    
    let isViewing = false;
    let countdown;
    let remaining = snap.duration;
    
    const startViewing = () => {
      if (isViewing) return;
      isViewing = true;
      snapImage.classList.add('visible');
      
      countdown = setInterval(() => {
        remaining -= 0.1;
        const percent = (remaining / snap.duration) * 100;
        countdownBar.style.width = `${percent}%`;
        
        if (remaining <= 0) {
          stopViewing();
          closeSnapViewer();
        }
      }, 100);
    };
    
    const stopViewing = () => {
      isViewing = false;
      snapImage.classList.remove('visible');
      clearInterval(countdown);
    };
    
    const closeSnapViewer = async () => {
      stopViewing();
      snapViewer.classList.add('hidden');
      await api(`/snaps/${snapId}/view`, { method: 'POST' });
      loadChats();
    };
    
    snapViewer.onmousedown = startViewing;
    snapViewer.onmouseup = stopViewing;
    snapViewer.ontouchstart = startViewing;
    snapViewer.ontouchend = stopViewing;
    
    // Close on swipe down
    let startY = 0;
    snapViewer.ontouchstart = (e) => {
      startY = e.touches[0].clientY;
      startViewing();
    };
    
    snapViewer.ontouchend = async (e) => {
      const endY = e.changedTouches[0].clientY;
      stopViewing();
      if (endY - startY > 100) {
        await closeSnapViewer();
      }
    };
  } catch (error) {
    showToast('Failed to load snap');
  }
}

// Stories
async function loadStories() {
  const friendsStories = document.getElementById('friends-stories');
  const discoverGrid = document.getElementById('discover-grid');
  
  try {
    const stories = await api('/stories');
    
    // Group stories by user
    const storyGroups = {};
    stories.forEach(story => {
      const userId = story.userId;
      if (!storyGroups[userId]) {
        storyGroups[userId] = {
          user: story.user,
          stories: [],
        };
      }
      storyGroups[userId].stories.push(story);
    });
    
    // Add own story button
    let html = `
      <div class="story-item add-story" id="add-own-story">
        <div class="story-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span class="story-name">Add Story</span>
      </div>
    `;
    
    // Add friend stories
    Object.values(storyGroups).forEach(group => {
      html += `
        <div class="story-item" data-user-id="${group.user.id}" data-stories='${JSON.stringify(group.stories)}'>
          <div class="story-circle">
            <div class="story-circle-inner">
              <div class="avatar-placeholder"></div>
            </div>
          </div>
          <span class="story-name">${group.user.displayName || group.user.username}</span>
        </div>
      `;
    });
    
    friendsStories.innerHTML = html;
    
    // Add story click handler
    document.getElementById('add-own-story').addEventListener('click', () => {
      navigateTo('camera');
    });
    
    // Story view handlers
    friendsStories.querySelectorAll('.story-item:not(.add-story)').forEach(item => {
      item.addEventListener('click', () => {
        const stories = JSON.parse(item.dataset.stories);
        viewStories(stories);
      });
    });
    
    // Discover content (placeholder)
    discoverGrid.innerHTML = `
      <div class="discover-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="discover-card-overlay">
          <div class="discover-card-title">Trending Now</div>
        </div>
      </div>
      <div class="discover-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <div class="discover-card-overlay">
          <div class="discover-card-title">For You</div>
        </div>
      </div>
      <div class="discover-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <div class="discover-card-overlay">
          <div class="discover-card-title">Sports</div>
        </div>
      </div>
      <div class="discover-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <div class="discover-card-overlay">
          <div class="discover-card-title">Entertainment</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load stories:', error);
  }
}

function viewStories(stories) {
  if (stories.length === 0) return;
  
  let currentIndex = 0;
  const storyImage = document.getElementById('story-image');
  const storyUsername = document.getElementById('story-username');
  const storyTime = document.getElementById('story-time');
  const storyProgress = document.getElementById('story-progress');
  
  storyViewer.classList.remove('hidden');
  
  let progressInterval;
  
  function showStory(index) {
    if (index >= stories.length) {
      closeStoryViewer();
      return;
    }
    
    const story = stories[index];
    storyImage.src = story.mediaUrl;
    storyUsername.textContent = story.user?.displayName || story.user?.username || 'User';
    storyTime.textContent = formatTime(new Date(story.createdAt));
    
    // Progress animation
    clearInterval(progressInterval);
    let progress = 0;
    storyProgress.style.width = '0%';
    
    progressInterval = setInterval(() => {
      progress += 2;
      storyProgress.style.width = `${progress}%`;
      
      if (progress >= 100) {
        currentIndex++;
        showStory(currentIndex);
      }
    }, 100);
    
    // Mark as viewed
    api(`/stories/${story.id}/view`, { method: 'POST' });
  }
  
  function closeStoryViewer() {
    clearInterval(progressInterval);
    storyViewer.classList.add('hidden');
    loadStories();
  }
  
  // Navigation
  storyViewer.addEventListener('click', (e) => {
    const rect = storyViewer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < rect.width / 3) {
      if (currentIndex > 0) {
        currentIndex--;
        showStory(currentIndex);
      }
    } else if (x > rect.width * 2 / 3) {
      currentIndex++;
      showStory(currentIndex);
    }
  });
  
  document.getElementById('close-story').addEventListener('click', (e) => {
    e.stopPropagation();
    closeStoryViewer();
  });
  
  showStory(0);
}

// Chat
function openChat(friendId, friendName) {
  currentChatFriend = { id: friendId, name: friendName };
  document.getElementById('chat-friend-name').textContent = friendName;
  chatModal.classList.remove('hidden');
  loadChatMessages(friendId);
}

async function loadChatMessages(friendId) {
  const messagesContainer = document.getElementById('chat-messages');
  
  try {
    const messages = await api(`/chats/${friendId}`);
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <p>No messages yet. Say hi!</p>
        </div>
      `;
      return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => `
      <div class="message ${msg.senderId === currentUser.id ? 'sent' : 'received'}">
        ${msg.message}
      </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    showToast('Failed to load messages');
  }
}

document.getElementById('close-chat').addEventListener('click', () => {
  chatModal.classList.add('hidden');
  currentChatFriend = null;
  loadChats();
});

document.getElementById('send-message-btn').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message || !currentChatFriend) return;
  
  try {
    await api('/chats', {
      method: 'POST',
      body: {
        receiverId: currentChatFriend.id,
        message,
      },
    });
    
    input.value = '';
    loadChatMessages(currentChatFriend.id);
  } catch (error) {
    showToast('Failed to send message');
  }
}

// Profile
document.getElementById('profile-btn').addEventListener('click', () => {
  updateProfile();
  profileModal.classList.remove('hidden');
});

document.getElementById('close-profile').addEventListener('click', () => {
  profileModal.classList.add('hidden');
});

document.getElementById('logout-btn').addEventListener('click', logout);

async function updateProfile() {
  if (!currentUser) return;
  
  document.getElementById('profile-display-name').textContent = currentUser.displayName || currentUser.username;
  document.getElementById('profile-username').textContent = `@${currentUser.username}`;
  
  try {
    const friends = await api('/friends');
    document.getElementById('friends-count').textContent = friends.length;
  } catch {
    document.getElementById('friends-count').textContent = '0';
  }
}

// Add Friends
document.getElementById('add-friend-btn').addEventListener('click', async () => {
  await loadUsersList();
  addFriendModal.classList.remove('hidden');
});

document.getElementById('close-add-friend').addEventListener('click', () => {
  addFriendModal.classList.add('hidden');
});

async function loadUsersList() {
  const usersList = document.getElementById('users-list');
  
  try {
    const [users, friends] = await Promise.all([
      api('/users'),
      api('/friends'),
    ]);
    
    const friendIds = new Set(friends.map(f => f.id));
    const otherUsers = users.filter(u => u.id !== currentUser.id && !friendIds.has(u.id));
    
    if (otherUsers.length === 0) {
      usersList.innerHTML = `
        <div class="empty-state">
          <p>No new users to add</p>
        </div>
      `;
      return;
    }
    
    usersList.innerHTML = otherUsers.map(user => `
      <div class="friend-item" data-id="${user.id}">
        <div class="avatar-small"></div>
        <span class="friend-name">${user.displayName || user.username}</span>
        <button class="btn-primary" style="padding: 8px 16px; font-size: 14px;">Add</button>
      </div>
    `).join('');
    
    usersList.querySelectorAll('.friend-item button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const item = btn.closest('.friend-item');
        const userId = item.dataset.id;
        
        try {
          await api('/friends', {
            method: 'POST',
            body: { friendId: userId },
          });
          
          btn.textContent = 'Added';
          btn.disabled = true;
          btn.style.background = 'var(--surface)';
          showToast('Friend added!');
          updateProfile();
        } catch (error) {
          showToast('Failed to add friend');
        }
      });
    });
  } catch (error) {
    showToast('Failed to load users');
  }
}

// Search filter
document.getElementById('friend-search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#users-list .friend-item');
  
  items.forEach(item => {
    const name = item.querySelector('.friend-name').textContent.toLowerCase();
    item.style.display = name.includes(query) ? 'flex' : 'none';
  });
});

document.getElementById('chat-search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#chats-list .chat-item');
  
  items.forEach(item => {
    const name = item.querySelector('.chat-name').textContent.toLowerCase();
    item.style.display = name.includes(query) ? 'flex' : 'none';
  });
});

// Event Listeners
function setupEventListeners() {
  // Stories shortcut
  document.getElementById('stories-shortcut').addEventListener('click', () => {
    navigateTo('stories');
  });
  
  // Send snap to friend from chat
  document.getElementById('send-snap-to-friend').addEventListener('click', () => {
    chatModal.classList.add('hidden');
    navigateTo('camera');
  });
}

// Utility Functions
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', checkAuth);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCamera();
  } else if (currentUser && currentScreen === 'camera') {
    initCamera();
  }
});
