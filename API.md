# NounPhraseJS API Documentation

## readTextFile

A helper function to load a text file.

```javascript
var filename = "/trainExample/wikiWars/train.txt";
nounphrasejs.readTextFile(filename, function(text) {
  // TODO: Do stuff with the loaded text here.
};
```
- filename is the path and name of the text file to load.

## Dictionary

To create a new empty dictionary use the Dictionary function.
```javascript
var dictionary = new nounphrasejs.Dictionary();

var wordFeatureCount = 50;
var rareWordMaxCount = 1;
var dictionaryWithParameters = new nounphrasejs.Dictionary(wordFeatureCount, rareWordMaxCount);
```
- wordFeatureCount indicates the amount of numerical features that get assigned to each word.
- rareWordMaxCount is used if adding new words to the dictionary when parsing a text corpus. It indicates how often a word needs to be in the whole text to be added to the dictionary.
If you decide to not provide these parameters the dictionary will assume reasonable default values.

It is also possible to create a Dictionary object using a given list of words.
```javascript
var words = ["Apple", "Banana", "Cherry"];
var dictionaryWithWords = new nounphrasejs.Dictionary(wordFeatureCount, rareWordMaxCount,);
```
## TextCorpus

To load a text dataset given in the ConLL2000 format, use the parseTextCorpus function.
The format of the ConLL2000 dataset is described here:
http://www.cnts.ua.ac.be/conll2000/chunking/

```javascript
var allowModifyDictionary = false;

var corpus = nounphrasejs.parseTextCorpus(text, dictionary, allowModifyDictionary);
```
- allowModifyDictionary indicates if new words from the text corpus should be added to the dictionary. This can be true for train data and should be false for test data. If a dictionary of words to use is provided, the parameter should be false in both cases.

Alternatively, you can parse your own dataset files and create a TextCorpus by using the TextCorpus function:
```javascript
var sentences = [[word1, word2, word3], [word4, word5]];
var wordCount = 5;

var corpusCustom = new nounphrasejs.TextCorpus(sentences, dictionary, wordCount);
```
- sentences is a list of all sentences. Each sentences is a list of Word objects. See Word below on how to create a Word object.
- wordCount is just a the count of all Word objects in sentences.

### Word

Word is an object to represent a single word in a TextCorpus. It can be created using the Word function:

```javascript
var actualWord = "Apple";
var nounPhrase = nounphrasejs.NOUN_PHRASE_BEGIN; //Alternatives: NOUN_PHRASE_INSIDE or NOUN_PHRASE_NONE
var index = dictionary.wordToIndex[nounphrasejs.WORD_PREFIX + actualWord.toLowerCase()];
var firstChar = actualWord.charAt(0);
var isCapitalised = (firstChar === firstChar.toUpperCase());

var word = new nounphrasejs.Word(index, actualWord, isCapitalised, nounPhrase);
```
- index is the index of the word in the dictionary.
- actualWord is the original word. Dicitionary lookups are done by lowercase words with a prefix, to avoid javascript name collisions.
- isCapitalised is wether the original word starts with a capital letter.
- nounPhrase is the class of the word for the classification task.
        
## NetworkConfigurations

### Loading
Both configurations can be created by calling their function with an options object and a Dictionary Object.
```javascript
var options = { hidden_unit_count: 30, lookup_table_learn_rate: 10 };

var wordWindowConfiguration = getWordWindowConfiguration(options, dictionary);
var sentenceConfiguration = getSentenceConfiguration(options, dictionary);
```
All available options are listed in the Options section and section for the respective functions. If an option is not set, the configuration will just use a reasonable default value.

To load configurations from JSON, call the same functions using a JSON string as the parameter:
```javascript
nounphrasejs.readTextFile("/jsonNets/wordWindowNounPhrase.txt", function(wordWindowJSON) {
  var wordWindowConfiguration = getWordWindowConfiguration(wordWindowJSON);
  
  // TODO: Do stuff with the configuration here.
});

nounphrasejs.readTextFile("/jsonNets/sentenceNounPhrase.txt", function(sentenceJSON) {
  var sentenceConfiguration = getSentenceConfiguration(sentenceJSON);
  
  // TODO: Do stuff with the configuration here.
});
```

