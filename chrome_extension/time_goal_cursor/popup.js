document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggle-switch');
  const goalIconInput = document.getElementById('goal-icon');
  const goalTextInput = document.getElementById('goal-text');
  const goalNotesInput = document.getElementById('goal-notes');
  const statusMsg = document.getElementById('status-msg');
  
  let saveTimeout;

  // Load saved state
  chrome.storage.sync.get(['isEnabled', 'goalIcon', 'goalText', 'goalNotes'], (result) => {
    if (result.isEnabled !== undefined) toggleSwitch.checked = result.isEnabled;
    if (result.goalIcon) goalIconInput.value = result.goalIcon;
    if (result.goalText) goalTextInput.value = result.goalText;
    if (result.goalNotes) goalNotesInput.value = result.goalNotes;
  });

  function saveDataAndNotify() {
    const data = {
      isEnabled: toggleSwitch.checked,
      goalIcon: goalIconInput.value,
      goalText: goalTextInput.value.toUpperCase().trim(),
      goalNotes: goalNotesInput.value
    };

    // Update UI instantly if they typed lowercase
    if (goalTextInput.value !== data.goalText) {
      goalTextInput.value = data.goalText;
    }

    chrome.storage.sync.set(data, () => {
      // Show saved message
      statusMsg.classList.add('show');
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => statusMsg.classList.remove('show'), 2000);

      // Notify active tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateData", 
            data: data
          }).catch(err => {}); // Ignore errors for tabs without content scripts
        });
      });
    });
  }

  // Listeners
  toggleSwitch.addEventListener('change', saveDataAndNotify);
  goalIconInput.addEventListener('input', saveDataAndNotify);
  goalTextInput.addEventListener('input', saveDataAndNotify);
  goalNotesInput.addEventListener('input', saveDataAndNotify);
});
