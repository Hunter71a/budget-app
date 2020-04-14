// BUDGET CONTROLLER
var budgetController = (function () {

  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
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
    percentageLabel: '.budget__expenses--percentage'
  };

  // add function to format numbers to money for better look in UI
  function formatMoney(number) {
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  //console.log(formatMoney(10000));   // $10,000.00
  //console.log(formatMoney(1000000)); // $1,000,000.00

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

        html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === 'exp') {
        element = DOMstrings.expensesContainer
        html = '<div class="item clearfix" id="expense-%id%" ><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }
      // replace the placeholder text with actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatMoney(obj.value));

      // insert the HTML into the DOM

      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);



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
    

      if (budgetDetails.percentage > 0){
        document.querySelector(DOMstrings.percentageLabel).textContent = budgetDetails.percentage + '%';
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }
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
  };


  var updateBudget = function () {

    // calculate the budget 
    budgetCtrl.calculateBudget();

    // return the budget
    var budget = budgetCtrl.getBudget();

    // populate the budget items on the UI
    UICtrl.displayBudget(budget);


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
    }
  };

  return {
    init: function () {
      console.log('Application innitialization in progress');
      setupEventListers();
      UICtrl.displayBudget({
        budget: 0,
        totalIncome: 0,
        totalExpenses: 0,
        percentage: -1
      });
    }
  };
})(budgetController, UIController);

// only line of code on the outside of out IIFE protection of the modules
controller.init();