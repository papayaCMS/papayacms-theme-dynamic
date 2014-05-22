/**
* papaya PopUp
*
* A simple object used by navigation links to open a popup.
*/
(function($) {

  var currentPopUp = null;
  var currentPopUpName = '';

  var popup = {

    element : null,
    href : null,
    target : null,

    options : {
      width : '500px',
      height : '600px',
      top : null,
      left : null,
      resizable : false,
      scrollBars : 'auto',
      toolBar : false,
      menuBar : false,
      locationBar : false,
      statusBar : false
    },

    /**
     * Store options and attach event handler
     *
     * @param element
     * @param options
     */
    setUp : function(element, options) {
      this.element = element;
      this.href = element.attr('href');
      this.target = element.attr('target') != '' ? element.attr('target') : 'popup';
      this.options = $.extend(this.options, options);
      this.element.click($.proxy(this.onClick, this));
    },

    /**
     * Event handler, open the popup and block default click handling if that was successful
     * @param event
     * @returns {Boolean}
     */
    onClick : function(event) {
      if (this.open(this.href, this.target, this.options)) {
        event.preventDefault();
        return false;
      }
      return true;
    },

    /**
     * Open a popup
     *
     * @param {String} url
     * @param {String} target
     * @param {Object} options
     * @returns {Boolean}
     */
    open : function(url, target, options) {
      var newPopUpName = target+'_'+options.width+'_'+options.height;
      var position = this.encodePosition(newPopUpName, options);

      var newPopUp = window.open(
        url,
        newPopUpName,
        this.encodeOptions(options) + position
      );

      if(newPopUp) {
        /* tries to put the newly created window in the foreground
           in case it had been opened before */
        newPopUp.focus();
      }
      currentPopUp = newPopUp;

      if (url.match(/^[a-z]+:/)) {
        currentPopUpName = '';
      } else {
        currentPopUpName = newPopUpName;
      }

      return (newPopUp) ? true : false;
    },

    /**
     * Encode the options into an string useable in window.open()
     *
     * @param {Object} options
     * @returns {String}
     */
    encodeOptions : function(options) {
      var result = 'dependent=yes';
      result += ',width='+options.width;
      result += ',height='+options.height;
      result += ',scrollbars='+options.scollBars;
      result += ',resizable='+(options.resizable ? 'yes' : 'no');
      result += ',toolbar='+(options.toolbar ? 'yes' : 'no');
      result += ',menubar='+(options.menuBar ? 'yes' : 'no');
      result += ',location='+(options.locationBar ? 'yes' : 'no');
      result += ',status='+(options.statusBar ? 'yes' : 'no');
      return result;
    },

    /**
     * Encode the position, if the current opup has the same target, try to close it.
     *
     * @param {String} newPopUpName
     * @param {Object} options
     * @returns {String}
     */
    encodePosition : function(newPopUpName, options) {
      if (typeof currentPopUp != undefined && currentPopUp != null) {
        if (!currentPopUp.closed) {
          if (currentPopUpName != newPopUpName) {
            if (currentPopUpName != '') {
              if (currentPopUp.screenX) {
                 return ',screenX='+currentPopUp.screenX+',screenY='+currentPopUp.screenY+
                        ',left='+currentPopUp.screenX+',top='+currentPopUp.screenY;
              } else {
                return ',screenX='+currentPopUp.screenLeft+',screenY='+currentPopUp.screenTop+
                       ',left='+currentPopUp.screenLeft+',top='+currentPopUp.screenTop;
              }
            } else {
              positionStr = '';
            }
            currentPopUp.close();
          }
        }
      } else if (options.left != null && options.top != null) {
        return ',screenX='+options.left+',screenY='+options.top+
          ',left='+options.left+',top='+options.top;
      } else if (options.left != null) {
        return ',screenX='+options.left+',left='+options.left;
      } else if (options.top != null) {
        return ',screenY='+options.top+',top='+options.top;
      } else {
        return '';
      };
    }
  };

  /**
   * Method to open an popup directly
   */
  $.papayaPopUp = function(url, target, width, height, options) {
    options = $.extend({}, popup.options, options);
    options.width = width;
    options.height = height;
    return !popup.open(url, target, options);
  };

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaPopUp = function(options) {
    var setUp =  function() {
      var instance = $.extend(true, {}, popup);
      instance.setUp($(this), $.extend({}, options, $(this).data('popup')));
    };
    if ($.papayaFragmentLoader) {
      $.papayaFragmentLoader.attach(this.selector, setUp);
    }
    return this.each(setUp);
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('a[data-popup]').papayaPopUp();
  }
);

/* bc compatibility to generated links */
var openPopup = function(url, target, width, height, options) {
  return jQuery.papayaPopUp(url, target, width, height, options);
};