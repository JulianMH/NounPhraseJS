"use strict";

var NOUN_PHRASE_BEGIN_COLOR = document.getElementById('nounPhraseBeginColor').style.backgroundColor;
var NOUN_PHRASE_INSIDE_COLOR = document.getElementById('nounPhraseInsideColor').style.backgroundColor;

function fillTable(table, data) {

    for (var i = 1; i < data.length; ++i) {
        var item = data[i];

        var row = table.insertRow(-1);

        row.insertCell(-1).innerHTML = item[0];
        row.insertCell(-1).innerHTML = item[1];
    }
}

var statsTable = document.getElementById("statsTable");
    
var w;
if (typeof (w) == "undefined") {
    w = new Worker("backgroundWorker.js?" + Math.random());
}
w.onerror = function(event){
    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
};
w.onmessage = function (event) {
	if (Object.prototype.toString.call(event.data) === '[object Array]') {
        if (event.data[0] === "finished") {
			document.getElementById('classifyButton').disabled = false;
            document.getElementById('statusLabel').innerHTML = "";
        }
        else if (event.data[0] === "ready") {
			document.getElementById('classifyButton').disabled = false;
            document.getElementById('statusLabel').innerHTML = "";
        }
        else if (event.data[0] === "word") {
            var wordData = event.data[1];
            var newHTML = wordData[0];
            
            if(wordData[2] == 1)
                newHTML += "<font style=\"color:" + NOUN_PHRASE_BEGIN_COLOR + "\">" + wordData[1] + "</font>";
            else if(wordData[2] == 2)
                newHTML += "<font style=\"color:" + NOUN_PHRASE_INSIDE_COLOR + "\">"  + wordData[1] + "</font>";
            else
                newHTML += wordData[1];
            
    	    document.getElementById('resultDiv').innerHTML += newHTML;
        } else if (event.data[0] == "stats") {
            fillTable(statsTable, event.data);
        }
    }
};
    
function classifyText() {
	document.getElementById('classifyButton').disabled = true;
    document.getElementById('resultDiv').innerHTML = "";
    document.getElementById('statusLabel').innerHTML = "classifying...";
    
    while(statsTable.hasChildNodes())
       statsTable.removeChild(statsTable.firstChild);
	
    w.postMessage(document.getElementById('inputTextarea').value);
}