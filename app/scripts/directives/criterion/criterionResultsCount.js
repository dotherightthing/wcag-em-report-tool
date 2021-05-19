'use strict';
angular.module('wcagReporter')
  .directive('criterionResultsCount', function (directivePlugin, evalSampleModel, selectedCasesOnlyFilter) {
    function singlePageAssert (scope) {
      var pages = evalSampleModel.getFilledPages();
      var asserts = scope.criterion.getSinglePageAsserts();

      return selectedCasesOnlyFilter(asserts)
        .sort(function (assertA, assertB) {
          return pages.indexOf(assertA.subject[0]) - pages.indexOf(assertB.subject[0]);
        });
    }

    // TODO: update the count if the .result-select is used to change a result outcome
    function testedSinglePageAssert (singlePageAssert) {
      var results = [];

      for (var i = 0; i < singlePageAssert.length; i++) {
        if (singlePageAssert[i].result.outcome !== 'earl:untested') {
          results.push(singlePageAssert[i]);
        }
      }

      return results;
    }

    return directivePlugin({
      restrict: 'E',
      replace: true,
      transclude: true,
      scope: {
        criterion: '=assert',
        opt: '=options'
      },

      controller: [
        '$scope',
        function ($scope) {
          if ($scope.opt.editable) {
            $scope.criterion.setCaseForEachPage();
          }

          $scope.$on('audit:sample-change', function () {
            $scope.singlePageAsserts = singlePageAssert($scope);
            $scope.testedSinglePageAsserts = testedSinglePageAssert($scope.singlePageAsserts);
          });
        }
      ],

      link: function (scope) {
        scope.singlePageAsserts = singlePageAssert(scope);
        scope.testedSinglePageAsserts = testedSinglePageAssert(scope.singlePageAsserts);
      },
      // singlePageAsserts.length outputs length of array
      templateUrl: 'views/directives/criterion/criterionResultsCount.html'
    });
  });
