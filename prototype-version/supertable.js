function build_slick_grid(id, columns) {

  var dataView;
  var grid;
  var data = [];

  // var columns = [
  //   {id: "Symbol", name: "Symbol", field: "Symbol", behavior: "select", cssClass: "cell-selection", width: 80, cannotTriggerInsert: true, resizable: false, selectable: false, sortable: true },
  //   {id: "EPS", name: "EPS", field: "EPS", behavior: "select", cssClass: "cell-selection", minWidth: 80, cannotTriggerInsert: true, resizable: false, selectable: false, sortable: true },
  //   {id: "LNST", name: "LNST", field: "LNST", behavior: "select", cssClass: "cell-selection", minWidth: 80, cannotTriggerInsert: true, resizable: false, selectable: false, sortable: true },
  //   {id: "ClosePrice", name: "ClosePrice", field: "ClosePrice", behavior: "select", cssClass: "cell-selection", minWidth: 80, cannotTriggerInsert: true, resizable: false, selectable: false, sortable: true },
  //   {id: "Signal", name: "Signal", field: "Signal", behavior: "select", cssClass: "cell-selection", minWidth: 80, cannotTriggerInsert: true, resizable: false, selectable: false, sortable: true },
  // ];

  var options = {
    editable: true,
    enableAddRow: false,
    enableCellNavigation: true,
    asyncEditorLoading: true,
    forceFitColumns: false,
    topPanelHeight: 25
  };

  var sortcol = "title";
  var sortdir = 1;
  var percentCompleteThreshold = 0;
  var searchString = "";

  function requiredFieldValidator(value) {
    if (value == null || value == undefined || !value.length) {
      return {valid: false, msg: "This is a required field"};
    }
    else {
      return {valid: true, msg: null};
    }
  }

  function myFilter(item, args) {
    if(args.header && args.inValues) {
      if(!(item[args.header] in args.inValues)) {
        return false;
      }
    }

    for(var key in args) {
      var itemNum = Number(item[key]) || 0;
      var argsNum = Number(args[key]) || 0;
      if(itemNum < argsNum) {
        return false;
      }
    }

    // for matching search
    // if (args.searchString != "" && item["Symbol"].indexOf(args.searchString) == -1) {
    //   return false;
    // }

    return true;
  }

  function percentCompleteSort(a, b) {
    return a["percentComplete"] - b["percentComplete"];
  }

  function comparer(a, b) {
    var x = Number(a[sortcol]), y = Number(b[sortcol]);
    return (x == y ? 0 : (x > y ? 1 : -1));
  }

  function toggleFilterRow() {
    grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
  }


  $(".grid-header .ui-icon")
          .addClass("ui-state-default ui-corner-all")
          .mouseover(function (e) {
            $(e.target).addClass("ui-state-hover")
          })
          .mouseout(function (e) {
            $(e.target).removeClass("ui-state-hover")
          });

  var SYMBOLS = ['SSI', 'VND', 'FPT', 'HSC', 'VCB', 'AAA', 'GTN'];

  var grid, dataView;

    dataView = new Slick.Data.DataView({ inlineFilters: true });
    grid = new Slick.Grid(id, dataView, columns, options);
    grid.setSelectionModel(new Slick.RowSelectionModel());

    var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
    var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);


    // move the filter panel defined in a hidden div into grid top panel
    $("#inlineFilterPanel")
        .appendTo(grid.getTopPanel())
        .show();

    grid.onCellChange.subscribe(function (e, args) {
      dataView.updateItem(args.item.id, args.item);
    });

    grid.onAddNewRow.subscribe(function (e, args) {
      var item = {"num": data.length, "id": "new_" + (Math.round(Math.random() * 10000)), "title": "New task", "duration": "1 day", "percentComplete": 0, "start": "01/01/2009", "finish": "01/01/2009", "effortDriven": false};
      $.extend(item, args.item);
      dataView.addItem(item);
    });

    grid.onKeyDown.subscribe(function (e) {
      // select all rows on ctrl-a
      if (e.which != 65 || !e.ctrlKey) {
        return false;
      }

      var rows = [];
      for (var i = 0; i < dataView.getLength(); i++) {
        rows.push(i);
      }

      grid.setSelectedRows(rows);
      e.preventDefault();
    });

    grid.onSort.subscribe(function (e, args) {
      console.log('Sort', e, args);
      sortdir = args.sortAsc ? 1 : -1;
      sortcol = args.sortCol.field;

      if ($.browser.msie && $.browser.version <= 8) {
        // using temporary Object.prototype.toString override
        // more limited and does lexicographic sort only by default, but can be much faster

        var percentCompleteValueFn = function () {
          var val = this["percentComplete"];
          if (val < 10) {
            return "00" + val;
          } else if (val < 100) {
            return "0" + val;
          } else {
            return val;
          }
        };

        // use numeric sort of % and lexicographic for everything else
        dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortAsc);
      } else {
        // using native sort with comparer
        // preferred method but can be very slow in IE with huge datasets
        dataView.sort(comparer, args.sortAsc);
      }
    });

    // wire up model events to drive the grid
    dataView.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render();
    });

    dataView.onRowsChanged.subscribe(function (e, args) {
      grid.invalidateRows(args.rows);
      grid.render();
    });

    dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
      var isLastPage = pagingInfo.pageNum == pagingInfo.totalPages - 1;
      var enableAddRow = isLastPage || pagingInfo.pageSize == 0;
      var options = grid.getOptions();

      if (options.enableAddRow != enableAddRow) {
        grid.setOptions({enableAddRow: enableAddRow});
      }
    });


    var h_runfilters = null;

    // wire up the slider to apply the filter to the model
    $("#pcSlider,#pcSlider2").slider({
      "range": "min",
      "slide": function (event, ui) {
        Slick.GlobalEditorLock.cancelCurrentEdit();

        if (percentCompleteThreshold != ui.value) {
          window.clearTimeout(h_runfilters);
          h_runfilters = window.setTimeout(updateFilter, 10);
          percentCompleteThreshold = ui.value;
        }
      }
    });


    // wire up the search textbox to apply the filter to the model
    $("#txtSearch,#txtSearch2").keyup(function (e) {
      Slick.GlobalEditorLock.cancelCurrentEdit();

      // clear on Esc
      if (e.which == 27) {
        this.value = "";
      }

      searchString = this.value;
      updateFilter();
    });

    function updateFilter() {
      dataView.setFilterArgs({
        percentCompleteThreshold: percentCompleteThreshold,
        searchString: searchString
      });
      dataView.refresh();
    }

    $("#btnSelectRows").click(function () {
      if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
        return;
      }

      var rows = [];
      for (var i = 0; i < 10 && i < dataView.getLength(); i++) {
        rows.push(i);
      }

      grid.setSelectedRows(rows);
    });


    // initialize the model after all the events have been hooked up
    // dataView.beginUpdate();
    // dataView.setItems(data);
    dataView.setFilterArgs({
      percentCompleteThreshold: percentCompleteThreshold,
      searchString: searchString
    });
    dataView.setFilter(myFilter);
    // dataView.endUpdate();

    // if you don't want the items that are not visible (due to being filtered out
    // or being on a different page) to stay selected, pass 'false' to the second arg
    dataView.syncGridSelection(grid, true);

    $("#gridContainer").resizable();


  var lastFilterUpdateHandler = null;

  return {
    update: function(data) {
      dataView.setItems(data);
      dataView.refresh();
      grid.invalidate();
    },

    get_grid: function() {
      return grid;
    },

    get_dataview: function() {
      return dataView;
    },

    /**
    Update filter with a slight of delay
    */
    updateFilter: function(filterArgs) {
      window.clearTimeout(lastFilterUpdateHandler);
      lastFilterUpdateHandler = window.setTimeout(function() {
        dataView.setFilterArgs(filterArgs);
        dataView.refresh();
      }, 10);
    },

    /**
    Filter row so that value in header in the list of values
    e.g. filteRowIn(['VND', 'SSI'], 'symbol')
    */
    filterRowIn: function(values, header) {
      var inValues = values.reduce(function(a,b) {
        a[b] = '';
        return a
      }, {});
      function inFilter(item, args) {
        if(item[args.header] in args.inValues) {
          return true;
        }
        return false;
      }
      dataView.setFilterArgs({
        'header': header,
        'inValues': inValues
      });
      dataView.refresh();
    },

  }
}