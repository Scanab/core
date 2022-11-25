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

if (!jeeFrontEnd.plan) {
  jeeFrontEnd.plan = {
    deviceInfo: null,
    $pageContainer: null,
    contextMenu: null,
    planHeaderContextMenu: {},
    init: function() {
      window.jeeP = this
      this.deviceInfo = getDeviceType()
      this.$pageContainer = $('#div_pageContainer')
      this.planHeaderContextMenu = {}
      if (typeof jeeFrontEnd.planEditOption === 'undefined' || this.deviceInfo.type != 'desktop') {
        jeeFrontEnd.planEditOption = {
          state: false,
          snap: false,
          grid: false,
          gridSize: false,
          highlight: true
        }
      }
    },
    createNewDesign: function() {
      bootbox.prompt("{{Nom du design ?}}", function(result) {
        if (result !== null) {
          jeedom.plan.saveHeader({
            planHeader: {
              name: result
            },
            error: function(error) {
              $.fn.showAlert({
                message: error.message,
                level: 'danger'
              })
            },
            success: function(data) {
              window.location = 'index.php?v=d&p=plan&plan_id=' + data.id
            }
          })
        }
      })
    },
    setColorSelect: function(_select) {
      if (_select.tagName != 'SELECT') return
      _select.style.backgroundColor = _select.selectedOptions[0].text.trim()
    },
    fullScreen: function(_mode) {
      if (_mode) {
        $('body').addClass('fullscreen')
      } else {
        $('body').removeClass('fullscreen')
      }
    },
    addObject: function(_plan) {
      _plan.planHeader_id = jeephp2js.planHeader_id
      jeedom.plan.create({
        plan: _plan,
        version: 'dashboard',
        error: function(error) {
          $.fn.showAlert({
            message: error.message,
            level: 'danger'
          })
        },
        success: function(data) {
          jeeP.displayObject(data.plan, data.html)
        }
      })
    },
    displayPlan: function(_code) {
      if (jeephp2js.planHeader_id == -1) return

      if (typeof _code == "undefined") {
        _code = null
      }
      if (getUrlVars('fullscreen') == 1) {
        jeeP.fullScreen(true)
      }
      jeedom.plan.getHeader({
        id: jeephp2js.planHeader_id,
        code: _code,
        error: function(error) {
          if (error.code == -32005) {
            var result = prompt("{{Veuillez indiquer le code ?}}", "")
            if (result == null) {
              $.fn.showAlert({
                message: error.message,
                level: 'danger'
              })
              return
            }
            jeeP.displayPlan(result)
          } else {
            jeephp2js.planHeader_id = -1
            $.fn.showAlert({
              message: error.message,
              level: 'danger'
            })
          }
        },
        success: function(data) {
          var $divDisplayObject = $('.div_displayObject')
          $divDisplayObject.empty()
            .append('<div id="div_grid" class="container-fluid" style="display:none;"></div>')
            .height('auto').width('auto')
          //general design configuration:
          if (isset(data.image)) {
            $divDisplayObject.append(data.image)
          }
          if (isset(data.configuration.backgroundTransparent) && data.configuration.backgroundTransparent == 1) {
            $divDisplayObject.css('background-color', 'transparent')
          } else if (isset(data.configuration.backgroundColor)) {
            $divDisplayObject.css('background-color', data.configuration.backgroundColor)
          } else {
            $divDisplayObject.css('background-color', '#ffffff')
          }
          if (data.configuration != null && init(data.configuration.desktopSizeX) != '' && init(data.configuration.desktopSizeY) != '') {
            $divDisplayObject.height(data.configuration.desktopSizeY).width(data.configuration.desktopSizeX)
            $('.div_displayObject img').height(data.configuration.desktopSizeY).width(data.configuration.desktopSizeX)
          } else {
            $divDisplayObject.width($('.div_displayObject img').attr('data-sixe_x')).height($('.div_displayObject img').attr('data-sixe_y'))
            $('.div_displayObject img').css({
              'height': ($('.div_displayObject img').attr('data-sixe_y')) + 'px',
              'width': ($('.div_displayObject img').attr('data-sixe_x')) + 'px'
            })
          }

          if ($('body').height() > $divDisplayObject.height()) {
            $('.div_backgroundPlan').height($('body').height())
          } else {
            $('.div_backgroundPlan').height($divDisplayObject.height())
          }

          $('#div_grid').width($divDisplayObject.width()).height($divDisplayObject.height())
          if (jeeP.deviceInfo.type != 'desktop') {
            $('meta[name="viewport"]').prop('content', 'width=' + $divDisplayObject.width() + ',height=' + $divDisplayObject.height())
            jeeP.fullScreen(true)
            $(window).on("navigate", function(event, data) {
              var direction = data.state.direction
              if (direction == 'back') {
                window.location.href = 'index.php?v=m'
              }
            })
          }

          //display design components:
          $divDisplayObject.find('.eqLogic-widget,.div_displayObject > .cmd-widget,.scenario-widget,.plan-link-widget,.view-link-widget,.graph-widget,.text-widget,.image-widget,.zone-widget,.summary-widget').remove()
          jeedom.plan.byPlanHeader({
            id: jeephp2js.planHeader_id,
            error: function(error) {
              $.fn.showAlert({
                message: error.message,
                level: 'danger'
              })
            },
            success: function(plans) {
              var objects = []
              for (var i in plans) {
                objects.push(jeeP.displayObject(plans[i].plan, plans[i].html, true))
              }
              try {
                $divDisplayObject.append(objects)
              } catch (e) {}
              try {
                jeeP.$pageContainer.append(style_css)
                style_css = ''
              } catch (e) {}
              jeedomUtils.addOrUpdateUrl('plan_id', jeephp2js.planHeader_id, data.name + ' - ' + JEEDOM_PRODUCT_NAME)
              jeeP.initEditOption(jeeFrontEnd.planEditOption.state)
              jeedomUtils.initReportMode()
              $(window).scrollTop(0)
            }
          })
        },
      })
    },
    getElementInfo: function(_element) {
      if (_element.length) _element = _element[0]
      if (_element.hasClass('eqLogic-widget')) {
        return {
          type: 'eqLogic',
          id: _element.getAttribute('data-eqLogic_id')
        }
      }
      if (_element.hasClass('cmd-widget')) {
        return {
          type: 'cmd',
          id: _element.getAttribute('data-cmd_id')
        }
      }
      if (_element.hasClass('scenario-widget')) {
        return {
          type: 'scenario',
          id: _element.getAttribute('data-scenario_id')
        }
      }
      if (_element.hasClass('plan-link-widget')) {
        return {
          type: 'plan',
          id: _element.getAttribute('data-link_id')
        }
      }
      if (_element.hasClass('view-link-widget')) {
        return {
          type: 'view',
          id: _element.getAttribute('data-link_id')
        }
      }
      if (_element.hasClass('graph-widget')) {
        return {
          type: 'graph',
          id: _element.getAttribute('data-graph_id')
        }
      }
      if (_element.hasClass('text-widget')) {
        return {
          type: 'text',
          id: _element.getAttribute('data-text_id')
        }
      }
      if (_element.hasClass('image-widget')) {
        return {
          type: 'image',
          id: _element.getAttribute('data-image_id')
        }
      }
      if (_element.hasClass('zone-widget')) {
        return {
          type: 'zone',
          id: _element.getAttribute('data-zone_id')
        }
      }
      if (_element.hasClass('summary-widget')) {
        return {
          type: 'summary',
          id: _element.getAttribute('data-summary_id')
        }
      }
    },
    savePlan: function(_refreshDisplay, _async) {
      if (jeephp2js.planHeader_id == -1) return

      jeedomUtils.showLoading()
      var plans = []
      var info, plan, position
      $('.div_displayObject >.eqLogic-widget,.div_displayObject > .cmd-widget,.scenario-widget,.plan-link-widget,.view-link-widget,.graph-widget,.text-widget,.image-widget,.zone-widget,.summary-widget').each(function() {
        info = jeeP.getElementInfo(this)
        plan = {}
        plan.position = {}
        plan.display = {}
        plan.id = $(this).attr('data-plan_id')
        plan.link_type = info.type
        plan.link_id = info.id
        plan.planHeader_id = jeeP.planHeader_id
        plan.display.height = $(this).outerHeight()
        plan.display.width = $(this).outerWidth()
        if (info.type == 'graph') {
          plan.display.graph = json_decode(this.querySelector('.graphOptions').jeeValue())
        }
        if (!$(this).is(':visible')) {
          position = $(this).show().position()
          $(this).hide()
        } else {
          position = $(this).position()
        }
        plan.position.top = position.top
        plan.position.left = position.left
        plans.push(plan)
      })
      jeedom.plan.save({
        plans: plans,
        async: _async || true,
        global: false,
        error: function(error) {
          $.fn.showAlert({
            message: error.message,
            level: 'danger'
          })
        },
        success: function() {
          if (init(_refreshDisplay, false)) {
            jeeP.displayPlan()
          }
          jeedomUtils.hideLoading()
        },
      })
    },
    displayObject: function(_plan, _html, _noRender) {
      _plan = init(_plan, {})
      _plan.position = init(_plan.position, {})
      _plan.css = init(_plan.css, {})
      var css_selector = ''
      var another_css = ''

      //get css selector:
      if (_plan.link_type == 'eqLogic' || _plan.link_type == 'scenario' || _plan.link_type == 'text' || _plan.link_type == 'image' || _plan.link_type == 'zone' || _plan.link_type == 'summary') {
        css_selector = '.div_displayObject .' + _plan.link_type + '-widget[data-' + _plan.link_type + '_id="' + _plan.link_id + '"]'
        $(css_selector).remove()
      } else if (_plan.link_type == 'view' || _plan.link_type == 'plan') {
        css_selector = '.div_displayObject .' + _plan.link_type + '-link-widget[data-id="' + _plan.id + '"]'
        $(css_selector).remove()
      } else if (_plan.link_type == 'cmd') {
        css_selector = '.div_displayObject > .cmd-widget[data-cmd_id="' + _plan.link_id + '"]'
        $(css_selector).remove()
      } else if (_plan.link_type == 'graph') {
        if (jeedom.history.chart['div_designGraph' + _plan.link_id]) {
          delete jeedom.history.chart['div_designGraph' + _plan.link_id]
        }
        css_selector = '.div_displayObject .graph-widget[data-graph_id="' + _plan.link_id + '"]'
        $(css_selector).remove()
        if (init(_plan.display.transparentBackground, false)) {
          _html = _html.replace('class="graph-widget"', 'class="graph-widget transparent"')
        }
      }

      var html = $(_html)
      html.attr('data-plan_id', _plan.id)
        .addClass('jeedomAlreadyPosition')
        .attr('data-zoom', init(_plan.css.zoom, 1))
        .addClass('noResize')

      //set widget style:
      var style = {}
      style['z-index'] = '1000'
      style['position'] = 'absolute'
      style['top'] = init(_plan.position.top, '10') + 'px'
      style['left'] = init(_plan.position.left, '10') + 'px'
      if (init(_plan.css.zoom, 1) != 1) {
        style['transform'] = 'scale(' + init(_plan.css.zoom, 1) + ')'
      }
      style['transform-origin'] = '0 0'

      if (_plan.link_type != 'cmd') {
        if (isset(_plan.display) && isset(_plan.display.width)) {
          style['width'] = init(_plan.display.width, 50) + 'px'
          html.width(init(_plan.display.width, 50))
        }
        if (isset(_plan.display) && isset(_plan.display.height)) {
          style['height'] = init(_plan.display.height, 50) + 'px'
          html.height(init(_plan.display.height, 50))
        }
      }

      for (var key in _plan.css) {
        if (_plan.css[key] === '' || key == 'zoom' || key == 'rotate') continue
        if (key == 'z-index' && _plan.css[key] < 999) continue

        if (key == 'background-color') {
          if (isset(_plan.display) && (!isset(_plan.display['background-defaut']) || _plan.display['background-defaut'] != 1)) {
            if (isset(_plan.display['background-transparent']) && _plan.display['background-transparent'] == 1) {
              style['background-color'] = 'transparent'
              style['border-radius'] = '0px'
              style['box-shadow'] = 'none'
              if (_plan.link_type == 'eqLogic') {
                another_css += css_selector + ' .widget-name{background-color : transparent !important;border:none!important;}'
                if (_plan.display['color-defaut'] == 0 && isset(_plan.css.color)) {
                  another_css += css_selector + ' .widget-name a{color : ' + _plan.css.color + ' !important;}'
                  another_css += css_selector + ' .state{color : ' + _plan.css.color + ' !important;}'
                }
              } else if (_plan.link_type == 'cmd') {
                if (_plan.display['color-defaut'] == 0 && isset(_plan.css.color)) {
                  another_css += css_selector + ' .widget-name a{color : ' + _plan.css.color + ' !important;}'
                  another_css += css_selector + ' .state{color : ' + _plan.css.color + ' !important;}'
                }
              }
            } else {
              style[key] = _plan.css[key]
            }
          }
          continue
        } else if (key == 'color') {
          if (!isset(_plan.display) || !isset(_plan.display['color-defaut']) || _plan.display['color-defaut'] != 1) {
            style[key] = _plan.css[key]
            if (_plan.link_type == 'eqLogic' || _plan.link_type == 'cmd' || _plan.link_type == 'summary') {
              another_css += css_selector + ' * {\n' + key + ' : ' + _plan.css[key] + ' !important;}'
              another_css += css_selector + ' .state {\n' + key + ' : ' + _plan.css[key] + ' !important;}'
            }
          }
          continue
        }
        if (key == 'opacity') continue
        if (key == 'font-size' && _plan.link_type == 'summary') {
          another_css += css_selector + ' .objectSummaryParent{\n' + key + ' : ' + _plan.css[key] + ' !important;\n}'
          continue
        }
        style[key] = _plan.css[key]
      }

      if (_plan.css['opacity'] && _plan.css['opacity'] !== '' && style['background-color'] && style['background-color'] != 'transparent') {
        if (style['background-color'].indexOf('#') != -1) {
          var rgb = jeedomUtils.hexToRgb(style['background-color'])
          style['background-color'] = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + _plan.css['opacity'] + ')'
        } else {
          style['background-color'] = style['background-color'].replace(')', ',' + _plan.css['opacity'] + ')').replace('rgb', 'rgba')
        }
      }

      if (_plan.link_type == 'eqLogic') {
        if (isset(_plan.display.hideName) && _plan.display.hideName == 1) {
          html.addClass('hideEqLogicName')
          another_css += css_selector + ' .verticalAlign{top: 50% !important;\n}'
        }
        if (isset(_plan.display.showObjectName) && _plan.display.showObjectName == 1) {
          html.addClass('displayObjectName')
        }
        if (isset(_plan.display.cmdHide)) {
          for (var i in _plan.display.cmdHide) {
            if (_plan.display.cmdHide[i] == 0) {
              continue
            }
            another_css += css_selector + ' .cmd[data-cmd_id="' + i + '"]{display : none !important;}'
          }
        }
        if (isset(_plan.display.cmdHideName)) {
          for (var i in _plan.display.cmdHideName) {
            if (_plan.display.cmdHideName[i] == 0) {
              continue
            }
            another_css += css_selector + ' .cmd[data-cmd_id="' + i + '"] .cmdName{display : none !important;}'
            another_css += css_selector + ' .cmd[data-cmd_id="' + i + '"] .title{display : none !important;}'
          }
        }
        if (isset(_plan.display.cmdTransparentBackground)) {
          for (var i in _plan.display.cmdTransparentBackground) {
            if (_plan.display.cmdTransparentBackground[i] == 0) {
              continue
            }
            another_css += css_selector + ' .cmd[data-cmd_id="' + i + '"]{'
            another_css += 'background-color: transparent !important'
            another_css += 'border-radius: 0px !important'
            another_css += 'box-shadow: none !important'
            another_css += '\n}'
          }
        }
        style['min-width'] = '0px'
        style['min-height'] = '0px'
        another_css += css_selector + ' *:not([class^="content"]:not(.cmd-widget) {'
        another_css += 'min-width:0px !important;'
        another_css += 'min-height:0px !important;'
        another_css += '\n}'
      }
      if (_plan.link_type == 'cmd') {
        var insideHtml = html.html()
        html = html.empty().append('<center>' + insideHtml + '</center>')
        delete style['height']
        style['min-height'] = '0px'
        delete style['width']
        style['min-width'] = '0px'
        html.css({
          'width': '',
          'height': '',
        })
        if (isset(_plan.display.hideName) && _plan.display.hideName == 1) {
          another_css += css_selector + ' .cmdName{\ndisplay : none !important;\n}'
          another_css += css_selector + ' .title{\ndisplay : none !important;\n}'
        }
      }
      if (_plan.link_type == 'image') {
        if (isset(_plan.display.allowZoom) && _plan.display.allowZoom == 1) {
          html.find('.directDisplay').addClass('zoom cursor')
        }
      }

      $('#style_' + _plan.link_type + '_' + _plan.link_id).remove()
      var style_el = '<style id="style_' + _plan.link_type + '_' + _plan.link_id + '">'
      if (_plan.display.css && _plan.display.css != '') {
        if (_plan.display.cssApplyOn && _plan.display.cssApplyOn != '') {
          var cssApplyOn = _plan.display.cssApplyOn.split(',')
          for (var i in cssApplyOn) {
            style_el += css_selector + ' ' + cssApplyOn[i] + '{' + _plan.display.css + '}'
          }
        } else {
          style_el += css_selector + ' ' + '{' + _plan.display.css + '}'
        }
      }
      style_el += css_selector + '{'


      for (var i in style) {
        if (['left', 'top', 'bottom', 'right', 'height', 'width', 'box-shadow'].indexOf(i) !== -1) {
          style_el += i + ':' + style[i] + ';'
        } else {
          style_el += i + ':' + style[i] + ' !important;'
        }
      }
      style_el += '}\n'
      style_el += another_css
      style_el += '</style>'

      if (_plan.link_type == 'graph') {
        this.$pageContainer.append(style_el)
        $('.div_displayObject').append(html)
        if (isset(_plan.display) && isset(_plan.display.graph)) {
          var done = 0
          for (var i in _plan.display.graph) {
            if (init(_plan.display.graph[i].link_id) != '') {
              done += 1
              jeedom.history.drawChart({
                cmd_id: _plan.display.graph[i].link_id,
                el: 'div_designGraph' + _plan.link_id,
                showLegend: init(_plan.display.showLegend, true),
                showTimeSelector: init(_plan.display.showTimeSelector, false),
                showScrollbar: init(_plan.display.showScrollbar, true),
                dateRange: init(_plan.display.dateRange, '7 days'),
                option: init(_plan.display.graph[i].configuration, {}),
                transparentBackground: init(_plan.display.transparentBackground, false),
                showNavigator: init(_plan.display.showNavigator, true),
                enableExport: false,
                global: false,
                yAxisScaling: init(_plan.display.yAxisScaling, false),
                yAxisByUnit: init(_plan.display.yAxisByUnit, false),
                success: function() {
                  done -= 1
                  if (done == 0) {
                      if (init(_plan.display.transparentBackground, false)) {
                        $('#div_designGraph' + _plan.link_id).find('.highcharts-background').style('fill-opacity', '0', 'important')
                      }
                    }
                }
              })
            }
          }
        }
        this.initEditOption(jeeFrontEnd.planEditOption.state)
        return
      }

      if (init(_noRender, false)) {
        style_css += style_el
        return html
      }
      this.$pageContainer.append(style_el)
      $('.div_displayObject').append(html)
      this.initEditOption(jeeFrontEnd.planEditOption.state)
    },
    //Constrain dragging inside design area, supporting zoom:
    dragClick: {
      x: 0,
      y: 0
    },
    dragStartPos: {
      top: 0,
      left: 0
    },
    dragStep: false,
    minLeft: 0,
    maxLeft: 0,
    maxTop: 0,
    isDragLocked: false,
    zoomScale: 1,
    draggableStartFix: function(event, ui) {
      jeeP.isDragLocked = false
      if ($(event.target).hasClass('locked')) {
        jeeP.isDragLocked = true
        document.body.style.cursor = "default"
        return false
      }
      jeeP.zoomScale = parseFloat($(ui.helper).attr('data-zoom'))
      if (jeeFrontEnd.planEditOption.grid == 1) {
        jeeP.dragStep = jeeFrontEnd.planEditOption.gridSize[0]
      } else {
        jeeP.dragStep = false
      }

      jeeP.dragClick.x = event.clientX
      jeeP.dragClick.y = event.clientY
      jeeP.dragStartPos = ui.originalPosition

      var $container = $('.div_displayObject')
      var containerWidth = $container.width()
      var containerHeight = $container.height()

      var clientWidth = $(ui.helper[0]).width()
      var clientHeight = $(ui.helper[0]).height()

      var marginLeft = $(ui.helper[0]).css('margin-left')
      var marginLeft = parseFloat(marginLeft.replace('px', ''))

      jeeP.minLeft = 0 - marginLeft

      jeeP.maxLeft = containerWidth + jeeP.minLeft - (clientWidth * jeeP.zoomScale)
      jeeP.maxTop = containerHeight - (clientHeight * jeeP.zoomScale)
    },
    draggableDragFix: function(event, ui) {
      if (jeeP.isDragLocked == true) return false
      var newLeft = event.clientX - jeeP.dragClick.x + jeeP.dragStartPos.left
      var newTop = event.clientY - jeeP.dragClick.y + jeeP.dragStartPos.top

      if (newLeft < jeeP.minLeft) newLeft = jeeP.minLeft
      if (newLeft > jeeP.maxLeft) newLeft = jeeP.maxLeft

      if (newTop < 0) newTop = 0
      if (newTop > jeeP.maxTop) newTop = jeeP.maxTop

      if (jeeP.dragStep) {
        newLeft = (Math.round(newLeft / jeeP.dragStep) * jeeP.dragStep)
        newTop = (Math.round(newTop / jeeP.dragStep) * jeeP.dragStep)
      }

      ui.position = {
        left: newLeft,
        top: newTop
      }
    },
    initEditOption: function(_state) {
      var $container = $('.container-fluid.div_displayObject')
      var $editItems = $('.plan-link-widget,.view-link-widget,.graph-widget,.div_displayObject >.eqLogic-widget,.div_displayObject > .cmd-widget,.scenario-widget,.text-widget,.image-widget,.zone-widget,.summary-widget')

      if (_state) {
        if (!this.$pageContainer.data('jeeFrontEnd.planEditOption.state')) {
          this.$pageContainer.data('jeeFrontEnd.planEditOption.state', true)
        }
        jeeFrontEnd.planEditOption.state = true
        $('.tooltipstered').tooltipster('disable')
        $('.div_displayObject').addClass('editingMode')
        jeedom.cmd.disableExecute = true

        //drag item:
        $editItems.draggable({
          cancel: '.locked',
          containment: 'parent',
          cursor: 'move',
          start: this.draggableStartFix,
          drag: this.draggableDragFix,
          stop: function(event, ui) {
            jeeP.savePlan(false, false)
          }
        })

        if (jeeFrontEnd.planEditOption.highlight) {
          $editItems.addClass('editingMode')
        } else {
          $editItems.removeClass('editingMode contextMenu_select')
        }

        if (jeeFrontEnd.planEditOption.gridSize) {
          $('#div_grid').show().css('background-size', jeeFrontEnd.planEditOption.gridSize[0] + 'px ' + jeeFrontEnd.planEditOption.gridSize[1] + 'px')
        } else {
          $('#div_grid').hide()
        }

        //resize item:
        $('.plan-link-widget,.view-link-widget,.graph-widget,.div_displayObject >.eqLogic-widget,.scenario-widget,.text-widget,.image-widget,.zone-widget,.summary-widget').resizable({
          cancel: '.locked',
          handles: 'n,e,s,w,se,sw,nw,ne',
          containment: $('.div_displayObject'),
          start: function(event, ui) {
            if ($(this).attr('data-zoom') != '1') {
              $(this).resizable("option", "containment", null)
            }
            this.zoomScale = parseFloat($(ui.helper).attr('data-zoom'))
            if (jeeFrontEnd.planEditOption.grid == 1) {
              this.dragStep = jeeFrontEnd.planEditOption.gridSize[0]
              this.dragStep = this.dragStep / this.zoomScale
            } else {
              this.dragStep = false
            }
          },
          resize: function(event, ui) {
            if (this.dragStep) {
              var newWidth = (Math.round(ui.size.width / this.dragStep) * this.dragStep)
              var newHeight = (Math.round(ui.size.height / this.dragStep) * this.dragStep)
              ui.element.width(newWidth)
              ui.element.height(newHeight)
            }
            ui.element.find('.camera').trigger('resize')
          },
          stop: function(event, ui) {
            jeeP.savePlan(false, false)
          },
        })

        $('.div_displayObject a').each(function() {
          if ($(this).attr('href') != '#') {
            $(this).attr('data-href', $(this).attr('href')).removeAttr('href')
          }
        })

        try {
          $editItems.contextMenu(true)
        } catch (e) {}
      } else {
        if (this.$pageContainer.data('jeeFrontEnd.planEditOption.state')) {
          this.$pageContainer.data('jeeFrontEnd.planEditOption.state', false)
        }
        jeeFrontEnd.planEditOption.state = false
        jeedom.cmd.disableExecute = false
        $('.div_displayObject').removeClass('editingMode')
        try {
          $('.tooltipstered').tooltipster('enable')
          $editItems.draggable('destroy').removeClass('editingMode')
          $('.plan-link-widget,.view-link-widget,.graph-widget,.div_displayObject >.eqLogic-widget,.scenario-widget,.text-widget,.image-widget,.zone-widget,.summary-widget').resizable("destroy")
          $('.div_displayObject a').each(function() {
            $(this).attr('href', $(this).attr('data-href'))
          })
        } catch (e) {}
        $('#div_grid').hide()
        try {
          $editItems.contextMenu(false)
        } catch (e) {}
      }
    },
  }
}

