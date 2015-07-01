# NounPhraseJS
Noun phrase detection in JavaScript using neural nets with convnetjs. Part of my bachelor thesis.

Still in development, better documentation coming soon.

# License
Check the license.txt file for detailed license information.

In general, most of the files are under MIT License.
The WikiWars dataset is under Wikipedias Creative Commons License.
The CONLL2000 dataset has no compatible license and thus is not included in this repository.

# Getting Started
## Running the example code
Grab all files from the repository. If you want to use noun phrase detection, download the train.txt and test.txt from http://www.cnts.ua.ac.be/conll2000/chunking/. Extract those files and put them in the folder trainExample/conll2000.

Now just host all those files on a server and navigate to the root folder in your browser. If you run Unix with python installed you can just use the server.sh to run a local server and find the example code under localhost:8000.

## Embed in custom project
You will need require.js to use the project: http://requirejs.org/

To use the library just copy these 4 files and load all except the last one with require.js: 
- nounphrasejs.js
- getWordWindowConfiguration.js
- getSentenceConfiguration.js
- convnet-min.js

"getWordWindowConfiguration" and "getSentenceConfiguration" are optional and you will most likely only need one of them for your project. Check Network Architectures for more information.

## Classifying unlabeled Text

To just classify a given sentence, load a pretrained network from JSON.  
```javascript
nounphrasejs.readTextFile("/jsonNets/wordWindowNounPhrase.txt", function(json) {
  var configuration = getWordWindowConfiguration(json);
  
  // TODO: Do stuff with the configuration here.
};
```
Make sure to use either getWordWindowConfiguration or getSentenceConfiguration depending on the type of the saved network. You can use the pretrained network JSON files from the "jsonNets" folder of this repository. Their filename indicates if they are a word window configuration or a sentence configuration.

The actual classification can be done by:
```javascript
configuration.classifySentence(["The", "blue", "cat", "sat", "on", "a", "mat", "."], 
  function(word, wordIndex, result) {
    alert("Word " + word + " classified as " + result + ".");
});
```

## Training a network

### Load a dataset

To train a network yourself, loading a training dataset is required.
```javascript
var dictionary = new Dictionary();

nounphrasejs.readTextFile("/trainExample/wikiWars/train.txt", function(text) {
  var corpus = nounphrasejs.parseTextCorpus(text, dictionary, true);
  // TODO: Do stuff with the text corpus here.
};
```
The last parameter of parseTextCorpus indicates if new words from the text corpus should be added to the dictionary. You want this to be true for train data and false for test data. If you provide a dictionary of words to use, the parameter should be false in both cases.

The dataset is expected to be in a similar format to http://www.cnts.ua.ac.be/conll2000/chunking/, all tags that do not include noun phrase information are simply ignored.

### Create a NetworkConfiguration object

To do the actual training and testing, a NetworkConfiguration object is needed. Call either getWordWindowConfiguration or getSentenceConfiguration depending on which network architecture you prefer.
```javascript
var options = {};
var configuration = getWordWindowConfiguration(options, dictionary);
```
You do not need to pass any options, the configuration will just use reasonable default values for any missing parameter. For a list of possible parameters, check the API documentation.

### Training and Testing

To train the network by taking 10000 random samples from your training data, call this:
```javascript
configuration.train(trainCorpus, 100000);
```
If you want to be able to output training statistics or provide a progress bar, pass a progress callback function.
```javascript
configuration.train(trainCorpus, 100000, function(index, stats, trainTime) {
  alert("Trained with " +  index + " of 10000 samples.");
});
```
Testing works similar.
```javascript
var correctLabels = configuration.test(testCorpus);
```
You can also pass a progress callback function.
```javascript
var correctLabels = configuration.test(testCorpus, function(index, correctLabels, predictedLabel, actualLabel, testTime) {
  alert("Text example number " + index + " was predicted to be " 
    + predictedLabel +" which is " + (predictedLabel == actualLabel) + ".");
});
```
Check the API documentation for more details on these functions.
 
# Network Architectures

TODO
