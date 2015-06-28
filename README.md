# NounPhraseJS
Noun phrase detection in JavaScript using neural nets with convnetjs. Part of my bachelor thesis.

Still in development, better documentation coming soon.

# License
Check the license.txt file for detailed license information.

In general, most of the files are under MIT License.
The WikiWars dataset is under Wikipedias Creative Commons License.
The CONLL2000 dataset has no compatible license and thus is not included in this repository.

# Running the example code
Grab all files from the repository. If you want to use noun phrase detection, download the train.txt and test.txt from http://www.cnts.ua.ac.be/conll2000/chunking/. Extract those files and put them in the folder trainExample/conll2000.

Now just host all those files on a server and navigate to the root folder in your browser. If you run Unix with python installed you can just use the server.sh to run a local server and find the example code under localhost:8000.

# Getting Started
You will need require.js to use the project: http://requirejs.org/

To use the library just copy the 4 files and load all except the last one with require.js: 
- nounphrasejs.js
- getSentenceConfiguration.js
- getWordWindowConfiguration.js
- convnet-min.js

"getSentenceConfiguration" and "getWordWindowConfiguration" are optional and you will most likely only need one of them for your project.

