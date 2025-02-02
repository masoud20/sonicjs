/**
 * Formatting Service -
 * The formatting serivce is responsible for simple formatting needs of the system. IE date formats, title formating, etc
 * @module formattingervice
 */

//check if running in node (and not the browser)
if (typeof module !== "undefined" && module.exports) {
  var moment = require("moment");
}

(function (exports) {
  (exports.formatDates = async function (data, dateOnly = false) {
    let dateFormat = dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD, h:mm:ss a";

    data.forEach((element) => {
      if (element.data) {
        if (element.updatedOn) {
          let day = moment(element.updatedOn);
          element.updatedOnFormatted = moment(day).format(dateFormat);
        }
        if (element.createdOn) {
          let day = moment(element.createdOn);
          element.createdOnFormatted = moment(day).format(dateFormat);
        }
      }
    });
  }),
    (exports.formatTitles = async function (data) {
      let length = 50;
      data.forEach((element) => {
        if (element.data) {
          if (!element.data.title) {
            let sourceCopy = "";
            if (element.data.body) {
              sourceCopy = element.data.body;
            } else if (element.data.text) {
              sourceCopy = element.data.text;
            } else if (element.data.contentType) {
              sourceCopy = element.data.contentType;
            }
            let rawBody = this.stripHtmlTags(sourceCopy);
            if (rawBody) {
              element.data.title = rawBody.substring(0, length);
              if (rawBody.length > length) {
                element.data.title += "...";
              }
            }
          }
        }
      });
    }),
    (exports.stripHtmlTags = function (str) {
      if (str === null || str === "") return false;
      else str = str.toString();
      return str.replace(/<[^>]*>/g, "");
    });
    (exports.truncateStringAndClearNewLines = function (body, length) {
      if (body) {
        let noTags = this.stripHtmlTags(body);
        let cleanHtml = noTags.replace(/(\r\n|\n|\r)/gm," ")
        .substring(0, 450);
  
        return cleanHtml.length > length
          ? cleanHtml.substr(0, length - 1) + "..."
          : cleanHtml;
      }
    }),
  exports.generateModuleDivWrapper = function (
    id,
    wrapperCss,
    wrapperStyles,
    shortCodeName,
    contentType,
    body,
    isInTemplateRegion = false,
    usesPageTemplate = false
  ) {
    if (shortCodeName === "PAGE-TEMPLATES") {
      return body;
    }

    if (usesPageTemplate && !isInTemplateRegion) {
      wrapperCss = wrapperCss.replace("module", "module-template");
    }

    return `<div class="${wrapperCss}" style="${wrapperStyles}" data-id="${id}" data-module="${shortCodeName}" data-content-type="${contentType}" 
      data-template-region=${isInTemplateRegion} data-template-page=${usesPageTemplate}>${body}</div>`;
  };
})(typeof exports === "undefined" ? (this["formattingService"] = {}) : exports);
