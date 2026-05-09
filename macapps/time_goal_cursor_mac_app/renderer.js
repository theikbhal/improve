const goalIconEl = document.getElementById('goal-icon');
const goalTextEl = document.getElementById('goal-text');
const thanksCountEl = document.getElementById('thanks-count');
const sorryCountEl = document.getElementById('sorry-count');
const timeTextEl = document.getElementById('time-text');
const trackerContainer = document.getElementById('cursor-tracker');

function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    timeTextEl.innerText = `${hours}:${minutes} ${ampm}`;
}

// Initial Settings Load
const settings = window.electronAPI.getSettings();
goalIconEl.innerText = settings.goalIcon;
goalTextEl.innerText = settings.goalText;
thanksCountEl.innerText = `T:${settings.thanksCount}`;
sorryCountEl.innerText = `S:${settings.sorryCount}`;

// Listen for updates from main process
window.electronAPI.onUpdateCounters((data) => {
    if (data.thanks !== undefined) {
        thanksCountEl.innerText = `T:${data.thanks}`;
        bumpElement(thanksCountEl);
    }
    if (data.sorry !== undefined) {
        sorryCountEl.innerText = `S:${data.sorry}`;
        bumpElement(sorryCountEl);
    }
});

window.electronAPI.onUpdateGoal((newGoal) => {
    goalTextEl.innerText = newGoal;
    bumpElement(goalTextEl);
});

function bumpElement(el) {
    el.classList.remove('update-bump');
    void el.offsetWidth; // Trigger reflow
    el.classList.add('update-bump');
}

// Update time every second
setInterval(updateTime, 1000);
updateTime();
