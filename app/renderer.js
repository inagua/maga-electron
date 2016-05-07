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
    $scope.jsonURL = "/Users/jacques/Dropbox/-data/data/maga/maga.json";
    $scope.editing = false;
    $scope.showNotYetImplemented = false;
    var createGame = function() { return { "status":"creating" }; };
    $scope.newGame = createGame();


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

    // Known Fields VALUES
    //
    var setupKnownFieldsValues = function () {
        if ($scope.games) {
            var statusMap = {};
            var agileMap = {};
            var tagsMap = {};
            $scope.games.forEach(function (game) {
                if (game.status) {
                    statusMap[game.status] = "ok";
                }
                if (game.agileTopics) {
                    game.agileTopics.forEach(function (topic) {
                        agileMap[topic] = "ok";
                    });
                }
                if (game.tags) {
                    game.tags.forEach(function (tag) {
                        tagsMap[tag] = "ok";
                    });
                }
            });
            $scope.knownStatus = Object.keys(statusMap).sort();
            $scope.knownAgileTopics = Object.keys(agileMap).sort();
            $scope.knownTags = Object.keys(tagsMap).sort();
        }
    };
    var setupAvailableAgileTopics = function () {
        if ($scope.knownAgileTopics && $scope.selectedGame && $scope.selectedGame.agileTopics && $scope.selectedGame.agileTopics.length > 0) {
            $scope.availableAgileTopics = [];
            $scope.knownAgileTopics.forEach(function (a) {
                if ($scope.selectedGame.agileTopics.indexOf(a) == -1) {
                    $scope.availableAgileTopics.push(a);
                }
            });
        } else {
            $scope.availableAgileTopics = $scope.knownAgileTopics;
        }
    };
    var setupAvailableTags = function () {
        if ($scope.knownTags && $scope.selectedGame && $scope.selectedGame.tags && $scope.selectedGame.tags.length > 0) {
            $scope.availableTags = [];
            $scope.knownTags.forEach(function (a) {
                if ($scope.selectedGame.tags.indexOf(a) == -1) {
                    $scope.availableTags.push(a);
                }
            });
        } else {
            $scope.availableTags = $scope.knownTags;
        }
    };
    var setupAvailableFieldsValues = function () {
        setupAvailableAgileTopics();
        setupAvailableTags();
    };

    // LOAD JSON
    //
    var loadJson = function () {
        $scope.allGames = JSON.parse(fs.readFileSync($scope.jsonURL,'utf8'));
        $scope.games = $scope.allGames;
        $scope.selectedGame = undefined;
        setupKnownFieldsValues();
        clearFilterFields();
        sortGames();
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
        setupAvailableFieldsValues();

        $scope.editing = (game == $scope.newGame);
        updateEditionButton();
    };

    $scope.gameClicked = function(url) {
        // event.preventDefault();
        shell.openExternal(url);
    };

    $scope.editionButtonClicked = function() {
        if ($scope.selectedGame) {
            if ($scope.editing) { // SAVE !!
                if ($scope.selectedGame == $scope.newGame) {
                    $scope.allGames.push($scope.newGame);
                    $scope.newGame = createGame();
                }
                $scope.selectedGame.updated = new Date();
                setupKnownFieldsValues();
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

    // FIELD: AGILE TOPICS
    //
    var pushAgileTopic = function (topic) {
        if (topic && topic.trim().length > 0) {
            if (!$scope.selectedGame.agileTopics) {
                $scope.selectedGame.agileTopics = [];
            }
            if ($scope.selectedGame.agileTopics.indexOf(topic) == -1) {
                $scope.selectedGame.agileTopics.push(topic);
                $scope.selectedGame.agileTopics.sort();
                setupAvailableAgileTopics();
            }
        }
    };
    $scope.removeAgileTopic = function (topic) {
        var i = $scope.selectedGame.agileTopics.indexOf(topic);
        if (i > -1) {
            $scope.selectedGame.agileTopics.splice(i, 1);
            setupAvailableAgileTopics();
        }
    };
    $scope.addAgileTopic = function () {
        pushAgileTopic($scope.newAgileTopic);
        $scope.newAgileTopic = undefined;
    };
    $scope.useAgileTopic = function (topic) {
        pushAgileTopic(topic);
    };


    // FIELD: TAGS
    //
    var pushTag = function (tag) {
        if (tag && tag.trim().length > 0) {
            if (!$scope.selectedGame.tags) {
                $scope.selectedGame.tags = [];
            }
            if ($scope.selectedGame.tags.indexOf(tag) == -1) {
                $scope.selectedGame.tags.push(tag);
                $scope.selectedGame.tags.sort();
                setupAvailableTags();
            }
        }
    };
    $scope.removeTag = function (tag) {
        var i = $scope.selectedGame.tags.indexOf(tag);
        if (i > -1) {
            $scope.selectedGame.tags.splice(i, 1);
            setupAvailableTags();
        }
    };
    $scope.addTag = function () {
        pushTag($scope.newTag);
        $scope.newTag = undefined;
    };
    $scope.useTag = function (tag) {
        pushTag(tag);
    };


    // RESOURCES
    //
    $scope.removeResource = function (resource) {
        var i = $scope.selectedGame.resources.indexOf(resource);
        if (i > -1) {
            $scope.selectedGame.resources.splice(i, 1);
        }
    };
    var isFull = function(string) {
        return string && string.trim().length > 0;
    };
    $scope.addResource = function () {
        if (isFull($scope.newResourceName) && isFull($scope.newResourceUrl)) {
            var newResource = {"name":$scope.newResourceName, "details":$scope.newResourceDetails, "type":$scope.newResourceType, "url":$scope.newResourceUrl};
            if (!$scope.selectedGame.resources) {
                $scope.selectedGame.resources = [];
            }
            $scope.selectedGame.resources.push(newResource);
            $scope.newResourceName = $scope.newResourceDetails = $scope.newResourceType = $scope.newResourceUrl = undefined;
        }
    };
});
