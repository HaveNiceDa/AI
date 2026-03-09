const chatContainer = document.getElementById("chatContainer");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const loading = document.getElementById("loading");

const sessionId = "user_001";
let messages = [];

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

async function loadHistory() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/history?sessionId=${sessionId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to load history");
    }

    const data = await response.json();
    messages = data.messages || [];

    if (messages.length === 0) {
      messages = [{ role: "assistant", content: "你好，有什么可以帮助你？" }];
    }

    renderMessages();
  } catch (error) {
    console.error("Error loading history:", error);
    messages = [{ role: "assistant", content: "你好，有什么可以帮助你？" }];
    renderMessages();
  }
}

function renderMessages() {
  chatContainer.innerHTML = "";
  messages.forEach((msg) => {
    addMessageToUI(msg.role, msg.content);
  });
  scrollToBottom();
}

async function sendMessage() {
  const input = chatInput.value.trim();
  if (!input) return;

  messages.push({ role: "user", content: input });
  addMessageToUI("user", input);
  chatInput.value = "";

  loading.classList.remove("hidden");

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: input,
        sessionId: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponse = "";

    const assistantMessageElement = addMessageToUI("assistant", "");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      aiResponse += chunk;
      assistantMessageElement.textContent = aiResponse;
      scrollToBottom();
    }

    messages.push({ role: "assistant", content: aiResponse });
  } catch (error) {
    addMessageToUI("assistant", "抱歉，我遇到了一些问题，请稍后再试。");
  } finally {
    loading.classList.add("hidden");
  }
}

function addMessageToUI(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);

  scrollToBottom();

  return contentDiv;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

loadHistory();
