import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp0lscjzry-ORW_dnv65c3v7Hn4v1KuiA",
  authDomain: "building-an-ai-journal.firebaseapp.com",
  projectId: "building-an-ai-journal",
  storageBucket: "building-an-ai-journal.firebasestorage.app",
  messagingSenderId: "454341145120",
  appId: "1:454341145120:web:0ed0782c18231091960245",
  measurementId: "G-3L4GR8JQQ3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const landingView = document.getElementById('landing-view');
const dashboardView = document.getElementById('dashboard-view');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const exportBtn = document.getElementById('export-btn');
const userNameDisplay = document.getElementById('user-name');
const journalForm = document.getElementById('journal-form');
const journalInput = document.getElementById('journal-input');
const chatHistory = document.getElementById('chat-history');
const entriesList = document.getElementById('entries-list');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const moodBtns = document.querySelectorAll('.mood-btn');

let currentUser = null;
let conversationState = [];
let selectedMood = '😊 Happy';

// 1. Mood Selector Logic
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMood = btn.dataset.mood;
  });
});

// 2. Feature: Voice Notes / Speech-to-Text
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    if (micBtn.classList.contains('recording')) {
      recognition.stop();
    } else {
      recognition.start();
      micBtn.classList.add('recording');
      micBtn.textContent = '🔴 Listening...';
    }
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    journalInput.value += (journalInput.value ? ' ' : '') + transcript;
  };

  recognition.onend = () => {
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎤';
  };
} else {
  micBtn.style.display = 'none'; // Hide if browser doesn't support SpeechRecognition
}

// 3. Feature: PDF Export / Print
exportBtn.addEventListener('click', () => {
  window.print();
});

// Auth Listeners
loginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    console.error("Login failed:", err);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userNameDisplay.textContent = user.displayName || user.email || 'User';
    landingView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loadUserHistory(user.uid);
  } else {
    landingView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    chatHistory.innerHTML = '';
    entriesList.innerHTML = '';
    conversationState = [];
  }
});

// Stream past journal entries
function loadUserHistory(uid) {
  try {
    const userEntriesRef = collection(db, 'users', uid, 'journal_entries');
    const q = query(userEntriesRef, orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
      entriesList.innerHTML = '';
      snapshot.forEach((doc) => {
        const entry = doc.data();
        const li = document.createElement('li');
        li.className = 'entry-item';
        
        const date = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : 'Just now';
        const moodBadge = entry.mood ? `<span class="mood-tag">${entry.mood}</span>` : '';
        
        li.innerHTML = `
          <div class="entry-header">
            <strong>${escapeHtml(entry.title || 'Journal Entry')}</strong>
            ${moodBadge}
          </div>
          <small>${date}</small>
          <p>${escapeHtml(entry.userPrompt)}</p>
          <div class="ai-box"><em>Gemini:</em> ${escapeHtml(entry.aiResponse)}</div>
        `;
        entriesList.appendChild(li);
      });
    });
  } catch (e) {
    console.warn("Firestore history setup notice:", e.message);
  }
}

// Form Submission
journalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const promptText = journalInput.value.trim();
  if (!promptText || !currentUser) return;

  appendChatMessage('user', `[Mood: ${selectedMood}] ${promptText}`);
  journalInput.value = '';
  sendBtn.disabled = true;

  let aiReply = "";
  let title = "Journal Reflection";

  try {
    const idToken = await currentUser.getIdToken();

    const response = await fetch('/api/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        message: promptText,
        mood: selectedMood,
        conversationHistory: conversationState
      })
    });

    if (!response.ok) throw new Error('API Request Failed');

    const data = await response.json();
    aiReply = data.reply;
    title = data.title || "Journal Reflection";

    appendChatMessage('model', aiReply);

    conversationState.push({ role: 'user', text: promptText });
    conversationState.push({ role: 'model', text: aiReply });

  } catch (err) {
    console.error('Gemini API Error:', err);
    appendChatMessage('model', 'Sorry, I encountered an error communicating with Gemini. Please try again.');
    sendBtn.disabled = false;
    return;
  }

  // Save entry to Firestore
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'journal_entries'), {
      title: title,
      mood: selectedMood,
      userPrompt: promptText,
      aiResponse: aiReply,
      createdAt: serverTimestamp()
    });
  } catch (fsErr) {
    console.warn('Firestore Save Warning:', fsErr.message);
  } finally {
    sendBtn.disabled = false;
  }
});

function appendChatMessage(role, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${role}`;
  msgDiv.textContent = text;
  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}