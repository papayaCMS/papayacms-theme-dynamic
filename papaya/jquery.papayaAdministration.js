/**
* papaya Administration connects the preview pages to the administration interface
*
*/
(function($) {

  var connector = {

    options : {
      'pageId' : 0,
      'themePath' : '/papaya-themes/dynamic/',
      'css' : 'papaya/administration/styles.css',
      'url' : '/papaya/'
    },

    data : {
      pageId : 0
    },

    nodes : {
      $css : null,
      $bar : null,
      links : {
        $edit : null
      }
    },

    setUp : function (options) {
      this.options = $.extend(this.options, options);
      if (this.options.pageId > 0) {
        this.data.pageId = this.options.pageId;
        this.create();
      }
    },

    create : function() {
      this.nodes.$css = $('<link rel="stylesheet" type="text/css"/>')
        .attr('href', this.options.themePath + this.options.css)
        .appendTo($('head'));
      this.nodes.$bar = $('<div id="papayaAdministration"/>')
        .appendTo('body');
      this.nodes.$buttons = $('<div class="buttons"/>')
        .appendTo(this.nodes.$bar);
      this.nodes.links.$edit = $('<a href="#" class="lsf" title="Edit Page" target="_top">edit</a>')
        .attr('href', this.options.url + 'pages.edit?tt[page_id]=' + this.data.pageId)
        .appendTo(this.nodes.$buttons);
    }

  };

  /**
   * Allow access to local variable, initialize plugin
   */
  $.papayaAdministration = function(options) {
    connector.setUp(options);
  };
})(jQuery);
