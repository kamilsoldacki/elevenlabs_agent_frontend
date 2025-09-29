const AGENT_ID = "WSTAW_TUTAJ_SWÓJ_AGENT_ID";
const ELEVEN_API_KEY = "WSTAW_TUTAJ_SWÓJ_ELEVENLABS_API_KEY"; // tylko na hackathon

const logBox = document.getElementById("log");
let ws;
let audioCtx;
let source;

function log(msg) {
  logBox.textContent += "\n" + msg;
  logBox.scrollTop = logBox.scrollHeight;
}

async function startAgent() {
  if (ws) ws.close();
  log("Łączenie z agentem...");
  ws = new WebSocket(`wss://api.elevenlabs.io/v1/agents/${AGENT_ID}/stream?xi-api-key=${ELEVEN_API_KEY}`);

  ws.binaryType = "arraybuffer";

  ws.onopen = async () => {
    log("Połączono! Rozpoczynamy rozmowę...");
    // uzyskanie mikrofonu
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
