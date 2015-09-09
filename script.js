//=========CONTENT SCRIPT============//

//Labels of game
var labels = {
	checkBalance : ["Verificar balanço bancário", "Check bank status"],	
	transferMoney: ["Transferir dinheiro", "Transfer money"]
}

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

//This stores the delay count
var counterDelay = 0;
var delay;
var DEFAULT_DELAY = 10;
var panel, globalAux;

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

//It listens for messages comming from background script
chrome.runtime.onMessage.addListener(
 	function(request, sender, sendResponse) {
    	sendResponse({backMessage: "Ok. Request data received by content script"});
   		handleRequest(request);	
   	}
);

//It sends a message to the background script
function sendRequest(request){
	chrome.runtime.sendMessage({message: request}, function(response) {console.log(response.backMessage);});
};

//It handles messages comming from background script
function handleRequest(request){
	showRequest(request.message);
	switch(request.message.act){
		case defaultAct.getRequestData:
			//code
			break;
		case defaultAct.setRequestData:
			//console.log("SetRequestData from background script>>> Act: ", request.message.act + " stepId: " + request.message.stepId);
			if (request.message.stepId != null){
				if ((request.message.job == defaultJob.checkBalance) ||
					(request.message.job == defaultJob.transferMoney)){
					executeMissionStep(request.message);	
				} else 
				if (request.message.job == defaultJob.campingBankLogs){
					executeCampingStep(request.message);
				} else 
				if (request.message.job == defaultJob.installSoftware){
					executeInstallSoftware(request.message);
				} else
				if (request.message.job == defaultJob.wait){
					//Do nothing, just wait
				}
				
			}
			break;

		default : break;
	}
};

//#################################################################
//#################################################################
//#################################################################

//It sends the next step description to the background script
function setNextStep(request, stepId){
	request.act = defaultAct.setRequestData;
	request.stepId = stepId;
	sendRequest(request);
};

//It resets the requestData structure
function resetRequestDada(request){
	request.act = null;
	request.stepId = null;
	request.url = null;
	request.ip = [];
	request.account = [];
	request.amount = null;
	//request.language = null;
	//request.job = null;
	return request;
};

//Show request content
function showRequest(request){
	var data = request;
	console.log("Request>>> ACTION:" + 
				(data.act == defaultAct.getRequestData ? "getRequestData" : "setRequestData") + 
				" STEPID: " + data.stepId + 
				" URL: " + data.url +
				" IPS: " + data.ip[0] + " " + data.ip[1] +
				" ACCOUNTS: " + data.account[0] + " " + data.account[1] +
				" AMOUNT: " + data.amount);
};

//It searches for all elements with the specified tagName, then filter those elements that have the specified attribName valued as attribValue.
//Next it gets one element from specified position on the elements array and returns it 
function getSomeElement(tagName, attribName, attribValue, position){
	if (tagName != null){
		element = document.getElementsByTagName(tagName);	
	} else {
		element = document.getElementsByTagName("*");
	}	
	resultElements = [];
	var count;
	if (attribName != null){
		for(count = 0; count <= element.length - 1; count++){
			if (element[count].getAttribute(attribName) == attribValue){
				resultElements.push(element[count]);
			}
		}	
	} else {
		resultElements = element;
	};
	if (resultElements.length > 0){
		try{
			resultElements[position].style.fontSize = "15px";
			resultElements[position].style.color = "red";
		} catch(error){
			console.log(error.message);
		}
		return resultElements[position];	
	} else {
		return null;
	}		
}

//It try to get some mission, if is avaiable, and accept it
function getSomeMission(request){
	//Get the URL mission
	var element = document.getElementsByTagName("a");
	var countFound = 0;
	var url;
	var urlIsObtained = false;
	for(count = 0; count <= element.length - 1; count++){
		aux = element[count];
		url = aux.href;
		aux = aux.childNodes[0];
		aux = aux.nodeValue;
		if (aux != null){
			if (request.job == defaultJob.checkBalance){
				if (aux.search(labels.checkBalance[request.language]) >= 0){
					countFound++;
					//url = url.split("?")[1];
					request.url = url;
					console.log(request.url);
					urlIsObtained = true;
					break;		
				}
			} else 
			if (request.job == defaultJob.transferMoney){
				if (aux.search(labels.transferMoney[request.language]) >= 0){
					countFound++;
					//url = url.split("?")[1];
					request.url = url;
					console.log(request.url);
					urlIsObtained = true;
					break;		
				}
			}
				
		}
	}
	return request;
};

//This analyses the url and defines the language
function defineLanguage(request){
	switch(window.location.href.split("/")[2].split(".")[0]){
		case "br":
			request.language = 0;
			break;
		case "en":
			request.language = 1;
			break;

		default: break;
	}
	request.act = defaultAct.setRequestData;
	sendRequest(request);
}

//It gets all information about current mission
function getMissionInformation(request){
	//Get the mission IPs
	var element = document.getElementsByClassName("black");
	var aux;
	var countFound = 0;

	request.ip[0] = getSomeElement("a", "class", "small", 0).childNodes[0].nodeValue;
	try{
		request.ip[1] = getSomeElement("a", "class", "small", 1).childNodes[0].nodeValue;
	}catch(error){
		console.log(error.message);
	}

	//Get the mission accounts
	element = document.getElementsByTagName("td");
	countFound = 0;
	for(count = 0; count <= element.length - 1; count++){
		aux = element[count];
		aux = aux.childNodes[0];
		aux = aux.nodeValue;
		if (aux != null){
			if (aux.search("#") >= 0){
				aux = aux.substr(1, aux.length - 1);
				request.account[countFound] = aux;
				console.log(countFound + "::" + request.account[countFound]);
				countFound++;		
			}	
		}
	}
	return request;	
};

