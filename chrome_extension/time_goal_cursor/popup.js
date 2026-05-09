document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggle-switch');
  const goalIconInput = document.getElementById('goal-icon');
  const goalTextInput = document.getElementById('goal-text');
  const goalNotesInput = document.getElementById('goal-notes');
  const detailedContextInput = document.getElementById('detailed-context');
  const statusMsg = document.getElementById('status-msg');

  const thanksDisplay = document.getElementById('thanks-display');
  const sorryDisplay = document.getElementById('sorry-display');
  const thanksShortcutInput = document.getElementById('thanks-shortcut');
  const sorryShortcutInput = document.getElementById('sorry-shortcut');

  // Visibility Toggles
  const showGoalCheck = document.getElementById('show-goal');
  const showCountersCheck = document.getElementById('show-counters');
  const showThanksCheck = document.getElementById('show-thanks');
  const showSorryCheck = document.getElementById('show-sorry');
  
  let thanksCount = 0;
  let sorryCount = 0;
  let saveTimeout;

  // Load saved state
  chrome.storage.sync.get(['isEnabled', 'goalIcon', 'goalText', 'goalNotes', 'detailedContext', 'thanksCount', 'sorryCount', 'thanksShortcut', 'sorryShortcut', 'showGoal', 'showCounters', 'showThanks', 'showSorry'], (result) => {
    if (result.isEnabled !== undefined) toggleSwitch.checked = result.isEnabled;
    if (result.goalIcon) goalIconInput.value = result.goalIcon;
    if (result.goalText) goalTextInput.value = result.goalText;
    if (result.goalNotes) goalNotesInput.value = result.goalNotes;
    if (result.detailedContext) detailedContextInput.value = result.detailedContext;
    if (result.thanksShortcut) thanksShortcutInput.value = result.thanksShortcut;
    if (result.sorryShortcut) sorryShortcutInput.value = result.sorryShortcut;
    
    // Visibility
    showGoalCheck.checked = result.showGoal !== undefined ? result.showGoal : true;
    showCountersCheck.checked = result.showCounters !== undefined ? result.showCounters : true;
    showThanksCheck.checked = result.showThanks !== undefined ? result.showThanks : true;
    showSorryCheck.checked = result.showSorry !== undefined ? result.showSorry : true;
    
    thanksCount = result.thanksCount || 0;
    sorryCount = result.sorryCount || 0;
    
    updateCounterDisplays();
  });

  function updateCounterDisplays() {
    thanksDisplay.innerText = thanksCount;
    sorryDisplay.innerText = sorryCount;
  }

  function saveDataAndNotify() {
    const data = {
      isEnabled: toggleSwitch.checked,
      goalIcon: goalIconInput.value,
      goalText: goalTextInput.value.toUpperCase().trim(),
      goalNotes: goalNotesInput.value,
      detailedContext: detailedContextInput.value,
      thanksCount: thanksCount,
      sorryCount: sorryCount,
      thanksShortcut: thanksShortcutInput.value.toLowerCase(),
      sorryShortcut: sorryShortcutInput.value.toLowerCase(),
      showGoal: showGoalCheck.checked,
      showCounters: showCountersCheck.checked,
      showThanks: showThanksCheck.checked,
      showSorry: showSorryCheck.checked
    };

    if (goalTextInput.value !== data.goalText) {
      goalTextInput.value = data.goalText;
    }

    chrome.storage.sync.set(data, () => {
      statusMsg.classList.add('show');
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => statusMsg.classList.remove('show'), 2000);

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateData", 
            data: data
          }).catch(err => {});
        });
      });
    });
  }

  // Counter Listeners
  document.getElementById('thanks-plus').addEventListener('click', () => { thanksCount++; updateCounterDisplays(); saveDataAndNotify(); });
  document.getElementById('thanks-minus').addEventListener('click', () => { if(thanksCount > 0) thanksCount--; updateCounterDisplays(); saveDataAndNotify(); });
  document.getElementById('sorry-plus').addEventListener('click', () => { sorryCount++; updateCounterDisplays(); saveDataAndNotify(); });
  document.getElementById('sorry-minus').addEventListener('click', () => { if(sorryCount > 0) sorryCount--; updateCounterDisplays(); saveDataAndNotify(); });

  // Other Listeners
  toggleSwitch.addEventListener('change', saveDataAndNotify);
  goalIconInput.addEventListener('input', saveDataAndNotify);
  goalTextInput.addEventListener('input', saveDataAndNotify);
  goalNotesInput.addEventListener('input', saveDataAndNotify);
  detailedContextInput.addEventListener('input', saveDataAndNotify);
  thanksShortcutInput.addEventListener('input', saveDataAndNotify);
  sorryShortcutInput.addEventListener('input', saveDataAndNotify);
  
  // Toggle Listeners
  showGoalCheck.addEventListener('change', saveDataAndNotify);
  showCountersCheck.addEventListener('change', saveDataAndNotify);
  showThanksCheck.addEventListener('change', saveDataAndNotify);
  showSorryCheck.addEventListener('change', saveDataAndNotify);
});
