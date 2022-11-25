<?php
/* This file is part of Jeedom.
*
* Jeedom is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* Jeedom is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
*/

if (!isConnect()) {
  throw new Exception('{{401 - Accès non autorisé}}');
}

$selectPlugin = init('selectPlugin');
if ($selectPlugin != '') {
  $listMessage = message::byPlugin($selectPlugin);
} else {
  $listMessage = message::all();
}
?>

<div id="md_messageDisplay" data-modalType="md_messageDisplay">
  <div class="input-group pull-right" style="display:inline-flex">
    <select id="sel_plugin" class="form-control input-sm roundedLeft" style="width: 200px;">
      <option value="" selected>{{Tout}}</option>
      <?php
      foreach ((message::listPlugin()) as $plugin) {
        if ($selectPlugin == $plugin['plugin']) {
          echo '<option value="' . $plugin['plugin'] . '" selected>' . $plugin['plugin'] . '</option>';
        } else {
          echo '<option value="' . $plugin['plugin'] . '">' . $plugin['plugin'] . '</option>';
        }
      }
      ?>
    </select>
    <span class="input-group-btn">
      <a class="btn btn-default btn-sm" id="bt_refreshMessage"><i class="fas fa-sync icon-white"></i> {{Rafraichir}}</a><a class="btn btn-danger roundedRight btn-sm" id="bt_clearMessage"><i class="far fa-trash-alt icon-white"></i> {{Vider}}</a>
    </span>
  </div>

  <table class="table table-condensed table-bordered tablesorter" id="table_message" style="margin-top: 5px;">
    <thead>
      <tr>
        <th data-sorter="false" data-filter="false"></th>
        <th>{{Date et heure}}</th>
        <th>{{Source}}</th>
        <th data-sorter="false" data-filter="false">{{Description}}</th>
        <th data-sorter="false" data-filter="false">{{Action}}</th>
        <th>{{Occurrences}}</th>
      </tr>
    </thead>
    <tbody>
      <?php
      $trs = '';
      foreach ($listMessage as $message) {
        $trs .= '<tr data-message_id="' . $message->getId() . '">';
        $trs .= '<td><div class="center"><i class="far fa-trash-alt cursor removeMessage"></i></div></td>';
        $trs .= '<td class="datetime">' . $message->getDate() . '</td>';
        $trs .= '<td class="plugin">' . $message->getPlugin() . '</td>';
        $trs .= '<td class="message">' . html_entity_decode($message->getMessage()) . '</td>';
        $trs .= '<td class="message_action">' . html_entity_decode($message->getAction()) . '</td>';
        $trs .= '<td class="occurrences" style="text-align: center">' . $message->getOccurrences() . '</td>';
        $trs .= '</tr>';
      }
      if ($trs != '') echo $trs;
      ?>
    </tbody>
  </table>
</div>

<script>
  "use strict"

  $(function() {
    jeedomUtils.hideAlert()
    jeedomUtils.initTableSorter()
    $('#table_message')[0].config.widgetOptions.resizable_widths = ['50px', '140px', '20%', '', '90px', '120px']
    $('#table_message').trigger('applyWidgets')
      .trigger('resizableReset')
      .trigger('update')
  })

  $("#sel_plugin").on('change', function(event) {
    $('#md_modal').dialog({
      title: "{{Centre de Messages}}"
    }).load('index.php?v=d&modal=message.display&selectPlugin=' + encodeURI(document.getElementById('sel_plugin').jeeValue())).dialog('open')
  })

  $("#bt_clearMessage").on('click', function(event) {
    jeedom.message.clear({
      plugin: document.getElementById('sel_plugin').jeeValue(),
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function() {
        document.querySelector("#table_message tbody").empty()
        jeedom.refreshMessageNumber()
      }
    })
  })

  $('#bt_refreshMessage').on('click', function(event) {
    $('#md_modal').dialog({
      title: "{{Centre de Messages}}"
    }).load('index.php?v=d&modal=message.display').dialog('open')
  })

  $('#table_message').on({
    'click': function(event) {
      var tr = $(this).closest('tr')
      jeedom.message.remove({
        id: tr.attr('data-message_id'),
        error: function(error) {
          $.fn.showAlert({
            message: error.message,
            level: 'danger'
          })
        },
        success: function() {
          tr.remove();
          $("#table_message").trigger("update")
          jeedom.refreshMessageNumber()
        }
      })
    }
  }, '.removeMessage')
</script>