//This function goes to the page especified by path
function goToPage(path){
	var currentUrl = window.location.href;
	newUrl = currentUrl.split("/");
	newUrl = newUrl[0] + "//" + newUrl[2] + path;
	window.location.href = newUrl;
}

//It analyzes the logs data and extracts accounts in order to invade them
//It analyzes the logs data and extracts accounts in order to invade them
function extractDataFromLogs(request, logs){
	var piece = logs.split(" to ");
	var count, count2 = 0;
	var positionFlag = 0;
	var thereIsAlready;
	var accountFound;
	for(count = 0; count <= piece.length - 1; count++){
		if (piece[count].search("#") == 0){
			positionFlag = piece[count].search(" ");
			if (piece[count].search(" at localhost") == positionFlag){
				accountFound = piece[count].substr(1, positionFlag - 1);
				thereIsAlready = false;
				for (count2 = 0; count2 <= request.account.length - 1; count2++){
					if (request.account[count2] == accountFound){
						thereIsAlready = true;
						break;
					}
				}
				if (accountFound == request.myAccount){
					thereIsAlready = true;
				}
				if (thereIsAlready == false){
					request.account.push(accountFound);
					console.log(accountFound);
				}
			}	
		}
	}
	return request;
};

//It gets the id of any software
function getSoftwareId(name, version){
	var elements = document.getElementsByTagName("tbody")[0].getElementsByTagName("*");
	var count, textNodeValue;
	var itemIsFound = false;
	var foundId = null;

	for (count = 0; count <= elements.length - 1; count++){
		if (elements[count].childNodes[0] != undefined){
			if (elements[count].childNodes[0].nodeValue != null){
				if (elements[count].childNodes[0].nodeValue.search(name.trim()) >= 0){					
					switch(elements[count].tagName){
						case "A":
							itemIsFound = true;
							break;
						case "TD":
							try{
								switch(elements[count].nextElementSibling.childNodes[1].childNodes[0].tagName){
									case undefined:
										if (elements[count].nextElementSibling.childNodes[1].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									case "B":
										if (elements[count].nextElementSibling.childNodes[1].childNodes[0].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									case "I":
										if (elements[count].nextElementSibling.childNodes[1].childNodes[0].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									default: break;
								}
							}catch(error){console.log(error.message)}
							break;
						case "B":
							try{
								switch(elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].tagName){
									case undefined:
										if (elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									case "B":
										if (elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									default: break;
								}
							}catch(error){console.log(error.message)}
							break;
						case "I":
							try{
								switch(elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].tagName){
									case undefined:
										if (elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									case "B":
										if (elements[count].parentElement.nextElementSibling.childNodes[1].childNodes[0].childNodes[0].nodeValue.search(version.trim()) >= 0){
											itemIsFound = true;
										}
										break;
									default: break;
								}
							}catch(error){console.log(error.message)}
							break;
						default: break;
					}
				};
			}
		}
		if (itemIsFound == true){
			foundId = elements[count].parentElement.tagName;
			switch(elements[count].tagName){
				case "B":
					foundId = elements[count].parentElement.parentElement.getAttribute("id");
					break;
				case "TD":
					foundId = elements[count].parentElement.getAttribute("id");
					break;
				case "I":
					foundId = elements[count].parentElement.parentElement.getAttribute("id");
					break;
				case "A":
					foundId = elements[count].parentElement.parentElement.getAttribute("id");
				default: break;
			}
			break;
		}
	}
	return foundId;
}


//This function implements the install software algorithm 
function executeInstallSoftware(request){
	var softwareId;
	switch(request.stepId){
		case "checkSoftware":
			if (getSoftwareId(request.software.split(",")[0],request.software.split(",")[1]) != null){
				setNextStep(request, "fillIPOnInternetPage");
				goToPage("/internet");	
			} else {
				window.alert("There is no any software like the specified :( >" + request.software.split(",")[0] + "::" + request.software.split(",")[1] + "<");
				setNextStep(request, "finishAll");
				location.reload(true)
			}
			break;
		case "fillIPOnInternetPage":
			if (request.ip.length > 0){

				if (getSomeElement("a", "href", "?view=logout", 0) == null){
					getSomeElement("input", "class", "browser-bar", 0).value = request.ip.pop(); //Fill IP Adress bar
					setNextStep(request, "goToServerTab");
					getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
		 		} else {
		 			setNextStep(request, "fillIPOnInternetPage");
		 			getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
		 		}
		 	} else {
		 		window.alert("There is no a ip avaiable");
		 	}
			break;
		case "goToServerTab":
		if ((getSomeElement("div", "class", "alert alert-error", 0) == null) &&
			(getSomeElement("a", "href", "?action=login", 0) != null)){
				setNextStep(request, "signInKnownServer");
		 		getSomeElement("a", "href",	"?action=login", 0).click(); //Click on the server login tab
		 	} else {
		 		if (request.ip.length >= 1){
		 			if (request.ip.length == 0){
		 				setNextStep(request, "finishSoftwareInstall");
		 			} else {
		 				setNextStep(request, "fillIPOnInternetPage");
		 				goToPage("/internet");
		 			}
		 		} else {
		 			//abort
		 		}
		 	}
			break;
		case "signInKnownServer":
			if (getSomeElement("strong", null, null, 1) != null){//Check if the password is avaiable 
		 		setNextStep(request, "removeMyClues");
		 		aux = getSomeElement("span", "class", "small pull-left", 0).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "name", "user", 0).value = aux; //Fill the user field with the user on screen
		 		aux = getSomeElement("span", "class", "small pull-left", 1).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "type", "password", 0).value = aux; //Fill the password field with the password on screen
		 		getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button
		 	} else {
		 		//Go to server invader
		 		setNextStep(request, "signInNew-KnownServer");
		 		goToPage("/internet?action=hack&method=bf"); //Atack by brute force method
		 	}
		 	break;
		case "signInNew-KnownServer":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		 		setNextStep(request, "signInKnownServer");
		 		//getSomeElement("a", "href", "?action=login", 0).click(); //Click on the server login tab
		 	} else {
				setNextStep(request, "finishCycle");
				location.reload(true);
		 	}
		 	break;
		case "removeMyClues":			

			logs = " ";
			try{
				logs = getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue; //Get all log datas
			}catch(error){	
				console.log(error.message);
			}
			if (logs != undefined){
				request = extractDataFromLogs(request, logs);	
			}

			setNextStep(request, "waitForEditLogProcess");	
			try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
			getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data ButtongoToPage("/missions");
			break;
		case "waitForEditLogProcess":
			setNextStep(request, "goToMySoftwarePanel");
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				//Do nothing
			} else {
				getSomeElement("a", "href", "?view=logs", 0).click(); //reload the log page
			}
			break;
		case "goToMySoftwarePanel":
			setNextStep(request, "uploadSoftware");
			goToPage("/software");
			
			break;
		case "uploadSoftware":
			setNextStep(request, "waitForInstallSoftwareProcess");
			softwareId = getSoftwareId(request.software.split(",")[0],request.software.split(",")[1]);
			if (softwareId != null){
				goToPage("/internet?view=software&cmd=up&id=" + softwareId);
			} else {
				window.alert("Hey, it seems you don't have that software anymore :(");
				setNextStep(request, "finishAll");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
				
			}
			break;
		case "waitForInstallSoftwareProcess":
			if (getSomeElement("div", "class", "alert alert-success", 0) == null){
				if (getSomeElement("div", "class", "alert alert-error", 0) == null){
					setNextStep(request, "goToLog-1");
				} else {
					//request.ip.pop();
					setNextStep(request, "finishCycle");
					getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
				}
			} else {
				setNextStep(request, "goToLog-1");
				location.reload(true);
			}
			break;
		case "goToLog-1":
			setNextStep(request, "clearLog-1");
			getSomeElement("a", "href", "?view=logs", 0).click(); //Go to logs
			break;
		case "clearLog-1":
			setNextStep(request, "waitForEditLogProcess-1");
			try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data Button
			break;
		case "waitForEditLogProcess-1":
			setNextStep(request, "goToSoftwareTab");
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				
			} else {
				getSomeElement("a", "href", "?view=logs", 0).click(); //Reload Page
			}
			break;
		case "goToSoftwareTab":
			setNextStep(request, "installSoftware");
			goToPage("/internet?view=software");
			break;
		case "installSoftware":
			softwareId = getSoftwareId(request.software.split(",")[0],request.software.split(",")[1]);
			if (softwareId != null){
				setNextStep(request, "waitForInstallSoftware");
				goToPage("/internet?view=software&cmd=install&id=" + softwareId);
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "waitForInstallSoftware":
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				setNextStep(request, "goToLog-3");
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "goToLog-3":
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				setNextStep(request, "clearLog-3");
				getSomeElement("a", "href", "?view=logs", 0).click(); //Go to logs
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "clearLog-3":
			setNextStep(request, "waitForEditLogProcess-3");
			try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data Button
			break;
		case "waitForEditLogProcess-3":
			setNextStep(request, "goToSoftwareTab2");
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				
			} else {
				getSomeElement("a", "href", "?view=logs", 0).click(); //Reload Page
			}
			break;	
		case "goToSoftwareTab2":
			setNextStep(request, "hideSoftware");
			goToPage("/internet?view=software");
			break;
		case "hideSoftware":
			softwareId = getSoftwareId(request.software.split(",")[0],request.software.split(",")[1]);
			if (softwareId != null){
				setNextStep(request, "waitForHideProcess");
				//window.alert("/internet?view=software&cmd=hide&id=" + softwareId);
				goToPage("/internet?view=software&cmd=hide&id=" + softwareId);
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "waitForHideProcess":
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				setNextStep(request, "goToLog-2");
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "goToLog-2":
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				setNextStep(request, "clearLog-2");
				getSomeElement("a", "href", "?view=logs", 0).click(); //Go to logs
			} else {
				setNextStep(request, "finishCycle");
				getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			}
			break;
		case "clearLog-2":
			setNextStep(request, "waitForEditLogProcess-2");
			try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data Button
			break;
		case "waitForEditLogProcess-2":
			setNextStep(request, "logOutServer");
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				
			} else {
				location.reload(true);
			}
			break;
		case "logOutServer":
			setNextStep(request, "finishCycle");
			getSomeElement("a", "href", "?view=logout", 0).click(); 
			break;
		case "goToMyOwnLog":
		 	setNextStep(request, "cleanOwnLog");
		 	goToPage("/log");
		 	break;
		case "cleanOwnLog":
		 	setNextStep(request, "waitForEditOwnLogProcess");
		 	try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	
		 	getSomeElement("input", "type", "submit", 0).click(); //Click on the Edit Log Data Button
		 	break;
		case "waitForEditOwnLogProcess":
		 	setNextStep(request, "finishAll");	
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		
		 	} else {
		 		location.reload(true);
		 	}
		 	break;
		case "finishCycle":
			if(request.ip.length > 0){
				setNextStep(request, "fillIPOnInternetPage");
				goToPage("/internet");
			} else {

				setNextStep(request, "goToMyOwnLog");
				location.reload(true);
				
			}
			break;
		case "finishAll":
			request = resetRequestDada(request); 
			request.job = defaultJob.checkBalance; 
			setNextStep(request, "chooseJob");
			goToPage("/software");
			break;

		default: break;
	}		
}

