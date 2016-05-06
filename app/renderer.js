// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//var remote = require('electron').remote;
// $scope.games = remote.getGlobal('games');

// var fs = require('fs');
var fs = require('fs.extra');

const shell = require('electron').shell;

var angularApp = angular.module('MagaApp', []);
var BUTTON_EDITION_EDIT = "  Edit  ";
var BUTTON_EDITION_VALIDATE = "Validate";

angularApp.controller('MagaMain', function ($scope) {

    var clearFilterFields = function() {
        $scope.gameFilterPattern = undefined;
        $scope.gameFilterFullSearch = false;
    };
    $scope.jsonURL = "maga-light.json";
    $scope.editing = false;
    $scope.showNotYetImplemented = false;


    // Search
    //
    var sortNameOf = function (game) {
        if (game) {
            var name = game.nameToSort || game.name;
            if (name && name.trim().length > 0) {
                return name.toUpperCase();
            }
        }
        return undefined;
    };
    function sortGames() {
        $scope.games.sort(function (a, b) {
            var aName = sortNameOf(a);
            if (!aName) {
                return 1;
            }
            var bName = sortNameOf(b);
            if (!bName) {
                return -1;
            }
            return aName.localeCompare(bName);
        })
    }

    // Known STATUS
    //
    var setupKnownFieldValues = function () {
        if ($scope.games) {
            var statusMap = {};
            var agileMap = {};
            $scope.games.forEach(function (game) {
                statusMap[game.status] = "ok";
                if (game.agile) {
                    game.agile.forEach(function (topic) {
                        agileMap[topic] = "ok";
                    });
                }
            });
            $scope.knownStatus = "" + Object.keys(statusMap).sort();
            $scope.knownAgileTopics = "" + Object.keys(agileMap).sort();
        }
    };

    // LOAD JSON
    //
    var loadJson = function () {
        $scope.allGames = JSON.parse(fs.readFileSync($scope.jsonURL,'utf8'));
        $scope.games = $scope.allGames;
        $scope.selectedGame = undefined;
        setupKnownFieldValues();
        clearFilterFields();
    };
    loadJson();

    // UI CALLBACKS
    //
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
            if ($scope.editing) { // SAVE !!
                $scope.selectedGame.updated = new Date();
                setupKnownFieldValues();
                sortGames();
            }
            $scope.editing = !$scope.editing;
        } else {
            $scope.editing = false;
        }
        updateEditionButton();
    };

    $scope.loadButtonClicked = function() {
        loadJson();
    };

    $scope.saveButtonClicked = function() {
        // backup
        var newPath = $scope.jsonURL.replace(".json", "-"+new Date().toISOString()+".json").replace(/:/g, '-');
        fs.copy($scope.jsonURL, newPath, { replace: false }, function (err) {
            if (err) { throw err; }
            console.log("JSON backuped as:", newPath);

            // save
            var json = JSON.stringify($scope.games, null, 4);
            fs.writeFile($scope.jsonURL, json, function (err) {
                if (err) return console.log(err);
                console.log('JSON saved!');
            });
        });
    };

    // EDITION button
    //
    var updateEditionButton = function () {
        if ($scope.editing && $scope.selectedGame) {
            $scope.editionButtonTitle = BUTTON_EDITION_VALIDATE;
        } else {
            $scope.editionButtonTitle = BUTTON_EDITION_EDIT;
        }
    };
    updateEditionButton();

    // Search
    //
    var filterUpdated = function (newValue, oldValue, scope) {
        var pattern = $scope.gameFilterPattern;
        if (!pattern || pattern.length == 0) {
            $scope.games = $scope.allGames;
        } else {
            var pattern = pattern.toUpperCase();
            $scope.games = [];
            $scope.allGames.forEach(function (g) {
                var place = g.name;
                if ($scope.gameFilterFullSearch) {
                    place = JSON.stringify(g);
                }
                place = place.toUpperCase();
                if (place.indexOf(pattern) > -1) {
                    $scope.games.push(g);
                }
            });
        }
        sortGames();
    };
    $scope.clearFilterButtonClicked = function() {
        clearFilterFields();
    };
    $scope.$watch("gameFilterPattern", filterUpdated);
    $scope.$watch("gameFilterFullSearch", filterUpdated);
    $scope.clearFilterButtonClicked();

    // REMOVE
    //
    $scope.removeButtonClicked = function() {
        var index = $scope.allGames.indexOf($scope.selectedGame);
        if (index > -1) {
            $scope.allGames.splice(index, 1);
            $scope.selectedGame = undefined;
            filterUpdated();
        }
    };
    
    // GENERATE ID
    //
    $scope.generateIdClicked = function () {
        if ($scope.selectedGame) {
            $scope.selectedGame.gameId = $scope.selectedGame.name.toLowerCase().replace(/ /g, '-');
        }
    };

    // GENERATE SORT NAME
    //
    $scope.generateSortNameClicked = function () {
        if ($scope.selectedGame) {
            $scope.selectedGame.nameToSort = $scope.selectedGame.name;
        }
    };

    // AGILE TOPICS
    //
    $scope.removeAgileTopic = function (topic) {
        var i = $scope.selectedGame.agile.indexOf(topic);
        if (i > -1) {
            $scope.selectedGame.agile.splice(i, 1);
        }
    };
    $scope.addAgileTopic = function () {
        if ($scope.newAgileTopic && $scope.newAgileTopic.trim().length > 0) {
            if (!$scope.selectedGame.agile) {
                $scope.selectedGame.agile = [];
            }
            $scope.selectedGame.agile.push($scope.newAgileTopic);
        }
        $scope.newAgileTopic = undefined;
    };
});
