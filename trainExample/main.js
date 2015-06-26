"use strict";

var json = "";
require(["../libraries/cnnvis", "../libraries/filesaver-min"], function() {
    
    function fillTable(table, data) {
    
        for (var i = 1; i < data.length; ++i) {
            var item = data[i];
    
            var row = table.insertRow(-1);
    
            row.insertCell(-1).innerHTML = item[0];
            row.insertCell(-1).innerHTML = item[1];
        }
    }
    
    var lossGraph = new cnnvis.Graph();
    
    var w;
    if (typeof (w) == "undefined") {
        w = new Worker("backgroundWorker.js?" + Math.random());
    }
    w.onerror = function(event){
        throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
    };
    w.onmessage = function (event) {
        if (typeof event.data == 'string') {
            document.getElementById('statusDiv').innerHTML = event.data;
        }
        else if (Object.prototype.toString.call(event.data) === '[object Array]') {
            if (event.data[0] === "loss") {
                lossGraph.add(event.data[1], event.data[2]);
                lossGraph.drawSelf(document.getElementById("lossGraph"));
            }
            else if (event.data[0] == "parameters") {
                fillTable(document.getElementById('parameterTable'), event.data);
            }
            else if (event.data[0] == "datasets") {
                fillTable(document.getElementById('datasetTable'), event.data);
            }
            else if (event.data[0] == "results") {
                fillTable(document.getElementById('resultTable'), event.data);
            }
            else if (event.data[0] == "timings") {
                fillTable(document.getElementById('timingTable'), event.data);
            }
            else if (event.data[0] == "json") {
                json = event.data[1];
                var button = document.getElementById('saveJSONButton');
                button.onclick = function() {
                    var blob = new Blob([json], {type: "text/plain;charset=utf-8"});
                    saveAs(blob, "json.txt");
                };
                button.disabled = false;
            }
            
        }

    };

});