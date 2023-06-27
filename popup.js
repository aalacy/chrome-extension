// Arrange the popup based on the status whether got the token or not
function checkToken(callback) {
	chrome.storage.sync.get(['info'], function(result) {
	  if (result.info) {
	  	manageLoading(false)
	  	$('#btn-auth').hide()
	  	$('#btn-dashboard').show()
	  } else {
	  	$('#btn-auth').show()
	  	$('#btn-dashboard').hide()
	  }
	});
}

function manageLoading(loading) {
	console.log('loading ', loading)
	if (loading) {
		$('.spinner-border').show()
		$('.buttons').hide()
	} else {
		$('.spinner-border').hide()
		$('.buttons').show()
	}
}

// Received the message from the background.js after successfully got the token
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  if (message.getToken) { 
    console.log('get the token')
    checkToken()
  } 
  if (message.loading != undefined) {
	 manageLoading(message.loading)
  }

});

manageLoading(true)

checkToken()

$(function() {
	// navigate to the user dashboard for the extensions
	$('#btn-dashboard').click(function() {
		chrome.storage.sync.get(['info'], function(result) {
			chrome.tabs.create({url: `http://secure-dashboard.revampcybersecurity.com/pages/extension/${result.info.email}`});
		})
	})

	// allow user to authenticate google account.
	$('#btn-auth').click(function() {
		chrome.runtime.sendMessage({ authToken: true });
	})
})

