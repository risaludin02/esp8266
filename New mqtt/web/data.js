// ===============================
// MQTT CONFIG
// ===============================
//const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
const brokerUrl = "wss://broker.emqx.io:8084/mqtt";
const cid = "web-" + Math.random().toString(16).substr(2, 8);
document.getElementById("cid").textContent = cid;

const client = mqtt.connect(brokerUrl, {
  clientId: cid,
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 4000
});

// ===============================
// ELEMENT
// ===============================
const statusEl = document.getElementById("status");
const teleEl   = document.getElementById("tele");

const plnEl = document.getElementById("plnStatus");
const dcEl  = document.getElementById("dcStatus");
const chEl  = document.getElementById("chStatus");
const veEl  = document.getElementById("veVolt");

const vAEl = document.getElementById("voltA");
const vBEl = document.getElementById("voltB");
const vCEl = document.getElementById("voltC");
const vDEl = document.getElementById("voltD");
const vEEl = document.getElementById("voltE");

// ===============================
// MQTT CONNECT EVENTS
// ===============================
client.on("connect", () => {
  statusEl.textContent = "connected";
  statusEl.style.color = "green";

  // Subscribe sesuai ESP8266
  client.subscribe("risal_esp8266/tele/#");
  client.subscribe("risal_esp8266/ack/#");
});

client.on("reconnect", () => {
  statusEl.textContent = "reconnecting...";
  statusEl.style.color = "orange";
});

client.on("close", () => {
  statusEl.textContent = "disconnected";
  statusEl.style.color = "red";
});

client.on("error", (err) => {
  console.error("MQTT Error:", err);
  statusEl.textContent = "error";
  statusEl.style.color = "red";
});

// ===============================
// RECEIVE MESSAGE
// ===============================
client.on("message", (topic, payload) => {

  const msg = payload.toString();
  const time = new Date().toLocaleTimeString();

  teleEl.innerHTML =
    `<div>[${time}] ${topic} → ${msg}</div>` +
    teleEl.innerHTML;

  // ===========================
  // STATUS PLN
  // ===========================
  if (topic === "risal_esp8266/tele/PLN") {
    if (msg === "1") {
      plnEl.textContent = "PLN: ON";
      plnEl.style.color = "green";
    } else {
      plnEl.textContent = "PLN: OFF";
      plnEl.style.color = "red";
    }
  }

  // ===========================
  // DISCHARGE
  // ===========================
  if (topic === "risal_esp8266/tele/DC") {
    dcEl.textContent = "DISCHARGE: " + msg;
    dcEl.style.color = msg !== "0" ? "green" : "#555";
  }

  // ===========================
  // CHARGER
  // ===========================
  if (topic === "risal_esp8266/tele/CH") {
    chEl.textContent = "CHARGER: " + msg;
    chEl.style.color = msg !== "0" ? "blue" : "#555";
  }

  // ===========================
  // VOLTASE (sesuai firmware ESP)
  // ===========================
  if (topic === "risal_esp8266/tele/V0")
    updateVolt(vAEl, "V0", msg);

  if (topic === "risal_esp8266/tele/V1")
    updateVolt(vBEl, "V1", msg);

  if (topic === "risal_esp8266/tele/V2")
    updateVolt(vCEl, "VBAT", msg);

  if (topic === "risal_esp8266/tele/V6") {
    updateVolt(vEEl, "PV", msg);
    veEl.textContent =
      "PV: " + parseFloat(msg).toFixed(2) + " V";
  }
});

// ===============================
// VOLT COLOR FUNCTION
// ===============================
function updateVolt(el, label, val) {
  const v = parseFloat(val);

  if (isNaN(v)) return;

  el.textContent = `${label}: ${v.toFixed(2)} V`;

  if (v >= 12.5)
    el.style.color = "green";
  else if (v >= 11.8)
    el.style.color = "orange";
  else
    el.style.color = "red";
}

// ===============================
// PUBLISH COMMAND
// ===============================
function publishCmd(sub, payload) {
  client.publish(
    "risal_esp8266/cmd/" + sub,
    payload.toString()
  );
}

// ===============================
// BUTTON CONTROL
// ===============================
document.getElementById("pb1")
  .addEventListener("click", () =>
    publishCmd("V5", "1")
  );

document.getElementById("pb1")
  .addEventListener("click", () =>
    publishCmd("V5", "0")
  );

document.getElementById("pb3")
  .addEventListener("click", () =>
    publishCmd("V7", "1")
  );

document.getElementById("pb2")
  .addEventListener("click", () =>
    publishCmd("V6", "1")
  );

document.getElementById("pb4")
  .addEventListener("click", () =>
  publishCmd("V8", "1")
  );