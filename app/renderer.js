// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var app = angular.module('MagaApp', []);


app.controller('MagaMain', function ($scope) {

    $scope.data = [
        {id:1, title:'Foo', desc:'More stuff about this here', category_name:'Category 1'},
        {id:2, title:'Goo', desc:'More stuff about this here', category_name:'Category 2'},
        {id:3, title:'Roo', desc:'Blah details on Roo are here', category_name:'Category 1'},
        {id:4, title:'Hoo', desc:'More stuff about Hoo here', category_name:'Category 2'},
        {id:5, title:'Woo', desc:'More stuff about this here', category_name:'Category 3'}
    ];

    $scope.setSelectedItem = function(item){
        $scope.selectedItem = item;
    };

    $scope.deleteItem = function(){
        if ($scope.selectedItem >= 0) {
            $scope.data.splice($scope.selectedItem,1);
        }
    };

});
