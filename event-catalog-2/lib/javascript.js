function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var getMultiSelectValues = function getMultiSelectValues(input) {
  var options = _toConsumableArray(input.getElementsByTagName('OPTION'));

  return options.reduce(function (values, option) {
    if (option.selected) values.push(option.value);
    return values;
  }, []);
};

var fetchEvents = function fetchEvents(instances) {
  if (instances.length === 0) return;
  console.log("fetching event data for ".concat(instances));
  document.getElementById('main-spinner').style.display = '';
  document.getElementById('main-spinner-msg').innerHTML = 'Loading Events...';
  var withSuccess = google.script.run.withSuccessHandler(renderEvents);
  var withFailure = withSuccess.withFailureHandler(function (error) {
    console.log(error);
  });
  withFailure.getEvents(instances);
};

var renderEvents = function renderEvents(eventData) {
  console.log(eventData);
};