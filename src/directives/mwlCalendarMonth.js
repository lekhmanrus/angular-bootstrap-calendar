'use strict';

var angular = require('angular');

angular
  .module('mwl.calendar')
  .controller('MwlCalendarMonthCtrl', function($scope, $filter, moment, calendarHelper, calendarConfig) {

    var vm = this;
    vm.calendarConfig = calendarConfig;

    $scope.$on('calendar.refreshView', function() {

      vm.weekDays = calendarHelper.getWeekDayNames();

      vm.view = calendarHelper.getMonthView(vm.events, vm.currentDay, vm.cellModifier);
      var rows = Math.floor(vm.view.length / 7);
      vm.monthOffsets = [];
      for (var i = 0; i < rows; i++) {
        vm.monthOffsets.push(i * 7);
      }

      //Auto open the calendar to the current day if set
      if (vm.autoOpen) {
        vm.view.forEach(function(day) {
          if (day.inMonth && moment(vm.currentDay).startOf('day').isSame(day.date) && !vm.openDayIndex) {
            vm.dayClicked(day, true);
          }
        });
      }

    });

    vm.dayClicked = function(day, dayClickedFirstRun) {

      if (!dayClickedFirstRun) {
        vm.onTimespanClick({
          calendarDate: day.date.toDate()
        });
      }

      vm.openRowIndex = null;
      var dayIndex = vm.view.indexOf(day);
      if (dayIndex === vm.openDayIndex) { //the day has been clicked and is already open
        vm.openDayIndex = null; //close the open day
      } else {
        vm.openDayIndex = dayIndex;
        vm.openRowIndex = Math.floor(dayIndex / 7);
      }

    };

    vm.getHTMLListEvents = function(date) {
      var events = [ ];
      vm.view.forEach(function(day) {
        if (moment(date).startOf('day').isSame(day.date)) {
          day.events.map(function(e) {
            var ret = $filter('calendarDate')(e.startsAt, 'time', true);
            if (calendarConfig.displayEventEndTimes && e.endsAt) {
              ret += ' - ' + $filter('calendarDate')(e.endsAt, 'time', true);
            }
            ret += ' - ' + e.title;
            events.push(ret);
            return ret;
          });
        }
      });
      var ret = '';
      if (events.length) {
        ret += '<ol>';
        for (var i in events) {
          if (events[i]) {
            ret += '<li>' + events[i] + '</li>';
          }
        }
        ret += '</ol>';
      }
      return ret;
    };

    vm.highlightEvent = function(event, shouldAddClass) {

      vm.view.forEach(function(day) {
        delete day.highlightClass;
        if (shouldAddClass) {
          var dayContainsEvent = day.events.indexOf(event) > -1;
          if (dayContainsEvent) {
            day.highlightClass = 'day-highlight dh-event-' + event.type;
          }
        }
      });

    };

    vm.handleEventDrop = function(event, newDayDate) {

      var newStart = moment(event.startsAt)
        .date(moment(newDayDate).date())
        .month(moment(newDayDate).month());

      var newEnd = calendarHelper.adjustEndDateFromStartDiff(event.startsAt, newStart, event.endsAt);

      vm.onEventTimesChanged({
        calendarEvent: event,
        calendarDate: newDayDate,
        calendarNewEventStart: newStart.toDate(),
        calendarNewEventEnd: newEnd ? newEnd.toDate() : null
      });
    };

  })
  .directive('mwlCalendarMonth', function(calendarUseTemplates) {

    return {
      template: calendarUseTemplates ? require('./../templates/calendarMonthView.html') : '',
      restrict: 'EA',
      require: '^mwlCalendar',
      scope: {
        events: '=',
        currentDay: '=',
        onEventClick: '=',
        onAddEventClick: '=',
        onEditEventClick: '=',
        onDeleteEventClick: '=',
        onEventTimesChanged: '=',
        addEventHtml: '=',
        createEventHtml: '=',
        editEventHtml: '=',
        deleteEventHtml: '=',
        autoOpen: '=',
        onTimespanClick: '=',
        cellModifier: '=',
        cellTemplateUrl: '@',
        cellEventsTemplateUrl: '@'
      },
      controller: 'MwlCalendarMonthCtrl as vm',
      link: function(scope, element, attrs, calendarCtrl) {
        scope.vm.calendarCtrl = calendarCtrl;
      },
      bindToController: true
    };

  });
