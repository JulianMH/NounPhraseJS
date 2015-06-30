# NounPhraseJS.js

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

TODO
NetworkConfiguration: NetworkConfiguration,
            TextCorpus: TextCorpus,
            readTextFile: readTextFile,
            parseTextCorpus: parseTextCorpus,