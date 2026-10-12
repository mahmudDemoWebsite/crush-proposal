// Add your WhatsApp number here if you want the selected date plan to open a chat with you.
// Use country code without + or spaces, for example: "8801XXXXXXXXX".
const YOUR_WHATSAPP_NUMBER = "";

const proposalScreen = document.querySelector("#proposal-screen");
const dateScreen = document.querySelector("#date-screen");
const confirmedScreen = document.querySelector("#confirmed-screen");
const yesButton = document.querySelector("#yes-button");
const noButton = document.querySelector("#no-button");
const buttonZone = document.querySelector("#button-zone");
const playfulMessage = document.querySelector("#playful-message");
const dateForm = document.querySelector("#date-form");
const dateInput = document.querySelector("#date-input");
const timeInput = document.querySelector("#time-input");
const noteInput = document.querySelector("#little-note");
const sendPlanButton = document.querySelector("#send-plan-button");
const backButton = document.querySelector("#back-button");
const shareMessage = document.querySelector("#share-message");
const toast = document.querySelector("#toast");
let toastTimer;
let noEscapeCount = 0;
let selectedPlan = null;

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDateDefaults() {
  const today = new Date();
  dateInput.min = localDateString(today);
  const suggestedDate = new Date(today);
  suggestedDate.setDate(suggestedDate.getDate() + 3);
  dateInput.value = localDateString(suggestedDate);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

function showScreen(screenToShow) {
  [proposalScreen, dateScreen, confirmedScreen].forEach((screen) => {
    screen.hidden = screen !== screenToShow;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function moveNoButton() {
  if (!buttonZone || noButton.hidden) return;

  noButton.classList.add("is-running");
  noButton.setAttribute("aria-label", "No (try again, this button is escaping)");
  const zoneRect = buttonZone.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();
  const maxX = Math.max(0, zoneRect.width - buttonRect.width - 8);
  const maxY = Math.max(0, buttonZone.clientHeight - buttonRect.height - 8);
  let x = 0;
  let y = 0;
  let safeSpotFound = false;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    x = 4 + Math.random() * Math.max(0, maxX - 4);
    y = 5 + Math.random() * Math.max(0, maxY - 5);
    const candidate = {
      left: zoneRect.left + x,
      right: zoneRect.left + x + buttonRect.width,
      top: zoneRect.top + y,
      bottom: zoneRect.top + y + buttonRect.height,
    };
    const overlapsYes = !(
      candidate.right < yesRect.left - 9 ||
      candidate.left > yesRect.right + 9 ||
      candidate.bottom < yesRect.top - 9 ||
      candidate.top > yesRect.bottom + 9
    );
    if (!overlapsYes) {
      safeSpotFound = true;
      break;
    }
  }

  // On very small screens, staying inside the play area matters more than avoiding every overlap.
  if (!safeSpotFound) {
    x = Math.max(4, Math.min(maxX, zoneRect.width - buttonRect.width - 4));
    y = maxY > 4 ? maxY : 4;
  }

  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noEscapeCount += 1;
  const messages = [
    "Oops! That button is a little shy. Try the pink one. 💗",
    "Hehe, too slow! Maybe 'Yes' is the one? 🙈",
    "The universe keeps pointing at YES. ✨",
    "That 'No' has places to be. The pink button is waiting! 💌",
    "Plot twist: the 'No' button is on vacation. 😂",
  ];
  playfulMessage.textContent = messages[(noEscapeCount - 1) % messages.length];
}

function escapeNo(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  moveNoButton();
}

function handleYes() {
  setDateDefaults();
  showScreen(dateScreen);
}

function getSelectedActivity() {
  return dateForm.querySelector('input[name="activity"]:checked')?.value || "Coffee & conversations ☕";
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function makePlanMessage() {
  if (!selectedPlan) return "";
  const lines = [
    "💌 OUR LITTLE DATE PLAN 💌",
    "",
    `📅 Day: ${selectedPlan.dateLabel}`,
    `🕰️ Time: ${selectedPlan.time}`,
    `✨ Date idea: ${selectedPlan.activity}`,
  ];
  if (selectedPlan.note) lines.push(`💭 Little note: ${selectedPlan.note}`);
  lines.push("", "Made with a little courage and a lot of heart. 💗");
  return lines.join("\n");
}

function confirmPlan(event) {
  event.preventDefault();
  if (!dateForm.reportValidity()) return;

  selectedPlan = {
    dateValue: dateInput.value,
    dateLabel: formatDate(dateInput.value),
    time: timeInput.value,
    activity: getSelectedActivity(),
    note: noteInput.value.trim(),
  };

  document.querySelector("#summary-date").textContent = selectedPlan.dateLabel;
  document.querySelector("#summary-time").textContent = selectedPlan.time;
  document.querySelector("#summary-activity").textContent = selectedPlan.activity;
  const summaryNote = document.querySelector("#summary-note");
  if (selectedPlan.note) {
    summaryNote.textContent = `A little note: “${selectedPlan.note}”`;
    summaryNote.hidden = false;
  } else {
    summaryNote.textContent = "";
    summaryNote.hidden = true;
  }
  shareMessage.textContent = "";
  showScreen(confirmedScreen);
  sprinkleHearts(14);
}

async function sendPlan() {
  const message = makePlanMessage();
  if (!message) return;

  if (YOUR_WHATSAPP_NUMBER.trim()) {
    const number = YOUR_WHATSAPP_NUMBER.replace(/\D/g, "");
    if (!number) {
      showToast("Check the WhatsApp number in script.js and try again.");
      return;
    }
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    shareMessage.textContent = "Your date plan is ready in WhatsApp. Just tap send. 💗";
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: "Our little date plan 💌", text: message });
      shareMessage.textContent = "Date plan shared. Here's to your little moment! 💗";
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(message);
    shareMessage.textContent = "Date plan copied! Paste it into a message to share. 💌";
    showToast("Your date plan has been copied to the clipboard.");
  } catch {
    shareMessage.textContent = "Copy your date details from the summary above and send them in a message. 💌";
  }
}

function sprinkleHearts(amount = 8) {
  const layer = document.querySelector("#heart-layer");
  for (let index = 0; index < amount; index += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = Math.random() > 0.45 ? "♥" : "♡";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${12 + Math.random() * 18}px`;
    heart.style.animationDuration = `${4 + Math.random() * 4}s`;
    heart.style.animationDelay = `${Math.random() * 1.2}s`;
    layer.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
  }
}

function startAmbientHearts() {
  sprinkleHearts(9);
  window.setInterval(() => {
    if (document.hidden) return;
    sprinkleHearts(2);
  }, 2400);
}

yesButton.addEventListener("click", handleYes);
noButton.addEventListener("pointerenter", (event) => {
  if (event.pointerType !== "touch") moveNoButton();
});
noButton.addEventListener("touchstart", escapeNo, { passive: false });
noButton.addEventListener("click", escapeNo);
noButton.addEventListener("focus", moveNoButton);
dateForm.addEventListener("submit", confirmPlan);
sendPlanButton.addEventListener("click", sendPlan);
backButton.addEventListener("click", () => {
  showScreen(dateScreen);
});

setDateDefaults();
startAmbientHearts();
