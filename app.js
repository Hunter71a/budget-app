// BUDGET CONTROLLER
var budgetController = (function () {

  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage
  };

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };


  var allExpenses = [];
  var allIncomes = [];
  var totalExpenses = 0;

  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function (item) {
      sum += item.value;
    });
    data.totals[type] = sum;
  }


  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1  //set percentage to -1 to indicate a percentage might not exist yet if there are no expenses
  };

  return {
    addItem: function (type, dsc, val) {
      var newItem, ID;
      // create new ID
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }
      // create new Item based on inc or exp type
      if (type === 'exp') {

        newItem = new Expense(ID, dsc, val);
      } else if (type === 'inc') {
        newItem = new Income(ID, dsc, val);
      }

      // push it into data structure
      data.allItems[type].push(newItem);

      // return the new element to caller
      return newItem;
    },

    deleteItem: function (type, id) {
      var ids, index;

      // create array of ids as first step to locating index of item
      ids = data.allItems[type].map(function (item) {
        return item.id;
      });

      // locate index of item we wish to delete
      index = ids.indexOf(id);

      // delete item from data
      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function () {

      // sum total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');

      // calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // calculate the percentage of income that is spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;   // use -1 to signify no percentage exists yet
      }
    },

    calculatePercentages: function () {
      data.allItems.exp.forEach(function (item) {
        item.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function () {
      var allPerc = data.allItems.exp.map(function (item) {
        return item.getPercentage();
      })
      return allPerc;

    },

    getBudget: function () {
      return {
        budget: data.budget,
        totalIncome: data.totals.inc,
        totalExpenses: data.totals.exp,
        percentage: data.percentage
      }
    },

    testing: function () {
      console.log(data);
    }
  };

})();



// UI CONTROLLER
var UIController = (function () {

  var DOMstrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month',
  };

  // add function to format numbers to money for better look in UI
  function formatMoney(number) {
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  //console.log(formatMoney(10000));   // $10,000.00
  //console.log(formatMoney(1000000)); // $1,000,000.00


  function formatNumber(num, type) {
    var numSplit, int, dec;
    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');

    int = numSplit[0];
    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    }
    dec = numSplit[1];
    //type ==='exp' ? sign = '-' : sign = '+';   // convert to handy shorthand as seen in line below
    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOMstrings.inputType).value,  // will be inc or exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
      };
    },
    addListItem: function (obj, type) {
      var html, newHtml, element;

      // create HTML string with placeholder text
      if (type === 'inc') {
        element = DOMstrings.incomeContainer;

        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === 'exp') {
        element = DOMstrings.expensesContainer
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }
      // replace the placeholder text with actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type)); //formatMoney(obj.value));

      // insert the HTML into the DOM

      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    deleteListItem: function (itemID) {
      // use more direct method to avoid convoluted remove child / parent node
      var itemObj = document.getElementById(itemID);
      itemObj.remove();

      // var removeThisItem = document.getElementById(itemID);

      // removeThisItem.parentNode.removeChild(removeThisItem);
    },

    clearFields: function () {
      var fields, fieldsArr;
      fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

      fieldsArr = Array.prototype.slice.call(fields);

      fieldsArr.forEach(function (current, index, array) {
        current.value = "";
      });
      fieldsArr[0].focus();

    },

    displayBudget: function (budgetDetails) {
      document.querySelector(DOMstrings.budgetLabel).textContent = formatMoney(budgetDetails.budget);
      document.querySelector(DOMstrings.incomeLabel).textContent = formatMoney(budgetDetails.totalIncome);
      document.querySelector(DOMstrings.expensesLabel).textContent = formatMoney(budgetDetails.totalExpenses);

      if (budgetDetails.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent = budgetDetails.percentage + '%';
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }
    },

    displayPercentages: function (percentages) {
      var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);




      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }

      });
    },

    displayDate: function () {
      var now, year, month, months;
      var now = new Date();
      // var christmas = new Date(2016, 11, 25);

      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      month = now.getMonth();
      year = now.getFullYear();

      document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;


    },

    changedType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.inputType + ',' +
        DOMstrings.inputDescription + ',' +
        DOMstrings.inputValue);
      nodeListForEach(fields, function (cur) {
        cur.classList.toggle('red-focus');
      });

      document.querySelector(DOMstrings.inputBtn).classList.toggle('red');

    },

    getDOMstrings: function () {
      return DOMstrings;
    }
  };

})();



// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {
  // pass other modules as arguments to the controller so it knows about them 

  var setupEventListers = function () {
    var DOM = UICtrl.getDOMstrings();
    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    // add ability to submit with enter key 
    // since the keystroke occurs at the document level we do not need to 
    // select an item using a query selector
    // instead look up the 'keyCode:' which is 13 for the enter key
    document.addEventListener('keypress', function (event) {
      //  console.log(event);  // convenient way to look up key code, make sure mouse is in brower document window when pressing
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
  };


  var updateBudget = function () {

    // calculate the budget 
    budgetCtrl.calculateBudget();

    // return the budget
    var budget = budgetCtrl.getBudget();

    // populate the budget items on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function () {
    //calculate precentages

    budgetCtrl.calculatePercentages();
    // read percentages from budget controller
    var percentages = budgetCtrl.getPercentages();

    console.log(percentages);
    //  update the UI with the new percentages
    UICtrl.displayPercentages(percentages);

  };

  var ctrlAddItem = function () {
    // declare method variables
    var input, newItem;

    // ass soon as someone hits button get input data field
    input = UICtrl.getInput();

    if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
      // add item to budget control
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // populate the item to the UI
      UICtrl.addListItem(newItem, input.type)

      // clear the input fields
      UICtrl.clearFields();

      // Calculate and update budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function (event) {
    var itemID, splitID, type, ID;
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemID) {
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);
      console.log(splitID);
      // delete item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // remove the item from the UI
      UICtrl.deleteListItem(itemID);

      // update and show the new budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();
    }
  };

  return {
    init: function () {
      console.log('Application innitialization in progress');
      setupEventListers();
      UICtrl.displayDate();
      UICtrl.displayBudget({
        budget: 0,
        totalIncome: 0,
        totalExpenses: 0,
        percentage: -1
      });
    }
  };
})(budgetController, UIController);

// only line of code on the outside of IIFE protection of the modules
controller.init();