jeeFrontEnd.plan.init()

var clickedOpen = false
var style_css = ''
for (var i in jeephp2js.planHeader) {
  jeeP.planHeaderContextMenu[jeephp2js.planHeader[i].id] = {
    name: jeephp2js.planHeader[i].name,
    callback: function(key, opt) {
      jeephp2js.planHeader_id = key
      jeeP.displayPlan()
    }
  }
}

if (jeeP.deviceInfo.type == 'desktop' && user_isAdmin == 1) {
  document.onkeydown = function(event) {
    if (jeedomUtils.getOpenedModal()) return

    if ((event.ctrlKey || event.metaKey) && event.which == 83) { //s
      event.preventDefault()
      jeeP.savePlan()
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.which == 69) { //e
      event.preventDefault()
      jeeFrontEnd.planEditOption.state = !jeeFrontEnd.planEditOption.state
      jeeP.$pageContainer.data('jeeFrontEnd.planEditOption.state', jeeFrontEnd.planEditOption.state)
      jeeP.initEditOption(jeeFrontEnd.planEditOption.state)
    }
  }
} else {
  document.onkeydown = function(event) {
    if (jeedomUtils.getOpenedModal()) return

    if ((event.ctrlKey || event.metaKey) && event.which == 83) { //s
      event.preventDefault()
      jeeP.savePlan()
    }
  }
}

