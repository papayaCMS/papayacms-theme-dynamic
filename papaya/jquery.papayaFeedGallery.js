/**
* papaya Feed Gallery
*
* This is a gallery script that can use an media-rss feed as data source. If no feed is provided
* the script loos for link[rel=alternate]. If this is not found it falls back to the
* standard papaya Gallery (part of jquery.papayaLightbox.js)
*
* The script look for an attribute "data-feed-gallery" this attribute can contain
* an json object with options for the gallery.
*
*/
(function($) {

  var gallery = {

    xmlns : {
      'rss' : '',
      'atom' : 'http://www.w3.org/2005/Atom',
      'media-rss' : 'http://search.yahoo.com/mrss/'
    },

    /**
     * Options
     */
    options : {
      feed : false, // media-rss feed url
      useGlobalFeed : true, // try to find a media-rss feed in head if no feed was specified
      template : 'div.galleryThumbnail', // selector for the thumbnail html element
      fadeDuration : 3000, // fading animation duration
      navigation : 'both', // position of the page navigation (top, bottom, both)
      captionLinkNext : '⇒', // caption for the next link
      captionLinkPrevious : '⇐', // caption for the previous link
      box : {}
    },

    $template : null,

    $container : null,
    $thumbnails : null,
    $navigations : null,
    $buttons : {
      next : null,
      previous : null
    },

    loading : false,

    setUp : function($node, options) {
      this.$container = $node;
      this.options = $.extend(this.options, options);
      this.template = this.getThumbnailTemplate(this.options.template);
      if (this.options.useGlobalFeed && !this.options.feed) {
        this.options.feed = this.getFeedUrlFromDocument();
      }
      if (this.options.feed && this.options.feed != '') {
        this.createGallery();
        this.fetchFeed(this.options.feed);
      } else {
        $node.papayaGallery(
          $.extend(
            true,
            $node.data('feedGallery'),
            {
               type : 'image',
               continious : false,
               allowNavigation : true
            }
          )
        );
      }
    },

    /**
    * Extract feed url from html head
    *
    * @return string
    */
    getFeedUrlFromDocument : function() {
      var feedLink = $('link[rel=alternate][type="application/rss+xml"]');
      if (feedLink.length > 0) {
        return feedLink.attr('href');
      }
      return false;
    },

    fetchFeed : function(url) {
      var that = this;
      var defer = $.Deferred();
      this.isLoading(true);
      $.get(url)
        .done(
          function (xml) {
            that
              .readFeed(xml)
              .done(
                function() {
                  defer.resolve();
                }
              )
              .fail(
                function() {
                  defer.reject();
                }
              );
          }
        )
        .fail(
          function () {
            defer.reject();
          }
        );
      defer.always(
        function () {
          that.isLoading(false);
        }
      );
      return defer.promise();
    },

    readFeed : function(xml) {
      var defer = $.Deferred();
      var gallery = this;
      $(xml).xmlns(
        this.xmlns,
        function() {
          gallery.$thumbnails.empty();
          var next = gallery.nextFeed = this.find('atom|link[rel=next]').attr('href');
          var previous = gallery.previousFeed = this.find('atom|link[rel=previous]').attr('href');
          if (next) {
            gallery.$buttons.next.show();
          } else {
            gallery.$buttons.next.hide();
          }
          if (previous) {
            gallery.$buttons.previous.show();
          } else {
            gallery.$buttons.previous.hide();
          }
          this.find('rss|item').each(
            function() {
              var $item = $(this);
              var $thumbnail = gallery.$template.clone();
              $thumbnail
                .find('a')
                .attr(
                  {
                    'href' : $item.find('rss|link').text()
                  }
                )
                .data(
                  {
                    'lightbox' : {
                      src : $item.find('media-rss|content').attr('url'),
                      title : $item.find('media-rss|title').text(),
                      href : $item.find('rss|link').text()
                    }
                  }
                );
              $thumbnail
                .find('img')
                .off('load')
                .on('load', function() { $thumbnail.fadeIn(gallery.options.fadeDuration); } )
                .attr('src', $item.find('media-rss|thumbnail').attr('url'));
              $thumbnail.appendTo(gallery.$thumbnails);
            }
          );
          gallery.$thumbnails.find('a').papayaLightboxLink(
            {
              type : 'image',
              continious : false,
              allowNavigation : true
            },
            previous
              ? function () {
                return gallery
                  .fetchFeed(previous)
                  .done(
                    function () {
                      gallery.$thumbnails.find('a').last().click();
                    }
                  );
              }
              : null
            ,
            next
              ? function () {
                return gallery
                  .fetchFeed(next)
                  .done(
                    function () {
                      gallery.$thumbnails.find('a').first().click();
                    }
                  );

              }
              : null
          );
          defer.resolve();
        }
      );
      return defer.promise();
    },

    /**
    * Replace container with gallery
    */
    createGallery : function() {
      this.$template = this.getThumbnailTemplate(this.options.template);
      this.$container.empty();
      this.$thumbnails = $(
        '<div class="galleryImages clearfix" />'
      );
      this.$thumbnails.appendTo(this.$container);
      var $navigation = $(
        '<div class="galleryNavigation">' +
          '<a href="#" class="galleryLinkPrevious"/>' +
          '<a href="#" class="galleryLinkNext"/>' +
        '</div>'
      );
      switch (this.options.navigation) {
      case 'top' :
        $navigation.prependTo(this.$container);
        break;
      case 'both' :
        $navigation.clone(true).prependTo(this.$container);
        $navigation.appendTo(this.$container);
        break;
      case 'bottom' :
        $navigation.appendTo(this.$container);
        break;
      }
      this.$navigations = this.$container.find('.galleryNavigation');
      this.$buttons.previous = this.$navigations
        .find('.galleryLinkPrevious')
        .text(this.options.captionLinkPrevious)
        .on('click', $.proxy(this.onPreviousFeedClick, this))
        .hide();
      this.$buttons.next = this.$navigations
        .find('.galleryLinkNext')
        .text(this.options.captionLinkNext)
        .on('click', $.proxy(this.onNextFeedClick, this))
        .hide();
    },

    /**
    * Try to get the thumbnail template, create a default strcuture if it can not be found
    *
    * @param string selector
    */
    getThumbnailTemplate : function(selector) {
      var template = $(selector).eq(0).clone();
      if (template.length == 0) {
        template = $(
          '<div class="galleryThumbnail"><a class="galleryThumbnailFrame"><img /></a></div>'
        );
      }
      template.css('display', 'none');
      template
        .find('a')
        .removeAttr('data-lightbox');
      template
        .find('img')
        .removeAttr('width')
        .removeAttr('height')
        .removeAttr('style');
      return template;
    },

    onPreviousFeedClick : function(event) {
      event.stopPropagation();
      if (this.previousFeed) {
        this.fetchFeed(this.previousFeed);
      }
      return false;
    },

    onNextFeedClick : function(event) {
      event.stopPropagation();
      if (this.nextFeed) {
        this.fetchFeed(this.nextFeed);
      }
      return false;
    },

    isLoading : function(status) {
      if (typeof status != 'undefined') {
        this.loading = status;
      }
      if (this.loading) {
        this.$container.addClass('loading');
        this.$thumbnails.css('display', 'hidden');
      } else {
        this.$container.removeClass('loading');
      }
      return this.loading;
    }

  };

  $.fn.papayaFeedGallery = function(options) {
    return this.each(
      function () {
        var instance = $.extend(true, {}, gallery);
        instance.setUp(
          $(this),
          $.extend(
            true,
            {},
            options,
            $(this).data('feedGallery')
          )
        );
      }
    );
  };

})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('[data-feed-gallery]').papayaFeedGallery();
  }
);