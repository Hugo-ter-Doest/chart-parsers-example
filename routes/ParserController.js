/*
    Some logic for loading grammar and parsing sentences
    Copyright (C) 2014 Hugo W.L. ter Doest

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var formidable = require('formidable');
var fs = require('fs');

var ParserFactoryClass = require('chart-parsers');
var parserFactory = new ParserFactoryClass();

var pos = require('pos');

// Page for loading a grammar
exports.choose_grammar_file = function(req, res) {
  res.render('load_grammar');
};

// Submit a grammar file
exports.submit_grammar = function(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    fs.readFile(files.grammar_file.path, 'utf8', function (error, text) {
      if (error) {
        console.log(error);
      }
  
      parserFactory.setGrammar(text);
  
      res.redirect('/input_sentence');
    });
  });
};

// Page for entering a sentence
exports.input_sentence = function(req, res) {
  res.render('parse_sentence');
};

// Parse a sentence
exports.parse_sentence = function(req, res) {
  var sentence = req.body.input_sentence;
  var words = new pos.Lexer().lex(sentence);
  var taggedWords = new pos.Tagger().tag(words);
  var N = taggedWords.length;

  var parser = parserFactory.createParser({'type': req.body.parsingAlgorithm});

  function listener(event_name, item) {
    //console.log(event_name + ': ' + item.id);
  }

  var start = new Date().getTime();
  var chart = parser.parse(taggedWords, listener);
  var end = new Date().getTime();
  
  var full_parse_items = chart.full_parse_items(parser.grammar.get_start_symbol(), 
    ((req.body.parsingAlgorithm === 'HeadCorner') || 
     (req.body.parsingAlgorithm === 'CYK')) ? 'cyk_item' : 'earleyitem');

  res.render('parse_result', {type_of_parser: req.body.parsingAlgorithm,
                              N: N,
                              tagged_sentence: taggedWords,
                              chart: chart,
                              parsing_time: end - start,
                              in_language: full_parse_items.length > 0,
                              parses: full_parse_items,
                              nr_items_created: chart.nr_of_items()});
};