if (jeeP.deviceInfo.type == 'desktop' && user_isAdmin == 1) {
  //Handle auto hide context menu
  $('#div_pageContainer').on({
    'mouseleave': function(event) {
      $(this).fadeOut().trigger('contextmenu:hide')
    }
  }, '.context-menu-root')

  jeeP.contextMenu = $.contextMenu({
    selector: '#div_pageContainer',
    appendTo: 'div#div_pageContainer',
    zIndex: 9999,
    events: {
      show: function(opt) {
        $.contextMenu.setInputValues(opt, this.data())
      },
      hide: function(opt) {
        $.contextMenu.getInputValues(opt, this.data())
      }
    },
    items: {
      fold1: {
        name: "{{Designs}}",
        icon: 'far fa-image',
        items: jeeP.planHeaderContextMenu
      },
      edit: {
        name: "{{Edition}}",
        icon: 'fas fa-pencil-alt',
        callback: function(key, opt) {
          jeeFrontEnd.planEditOption.state = !jeeFrontEnd.planEditOption.state
          this.data('jeeFrontEnd.planEditOption.state', jeeFrontEnd.planEditOption.state)
          jeeP.initEditOption(jeeFrontEnd.planEditOption.state)
        }
      },
      fullscreen: {
        name: "{{Plein écran}}",
        icon: 'fas fa-desktop',
        callback: function(key, opt) {
          if (this.data('fullscreen') == undefined) {
            this.data('fullscreen', 1)
          }
          jeeP.fullScreen(this.data('fullscreen'))
          this.data('fullscreen', !this.data('fullscreen'))
        }
      },
      sep1: "---------",
      addGraph: {
        name: "{{Ajouter Graphique}}",
        icon: 'fas fa-chart-line',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.addObject({
            link_type: 'graph',
            link_id: Math.round(Math.random() * 99999999) + 9999
          })
        }
      },
      addText: {
        name: "{{Ajouter texte/html}}",
        icon: 'fas fa-align-center',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.addObject({
            link_type: 'text',
            link_id: Math.round(Math.random() * 99999999) + 9999,
            display: {
              text: 'Texte à insérer ici'
            }
          })
        }
      },
      addScenario: {
        name: "{{Ajouter scénario}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeedom.scenario.getSelectModal({}, function(data) {
            jeeP.addObject({
              link_type: 'scenario',
              link_id: data.id
            })
          })
        }
      },
      fold4: {
        name: "{{Ajouter un lien}}",
        icon: 'fas fa-link',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        items: {
          addViewLink: {
            name: "{{Vers une vue}}",
            icon: 'fas fa-link',
            disabled: function(key, opt) {
              return !this.data('jeeFrontEnd.planEditOption.state')
            },
            callback: function(key, opt) {
              jeeP.addObject({
                link_type: 'view',
                link_id: -(Math.round(Math.random() * 99999999) + 9999),
                display: {
                  name: 'A configurer'
                }
              })
            }
          },
          addPlanLink: {
            name: "{{Vers un design}}",
            icon: 'fas fa-link',
            disabled: function(key, opt) {
              return !this.data('jeeFrontEnd.planEditOption.state')
            },
            callback: function(key, opt) {
              jeeP.addObject({
                link_type: 'plan',
                link_id: -(Math.round(Math.random() * 99999999) + 9999),
                display: {
                  name: 'A configurer'
                }
              })
            }
          },
        }
      },
      addEqLogic: {
        name: "{{Ajouter équipement}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeedom.eqLogic.getSelectModal({}, function(data) {
            jeeP.addObject({
              link_type: 'eqLogic',
              link_id: data.id
            })
          })
        }
      },
      addCommand: {
        name: "{{Ajouter commande}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeedom.cmd.getSelectModal({}, function(data) {
            jeeP.addObject({
              link_type: 'cmd',
              link_id: data.cmd.id
            })
          })
        }
      },
      addImage: {
        name: "{{Ajouter une image/caméra}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.addObject({
            link_type: 'image',
            link_id: Math.round(Math.random() * 99999999) + 9999
          })
        }
      },
      addZone: {
        name: "{{Ajouter une zone}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.addObject({
            link_type: 'zone',
            link_id: Math.round(Math.random() * 99999999) + 9999
          })
        }
      },
      addSummary: {
        name: "{{Ajouter un résumé}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.addObject({
            link_type: 'summary',
            link_id: -1
          })
        }
      },
      sep2: "---------",
      fold2: {
        name: "{{Affichage}}",
        icon: 'fas fa-th',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        items: {
          grid_none: {
            name: "Aucune",
            type: 'radio',
            radio: 'radio',
            value: '0',
            selected: true,
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.gridSize = false
                jeeP.initEditOption(1)
              }
            }
          },
          grid_10x10: {
            name: "10x10",
            type: 'radio',
            radio: 'radio',
            value: '10',
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.gridSize = [10, 10]
                jeeP.initEditOption(1)
              }
            }
          },
          grid_15x15: {
            name: "15x15",
            type: 'radio',
            radio: 'radio',
            value: '15',
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.gridSize = [15, 15]
                jeeP.initEditOption(1)
              }
            }
          },
          grid_20x20: {
            name: "20x20",
            type: 'radio',
            radio: 'radio',
            value: '20',
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.gridSize = [20, 20]
                jeeP.initEditOption(1)
              }
            }
          },
          sep4: "---------",
          snapGrid: {
            name: "{{Aimanter à la grille}}",
            type: 'checkbox',
            radio: 'radio',
            selected: jeeFrontEnd.planEditOption.grid,
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.grid = this.jeeValue()
                jeeP.initEditOption(1)
              }
            }
          },
          highlightWidget: {
            name: "{{Masquer surbrillance des éléments}}",
            type: 'checkbox',
            radio: 'radio',
            selected: jeeFrontEnd.planEditOption.highlight,
            events: {
              click: function(e) {
                jeeFrontEnd.planEditOption.highlight = (this.jeeValue() == 1) ? false : true
                jeeP.initEditOption(1)
              }
            }
          },
        }
      },
      removePlan: {
        name: "{{Supprimer le design}}",
        icon: 'fas fa-trash',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          bootbox.confirm('{{Êtes-vous sûr de vouloir supprimer ce design ?}}', function(result) {
            if (result) {
              jeedom.plan.removeHeader({
                id: jeephp2js.planHeader_id,
                error: function(error) {
                  $.fn.showAlert({
                    message: error.message,
                    level: 'danger'
                  })
                },
                success: function() {
                  $.fn.showAlert({
                    message: 'Design supprimé',
                    level: 'success'
                  })
                  window.location.reload()
                },
              })
            }
          })
        }
      },
      addPlan: {
        name: "{{Creer un design}}",
        icon: 'fas fa-plus-circle',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.createNewDesign()
        }
      },
      duplicatePlan: {
        name: "{{Dupliquer le design}}",
        icon: 'far fa-copy',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          bootbox.prompt("{{Nom la copie du design ?}}", function(result) {
            if (result !== null) {
              jeeP.savePlan(false, false)
              jeedom.plan.copyHeader({
                name: result,
                id: jeephp2js.planHeader_id,
                error: function(error) {
                  $.fn.showAlert({
                    message: error.message,
                    level: 'danger'
                  })
                },
                success: function(data) {
                  jeephp2js.planHeader_id = data.id
                  jeedomUtils.loadPage('index.php?v=d&p=plan&plan_id=' + data.id)
                },
              })
            }
          })
        }
      },
      configurePlan: {
        name: "{{Configurer le design}}",
        icon: 'fas fa-cogs',
        disabled: function(key, opt) {
          return !this.data('jeeFrontEnd.planEditOption.state')
        },
        callback: function(key, opt) {
          jeeP.savePlan(false, false)
          $('#md_modal').dialog({
            title: "{{Configuration du design}}"
          }).load('index.php?v=d&modal=planHeader.configure&planHeader_id=' + jeephp2js.planHeader_id).dialog('open')
        }
      },
      sep3: "---------",
      save: {
        name: "{{Sauvegarder}}",
        icon: 'fas fa-save',
        callback: function(key, opt) {
          jeeP.savePlan()
        }
      },
    }
  })

  $.contextMenu({
    selector: '.div_displayObject > .eqLogic-widget,.div_displayObject > .cmd-widget,.scenario-widget,.plan-link-widget,.text-widget,.view-link-widget,.graph-widget,.image-widget,.zone-widget,.summary-widget',
    zIndex: 9999,
    appendTo: 'div#div_pageContainer',
    events: {
      show: function(opt) {
        $.contextMenu.setInputValues(opt, this.data())
        if (jeeFrontEnd.planEditOption.highlight) {
          $(this).removeClass('editingMode').addClass('contextMenu_select')
        }
      },
      hide: function(opt) {
        $.contextMenu.getInputValues(opt, this.data())
        if (jeeFrontEnd.planEditOption.highlight) {
          $(this).removeClass('contextMenu_select').addClass('editingMode')
        }
      }
    },
    items: {
      parameter: {
        name: '{{Paramètres d\'affichage}}',
        icon: 'fas fa-cogs',
        callback: function(key, opt) {
          jeeP.savePlan(false, false)
          $('#md_modal').dialog({
            title: "{{Configuration du composant}}"
          }).load('index.php?v=d&modal=plan.configure&id=' + $(this).attr('data-plan_id')).dialog('open')
        }
      },
      configuration: {
        name: '{{Configuration avancée}}',
        icon: 'fas fa-cog',
        disabled: function(key, opt) {
          var info = jeeP.getElementInfo(this)
          return !(info.type == 'eqLogic' || info.type == 'cmd' || info.type == 'graph')
        },
        callback: function(key, opt) {
          var info = jeeP.getElementInfo(this)
          if (info.type == 'graph') {
            var el = $(this)
            var dom_el = this
            if (dom_el.length) dom_el = dom_el[0]

            $('#md_modal').load('index.php?v=d&modal=cmd.graph.select', function() {
              $('#table_addViewData tbody tr .enable').prop('checked', false)
              var options = json_decode(dom_el.querySelector('.graphOptions').jeeValue())
              for (var i in options) {
                var tr = document.querySelector('#table_addViewData tbody tr[data-link_id="' + options[i].link_id + '"]')
                tr.querySelector('.enable').jeeValue(1)
                tr.setJeeValues(options[i], '.graphDataOption')
                jeeP.setColorSelect(tr.querySelector('.graphDataOption[data-l1key="configuration"][data-l2key="graphColor"]'))
              }

              //set modal options:
              $('#md_modal').dialog({
                title: "{{Configuration avancée}}"
              })
              var buttons = {}
              var closeButtonText = "{{Annuler}}"
              var validateButtonText = "{{Valider}}"
              buttons[closeButtonText] = function() {
                $(this).dialog("close")
              }
              buttons[validateButtonText] = function() {
                var tr = document.querySelector('#table_addViewData tbody tr')
                var options = []
                while (tr.getAttribute('data-link_id') != undefined) {
                  if (tr.querySelector('.enable').checked == true) {
                    var graphData = tr.getJeeValues('.graphDataOption')[0]
                    graphData.link_id = tr.getAttribute('data-link_id')
                    options.push(graphData)
                  }
                  tr = tr.next()
                }
                el.find('.graphOptions').empty().append(JSON.stringify(options))
                jeeP.savePlan(true)
                $(this).dialog('close')
              }
              $('#md_modal').dialog({
                buttons: buttons
              })

              $('#md_modal').on("dialogclose", function(event, ui) {
                $(this).parent('div.ui-dialog').find('div.ui-dialog-buttonpane').remove()
              })
              $('#md_modal').dialog('open')
            })
          } else {
            $('#md_modal').load('index.php?v=d&modal=' + info.type + '.configure&' + info.type + '_id=' + info.id).dialog('open')
          }
        }
      },
      remove: {
        name: '{{Supprimer}}',
        icon: 'fas fa-trash',
        callback: function(key, opt) {
          jeeP.savePlan(false, false)
          jeedom.plan.remove({
            id: $(this).attr('data-plan_id'),
            error: function(error) {
              $.fn.showAlert({
                message: error.message,
                level: 'danger'
              })
            },
            success: function() {
              jeeP.displayPlan()
            },
          })
        }
      },
      duplicate: {
        name: '{{Dupliquer}}',
        icon: 'far fa-copy',
        disabled: function(key, opt) {
          var info = jeeP.getElementInfo(this)
          return !(info.type == 'text' || info.type == 'graph' || info.type == 'zone')
        },
        callback: function(key, opt) {
          var info = jeeP.getElementInfo(this)
          jeedom.plan.copy({
            id: $(this).attr('data-plan_id'),
            version: 'dashboard',
            error: function(error) {
              $.fn.showAlert({
                message: error.message,
                level: 'danger'
              })
            },
            success: function(data) {
              jeeP.displayObject(data.plan, data.html)
            }
          })
        }
      },
      lock: {
        name: "{{Verrouiller}}",
        type: 'checkbox',
        events: {
          click: function(opt) {
            if (this.jeeValue() == 1) {
              opt.handleObj.data.$trigger.addClass('locked')
            } else {
              opt.handleObj.data.$trigger.removeClass('locked')
            }
            $('.context-menu-root').hide()
          }
        }
      },
    }
  })
}

