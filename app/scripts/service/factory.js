'use strict';
angular
    .module('superstockApp')
    .factory('draw', function ($firebaseArray) {
        var drawGrid = function (Ref, config, loading, loaded, event) {
            var data = $firebaseArray(Ref);
            var lstObj = [];
            var loadingFlag = true;
            data.$watch(function (watchData) {
                //firebase data loading
                if (loadingFlag == false) return;
                if (data.length == 0) return;
                var popData = data[data.length - 1];
                var obj = {};
                if (config.idLabel)
                    obj[config.idLabel] = popData.$id;
                var arr = popData.$value.split('|');
                for (var j in config.labelList) {
                    // console.log(j);
                    if (config.labelList[j].format.indexOf('percent') > -1) {
                        obj[config.labelList[j].fieldName] = Math.ceil(arr[j] * 10000) / 100; // + '%';
                        if (isNaN(obj[config.labelList[j].fieldName]))
                            obj[config.labelList[j].fieldName] = '';
                    } else if (config.labelList[j].format.indexOf('bigNum') > -1 || config.labelList[j].format.indexOf('number') > -1) {
                        obj[config.labelList[j].fieldName] = parseFloat(arr[j]);
                        if (isNaN(obj[config.labelList[j].fieldName]))
                            obj[config.labelList[j].fieldName] = '';
                    } else {
                        obj[config.labelList[j].fieldName] = arr[j];
                    }

                }
                loading(obj);
                lstObj.push(obj);
            });
            data.$loaded(function () {
                loadingFlag = false;
                //data loaded callback
                loaded(lstObj);
                // console.log('loaded');

                //add new object event
                Ref.on('child_added', function (childSnapshot, prevChildKey) {
                    var dataConvert = {};
                    if (config.idLabel)
                        dataConvert[config.idLabel] = childSnapshot.key;
                    var arr = childSnapshot.val().split('|');
                    for (var j in config.labelList) {
                        if (config.labelList[j].format.indexOf('percent') > -1) {
                            if (arr[j] == '')
                                dataConvert[config.labelList[j].fieldName] = '';
                            else
                                dataConvert[config.labelList[j].fieldName] = Math.ceil(arr[j] * 10000) / 100; // + '%';
                            if (isNaN(dataConvert[config.labelList[j].fieldName]))
                                dataConvert[config.labelList[j].fieldName] = '';
                        } else if (config.labelList[j].format.indexOf('bigNum') > -1 || config.labelList[j].format.indexOf('number') > -1) {
                            dataConvert[config.labelList[j].fieldName] = parseFloat(arr[j]);
                            if (isNaN(dataConvert[config.labelList[j].fieldName]))
                                dataConvert[config.labelList[j].fieldName] = '';
                        } else {
                            dataConvert[config.labelList[j].fieldName] = arr[j];
                        }
                    }
                    event.added(dataConvert, childSnapshot, prevChildKey);
                });

                //update object event
                Ref.on('child_changed', function (childSnapshot, prevChildKey) {
                    var dataConvert = {};
                    if (config.idLabel)
                        dataConvert[config.idLabel] = childSnapshot.key;
                    var arr = childSnapshot.val().split('|');
                    for (var j in config.labelList) {
                        if (config.labelList[j].format.indexOf('percent') > -1) {
                            dataConvert[config.labelList[j].fieldName] = Math.ceil(arr[j] * 10000) / 100; // + '%';
                            if (isNaN(dataConvert[config.labelList[j].fieldName]))
                                dataConvert[config.labelList[j].fieldName] = '';
                        } else if (config.labelList[j].format.indexOf('bigNum') > -1 || config.labelList[j].format.indexOf('number') > -1) {
                            dataConvert[config.labelList[j].fieldName] = parseFloat(arr[j]);
                            if (isNaN(dataConvert[config.labelList[j].fieldName]))
                                dataConvert[config.labelList[j].fieldName] = '';
                        } else {
                            dataConvert[config.labelList[j].fieldName] = arr[j];
                        }
                    }
                    event.changed(dataConvert, childSnapshot, prevChildKey);
                });

                //remove object event
                Ref.on('child_removed', function (oldChildSnapshot) {
                    event.removed(oldChildSnapshot);
                });
            })
        }

        return {
            drawGrid: drawGrid
        }
    })