### Options

Both configurations share the following parameters:
- hidden_unit_count Amount of units in each hidden layer.
- output_labels Amount of possible labels for the classification of each word. For noun phrase detection 3 different labels are used. This value can be changed to work for other natural language processing tasks.
- lookup_table_learn_rate Determines the rate at which the word feature vectors are trained.

The following parameters configure the stochastic gradient decent trainer that is used. See http://cs.stanford.edu/people/karpathy/convnetjs/docs.html for documentation on the SGD trainer parameters:
- trainer_learn_rate
- trainer_l1_decay
- trainer_l2_decay
- trainer_momentum
- trainer_batch_size

### getWordWindowConfiguration

This is a network inspired by the word window approach network from the paper:
"A Unified Architecture for Natural Language Processing: Deep Neural Networks with Multitask Learning" by R. Colobert and J.Weston.

It has one additional parameter:

- word_window_radius determines how many words before and after each word are fed into the network. A value of 2 means that a total of 2 (words to the left) + 1 (actual word) + 2 (words to the right) = 5 words are the input of the network.

![Image of word window network](http://i.imgur.com/uigYTT6.png)

### getSentenceConfiguration

This is a network inspired by the word sentence approach network from the paper:
"A Unified Architecture for Natural Language Processing: Deep Neural Networks with Multitask Learning" by R. Colobert and J.Weston.

- filter_count the amount of filters in the convolution layer
- convolution_radius determines how many words before and after each word are included in each convolution. A value of 2 means that a total of 2 (words to the left) + 1 (actual word) + 2 (words to the right) = 5 words are the input of the network.
- max_sentence_width determines the maximum word count a input sentence can have for the convolution network. Sentences with more words will be cut off. Make sure this value is high enough for your dataset that most sentences are covered.

![Image of word window network](http://i.imgur.com/R7yaK8P.png)

### train function

Trains the neural network with given dataset.
```javascript
var iterationCount = 100000;
var progressFunction = function(index, stats, trainTime) {
  alert("Trained with " +  index + " of 10000 samples.");
}

configuration.train(trainCorpus, iterationCount, progressFunction);
```
- trainCorpus is the dataset used for training.
- iterationCount determines how many times a random word is chosen and used to train the network.
- progressFunction is a callback function that is called after each word is trained.
  - index is the iteration of the word that was trained.
  - stats is the stats object returned by ConvNetJS after training. It contains statistics like the current training loss. http://cs.stanford.edu/people/karpathy/convnetjs/docs.html
  - trainTime is the time this training iteration took in milliseconds.
  
The progressFunction is an optional argument.

### test function

Tests the neural network with given dataset and returns how many words were classified correctly.
```javascript
var progressFunction = function(index, correctLabels, predictedLabel, actualLabel, percentages, testTime) {
  alert("Text example number " + index + " was predicted to be " 
    + predictedLabel +" which is " + (predictedLabel == actualLabel) + ".");
};

var correctLabels = configuration.test(testCorpus, progressFunction);
```
- testCorpus is the dataset used for validation.
- progressFunction is a callback function that is called after each word is trained.
  - index is the number of the word that was trained.
  - correctLabels is the amount of words that were predicted correctly so far.
  - predictedLabel is the label the network predicted for the word.
  - actualLabel is the label the word has in the dataset.
  - percentages is a list of likelihoods the network calculated for the word for each possible label.
  - trainTime is the time testing this word took in milliseconds.
  
The progressFunction is an optional argument.

### classify function

Classify a sentence and call a callbackfunction with the result for eaach word once its been classified.
```javascript
var sentence = ["The", "blue", "cat", "sat", "on", "a", "mat", "."];
var callbackFunction = function(word, wordIndex, result, percentages) {
    alert("Word " + word + " classified as " + result + ".");
};

configuration.classifySentence(sentence, callbackFunction);
```
- sentence is a list of individual words that form the sentence to classify.
- callbackFunction is a callback function that is called once for each word to classify.
  - word is the word that was classified as a string.
  - wordIndex is the list index of the word that was classified.
  - result is the label the network predicted for the word.
  - percentages is a list of likelihoods the network calculated for the word for each possible label.