/**************************************init*********************************************/
jeeP.displayPlan()

$('#bt_createNewDesign').on('click', function() {
  jeeP.createNewDesign()
})

jeeP.$pageContainer.off('click', '.plan-link-widget').on('click', '.plan-link-widget', function() {
  if (!jeeFrontEnd.planEditOption.state) {
    if ($(this).attr('data-link_id') == undefined) {
      return
    }
    jeephp2js.planHeader_id = $(this).attr('data-link_id')
    jeeFrontEnd.planEditOption = {
      state: false,
      snap: false,
      grid: false,
      gridSize: jeeFrontEnd.planEditOption.gridSize,
      highlight: true
    }
    jeeP.displayPlan()
  }
})

jeeP.$pageContainer.on('click', '.zone-widget:not(.zoneEqLogic)', function() {
  var el = $(this)
  if (!jeeFrontEnd.planEditOption.state) {
    el.append('<center class="loading"><i class="fas fa-spinner fa-spin fa-4x"></i></center>')
    jeedom.plan.execute({
      id: el.attr('data-plan_id'),
      error: function(error) {
        $.fn.showAlert({
          message: error.message,
          level: 'danger'
        })
        el.empty().append('<center class="loading"><i class="fas fa-times fa-4x"></i></center>')
        setTimeout(function() {
          el.empty()
          clickedOpen = false
        }, 3000)
      },
      success: function() {
        el.empty()
        clickedOpen = false
      },
    })
  }
})

