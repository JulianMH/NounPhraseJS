"use strict";

define(['convnet-min'],
    function(){
        // File I/O Constants
        var NOUN_PHRASE_BEGIN = 1;
        var NOUN_PHRASE_INSIDE = 2;
        var NOUN_PHRASE_NONE = 0;
        var WORD_PREFIX = "abc";
        
        function readTextFile(file, doneReading) {
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {
                        var allText = rawFile.responseText;
                        doneReading(allText);
                    }
                }
            };
            rawFile.send(null);
        };
        
        function Word(index, actualWord, isCapitalised, nounPhrase) {
            this.index = index;
            this.actualWord = actualWord;
            this.isCapitalised = isCapitalised;
            this.nounPhrase = nounPhrase;
        };
        
        Word.prototype.toString = function () {
            return "Word: " + this.index + ", isCapitalised: " + this.isCapitalised + ", nounPhrase: " + this.nounPhrase;
        };
        
        function Dictionary(wordFeatureCount, rareWordMaxCount, words) {
            this.wordFeatureCount = (typeof wordFeatureCount === 'undefined') ? 50 : wordFeatureCount;
            this.rareWordMaxCount = (typeof rareWordMaxCount === 'undefined') ? 1 : rareWordMaxCount;
        
            this.wordToIndices = new Object();
            this.wordIndicesToVols = new Array();
            this.wordCounts = new Array();
            
            this.rareWordIndex = 0;
            this.rareVol = new convnetjs.Vol(this.wordFeatureCount, 1, 1);
            this.paddingVol = new convnetjs.Vol(this.wordFeatureCount, 1, 1);
            this.wordIndicesToVols[this.rareWordIndex] = this.rareVol;
            
            var thisDictionary = this;
            if(typeof words !== 'undefined')
                words.forEach(function (word, wordIndex) {
                    var index = wordIndex + 1;
                    var dictionaryWord = WORD_PREFIX + word.toLowerCase();
                    thisDictionary.wordToIndices[dictionaryWord] = index;
                    thisDictionary.wordIndicesToVols[index] = new convnetjs.Vol(thisDictionary.wordFeatureCount, 1, 1);
                    thisDictionary.wordCounts[index] = 0;
                });
        }
        
        function reviveDictionary(jsonObject) {
            jsonObject.paddingVol = reviveVol(jsonObject.paddingVol);
            jsonObject.rareVol = reviveVol(jsonObject.rareVol);
            
            for(var i = 0; i < jsonObject.wordIndicesToVols.length; ++i)
                jsonObject.wordIndicesToVols[i] = reviveVol(jsonObject.wordIndicesToVols[i]);
                
            return jsonObject;
        }
        
        function reviveVol(jsonObject) {
            var vol = new convnetjs.Vol(jsonObject.sx, jsonObject.sy, jsonObject.depth);
            vol.w = jsonObject.w;
            vol.dw = jsonObject.dw;
            return vol;
        }
        
        function parseTextCorpus(text, dictionary, allowModifyDictionary) {
            var lines = text.split("\n");
        
            var sentences = new Array();
            var currentSentence = new Array();
            var currentNewWordIndex = dictionary.wordIndicesToVols.length;
            var wordCount = 0;
        
            lines.forEach(function (line, i, a) {
                if (line === ""|| line === "\r") // If the sentence is over, start new sentence
                {
                    if(currentSentence.length > 0)
                    {
                        sentences[sentences.length] = currentSentence;
                        currentSentence = new Array();
                    }
                }
                else {
                    var data = line.replace("\r", "").split(" ");
                    var word = WORD_PREFIX + data[0].toLowerCase(); //prefix every word with abc to make sure no keywords/ exisiting properties are used
        
                    // determine the word index
                    var wordIndex = currentNewWordIndex;
                    if (dictionary.wordToIndices.hasOwnProperty(word)) {
                        wordIndex = dictionary.wordToIndices[word];
        
                        if (allowModifyDictionary) {
                            dictionary.wordCounts[wordIndex] += 1;
                            if (dictionary.wordCounts[wordIndex] >= dictionary.rareWordMaxCount)
                                dictionary.wordIndicesToVols[wordIndex] = new convnetjs.Vol(dictionary.wordFeatureCount, 1, 1);
                        }
                    }
                    else if (allowModifyDictionary) {
                        dictionary.wordToIndices[word] = wordIndex;
                        dictionary.wordIndicesToVols[wordIndex] = dictionary.rareVol;
                        dictionary.wordCounts[wordIndex] = 1;
                        currentNewWordIndex++;
                    } else {
                        wordIndex = dictionary.rareWordIndex;
                    }
        
                    // determine the noun phrase info
                    var wordNounPhrase = NOUN_PHRASE_NONE;
                    if ((data[2] === "B-NP") || (data[2] === "B-TI"))
                        wordNounPhrase = NOUN_PHRASE_BEGIN;
                    else if ((data[2] === "I-NP") || (data[2] === "I-TI"))
                        wordNounPhrase = NOUN_PHRASE_INSIDE;
        
                    // determine if first char is upper case
                    var firstChar = data[0].charAt(0);
                    var isCapitalised = (firstChar === firstChar.toUpperCase());
        
                    // add to current sentence
                    currentSentence[currentSentence.length] = new Word(wordIndex, data[0], isCapitalised, wordNounPhrase);
        
                    ++wordCount;
                }
            });
        
            if (sentences[sentences.length - 1].length === 0)
                sentences.pop();
                
            return new TextCorpus(sentences, dictionary, wordCount);
        }
        
        function TextCorpus(sentences, dictionary, wordCount) {
            this.sentences = sentences;
            this.dictionary = dictionary;
            this.wordCount = wordCount;
        };
        
        
        function NetworkConfiguration(network, trainer, getFeatureVector, trainFeatureVectorFromTrainingSample, dictionary, options) {
            this.network = network;
            this.trainer = trainer;
            this.options = options;
            this.getFeatureVector = getFeatureVector;
            this.trainFeatureVectorFromTrainingSample = trainFeatureVectorFromTrainingSample;
            this.dictionary = dictionary;
        };
        
        NetworkConfiguration.prototype.train = function(trainCorpus, iterations, progressFunction) {
            var currentTrainStartTime = new Date().getTime();
            for (var i = 0; i < iterations; ++i) {
                var sentenceIndex = Math.floor(Math.random() * trainCorpus.sentences.length);
                var sentence =  trainCorpus.sentences[sentenceIndex];
                var wordIndex = Math.floor(Math.random() * sentence.length);
                var word = sentence[wordIndex];
                
                var trainData = this.getFeatureVector(trainCorpus, sentenceIndex, wordIndex);
                var stats = this.trainer.train(trainData, word.nounPhrase);
                this.trainFeatureVectorFromTrainingSample(trainCorpus, sentenceIndex, wordIndex, trainData);
            
                if (typeof progressFunction !== 'undefined')
                {
                    var newTrainStartTime = new Date().getTime();
                    progressFunction(i, stats, newTrainStartTime- currentTrainStartTime);
                    currentTrainStartTime = newTrainStartTime;
                }
            }
        };
        
        NetworkConfiguration.prototype.test = function(testCorpus, progressFunction) {
            var totalCount = 0;
            var correctLabels = 0;
            
            var currentTestStartTime = new Date().getTime();
            
            var networkConfiguration = this;
                        
            testCorpus.sentences.forEach(function (sentence, sentenceIndex, sentences) {
                sentence.forEach(function (word, wordIndex, s) {
                    var result = networkConfiguration.network.forward(
                        	networkConfiguration.getFeatureVector(testCorpus, sentenceIndex, wordIndex));
            
                    var guess = 0;
                    var currentMaximum = result.w[0];
                    for (var index = 1; index < 3; ++index) {
                        if (result.w[index] > currentMaximum) {
                            guess = index;
                            currentMaximum = result.w[index];
                        }
                    };
            
                    if (guess === word.nounPhrase)
                        ++correctLabels;
                    ++totalCount;
                    
                    if (!(typeof progressFunction === 'undefined'))
                    {
                        var newTestStartTime = new Date().getTime();
                        progressFunction(totalCount, correctLabels, guess, word.nounPhrase, newTestStartTime - currentTestStartTime);
                        currentTestStartTime = newTestStartTime;
                    }
                });
            });
            
            return correctLabels;
        };
        
        NetworkConfiguration.prototype.classifySentence = function(sentenceWordList, outputForWord) {
            
            var words = new Array();
            var networkConfiguration = this;
            
            sentenceWordList.forEach(function (word) {
            
                var dictionaryWord = WORD_PREFIX + word.toLowerCase(); //prefix every word with abc to make sure no keywords/ exisiting properties are used
                    
                var wordIndex = networkConfiguration.dictionary.rareWordIndex;
                if (networkConfiguration.dictionary.wordToIndices.hasOwnProperty(dictionaryWord)) {
                    wordIndex = networkConfiguration.dictionary.wordToIndices[dictionaryWord];
                }
                
                var firstChar = word.charAt(0);
                var isCapitalised = (firstChar === firstChar.toUpperCase());
                
                words.push(new Word(wordIndex, word, isCapitalised, NOUN_PHRASE_BEGIN));
            });
            
            var corpus = new TextCorpus([words], networkConfiguration.dictionary, sentenceWordList.length);
            
            words.forEach(function (word, wordIndex) {
                var result = networkConfiguration.network.forward(
                        	networkConfiguration.getFeatureVector(corpus, 0, wordIndex));
            
                var guess = 0;
                var currentMaximum = result.w[0];
                for (var index = 1; index < 3; ++index) {
                    if (result.w[index] > currentMaximum) {
                        guess = index;
                        currentMaximum = result.w[index];
                    }
                };
                
                outputForWord(sentenceWordList[wordIndex], wordIndex, guess);
            });
        };
        
        NetworkConfiguration.prototype.toJSON = function() {
            return JSON.stringify({dictionary: this.dictionary, netJSON: this.network.toJSON(), options: this.options});
        };
        
        return {
            NetworkConfiguration: NetworkConfiguration,
            TextCorpus: TextCorpus,
            Dictionary: Dictionary,
            reviveDictionary: reviveDictionary,
            readTextFile: readTextFile,
            parseTextCorpus: parseTextCorpus,
            Word: Word,
            NOUN_PHRASE_BEGIN: NOUN_PHRASE_BEGIN,
            NOUN_PHRASE_INSIDE: NOUN_PHRASE_INSIDE,
            NOUN_PHRASE_NONE: NOUN_PHRASE_NONE,
            WORD_PREFIX: WORD_PREFIX,
        };
    }
);
