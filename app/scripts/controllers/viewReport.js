'use strict';

angular.module('wcagReporter')
  .controller('ViewReportCtrl', function (
    $scope,
    $document,
    wcag2spec,
    evalModel,
    appState,
    wcagReporterExport,
    toggleCriterionText,
    $http
  ) {
    var author = evalModel.reportModel.creator.name || '';
    var htmlBlob, html;
    var subject = 'Web Accessibility Report';
    var title = evalModel.reportModel.title;

    // Track Object URLs to manage the browser memory.
    // https://www.bennadel.com/blog/3472-downloading-text-using-blobs-url-createobjecturl-and-the-anchor-download-attribute-in-javascript.htm
    var pdfBlob = null;

    $scope.state = appState.moveToState('viewReport');
    $scope.scope = evalModel.scopeModel;
    $scope.explore = evalModel.exploreModel;

    $scope.filledPages = function () {
      return evalModel.sampleModel.getFilledPages();
    };

    $scope.wcag2specReady = wcag2spec.isLoaded();
    $scope.$on('wcag2spec:langChange', function () {
      $scope.wcag2specReady = true;
    });

    $scope.report = evalModel.reportModel;
    var tpl = [
      '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="utf-8">' +
    '<title>' + evalModel.reportModel.title + '</title>' +
    '<script>' + toggleCriterionText.toString()
        .replace('function (a)', 'function toggleCriterionText(a)') + '</script>' +
    '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" />' +
    '<link rel="stylesheet" href="report.css" />' +
    '</head><body><div class="container reporter-view">',
      '</div></body></html>'
    ];

    $scope.$on('reportReady', function (e, data) {
      // html
      html = tpl[0] + data.html() + tpl[1];

      htmlBlob = wcagReporterExport.getBlob(html, 'text/html;charset=utf-8');
      $document.find('#html_download_link')
        .attr(
          'href',
          wcagReporterExport.getBlobUrl(htmlBlob)
        );

      // pdf
      $http.post('http://localhost:3000/pdf/create', {
        author: author,
        html: html,
        subject: subject,
        title: title
      })
        .then(function (response) {
          const pdf = response.data;

          $http.get(pdf, { responseType: 'blob' })
            .then(function (blob) {
              // release the previous Object URL in browser memory
              // https://www.bennadel.com/blog/3472-downloading-text-using-blobs-url-createobjecturl-and-the-anchor-download-attribute-in-javascript.htm
              // "Reload Site?"
              if (pdfBlob) {
                URL.revokeObjectURL(pdfBlob);
              }

              // blob:http://localhost:9000/29abdcd2-0ba8-4a6d-bb34-0bba6a623c3d
              pdfBlob = wcagReporterExport.getBlob(blob.data, 'application/pdf');

              $document.find('#pdf_download_link')
                .attr(
                  'href',
                  wcagReporterExport.getBlobUrl(pdfBlob)
                );
            });
        })
        .catch(function (response) {
          console.error(response.status, response.data);
        });
    });

    $scope.downloadJsonStart = function () {
      wcagReporterExport.saveBlobIE();
      appState.setPrestineState();
    };

    $scope.saveHtmlBlobIE = function () {
      if (htmlBlob) {
        wcagReporterExport.saveBlobIE(htmlBlob, $scope.exportHtmlFile);
      }
    };

    $scope.savePdfBlobIE = function () {
      if (pdfBlob) {
        wcagReporterExport.saveBlobIE(pdfBlob, $scope.exportPdfFile);
      }
    };

    $scope.exportHtmlFile = wcagReporterExport.getFileName('html');
    $scope.exportPdfFile = wcagReporterExport.getFileName('pdf');
    $scope.exportJsonUrl = wcagReporterExport.getBlobUrl();
    $scope.exportJsonFile = wcagReporterExport.getFileName();
  });