jeeP.$pageContainer.on('mouseenter', '.zone-widget.zoneEqLogic.zoneEqLogicOnFly', function() {
  if (!jeeFrontEnd.planEditOption.state) {
    clickedOpen = true
    var el = $(this)
    jeedom.eqLogic.toHtml({
      id: el.attr('data-eqLogic_id'),
      version: 'dashboard',
      global: false,
      success: function(data) {
        var html = $(data.html).css('position', 'absolute')
        html.attr("style", html.attr("style") + "; " + el.attr('data-position'))
        el.empty().append(html)
        jeedomUtils.positionEqLogic(el.attr('data-eqLogic_id'), false)
        if (jeeP.deviceInfo.type == 'desktop') {
          el.off('mouseleave').on('mouseleave', function() {
            el.empty()
            clickedOpen = false
          })
        }
      }
    })
  }
})

jeeP.$pageContainer.on('click', '.zone-widget.zoneEqLogic.zoneEqLogicOnClic', function() {
  if (!jeeFrontEnd.planEditOption.state && !clickedOpen) {
    clickedOpen = true
    var el = $(this)
    jeedom.eqLogic.toHtml({
      id: el.attr('data-eqLogic_id'),
      version: 'dashboard',
      global: false,
      success: function(data) {
        let html = $(data.html).css('position', 'absolute')
        html.attr("style", html.attr("style") + "; " + el.attr('data-position'))
        el.empty().append(html)
        jeedomUtils.positionEqLogic(el.attr('data-eqLogic_id'), false)
        if (jeeP.deviceInfo.type == 'desktop' && el.hasClass('zoneEqLogicOnFly')) {
          el.off('mouseleave').on('mouseleave', function() {
            el.empty()
            clickedOpen = false
          })
        }
      }
    })
  }
})

