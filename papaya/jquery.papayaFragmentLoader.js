/**
* papaya Background Link, loads links and forms using ajax-requests an replaces
* the specified part of the current page with one of the returned page.
*
* data-fragment can contain a string or an json object. If it is an string it is the selector of
* the part to replace and the part of the loaded page it is replaced with. The url of the
* page to load is fetch from the href or action attribute.
*
* If it is an empty string the body is replaced.
*
* In a json array each of these values can be configured directly.
*/
(function($) {

  var link = {

    element : null,

    options : {
      'url' : '',
      'selector' : 'body',
      'replacement' : '',
      'trigger' : false
    },

    setUp : function (element, options) {
      this.element = element;
      this.options = $.extend(this.options, options);
      if (this.options.url == '') {
        if (element.is('[href]')) {
          this.options.url = element.attr('href');
        } else if (element.is('[action]')) {
          this.options.url = element.attr('action');
        }
      }
      if (this.options.url != '') {
        if (this.options.trigger = true) {
          this.fetch(false);
        } else if (element.is('form')) {
          element
            .off('submit')
            .on('submit', $.proxy(this.onClick, this));
        } else {
          element
            .off('click')
            .on('click', $.proxy(this.onClick, this));
        }
      }
    },

    onClick : function (event) {
      event.preventDefault();
      this.fetch(false);
    },

    onSubmit : function (event) {
      event.preventDefault();
      this.fetch(true);
    },

    fetch : function (withData) {
      var selector = this.options.selector;
      var fragment = this.options.replacement;
      if (fragment == '') {
        fragment = this.options.selector;
      }
      $(selector != '' ? selector : 'body')
        .load(
          this.options.url + (fragment != '' ? ' ' + fragment : ''),
          withData ? this.element.serializeArray() : null,
          function () {
            if (selector != '') {
              $.papayaFragmentLoader($(fragment));
            }
          }
        );
    }
  };

  var replace = {

    options : {
      'url' : ''
    },

    setUp : function (element, options) {
      this.element = element;
      this.options = $.extend(this.options, options);
      if (this.options.url == '') {
        if (element.is('[href]')) {
          this.options.url = element.attr('href');
        } else if (element.is('[action]')) {
          this.options.url = element.attr('action');
        }
      }
      element
        .addClass('fragmentLoading')
        .load(
          this.options.url,
          function () {
            element.removeClass('fragmentLoading');
          }
        );
    }
  };

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaFragmentLoader = function(options) {
    var setUp = function() {
      var instance = $.extend(true, {}, link);
      var data = $(this).data('fragment');
      if (typeof data == 'string') {
        data = {
          'selector' : data
        };
      }
      data = $.extend(true, options, data);
      instance.setUp($(this), $.extend({}, data));
    };
    $.papayaFragmentLoader.attach(this.selector, setUp);
    return this.each(setUp);
  };

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaFragmentReplace = function(options) {
    var setUp = function() {
      var instance = $.extend(true, {}, replace);
      var data = $(this).data('fragmentReplace');
      if (typeof data == 'string') {
        data = {
          'url' : data
        };
      }
      data = $.extend(true, options, data);
      instance.setUp($(this), $.extend({}, data));
    };
    $.papayaFragmentLoader.attach(this.selector, setUp);
    return this.each(setUp);
  };

  var setUps = [];

  $.papayaFragmentLoader = function(fragment) {
    var setUp;
    for (var i in setUps) {
      setUp = setUps[i];
      fragment.find(setUp.selector).each(setUp.callback);
    }
  };

  $.papayaFragmentLoader.attach = function(selector, callback) {
    setUps.push(
      { selector : selector, callback : callback }
    );
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('[data-fragment]').papayaFragmentLoader();
    jQuery('[data-fragment-replace]').papayaFragmentReplace();
  }
);