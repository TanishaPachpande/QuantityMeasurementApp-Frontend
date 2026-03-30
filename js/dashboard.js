var UNITS = {
  length: [
    { label: 'Kilometer',  factor: 1000    },
    { label: 'Meter',      factor: 1       },
    { label: 'Centimeter', factor: 0.01    },
    { label: 'Millimeter', factor: 0.001   },
    { label: 'Mile',       factor: 1609.34 },
    { label: 'Foot',       factor: 0.3048  },
    { label: 'Inch',       factor: 0.0254  },
  ],
  weight: [
    { label: 'Kilogram',  factor: 1         },
    { label: 'Gram',      factor: 0.001     },
    { label: 'Milligram', factor: 0.000001  },
    { label: 'Pound',     factor: 0.453592  },
    { label: 'Ounce',     factor: 0.0283495 },
    { label: 'Tonne',     factor: 1000      },
  ],
  temperature: [
    { label: 'Celsius'    },
    { label: 'Fahrenheit' },
    { label: 'Kelvin'     },
  ],
  volume: [
    { label: 'Liter',      factor: 1         },
    { label: 'Milliliter', factor: 0.001     },
    { label: 'Gallon',     factor: 3.78541   },
    { label: 'Cup',        factor: 0.236588  },
    { label: 'Tablespoon', factor: 0.0147868 },
  ],
};

var currentType = 'length';
var currentAction = 'comparison';

function convertTemp(val, from, to) {
  var kelvin;
  if (from === 'Celsius') kelvin = val + 273.15;
  else if (from === 'Fahrenheit') kelvin = (val - 32) * (5 / 9) + 273.15;
  else kelvin = val;

  if (to === 'Celsius') return kelvin - 273.15;
  else if (to === 'Fahrenheit') return (kelvin - 273.15) * (9 / 5) + 32;
  else return kelvin;
}

function convertUnits(value, from, to, type) {
  if (from === to) return value;
  if (type === 'temperature') return convertTemp(value, from, to);

  var units = UNITS[type];
  var fromFactor = 1;
  var toFactor = 1;

  for (var i = 0; i < units.length; i++) {
    if (units[i].label === from) fromFactor = units[i].factor;
    if (units[i].label === to) toFactor = units[i].factor;
  }

  return (value * fromFactor) / toFactor;
}

function formatNum(n) {
  if (!isFinite(n)) return 'Error';
  return parseFloat(n.toPrecision(8)).toString();
}

function fillDropdown(id, units, selected) {
  var select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '';
  for (var i = 0; i < units.length; i++) {
    var option = document.createElement('option');
    option.value = units[i].label;
    option.text = units[i].label;
    select.appendChild(option);
  }
  select.value = selected;
}

function populateSelects(type) {
  var units = UNITS[type];
  var first = units[0].label;
  var second = units.length > 1 ? units[1].label : units[0].label;

  fillDropdown('comp-from-unit', units, first);
  fillDropdown('comp-to-unit', units, second);
  fillDropdown('comp-result-unit', units, first);

  fillDropdown('conv-from-unit', units, first);
  fillDropdown('conv-to-unit', units, second);

  fillDropdown('arith-unit1', units, first);
  fillDropdown('arith-unit2', units, first);
  fillDropdown('arith-result-unit', units, first);
}

function selectType(type) {
  currentType = type;

  var cards = document.querySelectorAll('.type-card');
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.remove('active');
  }
  document.getElementById('type-' + type).classList.add('active');

  populateSelects(type);
  compute();
}

function selectAction(action) {
  currentAction = action;

  var btns = document.querySelectorAll('.action-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active');
  }

  var panels = document.querySelectorAll('.panel');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active');
  }

  document.getElementById('act-' + action).classList.add('active');
  document.getElementById('panel-' + action).classList.add('active');
  compute();
}

function compute() {
  if (currentAction === 'comparison') computeComparison();
  else if (currentAction === 'conversion') computeConversion();
  else if (currentAction === 'arithmetic') computeArithmetic();
}

function computeComparison() {
  var fromVal = parseFloat(document.getElementById('comp-from-val').value) || 0;
  var toVal = parseFloat(document.getElementById('comp-to-val').value) || 0;
  var fromUnit = document.getElementById('comp-from-unit').value;
  var toUnit = document.getElementById('comp-to-unit').value;
  var resultUnit = document.getElementById('comp-result-unit').value;

  var fromConverted = convertUnits(fromVal, fromUnit, resultUnit, currentType);
  var toConverted = convertUnits(toVal, toUnit, resultUnit, currentType);

  var symbol;
  if (fromConverted < toConverted) symbol = '<';
  else if (fromConverted > toConverted) symbol = '>';
  else symbol = '=';

  document.getElementById('comp-result').textContent =
    formatNum(fromConverted) + ' ' + resultUnit + ' ' + symbol + ' ' + formatNum(toConverted) + ' ' + resultUnit;
}

function computeConversion() {
  var val = parseFloat(document.getElementById('conv-val').value) || 0;
  var fromUnit = document.getElementById('conv-from-unit').value;
  var toUnit = document.getElementById('conv-to-unit').value;
  var result = convertUnits(val, fromUnit, toUnit, currentType);

  document.getElementById('conv-result').textContent =
    val + ' ' + fromUnit + ' = ' + formatNum(result) + ' ' + toUnit;
}

function computeArithmetic() {
  var val1 = parseFloat(document.getElementById('arith-val1').value) || 0;
  var val2 = parseFloat(document.getElementById('arith-val2').value) || 0;
  var unit1 = document.getElementById('arith-unit1').value;
  var unit2 = document.getElementById('arith-unit2').value;
  var op = document.getElementById('arith-op').value;
  var resultUnit = document.getElementById('arith-result-unit').value;

  var val1Converted = convertUnits(val1, unit1, resultUnit, currentType);
  var val2Converted = convertUnits(val2, unit2, resultUnit, currentType);

  var result;
  if (op === '+') result = val1Converted + val2Converted;
  else if (op === '-') result = val1Converted - val2Converted;
  else if (op === '*') result = val1Converted * val2Converted;
  else if (op === '/') {
    if (val2Converted !== 0) result = val1Converted / val2Converted;
    else result = null;
  }

  var opSymbol;
  if (op === '+') opSymbol = '+';
  else if (op === '-') opSymbol = '−';
  else if (op === '*') opSymbol = '×';
  else opSymbol = '÷';

  if (result === null) {
    document.getElementById('arith-result').textContent = 'Cannot divide by zero';
  } else {
    document.getElementById('arith-result').textContent =
      val1 + ' ' + unit1 + ' ' + opSymbol + ' ' + val2 + ' ' + unit2 + ' = ' + formatNum(result) + ' ' + resultUnit;
  }
}

function logout() {
  localStorage.removeItem('qm_user');
  window.location.href = 'index.html';
}

window.onload = function() {
  populateSelects('length');
  compute();
};