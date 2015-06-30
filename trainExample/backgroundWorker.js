"use strict";

// Configuration of which dataset, which architecture and hyper parameters to use
var USE_TIME_DATASET = false;
var USE_SENTENCE_NETWORK = false;
var TRAIN_ITERATION_COUNT = 50000;

var OPTIONS = {
    hidden_unit_count: 100,
    filter_count: 30,
    convolution_radius: 2,
    word_window_radius: 2,
    max_sentence_width: 60,
    lookup_table_learn_rate : 0.05,
    trainer_learn_rate: 0.001,
    trainer_l2_decay: 0.0001,
    trainer_momentum: USE_SENTENCE_NETWORK ? 0.5 : 0.9,
    trainer_batch_size: USE_SENTENCE_NETWORK ? 1 : 10
}; 
var DICTIONARY_RARE_WORD_COUNT = 1;
var DICTIONARY_WORD_FEATURE_COUNT = 50;

//Dummy window to make convnet js work in web worker
var window = new Object();

importScripts("../libraries/require.js");
require.config({baseUrl : '../'});

require(["getWordWindowConfiguration", "getSentenceConfiguration", "nounphrasejs", "libraries/cnnutil"],
    function(getWordWindowConfiguration, getSentenceConfiguration, nounphrasejs, _) {
        var xLossWindow = new cnnutil.Window(100);
        var wLossWindow = new cnnutil.Window(100);
        var trainCorpus;
        var testCorpus;
        
        var trainTimePerItemSum = 0;
        function trainProgressFunction(i, stats, trainTime) {
            trainTimePerItemSum += trainTime;
            
            if (isNaN(stats.cost_loss)) {
                debugger;
            }
            xLossWindow.add(stats.cost_loss);
            wLossWindow.add(stats.l2_decay_loss);
            
            if (i % 100 === 0) {
                postMessage("Training " + i + "/" + TRAIN_ITERATION_COUNT);
        
                var xa = xLossWindow.get_average();
                var xw = wLossWindow.get_average();
                if (xa >= 0 && xw >= 0) { // if they are -1 it means not enough data was accumulated yet for estimates
                    postMessage(["loss", i, xa + xw]);
                }
            }
        };
        
        var testTimePerItemSum = 0;
        function testProgressFunction(i, correctLabels, testTime) {
            testTimePerItemSum += testTime;
            
            if (i % 100 === 0) {
                postMessage("Testing " + i + "/" + testCorpus.wordCount);
            }
        };
        
        postMessage("Reading Train Text File");
        
        var trainFile = USE_TIME_DATASET ? "/trainExample/wikiwars/train.txt" : "/trainExample/conll2000/train.txt";
        var testFile = USE_TIME_DATASET ? "/trainExample/wikiwars/test.txt" : "/trainExample/conll2000/test.txt";
        
        nounphrasejs.readTextFile(trainFile, function (trainText) {
        
            postMessage("Reading Test Text File");
            nounphrasejs.readTextFile(testFile, function (testText) {
        
                postMessage("Processing Train Text File");
        
                var dictionary = new nounphrasejs.Dictionary(DICTIONARY_WORD_FEATURE_COUNT, DICTIONARY_RARE_WORD_COUNT);
                trainCorpus = nounphrasejs.parseTextCorpus(trainText, dictionary, true);
                
                postMessage(["parameters", 
                    ["Network Architecture", USE_SENTENCE_NETWORK ? "Sentence Approach" : "Word Window Approach"],
                    ["Training Iteration Count", TRAIN_ITERATION_COUNT],
                    ["Hidden Unit Count", OPTIONS.hidden_unit_count],
                    ["Filter Count", OPTIONS.filter_count],
                    ["Convolution Radius", OPTIONS.convolution_radius],
                    ["Word Window Radius", OPTIONS.word_window_radius],
                    ["Word Feature Count", dictionary.wordFeatureCount],
                    ["Word Not Rare Minimum Count", dictionary.rareWordMaxCount],
                    ["Convolution Layer Maximum Sentence Length", OPTIONS.max_sentence_width],
                    ["Trainer Learn Rate", OPTIONS.trainer_learn_rate],
                    ["Trainer L2 Decay", OPTIONS.trainer_l2_decay],
                    ["Trainer Momentum", OPTIONS.trainer_momentum],
                    ["Trainer Batch Size", OPTIONS.trainer_batch_size],
                    ["Lookup Table Learn Rate", OPTIONS.lookup_table_learn_rate]
                ]);
        
                postMessage("Processing Test Text File");
                testCorpus = nounphrasejs.parseTextCorpus(testText, dictionary, false);
        
                // Replace test set with validation set for tuning the hyperparameters.
                //testCorpus.sentences = trainCorpus.sentences.splice(0, 50);
                //trainCorpus.sentences = trainCorpus.sentences.splice(0, 10);
                //testCorpus.sentences = trainCorpus.sentences;
        
                postMessage(["datasets",
                    ["Dataset", USE_TIME_DATASET ? "Time (WikiWars)" : "Noun Phrase (CONLL2000)"],
                    ["Train Size", trainCorpus.wordCount + " words in " + trainCorpus.sentences.length + " sentences"],
                    ["Test Size", testCorpus.wordCount + " words in " + testCorpus.sentences.length + " sentences"]]);
        
                var configuration = USE_SENTENCE_NETWORK ? getSentenceConfiguration(OPTIONS, dictionary) : getWordWindowConfiguration(OPTIONS, dictionary);
        
                postMessage("Training");
                
                configuration.train(trainCorpus, TRAIN_ITERATION_COUNT, trainProgressFunction);
        
                postMessage(["timings",
                    ["Total Train Time", Math.round(trainTimePerItemSum / 1000) + " s"],
                    ["Average Train Time Per Word", trainTimePerItemSum / TRAIN_ITERATION_COUNT + " ms"]]);
        
        
                postMessage("Calculating Test Result");
                
                var correctLabels = configuration.test(testCorpus, testProgressFunction);
        
                postMessage(["timings",
                    ["Total Test Time", Math.round(testTimePerItemSum / 1000) + " s"],
                    ["Average Test Time Per Word", testTimePerItemSum / testCorpus.wordCount + " ms"]]);
        
                var percentage = (correctLabels / testCorpus.wordCount) * 100;
        
                postMessage(["results",
                    ["Correctly Tagged Words:", correctLabels + "/" + testCorpus.wordCount],
                    ["Correctly Tagged Percentage", percentage + " %"]]);
        
                postMessage("correct: " + correctLabels + "/" + testCorpus.wordCount + " percentage: " + percentage);
                
                postMessage(["json", configuration.toJSON()]);
            });
        });
});



