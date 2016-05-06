// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//var remote = require('electron').remote;
// $scope.games = remote.getGlobal('games');

// var fs = require('fs');
var fs = require('fs.extra');

const shell = require('electron').shell;

var angularApp = angular.module('MagaApp', []);
var BUTTON_EDITION_EDIT = "Edit";
var BUTTON_EDITION_VALIDATE = "Validate";

angularApp.controller('MagaMain', function ($scope) {

    var path = "maga-light.json";
    $scope.games = JSON.parse(fs.readFileSync(path,'utf8'));
    $scope.selectedGame = undefined;
    $scope.editing = false;

    $scope.selectGame = function(game){
        if ($scope.selectedGame == game) {
            $scope.selectedGame = undefined;
        } else {
            $scope.selectedGame = game;
        }

        $scope.editing = false;
        updateEditionButton();
    };

    $scope.gameClicked = function(url) {
        // event.preventDefault();
        shell.openExternal(url);
    };

    $scope.editionButtonClicked = function() {
        if ($scope.selectedGame) {
            if ($scope.editing) {
                $scope.selectedGame.updated = new Date();
            }
            $scope.editing = !$scope.editing;
        } else {
            $scope.editing = false;
        }
        updateEditionButton();
    };

    $scope.saveButtonClicked = function() {
        // backup
        var newPath = path.replace(".json", "-"+new Date().toISOString()+".json").replace(/:/g, '-');
        // console.log('>>>>> COPY: from:', path);
        // console.log('>>>>> COPY: to  :', newPath);
        // fs.createReadStream(path).pipe(fs.createWriteStream(newPath));
        fs.copy(path, newPath, { replace: false }, function (err) {
            if (err) { throw err; }
            console.log("JSON backuped as:", newPath);

            // save
            var json = JSON.stringify($scope.games, null, 4);
            fs.writeFile(path, json, function (err) {
                if (err) return console.log(err);
                console.log('JSON saved!');
            });
        });
    };

    var updateEditionButton = function () {
        if ($scope.editing && $scope.selectedGame) {
            $scope.editionButtonTitle = BUTTON_EDITION_VALIDATE;
        } else {
            $scope.editionButtonTitle = BUTTON_EDITION_EDIT;
        }
    };
    updateEditionButton();

});
