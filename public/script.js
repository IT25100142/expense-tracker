const form = document.getElementById('expenseForm');
const list = document.getElementById('expenseList');
const totalLKRDisplay = document.getElementById('total-lkr');
const totalUSDDisplay = document.getElementById('total-usd');
const rateDisplay = document.getElementById('rate-display');
const topCompanionDisplay = document.getElementById('top-companion');

// Global Exchange Rates Cache
let rates = { USD: 1, LKR: 300 }; // Fallback defaults

// 1. Fetch Real-Time Exchange Rate
async function fetchExchangeRate() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        rates = data.rates; // Store all rates
        
        // Update header display
        const lkrRate = rates.LKR;
        rateDisplay.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #00b894;"></i> Live Rate: 1 USD = Rs. ${lkrRate.toFixed(2)}`;
        
        // Trigger converter update if it has values
        convertCurrency();
        
    } catch (error) {
        console.error("Error fetching rate:", error);
        rateDisplay.innerHTML = `<i class="fa-solid fa-wifi" style="color: #ff7675;"></i> Offline Mode: 1 USD = Rs. ${rates.LKR} (Default)`;
    }
}

// 2. Fetch Expenses and Calculate Unified Total
async function loadExpenses() {
    await fetchExchangeRate(); // Wait for rate

    const response = await fetch('/api/expenses');
    const resData = await response.json();
    const data = resData.data;
    
    list.innerHTML = '';
    
    let grandTotalLKR = 0;
    let companionStats = {}; // To track who you spend the most with

    data.forEach((expense, index) => {
        // Calculation Logic
        let valueInLKR = expense.amount;
        if (expense.currency === 'USD') {
            valueInLKR = expense.amount * rates.LKR;
        }
        grandTotalLKR += valueInLKR;

        // Companion Stats Logic
        if (expense.spent_with) {
            const name = expense.spent_with.trim();
            if (name) {
                companionStats[name] = (companionStats[name] || 0) + valueInLKR;
            }
        }

        // Display Logic
        const symbol = expense.currency === 'USD' ? '$' : 'Rs.';
        
        // Show "With: Name" if it exists
        const withTag = expense.spent_with ? ` <span style="color: #a29bfe; font-size: 0.8rem; margin-left: 5px;"><i class="fa-solid fa-user-group"></i> ${expense.spent_with}</span>` : '';

        const li = document.createElement('li');
        li.setAttribute('data-category', expense.category);
        li.style.animationDelay = `${index * 0.1}s`; 

        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-desc">${expense.description}</span>
                <span class="expense-meta">
                    <i class="fa-regular fa-clock"></i> ${new Date(expense.date).toLocaleDateString()} &bull; ${expense.category} ${withTag}
                </span>
            </div>
            <div class="expense-actions">
                <span class="expense-price">${symbol} ${expense.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})" title="Delete Expense">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(li);
    });

    // Update Totals
    const grandTotalUSD = grandTotalLKR / rates.LKR;
    totalLKRDisplay.innerText = `Rs. ${grandTotalLKR.toFixed(2)}`;
    totalUSDDisplay.innerText = `$ ${grandTotalUSD.toFixed(2)}`;

    // Update Top Companion
    let topPerson = '-';
    let topAmount = 0;
    for (const [person, amount] of Object.entries(companionStats)) {
        if (amount > topAmount) {
            topAmount = amount;
            topPerson = person;
        }
    }
    topCompanionDisplay.innerText = topPerson === '-' ? '-' : `${topPerson}`;
}

// 3. Add Expense
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const category = document.getElementById('category').value;
    const spent_with = document.getElementById('spent-with').value;

    // --- NEW VALIDATION ---
    if (amount <= 0) {
        alert("⚠️ Please enter a valid positive amount.");
        return; // Stop the function here
    }

    await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            description, 
            amount, 
            currency,
            category,
            spent_with, 
            date: new Date().toISOString() 
        })
    });

    form.reset();
    loadExpenses();
});

// 4. Delete Expense
async function deleteExpense(id) {
    if(confirm('Are you sure you want to delete this expense?')) {
        await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        loadExpenses();
    }
}

/* --- CALCULATOR LOGIC --- */
let calcExpression = "";

function appendCalc(val) {
    const display = document.getElementById('calc-display');
    calcExpression += val;
    display.innerText = calcExpression;
}

function clearCalc() {
    calcExpression = "";
    document.getElementById('calc-display').innerText = "0";
}

function backspaceCalc() {
    calcExpression = calcExpression.slice(0, -1);
    document.getElementById('calc-display').innerText = calcExpression || "0";
}

function calculateResult() {
    try {
        const result = eval(calcExpression); 
        document.getElementById('calc-display').innerText = result;
        calcExpression = result.toString();
    } catch (e) {
        document.getElementById('calc-display').innerText = "Error";
        calcExpression = "";
    }
}

/* --- CONVERTER LOGIC --- */
function convertCurrency() {
    const amount = parseFloat(document.getElementById('conv-amount').value);
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    const resultDisplay = document.getElementById('conv-result');

    // --- NEW VALIDATION ---
    if (!amount || amount < 0) {
        resultDisplay.innerText = "0.00";
        return;
    }

    const rateFrom = rates[from];
    const rateTo = rates[to];
    const converted = (amount / rateFrom) * rateTo;
    
    const symbol = to === 'USD' ? '$' : (to === 'EUR' ? '€' : (to === 'GBP' ? '£' : (to === 'JPY' ? '¥' : 'Rs.')));
    resultDisplay.innerText = `${symbol} ${converted.toFixed(2)}`;
}

function swapCurrencies() {
    const fromSel = document.getElementById('conv-from');
    const toSel = document.getElementById('conv-to');
    
    const temp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = temp;
    
    convertCurrency();
}

// Initial Load
loadExpenses();