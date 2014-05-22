/**
* papaya Javascript submit, attaches submit actions to js event of form controls-
*
* The attribute 'data-submit-trigger' can contain the events separated by whitespaces.
*
* Example:
*   <input type="checkbox" data-submit-trigger="click"/>
*
*/
(function($) {

  var trigger = {

    element : null,

    options : {
      'events' : ''
    },

    setUp : function (element, options) {
      this.element = element;
      this.options = $.extend(this.options, options);
      var form = element.prop('form');
      if (form) {
        element.on(
          this.options.events,
          function(event) {
            event.stopPropagation();
            form.submit();
          }
        );
      }
    }
  };

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaSubmitTriggers = function(options) {
    var setUp = function() {
      var instance = $.extend(true, {}, trigger);
      var data = {};
      if ($(this).data('submitTrigger') != '') {
        data.events = $(this).data('submitTrigger');
      }
      instance.setUp($(this), $.extend({}, options, data));
    };
    if ($.papayaFragmentLoader) {
      $.papayaFragmentLoader.attach(this.selector, setUp);
    }
    return this.each(setUp);
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery(
      'input[data-submit-trigger][type=checkbox],input[data-submit-trigger][type=radio]'
    ).papayaSubmitTriggers(
      {
        events : 'click'
      }
    );
    jQuery(
      'select[data-submit-trigger]'
    ).papayaSubmitTriggers(
      {
        events : 'change'
      }
    );
  }
);