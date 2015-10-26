/**
* papaya Lightbox
*
* This provides lightbox and lightbox gallery functionality. It is controlled by data attributes
*
* "data-lightbox"
*
* Contains item data for a single lightbox link, it provides only the item information and will not
* trigger the event handling itsself.
*
* "data-lightbox-link"
*
* Same as "data-lightbox" but makes the link element into a lightbox link.
*
* "data-lightbox-group"
*
* Makes all descendent a elements into lightbox links. The a elements can contain a
* "data-lightbox" element with individual item data.
*
* "data-gallery"
*
* Looks for descendent a elements with an img inside. Makes them into lightbox links and
* connects them to each other (prev/next navigation). The a elements should contain a
* "data-lightbox" attribute with a least the "src" option providing the large image url
*/
(function($) {

  var $window = $(window);
  var $document = $(document);
  var isIE6 = !window.XMLHttpRequest;
  var compatibleOverlay = false;

  var lightbox = {

    defaults : {
      overlayOpacity: 0.8,      // 1 is opaque, 0 is completely transparent (change the color in the CSS file)
      overlayFadeDuration: 400,   // Duration of the overlay fade-in and fade-out animations (in milliseconds)
      resizeDuration: 400,      // Duration of each of the box resize animations (in milliseconds)
      resizeEasing: "swing",      // "swing" is jQuery's default easing
      width: 0,      // width of the box (0 means default handling)
      height: 0,     // height of the box (0 means default handling)
      imageFadeDuration: 400,     // Duration of the image fade-in animation (in milliseconds)
      captionAnimationDuration: 400,    // Duration of the caption animation (in milliseconds)
      closeKeys: [27, 88, 67],    // Array of keycodes to close the lightbox, default: Esc (27), 'x' (88), 'c' (67)
      previousKeys: [37, 80],     // Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
      nextKeys: [39, 78],      // Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
      headerPosition: 'bottom', // header can be in "top" or "bottom" position
      showCaptions : true,
      showLinkAlternate : false,
      sizes : { // standard sizes for the lightbox center, can be resized for the element (images)
        iframe : ['90%', '80%'],
        fragment : ['90%', '80%'],
        image : [250, 250]
      }
    },

    nodes : {
      overlay : null,
      center : null,
      image : null,
      iframe : null,
      fragment : null,
      sizer : null,
      closeLink : null,
      prevLink : null,
      nextLink : null,
      alternateLink : null,
      headerContainer : null,
      header : null,
      caption : null
    },

    currentItem : null,
    options : {},

    hiddenElements : [],
    handlers : {},
    preLoader : null,
    trigger : null,
    headerOffset : 0,

    width : 0,
    height : 0,

    originalSize : false,

    load : function(item, trigger) {
      this.currentItem = item;
      this.trigger = trigger;
      this.options = $.extend(true, {}, this.defaults, item.options.box);
      this.createLazy(item.options.type);
      this.setUp();
      this.stop();
      $(this.nodes.image).hide();
      $(this.nodes.iframe).hide();
      $(this.nodes.fragment).hide();
      $(this.nodes.center).addClass('lightboxLoading').show();
      switch (item.options.type) {
      case 'image' :
        this.loadImage(item);
        break;
      case 'fragment' :
        this.loadFragment(item);
        break;
      case 'iframe' :
        this.loadIframe(item);
        break;
      }
      if (this.options.showCaptions) {
        $(this.nodes.caption).text(item.options.title).show();
      } else {
        $(this.nodes.caption).hide();
      }
      if (item.options.href && this.options.showLinkAlternate) {
        $(this.nodes.alternateLink)
          .attr('href', item.options.href)
          .text(item.options.linkCaption)
          .show();
      } else {
        $(this.nodes.alternateLink)
          .hide();
      }
      $(this.nodes.overlay)
        .css("opacity", this.options.overlayOpacity)
        .fadeIn(this.options.overlayFadeDuration);
    },

    loadImage : function(item) {
      this.preLoader = new Image();
      this.preLoader.onload = $.proxy(this.onImageLoaded, this);
      this.preLoader.src = item.options.src;
    },

    onImageLoaded : function() {
      $(this.nodes.image).css(
        {
          backgroundImage : "url(" + this.currentItem.options.src + ")",
          backgroundSize : "contain",
          visibility : "hidden",
          display : ""
        }
      );
      this.originalSize = {
        width: this.preLoader.width,
        height: this.preLoader.height
      };
      this.resizeDisplay(this.preLoader.width, this.preLoader.height);
      this.show(this.nodes.image);
    },

    resizeDisplay : function(width, height) {
      $(this.nodes.sizer).width(width);
      $([this.nodes.sizer, this.nodes.prevLink, this.nodes.nextLink]).height(height);
    },

    loadIframe : function(item) {
      var defer = new $.Deferred();
      $(this.nodes.iframe).attr('src', item.options.src);
      var timer = 30000;
      var step = 100;
      var target = this.nodes.iframe;
      var interval = window.setInterval(
        function() {
          var targetDocument = target.contentDocument || target.contentWindow.document;
          if (targetDocument &&
               (
                 targetDocument.readyState == 'complete' ||
                 targetDocument.readyState == 'interactive'
               )
             ) {
            defer.resolve();
          } else if (timer <= 0) {
            defer.reject();
          }
          timer -= step;
        },
        step
      );
      defer.always(
        function () {
          window.clearInterval(interval);
        }
      );
      defer.done($.proxy(this.onIframeLoaded, this));
    },

    onIframeLoaded : function() {
      this.show(this.nodes.iframe);
    },

    loadFragment : function(item) {
      var fragment = item.options.fragment;
      $(this.nodes.fragment).load(
        item.options.src + (fragment != '' ? ' ' + fragment : ' *:not(script)'),
        null,
        $.proxy(this.onFragmentLoaded, this)
      );
    },

    onFragmentLoaded : function() {
      this.show(this.nodes.fragment);
    },

    show : function(contentElement) {
      var isTopHeader, $element, width, height, middle, top;
      isTopHeader = this.options.headerPosition == 'top';
      $element = $(contentElement);
      if (this.originalSize && this.originalSize.width > $window.width()) {
        this.resizeDisplay(
          width = $window.width(),
          height = $window.width() * this.originalSize.height / this.originalSize.width
        );
      } else {
        width = $element.outerWidth();
        height = $element.outerHeight();
      }
      if (isTopHeader) {
        $(this.nodes.header).removeClass('bottom').addClass('top');
      } else {
        $(this.nodes.header).removeClass('top').addClass('bottom');
      }
      middle = $window.scrollTop() + ($window.height() / 2);
      top = Math.max(0, middle - (height / 2)) + (this.headerOffset / 2);
      if (
          this.nodes.center.offsetWidth != width ||
          this.nodes.center.offsetHeight != height) {
        $(this.nodes.center).animate(
          {
            width: width,
            height: height,
            top: top,
            marginLeft: -width / 2
          },
          this.options.resizeDuration,
          this.options.resizeEasing
        );
      }
      $(this.nodes.center).removeClass('lightboxLoading');
      if (this.currentItem && this.currentItem.hasPrevious()) $(this.nodes.prevLink).show();
      if (this.currentItem && this.currentItem.hasNext()) $(this.nodes.nextLink).show();
      var that = this;
      $(this.nodes.center).queue(
        function() {
          $(that.nodes.headerContainer).css(
            {
              width: width,
              top: top + (isTopHeader ? -that.headerOffset : height),
              marginLeft: -width / 2,
              visibility: "hidden",
              display: ""
            }
          );
          $(contentElement).css(
            {
              display: "none", visibility: "", opacity: ""
            }
          ).fadeIn(
            that.options.imageFadeDuration,
            function () {
              $(that.nodes.header)
                .css(
                  "marginTop",
                  that.headerOffset
                )
                .animate(
                  { marginTop: 0 },
                  that.options.captionAnimationDuration,
                  function () {
                    $(that.nodes.closeLink).focus();
                  }
                );
              that.nodes.headerContainer.style.visibility = "";
            }
          );
        }
      );
    },

    close : function() {
      this.currentItem = null;
      this.stop();
      $(this.nodes.center).hide();
      $(this.nodes.overlay).stop().fadeOut(
        this.options.overlayFadeDuration, $.proxy(this.tearDown, this)
      );
      if (this.trigger) {
        var $trigger = $(this.trigger);
        if ($trigger.is('a')) {
          $trigger.focus();
        } else if ($trigger.find('a').length > 0) {
          $trigger.find('a').focus();
        } else {
          $trigger.parents('a').focus();
        }
        this.trigger = null;
      }
    },

    createLazy : function(type) {
      if (!this.nodes.overlay) {
        $('body').append(
          $(
            [
              this.nodes.overlay = $('<div class="lightboxOverlay" />')[0],
              this.nodes.headerContainer = $('<div class="lightboxHeaderContainer" />')[0],
              this.nodes.center = $('<div class="lightboxCenter" />')[0]
            ]
          ).css("display", "none")
        );

        this.nodes.image = $('<div class="lightboxImage" />').appendTo(this.nodes.center).append(
          this.nodes.sizer = $('<div style="position: relative;" />').append(
            [
              this.nodes.prevLink = $('<a class="lightboxPrevLink" href="#" />')
                .on('click', $.proxy(this.onClickPrevious, this))[0],
              this.nodes.nextLink = $('<a class="lightboxNextLink" href="#" />')
                .on('click', $.proxy(this.onClickNext, this))[0]
            ]
          )[0]
        )[0];
        this.nodes.iframe = $('<iframe class="lightboxIframe" />').appendTo(this.nodes.center)[0];
        this.nodes.fragment = $('<div class="lightboxFragment" />').appendTo(this.nodes.center)[0];

        this.nodes.header = $('<div class="lightboxHeader top" />').appendTo(this.nodes.headerContainer).append(
          [
            this.nodes.closeLink = $('<a class="lightboxCloseLink" href="#"> </a>')
              .add(this.nodes.overlay)
              .on('click', $.proxy(this.onClickClose, this))[0],
            this.nodes.caption = $('<div class="lightboxCaption" />')[0],
            this.nodes.alternateLink = $('<a class="lightboxLinkAlternate" href="#">foobar</a>')[0],
            this.nodes.number = $('<div class="lightboxNumber" />')[0],
            $('<div style="clear: both;" />')[0]
          ]
        )[0];
      }
      var width = this.options.width;
      var height = this.options.height;
      if (parseInt(width) <= 0) {
        width = this.defaults.sizes[type][0];
      }
      if (parseInt(height) <= 0) {
        height = this.defaults.sizes[type][1];
      }
      this.headerOffset = (this.options.headerPosition == 'top')
        ? $(this.nodes.headerContainer).height()
        : -$(this.nodes.headerContainer).height();
      this.center(
        this.width = this.sizeToPixel(width, $window.width()),
        this.height = this.sizeToPixel(height, $window.height())
      );
    },

    center : function(centerWidth, centerHeight) {
      var middle, top;
      middle = $window.scrollTop() + ($window.height() / 2);
      top = Math.max(0, middle - (centerHeight / 2)) + this.headerOffset;
      $(this.nodes.center).css(
        {
          top: top,
          width: centerWidth,
          height: centerHeight,
          marginLeft: -centerWidth/2
        }
      );
      $([this.nodes.iframe, this.nodes.fragment]).css(
        {
          top: 0,
          left: 0,
          margin: 0,
          width: centerWidth,
          height: centerHeight
        }
      );
      compatibleOverlay = isIE6 || (
        this.nodes.overlay.currentStyle && (this.nodes.overlay.currentStyle.position != "fixed")
      );
      if (compatibleOverlay) {
        this.nodes.overlay.style.position = "absolute";
      }
      var left = $window.scrollLeft(), width = $window.width();
      $([this.nodes.center, this.nodes.headerContainer]).css("left", left + (width / 2));
      if (compatibleOverlay) {
        $(this.nodes.overlay).css(
          {left: left, top: $window.scrollTop(), width: width, height: $window.height()}
        );
      }
    },

    onClickPrevious : function(event) {
      event.stopPropagation();
      event.preventDefault();
      this
        .currentItem
        .fetchPrevious()
        .done(
          function (item) {
            if (item) {
              item.show();
            }
          }
        );
      return false;
    },

    onClickNext : function(event) {
      event.stopPropagation();
      event.preventDefault();
      this
        .currentItem
        .fetchNext()
        .done(
          function (item) {
            if (item) {
              item.show();
            }
          }
        );
      return false;
    },

    onClickClose : function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.close();
      return false;
    },

    onKeyDown : function(event) {
      var code = event.keyCode;
      if ($.inArray(code, this.options.closeKeys) >= 0) {
        return this.onClickClose(event);
      } else if ($.inArray(code, this.options.nextKeys) >= 0) {
        return this.onClickNext(event);
      } else if ($.inArray(code, this.options.previousKeys) >= 0) {
        return this.onClickPrevious(event);
      }
      return false;
    },

    onResize : function(event) {
      event.stopPropagation();
      event.preventDefault();
      var left = $window.scrollLeft(), width = $window.width();
      $([this.nodes.center, this.nodes.headerContainer]).css("left", left + (width / 2));
      if (compatibleOverlay) {
        $(this.nodes.overlay).css(
          {left: left, top: $window.scrollTop(), width: width, height: $window.height()}
        );
      }
    },

    setUp : function() {
      $('object').add(isIE6 ? 'select' : 'embed').each(
        function(index, element) {
          this.hiddenElements[index] = [element, element.style.visibility];
          element.style.visibility = 'hidden';
        }
      );
      $window.on('scroll resize', this.handlers.resize = $.proxy(this.onResize, this));
      $document.on('keydown', this.handlers.keydown = $.proxy(this.onKeyDown, this));
    },

    tearDown : function() {
      $.each(
        this.hiddenElements,
        function(index, element) {
          element[0].style.visibility = element[1];
        }
      );
      this.hiddenElements = [];
      $window.off('scroll resize', this.handlers.resize);
      $document.off('keydown', this.handlers.keydown);
    },

    stop : function() {
      if (this.preLoader) {
        this.preLoader.onload = null;
        this.preLoader.src = "";
      }
      $([this.nodes.center, this.nodes.image, this.nodes.header]).stop(true);
      $([this.nodes.prevLink, this.nodes.nextLink, this.nodes.image, this.nodes.headerContainer]).hide();
    },

    sizeToPixel : function(size, fullSize) {
      if (size.toString().match(/%$/)) {
        var intSize = parseInt(size);
        return Math.floor(intSize * fullSize / 100);
      }
      return size;
    }
  };

  var lightboxLink = {

    options : {
      type : 'fragment', // iframe, fragment, image
      src : '',
      fragment : '*:not(script)',
      title : '',
      href : '',
      linkCaption : 'Download',
      box : {}
    },

    node : null,
    previous : null,
    next : null,

    setUp : function(node, options, previous) {
      this.node = node;
      this.setPrevious(previous);
      this.options = $.extend(true, {}, this.options, options);
      if (this.options.src == '' && node.is('[href]')) {
        this.options.src = node.attr('href');
      }
      if (this.options.title == '' && node.is('[title]')) {
        this.options.title = node.attr('title');
      }
      this.node.on('click', $.proxy(this.onClick, this));
    },

    onClick : function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.show(event.target);
    },

    show : function(trigger) {
      lightbox.load(this, trigger);
    },

    fetchPrevious : function () {
      if (this.hasPrevious()) {
        return $.when($.isFunction(this.previous) ? this.previous() : this.previous);
      } else {
        return $.Deferred().reject(this).promise();
      }
    },

    fetchNext : function () {
      if (this.hasNext()) {
        return $.when($.isFunction(this.next) ? this.next() : this.next);
      } else {
        return $.Deferred().reject(this).promise();
      }
    },

    setPrevious : function (previous) {
      if (this.previous != previous) {
        this.previous = previous;
        if (previous && previous.setNext) {
          previous.setNext(this);
        }
      }
    },

    setNext : function (next) {
      if (this.next != next) {
        this.next = next;
        if (next && next.setPrevious) {
          next.setPrevious(this);
        }
      }
    },

    hasPrevious : function () {
      return (typeof this.previous != 'undefined' && this.previous != null);
    },

    hasNext : function () {
      return (typeof this.next != 'undefined' && this.next != null);
    }
  };

  $.fn.papayaLightboxLink = function(options, previousGroup, nextGroup) {
    if (typeof previousGroup == 'undefined') {
      previousGroup = null;
    }
    if (typeof nextGroup == 'undefined') {
      nextGroup = null;
    }
    var previous = null, first = null;
    options = $.extend(true, {}, options);
    return this.each(
      function () {
        var instance = $.extend(true, {}, lightboxLink);
        instance.setUp(
          $(this),
          $.extend(
            true, {}, options, $(this).data('lightbox'), $(this).data('lightboxLink')
          ),
          options.allowNavigation ? previous : null
        );
        if (options.allowNavigation) {
          if (first == null) {
            first = instance;
            if (previousGroup) {
              first.setPrevious(previousGroup);
            }
          } else if (nextGroup) {
            instance.setNext(nextGroup);
          } else if (options.continious) {
            instance.setNext(first);
          }
          previous = instance;
        }
      }
    );
  };

  $.fn.papayaGallery = function(options) {
    $(this).each(
      function () {
        $(this).find('a:has(img)').papayaLightboxLink(
          $.extend(
            true,
            options,
            $(this).data('gallery'),
            {
              allowNavigation: true,
              type : 'image'
            }
          )
        );
      }
    );
  };

})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('[data-lightbox-link]').papayaLightboxLink();
    jQuery('[data-lightbox-group]').each(
      function() {
        $(this)
          .find('a')
          .papayaLightboxLink(
            $(this).data('lightboxGroup')
          );
      }
    );
    jQuery('[data-gallery]').papayaGallery();
  }
);
