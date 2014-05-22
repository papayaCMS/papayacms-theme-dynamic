<?php
/**
* CSS themewrapper script
*
* @copyright 2002-2009 by papaya Software GmbH - All rights reserved.
* @link http://www.papaya-cms.com/
* @license http://www.gnu.org/licenses/old-licenses/gpl-2.0.html GNU General Public License, version 2
*
* You can redistribute and/or modify this script under the terms of the GNU General Public
* License (GPL) version 2, provided that the copyright and license notes, including these
* lines, remain unmodified. papaya is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE.
*
* @package Papaya
* @version $Id: css.php 39265 2014-02-18 19:47:41Z weinert $
*/

/**
* Include configuration file
*/
if (file_exists('../../../papaya.php')) {
  include_once('../../../papaya.php');
} else {
  include_once('../../conf.inc.php');
}

if (defined('PAPAYA_MAINTENANCE_MODE') && PAPAYA_MAINTENANCE_MODE) {
  @header('', TRUE, 503);
} else {
  /**
  * include page controller
  */
  include_once(PAPAYA_INCLUDE_PATH.'core.php');
  $_SERVER['REDIRECT_PAPAYA_STATUS'] = 404;
  $PAPAYA_PAGE = new papaya_page();
  $PAPAYA_PAGE->execute();
  $PAPAYA_PAGE->get();
}