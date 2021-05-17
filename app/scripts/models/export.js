'use strict';
/**
 *
 */
angular.module('wcagReporter')
  .factory('wcagReporterExport', function (evalModel, reportStorage, pkgData, $rootScope) {
    function getJsonLd () {
      var jsonLd = {
        '@context': evalModel.context,
        type: evalModel.type,
        id: evalModel.id,
        publisher: 'reporter:releases/tag/' + pkgData.version,
        lang: $rootScope.lang
      };

      jsonLd.evaluationScope = evalModel.scopeModel.exportData();
      jsonLd.auditResult = evalModel.auditModel.exportData();

      angular.extend(
        jsonLd,
        evalModel.reportModel.exportData(),
        evalModel.sampleModel.exportData(),
        evalModel.exploreModel.exportData()
      );

      return jsonLd;
    }

    var exportModel = {

      storage: reportStorage,

      saveToUrl: function () {
        return reportStorage.post(exportModel.getJson());
      },

      getJson: function () {
        return {
          '@graph': [getJsonLd()].concat(evalModel.otherData)
        };
      },

      getString: function () {
        return angular.toJson(exportModel.getJson(), true);
      },

      getBlobUrl: function (blob) {
        try {
          blob = blob || exportModel.getBlob();
          return (window.URL || window.webkitURL).createObjectURL(blob);
        } catch (e) {
          console.error(e);
        }
      },

      saveBlobIE: function (blob, filename) {
        blob = blob || exportModel.getBlob();
        filename = filename || exportModel.getFileName();

        if (window.navigator.msSaveOrOpenBlob) {
	            window.navigator.msSaveBlob(blob, filename);
	        }
      },

      // BLOB = Binary Large OBject
      // https://stackoverflow.com/a/30881444
      getBlob: function (data, type) {
        data = data || exportModel.getString();
        type = type || 'application/json;charset=utf-8';
        return new Blob([data], { type: type });
      },

      getFileName: function (ext) {
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var date = d.getDate();

        if (month < 10) {
          month = `0${month}`;
        }

        if (date < 10) {
          date = `0${date}`;
        }

        var titleDate = `${year}${month}${date}`;
        var title = (evalModel.scopeModel.website.siteName + ' evaluation report-' + titleDate);
        ext = ext || 'json';
        title = title.trim();

        return title.replace(/(^\-+|[^a-zA-Z0-9\/_| -]+|\-+$)/g, '')
          .toLowerCase()
          .replace(/[\/_| -]+/g, '-') + '.' + ext;
      }
    };

    reportStorage.exportModel = exportModel;

    return exportModel;
  });
