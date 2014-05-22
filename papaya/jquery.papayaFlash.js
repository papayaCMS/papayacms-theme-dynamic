/**
* papaya Flash
*
* registers found flash files using the swfobject
*/
(function($) {

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaFlash = function() {
    return this.each(
      function() {
        var elementId = $(this).attr('id');
        var options = $(this).data('swfobject');
        if (elementId && elementId != '') {
          swfobject.registerObject(
            elementId,
            options.version,
            options.installer
          );
        }
      }
    );
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('object[data-swfobject]').papayaFlash();
  }
);