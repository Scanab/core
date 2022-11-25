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

"use strict"

if (!jeeFrontEnd.profils) {
  jeeFrontEnd.profils = {
    init: function() {
      /* Not used, loaded as modal!
      window.jeeP = this
      */
    },
  }
}

jeeFrontEnd.profils.init()

document.onkeydown = function(event) {
  if ((event.ctrlKey || event.metaKey) && event.which == 83) { //s
    event.preventDefault()
    $("#bt_saveProfils").click()
  }
}

$(function() {
  jeedomUtils.initTableSorter()
  $('#tableDevices')[0].config.widgetOptions.resizable_widths = ['', '180px', '180px', '80px']
  $('#tableDevices').trigger('applyWidgets')
    .trigger('resizableReset')
    .trigger('sorton', [
      [
        [2, 1]
      ]
    ])
})

$("#bt_saveProfils").on('click', function(event) {
  jeedomUtils.hideAlert()
  var profil = document.getElementById('div_userProfils').getJeeValues('.userAttr')[0]
  if (jeephp2js.profils_user_id == -1) {
    if (profil.password != document.getElementById('in_passwordCheck').value) {
      $.fn.showAlert({
        message: "{{Les deux mots de passe ne sont pas identiques}}",
        level: 'danger'
      })
      return
    }
    jeedom.user.saveProfils({
      profils: profil,
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function() {
        $.fn.showAlert({
          message: "{{Sauvegarde effectuée}}",
          level: 'success'
        })
        jeedom.user.get({
          error: function(error) {
            $.fn.showAlert({
              message: error.message,
              level: 'danger'
            })
          },
          success: function(data) {
            document.getElementById('div_userProfils').setJeeValues(data, '.userAttr')
            jeeFrontEnd.modifyWithoutSave = false
          }
        })
      }
    })
  } else {
    profil.id = jeephp2js.profils_user_id;
    jeedom.user.save({
      users: [profil],
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function() {
        $('#div_alertProfils').showAlert({
          message: "{{Sauvegarde effectuée}}",
          level: 'success'
        })
        jeedom.user.get({
          error: function(error) {
            $.fn.showAlert({
              message: error.message,
              level: 'danger'
            })
          },
          success: function(data) {
            jeeFrontEnd.modifyWithoutSave = false
          }
        })
      }
    })
  }
  return false
})

jeedom.user.get({
  id: jeephp2js.profils_user_id,
  error: function(error) {
    $.fn.showAlert({
      message: error.message,
      level: 'danger'
    })
  },
  success: function(data) {
    document.getElementById('div_userProfils').setJeeValues(data, '.userAttr')
    document.getElementById('in_passwordCheck').value = data.password
    jeeFrontEnd.modifyWithoutSave = false
  }
})

$('#div_userProfils').off('change', '.userAttr').on('change', '.userAttr:visible', function() {
  jeeFrontEnd.modifyWithoutSave = true
})

$('.bt_selectWarnMeCmd').on('click', function() {
  jeedom.cmd.getSelectModal({
    cmd: {
      type: 'action',
      subType: 'message'
    }
  }, function(result) {
    document.querySelector('.userAttr[data-l1key="options"][data-l2key="notification::cmd"]').jeeValue(result.human)
  })
})

$('#bt_configureTwoFactorAuthentification').on('click', function() {
  var profil = document.getElementById('div_userProfils').getJeeValues('.userAttr')[0]
  $('#md_modal').dialog({
    title: "{{Authentification 2 étapes}}"
  }).load('index.php?v=d&modal=twoFactor.authentification').dialog('open')
})

if (jeephp2js.profils_user_id == -1) {
  $('#bt_genUserKeyAPI').on('click', function() {
    var profil = document.getElementById('div_userProfils').getJeeValues('.userAttr')[0]
    profil.hash = ''
    jeedom.user.saveProfils({
      profils: profil,
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function() {
        $.fn.showAlert({
          message: "{{Opération effectuée}}",
          level: 'success'
        })
        jeedom.user.get({
          error: function(error) {
            $.fn.showAlert({
              message: error.message,
              level: 'danger'
            })
          },
          success: function(data) {
            document.getElementById('div_userProfils').setJeeValues(data, '.userAttr')
            jeeFrontEnd.modifyWithoutSave = false
          }
        })
      }
    })
  })

  $('.bt_removeRegisterDevice').on('click', function() {
    var key = $(this).closest('tr').attr('data-key')
    jeedom.user.removeRegisterDevice({
      key: key,
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function(data) {
        jeeFrontEnd.modifyWithoutSave = false
        window.location.reload()
      }
    })
  })

  $('#bt_removeAllRegisterDevice').on('click', function() {
    jeedom.user.removeRegisterDevice({
      key: '',
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function(data) {
        jeeFrontEnd.modifyWithoutSave = false
        window.location.reload()
      }
    })
  })

  $('.bt_deleteSession').on('click', function() {
    var id = $(this).closest('tr').attr('data-id')
    jeedom.user.deleteSession({
      id: id,
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
      },
      success: function(data) {
        window.location.reload()
      }
    })
  })
}