//Execute the camping step job
function executeCampingStep(request){
	//var AMOUNT_BUFFERED_ACCOUNTS = 2;
	var amountAccount = 0;
	var aux, logs;
	switch(request.stepId){
		case "fillIPOnInternetPage":
			if (getSomeElement("a", "href", "?view=logout", 0) == null){
		 		setNextStep(request, "goToServerTab");
				getSomeElement("input", "class", "browser-bar", 0).value = request.ip[0]; //Fill IP Adress bar
				getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
		 	} else {
		 		setNextStep(request, "fillIPOnInternetPage");
		 		getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
		 	}
			break;
		case "goToServerTab":
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				setNextStep(request, "signInKnownServer");
		 		getSomeElement("a", "href",	"?action=login", 0).click(); //Click on the server login tab
		 	} else {
		 		window.alert("Hey, it's a bad ip!");
		 		request.job = defaultJob.checkBalance;
		 		setNextStep(request, "chooseJob");
		 		goToPage("/internet");
		 	}
			break;
		case "signInKnownServer":
			if (getSomeElement("strong", null, null, 1) != null){//Check if the password is avaiable 
		 		setNextStep(request, "removeMyClues");
		 		aux = getSomeElement("span", "class", "small pull-left", 0).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "name", "user", 0).value = aux; //Fill the user field with the user on screen
		 		aux = getSomeElement("span", "class", "small pull-left", 1).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "type", "password", 0).value = aux; //Fill the password field with the password on screen
		 		getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button
		 	} else {
		 		//Go to server invader
		 		//window.alert("Come on man! You need to have access to this IP first!");
		 		//request.job = defaultJob.checkBalance;
		 		//setNextStep(request, "chooseJob");
		 		//goToPage("/internet");
		 		//Go to server invader
		 		setNextStep(request, "signInNew-KnownServer");
		 		goToPage("/internet?action=hack&method=bf"); //Atack by brute force method
		 	}
		 	break;
		case "signInNew-KnownServer":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		 		setNextStep(request, "signInKnownServer");
		 		//getSomeElement("a", "href",	"?action=login", 0).click(); //Click on the server login tab
		 	} else {
		 		window.alert("Come on, man. Your cracker is a shit!");
		 		request.job = defaultJob.checkBalance;
		 		setNextStep(request, "chooseJob");
		 		goToPage("/internet");
		 	}
		 	break;
		case "removeMyClues":
			

			logs = " ";
			try{
				logs = getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue; //Get all log datas
			}catch(error){	
				console.log(error.message);
			}
			if (logs != undefined){
				request = extractDataFromLogs(request, logs);	
			}

			setNextStep(request, "waitForEditLogProcess");	
			try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
			getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data ButtongoToPage("/missions");
			break;
		case "waitForEditLogProcess":
			if (request.account.length == 0){
				//setNextStep(request, "listenForActivities");	
				setNextStep(request, "goToMyOwnLog");
			} else {
				setNextStep(request, "startExtractMoney");
			}
			
			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				//Do nothing
			} else {
				getSomeElement("a", "href", "?view=logs", 0).click(); //reload the log page
			}
			break;
		case "listenForActivities":
			counterDelay = 0;
			delay = setInterval(
				function(){
					counterDelay++; 
					if (counterDelay >= 5){
						clearInterval(delay); 
						logs = " ";
						try{
							logs = getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue; //Get all log datas
						}catch(error){	
							console.log(error.message);
						}
						amountAccount = request.account.length;
						if (logs != undefined){
							request = extractDataFromLogs(request, logs);	
						}
						if (amountAccount != request.account.length){
							setNextStep(request, "waitForEditLogProcessOnListening");
							try{
								getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
							}catch(error){};
							getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data ButtongoToPage("/missions");	
						} else {
							setNextStep(request, "listenForActivities");
							getSomeElement("a", "href", "?view=logs", 0).click();
						}
		 			}
		 		}, 1000); //Wait the specified time on the page
			
			break;
		case "waitForEditLogProcessOnListening":
			//if (request.account.length >= AMOUNT_BUFFERED_ACCOUNTS){
			setNextStep(request, "startExtractMoney");
			//} else {
			//	setNextStep(request, "listenForActivities");
			//}

			if (getSomeElement("div", "class", "alert alert-error", 0) == null){
				//Do nothing
			} else {
				getSomeElement("a", "href", "?view=logs", 0).click();
			}
			break;
		case "startExtractMoney":
			setNextStep(request, "acessBankIP");
			getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
			break;
		case "acessBankIP":
			setNextStep(request, "accessHackAccountTab");
			getSomeElement("input", "class", "browser-bar", 0).value = request.ip[0]; //Fill IP Adress bar
			getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
			break;
		case "accessHackAccountTab":
			setNextStep(request, "hackAccount");
			goToPage("/internet?action=hack&type=bank");
		 	break;
		 case "hackAccount":
			setNextStep(request, "waitForEditAccountHackProcess");
			getSomeElement("input", "name", "acc", 0).value = request.account[request.account.length - 1]; //Fill Account to hack bar
		 	getSomeElement("button", "type", "submit", 0).click(); //Click on Hack button
		 	break;
		 case "waitForEditAccountHackProcess":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){ //Check for error message
		 		setNextStep(request, "signInAccount");	
		 	} else {
				if (getSomeElement("strong", null, null, 1) != null){
					//ssswindow.alert("You have ever access this account");
					setNextStep(request, "transferMoney");
					getSomeElement("input", "name", "acc", 0).value = request.account[request.account.length - 1]; //Fill the account field
		 			getSomeElement("input", "name", "pass", 0).value = getSomeElement("strong", null, null, 1).childNodes[0].nodeValue; //Fill the password field with the password on screen
		 			getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button
				} else {
					//Next account
					request.account.pop(); //Remove last element from account array
					if (request.account.length > 0){
						setNextStep(request, "accessHackAccountTab");
					} else {
						setNextStep(request, "goToServerTab");
					}
					getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
				}
		 	}
		 	break;
		 case "signInAccount":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){ //Check for success message
		 		setNextStep(request, "transferMoney");
		 		getSomeElement("input", "name", "acc", 0).value = request.account[request.account.length - 1]; //Fill the account field
		 		getSomeElement("input", "name", "pass", 0).value = getSomeElement("strong", null, null, 1).childNodes[0].nodeValue; //Fill the password field with the password on screen
		 		getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button
		 	} else {

		 		request.account.pop(); //Remove last element from account array  
				setNextStep(request, "goToServerTab");
				goToPage("/internet");
		 	}
		 	break;
		 case "transferMoney":
		 	counterDelay = 0;
			delay = setInterval(
					function(){
						if (request.amount = getSomeElement("strong", null, null, 0).childNodes[0].nodeValue != "$0"){
							counterDelay++; 
							if (counterDelay >= 1){
								clearInterval(delay); 
								getSomeElement("input", "name", "acc", 0).value = request.myAccount; //Fill the To field
		 						getSomeElement("input", "name", "ip", 1).value = request.ip[0]; //Fill the Bank IP field
		 						request.account.pop(); //Remove last element from account array
		 						setNextStep(request, "goOutToTheAccount");
		 						getSomeElement("button", "class", "btn btn-success", 0).click(); //Click on the Transfer Money button
		 					}	
						} else {
							clearInterval(delay);
							request.account.pop(); //Remove last element from account array  
							setNextStep(request, "goOutToTheAccount");
							location.reload(true); //Reload the page
						}
						
		 			}, 1000); //Wait the specified time on the page
		 		break;
		 case "goOutToTheAccount":
		 	setNextStep(request, "goToServerTab");
		 	getSomeElement("a", "href", "?bAction=logout", 0).click(); //Click on the account logout button	
		 	break;
		 case "goToMyOwnLog":
		 	setNextStep(request, "cleanOwnLog");
		 	goToPage("/log");
		 	break;
		 case "cleanOwnLog":
		 	setNextStep(request, "waitForEditOwnLogProcess");
		 	try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	
		 	getSomeElement("input", "type", "submit", 0).click(); //Click on the Edit Log Data Button
		 	break;
		 case "waitForEditOwnLogProcess":
		 	//request.counter = 0;
		 	setNextStep(request, "goToListenServer");	
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		
		 	} else {
		 		location.reload(true);
		 	}
		 	break;
		 case "goToListenServer":
		 	setNextStep(request, "listenForActivities");	
		 	goToPage("/internet");
		 	break;
		default: break;
	}
}


