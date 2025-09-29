const AGENT_ID = "agent_1401k6b4mb4ffeer00bhywzyzbf4";
const ELEVEN_API_KEY = "sk_49ee18cb979d5e4bb21016743b831736b721cd245bb155c7"; // tylko na hackathon

const logBox = document.getElementById("log");
let conversation;

function log(msg) {
  logBox.textContent += "\n" + msg;
  logBox.scrollTop = logBox.scrollHeight;
}

async function startConversation() {
  try {
    log("Łączenie z agentem...");

    conversation = await window.ElevenLabs.Conversation.startSession({
      agentId: AGENT_ID,
      apiKey: ELEVEN_API_KEY,
      connectionType: "websocket",
      onTranscription: (msg) => log("TY: " + msg.text),
      onResponse: (msg) => log("AGENT: " + msg.text),
      onAudio: (audioBuffer) => {
        // SDK samo odtwarza audio
      }
    });

    await conversation.startMicrophone();
    log("Połączono! Zacznij mówić 🚀");

  } catch (e) {
    log("Błąd połączenia: " + e.message);
  }
}

async function uploadPDF() {
  const fileInput = document.getElementById("pdfInput");
  if (!fileInput.files.length) return alert("Wybierz PDF");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const res = await fetch(`https://api.elevenlabs.io/v1/agents/${AGENT_ID}/knowledge-base`, {
    method: "POST",
    headers: { "xi-api-key": ELEVEN_API_KEY },
    body: formData
  });
  const data = await res.json();
  log("PDF uploaded: " + JSON.stringify(data));
}
