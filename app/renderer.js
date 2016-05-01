// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//var remote = require('electron').remote;
// $scope.games = remote.getGlobal('games');

var fs = require('fs');


var angularApp = angular.module('MagaApp', []);

angularApp.controller('MagaMain', function ($scope) {

    var path = "/Users/jacques/Dropbox/-work/projects/-github/node-js/maga/maga-crawler-tcc/maga.json";
    $scope.games = JSON.parse(fs.readFileSync(path,'utf8'));

    $scope.setSelectedItem = function(item){
        $scope.selectedItem = item;
    };

});