//mail-unread label label-important
//<span class="mail-unread label label-important">1</span>
//Execute the steps
function executeMissionStep(request){
	var aux, count, aux2;
	switch(request.stepId){
		 case "chooseJob": //It shows the first choice panel
		 	aux = document.createElement("div");
		 	aux.id = "gen-modal";
		 	aux.className = "modal hide in";
		 	aux.tabindex = "0";
		 	aux['aria-hidden'] = false;
		 	aux.style.display = "block";
			aux.innerHTML = 
		 	'<div class="widget-title">'+
		 		'<h5>Ok, here we go</h5>'+
		 		'<span class="label label-important hide1024" style="float: right">Bot</span>'+
		 	'</div>'+
		 	'<div class="modal-body">'+
		 		'<b>Choose some action: </b><br><br>'+
		 		'<button id="set-check-account-status-job" class="btn btn-success">Perform check account status missions</button><br><br>'+
		 		'<button id="set-transfer-money-job" class="btn btn-success">Perform transfer money missions</button><br><br>'+
		 		'<button id="set-camping-bank-logs" class="btn btn-success"> Listen transfer bank logs on </button>'+
		 		'<input id="target-bank-ip" class="controls" type="text" value="246.248.105.231" style="vertical-align: top; margin-left: 10px; margin-right: 10px;"> and transfer to my account: <input id="set-my-account" class="controls" type="text" value="12345678" style="vertical-align: initial; margin-left: 10px; margin-right: 10px;"><br>'+
		 		'<button id="set-install-software" class="btn btn-success"> Upload, install and hide this</button>'+
		 		'<input id="installSoftware" class="controls" type="text" value="Advanced Warez.vwarez, 5.0" style="vertical-align: top; margin-left: 10px; margin-right: 10px;"> software on these <input id="ip-install-targets" class="controls" type="text" value="1.2.3.4, 10.11.12.13" style="vertical-align: initial; margin-left: 10px; margin-right: 10px;"> IPs.<br>'+
		 		'<button id="set-hide-menu" class="btn btn-danger mission-abort">Sleep bot and hide this menu</button><br><br>'+
		 		'<div style="font-size: 12px;"><b>Important</b>: Ensure there are no tasks running. Click on BOT button anytime to abort the script process. Be careful with Safenet and FBI. Try to not fuck yourself. Do not make it too public. Enjoy it.<br><b>G programmer(2015)</b></div>'+
		 		'</div>'+
		 	'<div class="modal-footer"></div>';

		 	document.getElementsByTagName("BODY")[0].appendChild(aux);
		 	document.getElementById("set-check-account-status-job").onclick = function(){
		 		request.job = defaultJob.checkBalance;
				setNextStep(request, "tryToGetSomeMission");
				goToPage("/missions");	
			};
			document.getElementById("set-transfer-money-job").onclick = function(){
		 		request.job = defaultJob.transferMoney;
				setNextStep(request, "tryToGetSomeMission");
				goToPage("/missions");	
			};
			document.getElementById("set-camping-bank-logs").onclick = function(){
				request = resetRequestDada(request);
		 		request.job = defaultJob.campingBankLogs;
		 		request.ip[0] = getSomeElement("input", "id", "target-bank-ip", 0).value;
		 		request.myAccount = getSomeElement("input", "id", "set-my-account", 0).value;
				setNextStep(request, "fillIPOnInternetPage");
				goToPage("/internet");	
			};
			document.getElementById("set-install-software").onclick = function(){
				request = resetRequestDada(request);
		 		request.job = defaultJob.installSoftware;
		 		request.software = document.getElementById("installSoftware").value;
		 		aux2 = document.getElementById("ip-install-targets").value;
		 		if (aux2.search(",") >= 0){
		 			aux2 = aux2.split(",");
		 			for(aux = 0; aux <= aux2.length - 1; aux++){
		 				request.ip[aux] = aux2[aux].trim();
		 			}
		 		} else {
		 			request.ip[0] = aux2.trim();
		 		}
				setNextStep(request, "checkSoftware");
				goToPage("/software");	
			};
			document.getElementById("set-hide-menu").onclick = function(){
				request = resetRequestDada(request);
		 		request.job = defaultJob.wait;
		 		setNextStep(request, "");
				location.reload(true);	
			};
		 	break;
		 case "accessMissionPage":
			setNextStep(request, "tryToGetSomeMission");
			goToPage("/missions");
		 	break;
		 case "tryToGetSomeMission":
		 	request = resetRequestDada(request);
		 	defineLanguage(request);
		 	request = getSomeMission(request);
		 	if (request.url != null){
				setNextStep(request, "acceptMission");
				window.location.href = request.url;
		 	} else {
				setNextStep(request, "tryToGetSomeMission");
				count = getSomeElement("b", null, null, 0).childNodes[0].nodeValue; //Get the time missing to next missions package
				if (request.counter > 0){//Check of own log needs to be clean
					setNextStep(request, "cleanOwnLog");
					goToPage("/log");
				} else
				if (count > 0){

					aux = document.createElement("div");
					aux.id = "secondsCounterContainer";
					getSomeElement("div", "class", "widget-content padding", 0).appendChild(aux);

					count = (count * 60) - 50;
					console.log("Wait " + count + " seconds");
					counterDelay = 0; 
					delay = setInterval(
						function(){

							
							try{
								getSomeElement("div", "id", "secondsCounterContainer", 0).childNodes[0].nodeValue = "or " + (count - counterDelay) + " seconds";
							}catch(error){
								console.log(error.message);
								aux = document.createTextNode("or " + (count - counterDelay) + " seconds");
								getSomeElement("div", "id", "secondsCounterContainer", 0).appendChild(aux);
							}
						
							
							counterDelay++; 
							if (counterDelay >= count){
								clearInterval(delay); 
		 						goToPage("/missions");
		 					}
		 				}, 1000); //Wait the specified time on the page
				} else {
					goToPage("/missions");
					//window.close();
				}		
		 	}
		 	break;
		 case "acceptMission":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){//Check is some error has happened 
				setNextStep(request, "getMissionInformationAndGoToInternetPage");
		 		getSomeElement("span", "class", "btn btn-success mission-accept", 0).click(); //Click on the Accept mission button
		 		counterDelay = 0; 
		 		delay = setInterval(
		 			function(){
		 				counterDelay++; 
		 				if (counterDelay >= 1000/DEFAULT_DELAY){
		 					clearInterval(delay); 
		 					counterDelay = 0; 
		 					getSomeElement("input", "type", "submit", 0).click(); //Click on the div float Accept mission button
		 				}
		 			}, DEFAULT_DELAY);
		 	} else {
				setNextStep(request, "tryToGetSomeMission");
				goToPage("/missions");	
		 	}
		 	break;
		 case "getMissionInformationAndGoToInternetPage":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){//Check is some error has happened 
		 		request = getMissionInformation(request);
		 		request.counter++;
				setNextStep(request, "fillIPOnInternetPage");
				goToPage("/internet");	
		 	} else {
				setNextStep(request, "tryToGetSomeMission");
				goToPage("/missions");	
		 	}
			break;
		 case "fillIPOnInternetPage":
		 	if (getSomeElement("a", "href", "?view=logout", 0) == null){
		 		switch(request.job){
		 			case defaultJob.stealBitcoinData:
		 				setNextStep(request, "goToServerTab"); break;
		 			default: setNextStep(request, "accessHackAccountTab"); break;
		 		}
				getSomeElement("input", "class", "browser-bar", 0).value = request.ip[0]; //Fill IP Adress bar
				getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
		 	} else {
		 		setNextStep(request, "fillIPOnInternetPage");
		 		getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout Button
		 	}
			break;
		 case "accessHackAccountTab":
		 	setNextStep(request, "hackAccount");
			goToPage("/internet?action=hack&type=bank");
		 	break;
		 case "hackAccount":
			setNextStep(request, "waitForEditAccountHackProcess");
			getSomeElement("input", "name", "acc", 0).value = request.account[0]; //Fill Account to hack bar
		 	getSomeElement("button", "type", "submit", 0).click(); //Click on Hack button
		 	break;
		 case "waitForEditAccountHackProcess":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){ //Check for error message
		 		setNextStep(request, "signInAccount");	
		 	} else {
				setNextStep(request, "abortMission");
				goToPage("/missions");
		 	}
		 	break;
		 case "signInAccount":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){ //Check for success message
		 		switch(request.job){
		 			case defaultJob.checkBalance:
		 				setNextStep(request, "getTheAccountBalance");
		 				break;
		 			case defaultJob.transferMoney:
		 				setNextStep(request, "transferMoney");
		 				break;
		 			default: break;	
		 		}
		 		
		 		getSomeElement("input", "name", "acc", 0).value = request.account[0]; //Fill the account field
		 		getSomeElement("input", "name", "pass", 0).value = getSomeElement("strong", null, null, 1).childNodes[0].nodeValue; //Fill the password field with the password on screen
		 		getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button
		 	} else {
				setNextStep(request, "abortMission");
				goToPage("/missions");
		 	}
		 	break;
		 case "getTheAccountBalance":
		 	request.amount = getSomeElement("strong", null, null, 0).childNodes[0].nodeValue; //Get the account balance
			setNextStep(request, "goToServerTab");
			getSomeElement("a", "href", "?bAction=logout", 0).click(); //Click on the account logout button
		 	break;
		 case "transferMoney":
		 	counterDelay = 0;
			delay = setInterval(
					function(){						
						counterDelay++; 
						if (counterDelay >= 1){
							clearInterval(delay); 
							setNextStep(request, "goOutToTheAccount");
		 					getSomeElement("input", "name", "acc", 0).value = request.account[1]; //Fill the To field
		 					getSomeElement("input", "name", "ip", 1).value = request.ip[1]; //Fill the Bank IP field
		 					getSomeElement("button", "class", "btn btn-success", 0).click(); //Click on the Transfer Money button
		 				}	
						
		 			}, 1000); //Wait the specified time on the page
		 	break;
		 case "goOutToTheAccount":
		 	setNextStep(request, "goToServerTab");
		 	getSomeElement("a", "href", "?bAction=logout", 0).click(); //Click on the account logout button	
		 	break;
		 case "goToServerTab":
		 	setNextStep(request, "signInKnownServer");
		 	getSomeElement("a", "href",	"?action=login", 0).click(); //Click on the server login tab
		 	break;
		 case "signInKnownServer":
		 	if (getSomeElement("strong", null, null, 1) != null){//Check if the password is avaiable 
		 		setNextStep(request, "removeLogsFromTarget");
		 		aux = getSomeElement("span", "class", "small pull-left", 0).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "name", "user", 0).value = aux; //Fill the user field with the user on screen
		 		aux = getSomeElement("span", "class", "small pull-left", 1).childNodes[1].nodeValue;
		 		aux = aux.substr(2, aux.length - 2);
		 		getSomeElement("input", "type", "password", 0).value = aux; //Fill the password field with the password on screen
		 		getSomeElement("input", "type", "submit", 1).click(); //Click on the Login button

		 	} else {
		 		//Go to server invader
		 		setNextStep(request, "signInNew-KnownServer");
		 		goToPage("/internet?action=hack&method=bf"); //Atack by brute force method
		 	}
		 	break;
		 case "signInNew-KnownServer":
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		 		setNextStep(request, "signInKnownServer");
		 		//getSomeElement("a", "href",	"?action=login", 0).click(); //Click on the server login tab
		 	} else {
		 		if (request.ip[0] == request.ip[1]){
		 			setNextStep(request, "goToFeedbackMissionPage");	
		 		} else {
		 			setNextStep(request, "fillIPOnInternetPage-SecondServer");	
		 		};
		 		location.reload(true); //Reload the page
		 	}
		 	break;
		 case "removeLogsFromTarget":
		 	setNextStep(request, "waitForEditLogProcess");
		 	try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	getSomeElement("input", "type", "submit", 1).click(); //Click on the Edit Log Data Button
		 	break;
		 case "waitForEditLogProcess":
		 	setNextStep(request, "goOutFromBankServer");
		 	break;goToServerTab
		 case "goOutFromBankServer":
		 	switch(request.job){
		 		case defaultJob.checkBalance:
		 			setNextStep(request, "goToFeedbackMissionPage");
		 			break;
		 		case defaultJob.transferMoney:
		 			if (request.ip[0] == request.ip[1]){
		 				setNextStep(request, "goToFeedbackMissionPage");	
		 			} else {
		 				setNextStep(request, "fillIPOnInternetPage-SecondServer");	
		 			};
		 			break;

		 		default: break;	
		 	}
		 	getSomeElement("a", "href", "?view=logout", 0).click(); //Click on the Logout button	
		 	
		 	break;
		 case "fillIPOnInternetPage-SecondServer":
		 	request.ip[0] = request.ip[1];
		 	setNextStep(request, "goToServerTab");
			getSomeElement("input", "class", "browser-bar", 0).value = request.ip[1]; //Fill IP Adress bar
			getSomeElement("input", "type", "submit", 0).click(); //Click on Go button
		 	break;
		 case "goToFeedbackMissionPage":
		 	switch(request.job){
		 		case defaultJob.checkBalance:
		 			setNextStep(request, "informBalance");
		 			break;
		 		case defaultJob.transferMoney:
		 			setNextStep(request, "confirmFinishMission");
		 			break;
		 		default: break;
		 	}
		 	goToPage("/missions");
		 	break;
		 case "informBalance":
		 	getSomeElement("input", "id", "amount-input", 0).value = request.amount; //Fill the balance field with the balance value
		 	setNextStep(request, "accessMissionPage");
		 	getSomeElement("span", "class", "btn btn-success mission-complete", 0).click(); //Click on the Complete Mission Button
		 	counterDelay = 0; 
		 	delay = setInterval( 
		 		function(){
		 			counterDelay++;
		 			if (counterDelay >= 2000/DEFAULT_DELAY){
		 				clearInterval(delay); 
		 				counterDelay = 0; 
		 				getSomeElement("input", "id", "modal-submit", 0).click(); //Click on the float div Complete Mission button
		 			}
		 		}, DEFAULT_DELAY); 
		 	break;
		 case "confirmFinishMission":
		 	setNextStep(request, "accessMissionPage");
		 	getSomeElement("span", "class", "btn btn-success mission-complete", 0).click();
		 	counterDelay = 0; 
		 	delay = setInterval( 
		 		function(){
		 			counterDelay++;
		 			if (counterDelay >= 2000/DEFAULT_DELAY){
		 				clearInterval(delay); 
		 				counterDelay = 0; 
		 				getSomeElement("input", "id", "modal-submit", 0).click(); //Click on the float div Complete Mission button
		 			}
		 		}, DEFAULT_DELAY); 
		 	break;
		 case "abortMission":
			setNextStep(request, "accessMissionPage");
			getSomeElement("span", "class", "btn btn-danger mission-abort", 0).click(); //Click on the Abort button
			counterDelay = 0; 
			delay = setInterval(
				function(){
					counterDelay++; 
					if (counterDelay >= 1000/DEFAULT_DELAY){
						clearInterval(delay); 
						counterDelay = 0; 
		 				getSomeElement("input", "type", "submit", 0).click(); //Click on the float div Abort button
		 			}
		 		}, DEFAULT_DELAY);
		 	break;
		 case "cleanOwnLog":
		 	setNextStep(request, "waitForEditOwnLogProcess");
		 	try{
				getSomeElement("textarea", "class", "logarea", 0).childNodes[0].nodeValue = " "; //Clean the logs
			}catch(error){};
		 	
		 	getSomeElement("input", "type", "submit", 0).click(); //Click on the Edit Log Data Button
		 	break;
		 case "waitForEditOwnLogProcess":
		 	request.counter = 0;
		 	setNextStep(request, "tryToGetSomeMission");
		 	if (getSomeElement("div", "class", "alert alert-error", 0) == null){
		
		 	} else {
		 		goToPage("/missions");
		 	}
		 	break;

		default: break;
	}
}

function startScriptComunnication(){ //Get data from background script
	requestData.act = defaultAct.getRequestData;
	sendRequest(requestData);
}

delay = setInterval(//It waits for beginning of script comunication
	function(){
		counterDelay++; 
		if (counterDelay >= 30/DEFAULT_DELAY){
			clearInterval(delay); 
			counterDelay = 0; 
			startScriptComunnication();
		}
	}, DEFAULT_DELAY);

aux = document.createElement("li"); //Create a STOP BOT button
aux.className = "btn btn-danger mission-abort";
aux.innerHTML = '<a><span class="text" style="color: white;">BOT</span></a>';
document.getElementsByClassName("nav btn-group")[0].appendChild(aux);
aux.onclick = function(){requestData = resetRequestDada(requestData); requestData.job = defaultJob.checkBalance; setNextStep(requestData, "chooseJob"); location.reload(true)};
