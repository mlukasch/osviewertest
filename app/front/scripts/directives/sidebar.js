;(function(angular) {

  var app = angular.module('Application');

  app.directive('sidebar', [
    '_',
    function(_) {
      return {
        templateUrl: 'templates/sidebar.html',
        replace: false,
        restrict: 'E',
        scope: {
          type: '@',
          state: '=',
          events: '='
        },
        link: function($scope) {
          $scope.getHierarchyName = function(hierarchy) {
            if (!hierarchy) {
              return;
            }
            return hierarchy.common ? 'Other Dimensions' : hierarchy.name;
          };

          function updateHierarchies(items) {
            $scope.hierarchies = _.filter(items, function(item) {
              return !item.common;
            });

            $scope.locationHierarchies = _.chain(items)
              .map(function(hierarchy) {
                var result = _.extend({}, hierarchy);
                result.dimensions = _.filter(hierarchy.dimensions,
                  function(item) {
                    return item.dimensionType == 'location';
                  });
                if (result.dimensions.length > 0) {
                  return result;
                }
              })
              .filter()
              .value();

            $scope.datetimeHierarchies = _.chain(items)
              .map(function(hierarchy) {
                var result = _.extend({}, hierarchy);
                result.dimensions = _.filter(hierarchy.dimensions,
                  function(item) {
                    return item.dimensionType == 'datetime';
                  });
                if (result.dimensions.length > 0) {
                  return result;
                }
              })
              .filter()
              .value();
          }

          if ($scope.state && $scope.state.hierarchies) {
            updateHierarchies($scope.state.hierarchies);
          }

          $scope.$watchCollection('state.hierarchies', function(items) {
            updateHierarchies(items);
          });

          function updateSelectedHierarchies(currentGroups) {
            var result = [];
            _.forEach($scope.state.dimensions.items, function(dimension) {
              var isSelected = !!_.find(currentGroups, function(group) {
                return dimension.key == group;
              });
              if (isSelected) {
                result.push(dimension.hierarchy);
              }
            });
            $scope.selectedHierarchies = result;
          }

          if (
            $scope.state &&
            $scope.state.dimensions &&
            $scope.state.dimensions.current &&
            $scope.state.dimensions.current.groups
          ) {
            updateSelectedHierarchies($scope.state.dimensions.current.groups);
          }

          function isSelectionValid(selection, hierarchies) {
            var allowedKeys = [];
            _.forEach(hierarchies, function(hierarchy) {
              _.forEach(hierarchy.dimensions, function(dimension) {
                allowedKeys.push(dimension.key);
              });
            });

            var result = true;
            _.forEach(selection, function(key) {
              if (allowedKeys.indexOf(key) < 0) {
                result = false;
                return false;
              }
            });

            return result;
          }

          function updateSelections(type) {
            if (!$scope.events) {
              return;
            }
            var hierarchies = null;
            if (type) {
              switch (type) {
                case 'location':
                  hierarchies = $scope.locationHierarchies;
                  break;
                case 'time-series':
                  hierarchies = $scope.datetimeHierarchies;
                  break;
                default:
                  hierarchies = $scope.hierarchies;
                  break;
              }
            }

            if (!hierarchies) {
              return;
            }

            var isGroupValid = isSelectionValid(
              $scope.state.dimensions.current.groups, hierarchies);
            var isRowsValid = isSelectionValid(
              $scope.state.dimensions.current.rows, hierarchies);
            var isColumnsValid = isSelectionValid(
              $scope.state.dimensions.current.columns, hierarchies);
            var isSeriesValid = isSelectionValid(
              $scope.state.dimensions.current.series, hierarchies);

            var hierarchy = _.first(hierarchies);
            if (hierarchy && hierarchy.dimensions) {
              var dimension = _.first(hierarchy.dimensions);
              if (dimension) {
                if (!isGroupValid) {
                  $scope.events.changeGroup(dimension.key, true);
                }
                if (!isRowsValid) {
                  $scope.events.changePivot('rows', dimension.key, true);
                }
                if (!isColumnsValid) {
                  $scope.events.changePivot('columns', dimension.key, true);
                }
              }
            }

            if (!isSeriesValid) {
              $scope.events.dropPivot('series', null, true);
            }
          }
          updateSelections($scope.type);
          $scope.$watch('type', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              updateSelections($scope.type);
            }
          });

          $scope.$watchCollection('state.dimensions.current.groups',
            function(currentGroups) {
              updateSelectedHierarchies(currentGroups);
            });

          $scope.$on('sidebarList.changeItemSelection',
            function($event, item, isSelected, key) {
              if ($scope.events) {
                switch ($scope.type) {
                  case 'drilldown':
                    var dimension = _.first(item.dimensions);
                    if (dimension) {
                      $scope.events.changeGroup(dimension.key, true);
                    }
                    break;
                  case 'pivot-table':
                    if (isSelected) {
                      $scope.events.changePivot(key, item.key);
                    } else {
                      $scope.events.dropPivot(key, item.key);
                    }
                    break;
                  case 'sortable-series':
                    if (key == 'group') {
                      $scope.events.changeGroup(item.key, true);
                    } else {
                      if (isSelected) {
                        $scope.events.changePivot(key, item.key, true);
                      } else {
                        $scope.events.dropPivot(key, item.key, true);
                      }
                    }
                    break;
                  case 'time-series':
                    $scope.events.changeGroup(item.key, true);
                    $scope.events.toggleOrderBy(item.key, 'asc', true);
                    break;
                  case 'location':
                    $scope.events.changeGroup(item.key, true);
                    break;
                }
              }
              $event.stopPropagation();
            });
        }
      };
    }
  ]);
})(angular);
