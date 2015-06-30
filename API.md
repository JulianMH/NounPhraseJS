# NounPhraseJS.js

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
- sentences is a list of all sentences. Each sentences is a list of word objects. See Word below on how to create a word object.
- word count is just a the count of all Word objects in sentences.

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
        
## NetworkConfiguration

TODO train
TODO classify
TODO test

TODO getSentenceConfiguration getWordWindowConfiguration