const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// To hold the conversation history
let conversationHistory = [];

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to UI and history
  appendMessage("user", userMessage);
  conversationHistory.push({ role: "user", text: userMessage });
  input.value = "";

  // Show a temporary "Thinking..." message
  const thinkingMessageElement = appendMessage("bot", "Masih mikir...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from server.");
    }

    const data = await response.json();

    if (data && data.result) {
      // Update the "Thinking..." message with the actual response
      // Gunakan formatMessage untuk merapikan teks (bold, dll)
      thinkingMessageElement.innerHTML = formatMessage(data.result);
      
      // Add bot response to history for context in the next turn
      conversationHistory.push({ role: "model", text: data.result });
    } else {
      thinkingMessageElement.textContent = "Sorry, no response received.";
    }
  } catch (error) {
    console.error("Error:", error);
    thinkingMessageElement.textContent =
      error.message || "Failed to get response from server.";
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  
  // Jika pengirim adalah bot, kita izinkan HTML sederhana untuk formatting
  if (sender === "bot") {
    // Jika text adalah "Gemini is thinking...", jangan diformat dulu
    if (text === "Gemini is thinking...") {
        msg.textContent = text;
        // Opsional: Tambahkan class khusus untuk animasi thinking jika diinginkan
        msg.style.color = "#888"; 
        msg.style.fontStyle = "italic";
    } else {
        msg.innerHTML = formatMessage(text);
        msg.style.color = ""; // Reset style
        msg.style.fontStyle = "";
    }
  } else {
    // Untuk user, selalu gunakan textContent demi keamanan (mencegah XSS)
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  // Return the message element so it can be updated later
  return msg;
}

// Fungsi sederhana untuk mengubah Markdown dasar menjadi HTML
function formatMessage(text) {
  if (!text) return "";

  // 1. Escape HTML characters untuk keamanan dasar
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Headers (### Header -> <h3>Header</h3>)
  // Gemini sering menggunakan ### atau ## untuk judul bagian
  formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');

  // 3. Convert Bold (**text**) menjadi <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 4. Convert Italic (*text*) menjadi <em>text</em>
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Catatan: Karena kita menggunakan CSS 'white-space: pre-wrap', 
  // kita tidak perlu mengubah \n menjadi <br>.

  return formatted;
}
