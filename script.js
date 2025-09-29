const AGENT_ID = "agent_1401k6b4mb4ffeer00bhywzyzbf4";
const ELEVEN_API_KEY = "sk_49ee18cb979d5e4bb21016743b831736b721cd245bb155c7"; // tylko na hackathon

const logBox = document.getElementById("log");
let ws;
let audioCtx;

function log(msg) {
  logBox.textContent += "\n" + msg;
  logBox.scrollTop = logBox.scrollHeight;
}

async function getSessionToken() {
  const res = await fetch(`https://api.elevenlabs.io/v1/agents/${AGENT_ID}/session`, {
    method: "POST",
    headers: { "xi-api-key": ELEVEN_API_KEY }
  });
  const data = await res.json();
  if (!data.client_secret) {
    log("Błąd pobierania sesji: " + JSON.stringify(data));
    throw new Error("Brak tokenu sesji");
  }
  return data.client_secret;
}

async function startAgent() {
  try {
    log("Łączenie z agentem...");
    const token = await getSessionToken();
    ws = new WebSocket(`wss://api.elevenlabs.io/v1/agents/${AGENT_ID}/stream?client_secret=${token}`);
    ws.binaryType = "arraybuffer";

    ws.onopen = async () => {
      log("Połączono! Mów, aby rozpocząć rozmowę.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          e.data.arrayBuffer().then(buf => ws.send(buf));
        }
      };
      mediaRecorder.start(250);
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") {
        playAudio(event.data);
      } else {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcription") log("TY: " + msg.text);
        if (msg.type === "response") log("AGENT: " + msg.text);
      }
    };

    ws.onclose = () => log("Rozłączono.");
  } catch (e) {
    log("Błąd połączenia: " + e.message);
  }
}

async function playAudio(buffer) {
  if (!audioCtx) audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));
  const src = audioCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(audioCtx.destination);
  src.start();
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
