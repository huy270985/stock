angular.module('superstockApp')
    .directive('categoryHeader', function() {
        function link(scope) {


            console.log(scope.gridOptions.columnDefs);
            scope.headerRowHeight = 30;
            scope.catHeaderRowHeight = scope.headerRowHeight + 'px';
            scope.categories = [];
            var lastDisplayName = "";
            var totalWidth = 0;
            var left = 0;
            cols = scope.gridOptions.columnDefs;
            for (var i = 0; i < cols.length; i++) {



                totalWidth += Number(cols[i].width);


                var displayName = (typeof(cols[i].categoryDisplayName) === "undefined") ?
                    "\u00A0" : cols[i].categoryDisplayName;

                if (displayName !== lastDisplayName) {

                    scope.categories.push({
                        displayName: lastDisplayName,
                        width: totalWidth - Number(cols[i].width),
                        widthPx: (totalWidth - Number(cols[i].width)) + 'px',
                        left: left,
                        leftPx: left + 'px'
                    });

                    left += (totalWidth - Number(cols[i].width));
                    totalWidth = Number(cols[i].width);
                    lastDisplayName = displayName;
                }
            }

            if (totalWidth > 0) {

                scope.categories.push({
                    displayName: lastDisplayName,
                    width: totalWidth,
                    widthPx: totalWidth + 'px',
                    left: left,
                    leftPx: left + 'px'
                });
            }

        }
        return {


            templateUrl: 'scripts/directives/templates/category_header.html',
            link: link
        };
    });