"use strict";

define(["nounphrasejs"], function(nounphrasejs) {
    
    var DEFAULT_OPTIONS = {
        hidden_unit_count: 30,
        filter_count: 30,
        convolution_radius: 2,
        max_sentence_width: 60,
        output_classes: 3,
        lookup_table_learn_rate: 0.1,
        trainer_learn_rate: 0.001,
        trainer_l2_decay: 0.0001,
        trainer_momentum: 0.5,
        trainer_batch_size: 1
    };
    
    return function getSentenceConfiguration(options, dictionary) {
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
            options.width_with_padding = options.max_sentence_width + (options.convolution_radius * 2);
            options.convolution_width = (options.convolution_radius * 2);
            
            network.makeLayers([
                { type: 'input', out_sx: dictionary.wordFeatureCount + 3, out_sy: options.width_with_padding, out_depth: 1 },
                { type: 'conv', sx: dictionary.wordFeatureCount + 3, sy: options.convolution_width, filters: options.filter_count, stride: 1 },
                { type: 'fc', num_neurons: options.hidden_unit_count, group_size: options.filter_count, activation: 'maxout' },
                //{ type: 'fc', num_neurons: options.hidden_unit_count },
                //{ type: 'fc', num_neurons: options.hidden_unit_count, activation: 'tanh' },
                //{ type: 'fc', num_neurons: options.hidden_unit_count }),
                { type: 'softmax', num_classes: options.output_classes }]);
        }
        
        var trainer = new convnetjs.Trainer(network, {
            method: 'sgd', 
            learning_rate: options.trainer_learn_rate,
            l2_decay: options.trainer_l2_decay, 
            momentum:  options.trainer_momentum, 
            batch_size:  options.trainer_batch_size,
        });
        
        
        function getSentenceWithLabelForWord(textCorpus, sentenceIndex, wordIndex) {
            var sentence = textCorpus.sentences[sentenceIndex];
            var sentenceFeatures = new convnetjs.Vol(dictionary.wordFeatureCount + 3, options.width_with_padding, 1);
        
            for (var i = 0; i < options.width_with_padding; ++i) {
                var currentWordPosition = i - options.convolution_radius;
                var distanceToLabeledWord = (currentWordPosition - wordIndex) / sentence.length;
        
                if (distanceToLabeledWord < -1)
                    distanceToLabeledWord = -1;
                if (distanceToLabeledWord > 1)
                    distanceToLabeledWord = 1;
        
                var isCapitalised = false;
                var currentWordVol = textCorpus.dictionary.paddingVol;
                if (currentWordPosition >= 0 && currentWordPosition < sentence.length) {
                    var currentWord = sentence[currentWordPosition];
                    isCapitalised = currentWord.isCapitalised;
                    currentWordVol = textCorpus.dictionary.wordIndicesToVols[currentWord.index];
                }
        
                for (var j = 0; j < dictionary.wordFeatureCount; ++j)
                    sentenceFeatures.set(j, i, 0, currentWordVol.get(j, 0, 0));
                sentenceFeatures.set(dictionary.wordFeatureCount, i, 0, isCapitalised ? 1 : 0);
                sentenceFeatures.set(dictionary.wordFeatureCount + 1, i, 0, currentWordPosition == wordIndex ? 0 : 1);
                sentenceFeatures.set(dictionary.wordFeatureCount + 2, i, 0, distanceToLabeledWord);
            }
        
            return sentenceFeatures;
        };
        
        function learnFromSentenceWithLabelForWordGradients(textCorpus, sentenceIndex, wordIndex, sentenceWithLabel) {
            var sentence = textCorpus.sentences[sentenceIndex];
        
            for (var i = 0; i < options.width_with_padding; ++i) {
                var currentWordPosition = i - options.convolution_radius;
        
                var volToChange = textCorpus.dictionary.paddingVol;
                if (currentWordPosition >= 0 && currentWordPosition < textCorpus.sentences[sentenceIndex].length) {
                    var currentWord = sentence[currentWordPosition];
                    volToChange = textCorpus.dictionary.wordIndicesToVols[currentWord.index];
        
                    for (var j = 0; j < dictionary.wordFeatureCount; ++j) {
                        volToChange.set(j, 0, 0, sentenceWithLabel.get(j, i, 0) - (options.lookup_table_learn_rate * sentenceWithLabel.get_grad(j, i, 0)));
                    }
                }
            }
        };
        
       return new nounphrasejs.NetworkConfiguration(network, trainer, getSentenceWithLabelForWord, learnFromSentenceWithLabelForWordGradients, dictionary, options);
    };
});