$(document).click(function(event) {
  if (!jeeFrontEnd.planEditOption.state) {
    if ((!$(event.target).hasClass('.zone-widget.zoneEqLogic') && $(event.target).closest('.zone-widget.zoneEqLogic').html() == undefined) && (!$(event.target).hasClass('.zone-widget.zoneEqLogicOnFly') && $(event.target).closest('.zone-widget.zoneEqLogicOnFly').html() == undefined)) {
      $('.zone-widget.zoneEqLogic').each(function() {
        if ($(this).hasClass('zoneEqLogicOnClic') || $(this).hasClass('zoneEqLogicOnFly')) {
          $(this).empty()
          clickedOpen = false
        }
      })
    }
  }
})

$('.view-link-widget').off('click').on('click', function() {
  if (!jeeFrontEnd.planEditOption.state) {
    $(this).find('a').click()
  }
})

$('.div_displayObject').off('resize', '.graph-widget').on('resize', '.graph-widget', function() {
  if (isset(jeedom.history.chart['div_designGraph' + $(this).attr('data-graph_id')])) {
    jeedom.history.chart['div_designGraph' + $(this).attr('data-graph_id')].chart.reflow()
  }
})

$('.graphDataOption[data-l1key=configuration][data-l2key=graphColor]').off('change').on('change', function() {
  jeeP.setColorSelect(this.closest('select'))
})

$(function() {
  jeedomUI.setEqSignals()
  jeedomUI.setHistoryModalHandler()

  //back to mobile home with three fingers on mobile:
  if (user_isAdmin == 1 && $('body').attr('data-device') == 'mobile') {
    $('body').on('touchstart', function(event) {
      if (event.touches.length == 3) {
        $('body').off('touchstart')
        event.preventDefault()
        event.stopPropagation()
        window.location.href = 'index.php?v=m'
      }
    })
  }
})
