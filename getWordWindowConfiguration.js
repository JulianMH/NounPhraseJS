"use strict";

define(["nounphrasejs"], function(nounphrasejs) {
    
    var DEFAULT_OPTIONS = {
        hidden_unit_count: 30,
        word_window_radius: 2,
        lookup_table_learn_rate: 0.1,
        output_labels: 3,
        trainer_learn_rate: 0.001,
        trainer_l1_decay: 0,
        trainer_l2_decay: 0.0001,
        trainer_momentum: 0.9,
        trainer_batch_size: 10
    };
    
    return function getWordWindowConfiguration(options, dictionary) {
         var network = new convnetjs.Net();
        
        if(typeof(options) == 'string') { // Load from JSON if string is passed as argument.
            
            var savedConfiguration = JSON.parse(options);
            
            options = savedConfiguration.options;
            dictionary = nounphrasejs.reviveDictionary(savedConfiguration.dictionary);
            network.fromJSON(savedConfiguration.netJSON);
        } else {
            
            // Make sure options are complete
            for(var key in DEFAULT_OPTIONS) {
                if(DEFAULT_OPTIONS.hasOwnProperty(key) && !options.hasOwnProperty(key))
                    	options[key] = DEFAULT_OPTIONS[key];
            }
            options.word_window_width = (options.word_window_radius * 2);
            
            network.makeLayers([
                { type: 'input', out_sx: dictionary.wordFeatureCount + 1, out_sy: options.word_window_width, out_depth: 1 },
                { type: 'fc', num_neurons: options.hidden_unit_count },
                { type: 'fc', num_neurons: options.hidden_unit_count, activation: 'tanh' },
                { type: 'fc', num_neurons: options.hidden_unit_count },
                { type: 'softmax', num_classes: options.output_labels }]);
        }
        
        var trainer = new convnetjs.Trainer(network, {
            method: 'sgd', 
            learning_rate: options.trainer_learn_rate,
            l1_decay: options.trainer_l1_decay,
            l2_decay: options.trainer_l2_decay, 
            momentum:  options.trainer_momentum, 
            batch_size:  options.trainer_batch_size,
        });
        
        function getWindowForWord(textCorpus, sentenceIndex, wordIndex) {
            var sentence = textCorpus.sentences[sentenceIndex];
            var wordWindow = new convnetjs.Vol(dictionary.wordFeatureCount + 1, options.word_window_width, 1);
        
            for (var i = 0; i < options.word_window_width; ++i) {
                var currentWordPosition = i - options.word_window_radius + wordIndex;
        
                var isCapitalised = false;
                var currentWordVol = textCorpus.dictionary.paddingVol;
                if (currentWordPosition >= 0 && currentWordPosition < sentence.length) {
                    var currentWord = sentence[currentWordPosition];
                    isCapitalised = currentWord.isCapitalised;
                    currentWordVol = textCorpus.dictionary.wordIndicesToVols[currentWord.index];
                }
        
                for (var j = 0; j < dictionary.wordFeatureCount; ++j)
                    wordWindow.set(j, i, 0, currentWordVol.get(j, 0, 0));
                wordWindow.set(dictionary.wordFeatureCount, i, 0, isCapitalised ? 1 : 0);
            }
        
            return wordWindow;
        };
        
        function learnFromWindowForWordGradients(textCorpus, sentenceIndex, wordIndex, wordWindow) {
            for (var i = 0; i < options.word_window_width; ++i) {
                var currentWordPosition = i - options.word_window_radius + wordIndex;
        
                var volToChange = textCorpus.dictionary.paddingVol;
                if (currentWordPosition >= 0 && currentWordPosition < textCorpus.sentences[sentenceIndex].length) {
                    volToChange = textCorpus.dictionary.wordIndicesToVols[textCorpus.sentences[sentenceIndex][currentWordPosition].index];
                }
        
                for (var j = 0; j < dictionary.wordFeatureCount; ++j) {
                    volToChange.set(j, 0, 0, wordWindow.get(j, i, 0) - (options.lookup_table_learn_rate * wordWindow.get_grad(j, i, 0))); //TODO grad korrekt? Window auch?
                }
            }
        };
        
        return new nounphrasejs.NetworkConfiguration(network, trainer, getWindowForWord, learnFromWindowForWordGradients, dictionary, options);
    };
});