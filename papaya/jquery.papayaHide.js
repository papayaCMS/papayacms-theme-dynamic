/**
* papaya Javascript Hide, a simple plugin that hides the elements, containing the
* data-hide attribute.
*
* It registers the callback function at the papayaFragmentLoader if it exists, so
* it will be called for loaded fragments, too.
*
*/
(function($) {

  /**
   * Hide elements
   */
  $.fn.papayaHide = function() {
    var setUp = function() {
      $(this).hide();
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
      '[data-hide]'
    ).papayaHide();
  }
);