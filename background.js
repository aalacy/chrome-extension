let status, message

function uploadToServer(exts, info) {
  fetch('https://urinotsecure.revampcybersecurity.com/api/admin/ext/save', {
  // fetch('http://localhost:5000/api/admin/ext/save', {
      credentials: 'same-origin', // <-- includes cookies in the request
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ exts, info })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data)
    status = data.status
    message = data.message
  })
  .catch(error => {
    console.log(error);
  })
  .finally(() => {
     // save the token inside the storage for the popup to structure the view
    chrome.storage.sync.set({ status, message, loading:false }, function() {
      chrome.runtime.sendMessage({ loading:false });
      if (status == 'success') {
        chrome.runtime.sendMessage({ getToken: true });
      }
    })
  });
}

function getAuthToken() {
  chrome.storage.sync.set({ loading: true }, function() {  
    chrome.identity.getAuthToken({ 'interactive': true }, function(_token) {
      if (chrome.runtime.lastError) {
          alert(chrome.runtime.lastError.message);
          return;
      }

      // Save the list of the extensions with auth information
      fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + _token)
        .then(response => response.json())
        .then(info => {

          chrome.storage.sync.set({ info }, function() {
          })
          chrome.management.getAll(function(exts) {
            uploadToServer(exts, info)
          })
        })
        .catch(error => {
          console.log(error);
        });
    });
  });
}

function regularUpdate() {
  console.log('update from alarm')
  chrome.storage.sync.set({ loading: true }, function() {  
    chrome.storage.sync.get(['info'], function(result) {
      chrome.management.getAll(function(exts) {
        uploadToServer(exts, result.info)
      })
    })
  })
}

function createAlarm(name, interval) {
  chrome.alarms.create(name, { periodInMinutes: interval });
}

function clearAlarm(name) {
  chrome.alarms.clear(name);
}

function showNotification(storedData) {
  chrome.notifications.create('', {
      type: 'basic',
      iconUrl: 'assets/img/icons/icon128.png',
      title: 'Don\'t forget!',
      message: "You didn't properly authenticate for the Extension Guard. Wake up, dude!"
   }, function(notificationId) {});
}

// right after installed the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled....');
  
  getAuthToken()

  clearAlarm('reminder')
  clearAlarm('checker')

  createAlarm('reminder', 60*24)
  createAlarm('checker', 60)
});

// Get the message from popup.js to trigger the authentication
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  if(message.authToken) { 
    getAuthToken()
  }
});

// set the alarm
chrome.alarms.onAlarm.addListener(function( alarm ) {
  console.log(alarm.name); // reminder
  // check if the user already authenticate
  if (alarm.name == 'reminder') {
    chrome.storage.sync.get(['info'], function(result) {
      if (!result.info.email) {
        showNotification()
      } else {
        clearAlarm()
      }
    });
  } else if (alarm.name == 'checker') {
    regularUpdate()
  }
});

// triggered when the notification clicked
chrome.notifications.onClicked.addListener(function() {
  getAuthToken();
});

