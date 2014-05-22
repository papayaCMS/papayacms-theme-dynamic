/**
* papaya Svg Urls
*
* Captures img elements with
*/
(function($) {

  var svgSupport = (
    !!document.createElementNS &&
    !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect
  );

  var imageSources = {

    options : {
      'svg' : ''
    },

    node : null,
    preLoader : null,


    setUp : function (node, options) {
      this.options = $.extend(this.options, options);
      this.node = node;
      if (svgSupport && options.svg != '') {
        this.preLoader = new Image();
        this.preLoader.onload = $.proxy(this.onImageLoaded, this);
        this.preLoader.src = this.options.svg;
      }
    },

    onImageLoaded : function() {
      this.node.attr('src', this.options.svg);
    }

  };

  /**
   * Method to attach an click event to element that opens a popup
   */
  $.fn.papayaImageSources = function(options) {
    var setUp =  function() {
      var instance = $.extend(true, {}, imageSources);
      instance.setUp($(this), $.extend({}, options, { svg : $(this).data('srcSvg') }));
    };
    if ($.papayaFragmentLoader) {
      $.papayaFragmentLoader.attach(this.selector, setUp);
    }
    return this.each(setUp);
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('img[data-src-svg]').papayaImageSources();
  }
);