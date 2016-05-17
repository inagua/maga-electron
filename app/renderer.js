// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//var remote = require('electron').remote;
// $scope.games = remote.getGlobal('games');

// var fs = require('fs');
var fs = require('fs.extra');
var moment = require('moment'); // http://momentjs.com/docs/#/displaying/
moment.locale('fr');

const shell = require('electron').shell;

var angularApp = angular.module('MagaApp', []);
var BUTTON_EDITION_EDIT = "  Edit  ";
var BUTTON_EDITION_VALIDATE = "Validate";
var ARTICLES = ['the', 'a', 'le', 'la', 'les', "l'", 'un', 'une', 'des'];

String.prototype.startsWith = function (str) { return !this.indexOf(str); };

angularApp.controller('MagaMain', function ($scope, $sce) {

    var clearFilterFields = function() {
        $scope.gameFilterPattern = undefined;
        $scope.gameFilterFullSearch = false;
    };
    $scope.jsonURL = "/Users/jacques/Dropbox/-data/data/maga/maga.json";
    $scope.editing = false;
    $scope.noNeedToSave = true;
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
            var idsMap = {};
            var statusMap = {};
            var agileMap = {};
            var tagsMap = {};
            $scope.games.forEach(function (game) {
                if (game.gameId) { idsMap[game.gameId] = "ok"; }
                if (game.status) { statusMap[game.status] = "ok"; }
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
            $scope.knownSee = Object.keys(idsMap).sort();
            $scope.knownStatus = Object.keys(statusMap).sort();
            $scope.knownAgileTopics = Object.keys(agileMap).sort();
            $scope.knownTags = Object.keys(tagsMap).sort();
        }
    };
    var setupAvailableAgileTopics = function () {
        if ($scope.knownAgileTopics && $scope.selectedGame && $scope.selectedGame.agileTopics && $scope.selectedGame.agileTopics.length > 0) {
            $scope.availableAgileTopics = [];
            $scope.knownAgileTopics.forEach(function (k) {
                if ($scope.selectedGame.agileTopics.indexOf(k) == -1) {
                    $scope.availableAgileTopics.push(k);
                }
            });
        } else {
            $scope.availableAgileTopics = $scope.knownAgileTopics;
        }
        $scope.availableAgileTopics.sort();
    };
    var setupAvailableTags = function () {
        if ($scope.knownTags && $scope.selectedGame && $scope.selectedGame.tags && $scope.selectedGame.tags.length > 0) {
            $scope.availableTags = [];
            $scope.knownTags.forEach(function (k) {
                if ($scope.selectedGame.tags.indexOf(k) == -1) {
                    $scope.availableTags.push(k);
                }
            });
        } else {
            $scope.availableTags = $scope.knownTags;
        }
        $scope.availableTags.sort();
    };
    var setupAvailableSee = function () {
        if ($scope.knownSee && $scope.selectedGame && $scope.selectedGame.see && $scope.selectedGame.see.length > 0) {
            $scope.availableSee = [];
            $scope.knownSee.forEach(function (k) {
                if ($scope.selectedGame.see.indexOf(k) == -1) {
                    $scope.availableSee.push(k);
                }
            });
        } else {
            $scope.availableSee = $scope.knownSee;
        }
        if ($scope.availableSee && $scope.availableSee.length > 0 && $scope.selectedGame && $scope.selectedGame.gameId) {
            var i = $scope.availableSee.indexOf($scope.selectedGame.gameId);
            if (i > -1) {
                $scope.availableSee.splice(i, 1);
            }
        }
        $scope.availableSee.sort();
    };
    var setupAvailableFieldsValues = function () {
        setupAvailableAgileTopics();
        setupAvailableTags();
        setupAvailableSee();
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

    // UTILS
    //
    $scope.formatFullDate = function(date) {
        if (date) {
            // return moment(new Date(date)).format("dddd, MMMM Do YYYY, HH:mm:ss"); // EN
            return moment(new Date(date)).format("dddd Do MMMM YYYY - HH:mm:ss"); // FR
        }
        return "-";
    };
    $scope.gameNameForId = function(gameId) {
        if ($scope.allGames && gameId) {
            for (var g in $scope.allGames) {
                var game = $scope.allGames[g];
                if (gameId == game.gameId) {
                    return game;
                }
            }
        }
        return undefined;
    };
    $scope.htmlify = function(string) {
        return $sce.trustAsHtml(string.replace(/\n/g, '<br>'));
    };

    // UI CALLBACKS
    //
    $scope.selectGame = function(game){
        $scope.selectedSeeId = undefined;
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
        $scope.noNeedToSave = false;
        if ($scope.selectedGame) {
            if ($scope.editing) { // SAVE !!
                if ($scope.selectedGame.name.trim().length == 0) {
                    return ;
                }
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

    $scope.clearNewGameClicked = function() {
        $scope.selectedGame = $scope.newGame = createGame();
    };

    $scope.loadButtonClicked = function() {
        $scope.noNeedToSave = true;
        loadJson();
    };

    $scope.saveButtonClicked = function() {
        // backup
        var newPath = $scope.jsonURL.replace(".json", "-"+new Date().toISOString()+".json").replace(/:/g, '-');
        fs.copy($scope.jsonURL, newPath, { replace: false }, function (err) {
            if (err) { throw err; }
            console.log("JSON backuped as:", newPath);

            // save
            var json = JSON.stringify($scope.allGames, null, 4);
            fs.writeFile($scope.jsonURL, json, function (err) {
                if (err) return console.log(err);
                console.log('JSON saved!');
                $scope.$apply(function(){
                    $scope.noNeedToSave = true;
                    }
                );
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
            var patternUppercase = pattern.toUpperCase();
            $scope.games = [];
            $scope.allGames.forEach(function (g) {
                var place = g.name;
                place = place.toUpperCase();
                if ($scope.gameFilterFullSearch) {
                    place = JSON.stringify(g);
                }
                if (pattern.startsWith("tag:")) {
                    var tag = pattern.replace("tag:", "");
                    if (tag && g.tags && g.tags.indexOf(tag) > -1) {
                        $scope.games.push(g);
                    }
                } else if (pattern.startsWith("agile:")) {
                    var topic = pattern.replace("agile:", "");
                    if (topic && g.agileTopics && g.agileTopics.indexOf(topic) > -1) {
                        $scope.games.push(g);
                    }
                } else if (place.indexOf(patternUppercase) > -1) {
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
    var suffixeFirstWordOf = function(string) {
        var words = string.split(" ");
        var first = words[0];
        words.splice(0, 1);
        words.push("("+first+")");
        return words.join(" ");
    };
    $scope.generateSortNameClicked = function () {
        if ($scope.selectedGame && $scope.selectedGame.name && $scope.selectedGame.name.trim().length > 0) {
            for (var a in ARTICLES) {
                var article = ARTICLES[a];
                if ($scope.selectedGame.name.toLowerCase().startsWith(article)) {
                    $scope.selectedGame.nameToSort = suffixeFirstWordOf($scope.selectedGame.name);
                    return ;
                }
            }
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


    // FIELD: SEE
    //
    $scope.removeSee = function (see) {
        var i = $scope.selectedGame.see.indexOf(see);
        if (i > -1) {
            $scope.selectedGame.see.splice(i, 1);
            setupAvailableSee();
        }
    };
    $scope.useSee = function () {
        var see = $scope.selectedSeeGameId;
        if (see && see.trim().length > 0) {
            if (!$scope.selectedGame.see) { $scope.selectedGame.see = []; }
            if ($scope.selectedGame.see.indexOf(see) == -1) {
                $scope.selectedGame.see.push(see);
                $scope.selectedGame.see.sort();
                setupAvailableSee();
            }
        }
        $scope.selectedSeeGameId = undefined;
    };


    // FIELD: STEPS
    //
    $scope.removeStep = function (step) {
        var i = $scope.selectedGame.steps.indexOf(step);
        if (i > -1) {
            $scope.selectedGame.steps.splice(i, 1);
        }
    };
    $scope.addStep = function () {
        var newStep = { "name":$scope.newStepName, "duration":$scope.newStepDuration, "details":$scope.newStepDetails };
        if ($scope.newStepName && $scope.newStepName.trim().length > 0) {
            if (!$scope.selectedGame.steps) { $scope.selectedGame.steps = []; }
            if ($scope.selectedGame.steps.indexOf(newStep) == -1) {
                $scope.selectedGame.steps.push(newStep);
            }
        }
        $scope.newStepName = $scope.newStepDuration = $scope.newStepDetails = undefined;
    };


    // FIELD: VARIANS
    //
    $scope.removeVariant = function (variant) {
        var i = $scope.selectedGame.variants.indexOf(variant);
        if (i > -1) {
            $scope.selectedGame.variants.splice(i, 1);
        }
    };
    $scope.addVariant = function () {
        var newVariant = { "name":$scope.newVariantName, "details":$scope.newVariantDetails };
        if ($scope.newVariantName && $scope.newVariantName.trim().length > 0) {
            if (!$scope.selectedGame.variants) { $scope.selectedGame.variants = []; }
            if ($scope.selectedGame.variants.indexOf(newVariant) == -1) {
                $scope.selectedGame.variants.push(newVariant);
            }
        }
        $scope.newVariantName = $scope.newVariantDetails = undefined;
    };


    // FIELD: MATERIAL
    //
    $scope.removeMaterial = function (material) {
        var i = $scope.selectedGame.materials.indexOf(material);
        if (i > -1) {
            $scope.selectedGame.materials.splice(i, 1);
        }
    };
    $scope.addMaterial = function () {
        if ($scope.newMaterial && $scope.newMaterial.trim().length > 0) {
            if (!$scope.selectedGame.materials) { $scope.selectedGame.materials = []; }
            if ($scope.selectedGame.materials.indexOf($scope.newMaterial) == -1) {
                $scope.selectedGame.materials.push($scope.newMaterial);
            }
        }
        $scope.newMaterial = undefined;
    };

    // Clickable Tags
    //
    $scope.tagClicked = function (tag) {
        $scope.gameFilterPattern = "tag:" + tag;
    };
    $scope.agileTopicClicked = function (agile) {
        $scope.gameFilterPattern = "agile:" + agile;
    };
});
