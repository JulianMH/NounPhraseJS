"use strict";

var USE_TIME_DATASET = false;
var USE_SENTENCE_NETWORK = false;

//Dummy window to make convnet js work in web worker
var window = new Object();

importScripts("../libraries/require.js");
require.config({baseUrl : '../'});

require(["getWordWindowConfiguration", "getSentenceConfiguration", "nounphrasejs",  "libraries/cnnutil"],
 	 function(getWordWindowConfiguration, getSentenceConfiguration, nounphrasejs, _) {
          
        var jsonFile = USE_TIME_DATASET ? 
              (USE_SENTENCE_NETWORK  ? "../jsonNets/sentenceTime.txt" : "../jsonNets/wordWindowTime.txt") : 
              (USE_SENTENCE_NETWORK ? "../jsonNets/sentenceNounPhrase.txt" : "../jsonNets/wordWindowNounPhrase.txt");
              
        nounphrasejs.readTextFile(jsonFile, function (json) {
            
            var configuration = USE_SENTENCE_NETWORK ? 
                    getSentenceConfiguration(json) :
                	getWordWindowConfiguration(json);
                    
			postMessage(["ready"]);
            
    		self.addEventListener('message', function(e) {
    			var textToClassify = e.data;
                
                var wordCount = 0;
                var classifyStartTime = new Date().getTime();
                
                function processSentence(sentenceWords, sentenceSeperators) {
                    wordCount += sentenceWords.length;
                    configuration.classifySentence(sentenceWords, function(word, wordIndex, result, percentages) {
                        postMessage(["word", [sentenceSeperators[wordIndex], sentenceWords[wordIndex], result]]);
                    });
                }
                
                var currentSentenceWords = [];
                var currentSentenceSeperators = [];
                
    			var currentWord = "";
    			var currentSeperator = "";
                
                var punctuation = "!\"#$%&'()*+,-/:;<=>?@[]^_`{|}~";
                var wordSeperator = "  \t\r\n";
                var sentenceSeperator = ".";
                var allWordEnders = punctuation.concat(wordSeperator).concat(sentenceSeperator);
                
                for(var i = 0; i < textToClassify.length; ++i)
                {
                    var c = textToClassify.charAt(i);
                    
                    if(allWordEnders.indexOf(c) > -1)
                    {
                        if(currentWord !== "") {
                            currentSentenceWords.push(currentWord);
                            currentSentenceSeperators.push(currentSeperator);
                            currentWord = "";
                            currentSeperator = "";
                        }
                        currentSeperator += c;
                        if(sentenceSeperator.indexOf(c) > -1) {
                            processSentence(currentSentenceWords, currentSentenceSeperators);
                            currentSentenceWords = [];
                            currentSentenceSeperators = [];
                        }
                    }
                    else
                        currentWord += c;
                }
                if(currentWord !== "") {
                    currentSentenceWords.push(currentWord);
                    currentSentenceSeperators.push(currentSeperator);
                }
                processSentence(currentSentenceWords, currentSentenceSeperators);
                if(currentWord == "")
                    postMessage(["word", [currentSeperator, "", 0]]);
                   
                var totalClassifyTime = new Date().getTime() - classifyStartTime;
                    
                postMessage(["stats", 
                    ["Word Count", wordCount],
                    ["Total Time", totalClassifyTime + " ms"], 
                    ["Per Word Time", totalClassifyTime / wordCount + " ms"]]);
                
    			postMessage(["finished"]);
    		}, false);
        });
});



