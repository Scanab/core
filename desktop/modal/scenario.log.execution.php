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
$scenario = scenario::byId(init('scenario_id'));
if (!is_object($scenario)) {
  throw new Exception(__('Aucun scénario ne correspondant à :', __FILE__) . ' ' . init('scenario_id'));
}
sendVarToJs('jeephp2js.md_scenarioLog_scId', init('scenario_id'));
?>

<div style="display: none;width : 100%" id="div_alertScenarioLog" data-modalType="md_scenarioLog"></div>
<?php echo '<span style="font-weight: bold;">' . $scenario->getHumanName(true, false, true) . '</span>'; ?>
<div class="input-group pull-right">
  <span class="input-group-btn" style="display: inline;">
    <span class="label-sm">{{Log brut}}</span>
    <input type="checkbox" id="brutlogcheck" autoswitch="1"/>
    <i id="brutlogicon" class="fas fa-exclamation-circle icon_orange"></i>
    <input class="input-sm roundedLeft" id="in_scenarioLogSearch" style="width : 200px;margin-left:5px;" placeholder="{{Rechercher}}" />
    <a id="bt_resetScenarioLogSearch" class="btn btn-sm"><i class="fas fa-times"></i>
    </a><a class="btn btn-warning btn-sm" data-state="1" id="bt_scenarioLogStopStart"><i class="fas fa-pause"></i> {{Pause}}
    </a><a class="btn btn-success btn-sm" id="bt_scenarioLogDownload"><i class="fas fa-cloud-download-alt"></i> {{Télécharger}}
    </a><a class="btn btn-warning btn-sm roundedRight" id="bt_scenarioLogEmpty"><i class="fas fa-trash"></i> {{Vider}}</a>
  </span>
</div>
<br/><br/>
<pre id='pre_scenariolog' style='overflow: auto; height: calc(100% - 70px);width:100%;'></pre>

<script>
var $rawLogCheck = $('#brutlogcheck')
$rawLogCheck.on('click').on('click', function () {
  $rawLogCheck.attr('autoswitch', 0)

  var scroll = $('#pre_scenariolog').scrollTop()
  jeedom.log.autoupdate({
    log: 'scenarioLog/scenario' + jeephp2js.md_scenarioLog_scId + '.log',
    display: document.getElementById('pre_scenariolog'),
    search: document.getElementById('in_scenarioLogSearch'),
    control: document.getElementById('bt_scenarioLogStopStart'),
    once: 1
  })
  $('#pre_scenariolog').scrollTop(scroll)
})


jeedom.log.autoupdate({
  log: 'scenarioLog/scenario' + jeephp2js.md_scenarioLog_scId + '.log',
  display: document.getElementById('pre_scenariolog'),
  search: document.getElementById('in_scenarioLogSearch'),
  control: document.getElementById('bt_scenarioLogStopStart')
})

$('#bt_resetScenarioLogSearch').on('click', function () {
  document.getElementById('in_scenarioLogSearch').value = ''
})

$('#bt_scenarioLogEmpty').on('click', function() {
  jeedom.scenario.emptyLog({
    id: jeephp2js.md_scenarioLog_scId,
    error: function(error) {
      $('#div_alertScenarioLog').showAlert({message: error.message, level: 'danger'})
    },
    success: function() {
      $('#div_alertScenarioLog').showAlert({message: '{{Log vidé avec succès}}', level: 'success'})
      document.emptyById('pre_logScenarioDisplay')
    }
  })
})

$('#bt_scenarioLogDownload').click(function() {
  window.open('core/php/downloadFile.php?pathfile=log/scenarioLog/scenario<?php echo init('scenario_id') ?>.log', "_blank", null)
})
</script>
