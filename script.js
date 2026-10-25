// ============================================
// RUPEES LENS - Financial Visibility Dashboard
// ============================================
const STORAGE_KEY = "rupeesLensData";

// Load existing data from localStorage or start fresh
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing localStorage data", e);
        }
    }
    return { transactions: [] };
}

// Function to save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Global data object initialized from storage
var data = loadData();

document.addEventListener("DOMContentLoaded", () => {

    // ---------- DOM ELEMENTS ----------
    const transactionForm = document.getElementById("transactionForm");
    const descriptionInput = document.getElementById("description");
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    const typeInput = document.getElementById("type");
    const categoryInput = document.getElementById("category");
    const necessityInput = document.getElementById("necessity");
    const transactionList = document.getElementById("transactionList");

    const totalIncomeEl = document.getElementById("totalIncome");
    const chartPeriodInput = document.getElementById("chartPeriod");
    const totalExpensesEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("balance");
    const leakCountEl = document.getElementById("leakCount");

    const radarResults = document.getElementById("radarResults");

    const subscriptionForm = document.getElementById("subscriptionForm");
    const subNameInput = document.getElementById("subName");
    const subAmountInput = document.getElementById("subAmount");
    const subFrequencyInput = document.getElementById("subFrequency");
    const subDateInput = document.getElementById("subDate");
    const subscriptionList = document.getElementById("subscriptionList");
    const subscriptionAnnualEl = document.getElementById("subscriptionAnnual");

    const planForm = document.getElementById("planForm");
    const planMonthInput = document.getElementById("planMonth");
    const planAmountInput = document.getElementById("planAmount");
    const forecastSummary = document.getElementById("forecastSummary");
    const forecastList = document.getElementById("forecastList");

    const reductionInput = document.getElementById("reduction");
    const reductionLabel = document.getElementById("reductionLabel");
    const monthlySavingEl = document.getElementById("monthlySaving");
    const annualSavingEl = document.getElementById("annualSaving");

    // ---------- DATA ----------
    let data = loadData();
    let monthlyChart = null;
    let categoryChart = null;

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                return {
                    transactions: Array.isArray(parsed.transactions)
                        ? parsed.transactions
                        : [],
                    subscriptions: Array.isArray(parsed.subscriptions)
                        ? parsed.subscriptions
                        : [],
                    monthlyPlans:
                        parsed.monthlyPlans &&
                        typeof parsed.monthlyPlans === "object"
                            ? parsed.monthlyPlans
                            : {}
                };
            }
        } catch (error) {
            console.error("Could not load saved data:", error);
        }

        return {
            transactions: [],
            subscriptions: [],
            monthlyPlans: {}
        };
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Could not save data:", error);
            alert("Your browser could not save the data. Please check browser storage.");
        }
    }

    // ---------- HELPER FUNCTIONS ----------
    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function money(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function localDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function monthKey(dateString) {
        return String(dateString || "").slice(0, 7);
    }

    function monthLabel(key) {
        const [year, month] = key.split("-").map(Number);

        return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric"
        });
    }
    function getWeekKey(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    function validAmount(value) {
        const amount = Number(value);
        return Number.isFinite(amount) && amount > 0;
    }

    function getMonthlyTransactions(key) {
        return data.transactions.filter(transaction =>
            monthKey(transaction.date) === key
        );
    }

    function sumTransactions(transactions, type) {
        return transactions
            .filter(transaction => transaction.type === type)
            .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    }

    // ---------- TRANSACTIONS ----------
    function renderTransactions() {
        if (!transactionList) return;

        const sorted = [...data.transactions].sort((a, b) =>
            String(b.date).localeCompare(String(a.date))
        );

        if (sorted.length === 0) {
            transactionList.innerHTML = `
                <tr>
                    <td colspan="6">No transactions yet. Add your first transaction above.</td>
                </tr>
            `;
            return;
        }

        transactionList.innerHTML = sorted.map(transaction => `
            <tr>
                <td>${escapeHTML(transaction.description)}</td>
                <td>${escapeHTML(transaction.date)}</td>
                <td>${escapeHTML(transaction.category)}</td>
                <td>${escapeHTML(transaction.type)}</td>
                <td class="${transaction.type === "income" ? "income-amount" : "expense-amount"}">
                    ${transaction.type === "income" ? "+" : "-"}${money(transaction.amount)}
                </td>
                <td>
                    <button
                        type="button"
                        class="delete-btn"
                        data-delete-transaction="${escapeHTML(transaction.id)}"
                        aria-label="Delete transaction"
                    >Delete</button>
                </td>
            </tr>
        `).join("");
    }

    if (transactionForm) {
        if (dateInput && !dateInput.value) {
            dateInput.value = localDateString();
        }

        transactionForm.addEventListener("submit", event => {
        event.preventDefault();

        const description = descriptionInput ? descriptionInput.value.trim() : "";
        const amount = amountInput ? Number(amountInput.value) : 0;
        const date = dateInput ? dateInput.value : "";
        const type = typeInput ? typeInput.value : "expense";
        const category = categoryInput ? categoryInput.value : "General";
        const necessity = necessityInput ? necessityInput.value : "Need";

        if (!description || !date || !amount || isNaN(amount)) {
            alert("Please enter a description, a valid amount, and a date.");
            return;
        }

        if (!["income", "expense"].includes(type)) {
            alert("Please choose Income or Expense.");
            return;
        }

        // 1. Push to transactions array
        data.transactions.push({
            id: (typeof createId === "function") ? createId() : Date.now(),
            description,
            amount,
            date,
            type,
            category,
            necessity
        });

        // 2. Save to browser storage
        localStorage.setItem("rupeesLensData", JSON.stringify(data));
        if (typeof saveData === "function") saveData();

        // 3. Reset form inputs
        transactionForm.reset();
        if (dateInput && typeof localDateString === "function") {
            dateInput.value = localDateString();
        }

        // 4. Refresh Dashboard, Charts, and Anomaly Radar
        if (typeof refreshDashboard === "function") refreshDashboard();
        if (typeof renderTransactions === "function") renderTransactions();
        if (typeof renderPeriodChart === "function") renderPeriodChart();
        if (typeof renderCategoryChart === "function") renderCategoryChart();
        if (typeof detectFinancialAnomalies === "function") detectFinancialAnomalies();
        if (typeof detectMoneyLeaks === "function") detectMoneyLeaks();
    });
    }

    if (transactionList) {
        transactionList.addEventListener("click", event => {
            const button = event.target.closest("[data-delete-transaction]");
            if (!button) return;

            const id = button.dataset.deleteTransaction;

            if (!confirm("Delete this transaction?")) return;

            data.transactions = data.transactions.filter(item => item.id !== id);
            saveData();
            refreshDashboard();
        });
    }

    // ---------- DASHBOARD SUMMARY ----------
    function renderSummary() {
    const currentMonth = localDateString().slice(0, 7);
    const transactions = getMonthlyTransactions(currentMonth);

    const income = sumTransactions(transactions, "income");
    const expenses = sumTransactions(transactions, "expense");
    const balance = income - expenses;

    if (totalIncomeEl) totalIncomeEl.textContent = money(income);
    if (totalExpensesEl) totalExpensesEl.textContent = money(expenses);
    if (balanceEl) balanceEl.textContent = money(balance);

    // Calculate leaks only when expense transactions exist
    const expenseTx = (transactions || []).filter(t => t.type === "expense" && !t.isTransfer && !t.isRefund);
    let leakCount = 0;

    if (expenseTx.length > 0) {
        const nonEssential = expenseTx
            .filter(t => t.necessity === "non-essential")
            .reduce((s, t) => s + Number(t.amount || 0), 0);
            
        if (expenses > 0 && (nonEssential / expenses) > 0.4) {
            leakCount++;
        }
    }

    // Match exact ID from line 84 of index.html
    const leakCountEl = document.getElementById("leakCount");
    if (leakCountEl) {
        leakCountEl.textContent = leakCount;
    }
}
    // ---------- CHARTS ----------
   function renderPeriodChart() {
        const canvas = document.getElementById("monthlyChart");

        if (!canvas || typeof Chart === "undefined") return;

        const period = chartPeriodInput ? chartPeriodInput.value : "monthly";
        const labels = [];
        const incomes = [];
        const expenses = [];
        const now = new Date();

        if (period === "weekly") {
            for (let i = 7; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
                const weekLabel = `W${getWeekKey(date).split('-W')[1]} (${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })})`;
                
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                const filtered = data.transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= start && tDate <= end;
                });

                labels.push(weekLabel);
                incomes.push(sumTransactions(filtered, "income"));
                expenses.push(sumTransactions(filtered, "expense"));
            }
        } else if (period === "yearly") {
            const currentYear = now.getFullYear();
            for (let i = 4; i >= 0; i--) {
                const yr = String(currentYear - i);
                const filtered = data.transactions.filter(t => t.date.startsWith(yr));

                labels.push(yr);
                incomes.push(sumTransactions(filtered, "income"));
                expenses.push(sumTransactions(filtered, "expense"));
            }
        } else {
            for (let offset = 11; offset >= 0; offset--) {
                const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
                const key = monthKey(localDateString(date));
                const transactions = getMonthlyTransactions(key);

                labels.push(date.toLocaleDateString("en-IN", {
                    month: "short",
                    year: "2-digit"
                }));

                incomes.push(sumTransactions(transactions, "income"));
                expenses.push(sumTransactions(transactions, "expense"));
            }
        }

        if (monthlyChart) monthlyChart.destroy();

        monthlyChart = new Chart(canvas, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Income",
                        data: incomes,
                        backgroundColor: "#16a34a"
                    },
                    {
                        label: "Expenses",
                        data: expenses,
                        backgroundColor: "#ef4444"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => "₹" + Number(value).toLocaleString("en-IN")
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => `${context.dataset.label}: ${money(context.raw)}`
                        }
                    }
                }
            }
        });
    } 
    function renderCategoryChart() {
        const canvas = document.getElementById("categoryChart");

        if (!canvas || typeof Chart === "undefined") return;

        const currentMonth = localDateString().slice(0, 7);
        const expenses = getMonthlyTransactions(currentMonth)
            .filter(transaction => transaction.type === "expense");

        const totals = {};

        expenses.forEach(transaction => {
            const category = transaction.category || "Other";
            totals[category] = (totals[category] || 0) + Number(transaction.amount || 0);
        });

        const labels = Object.keys(totals);
        const values = labels.map(label => totals[label]);

        if (categoryChart) categoryChart.destroy();

        categoryChart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: labels.length ? labels : ["No expenses yet"],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: [
                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#06b6d4",
                        "#ec4899",
                        "#64748b"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => {
                                if (!values.length) return "No expenses yet";
                                return `${context.label}: ${money(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ---------- EXPENSE LEAK RADAR ----------
    function renderRadar() {
        if (!radarResults) return;

        const currentMonth = localDateString().slice(0, 7);
        const expenses = getMonthlyTransactions(currentMonth)
            .filter(transaction => transaction.type === "expense");

        const alerts = [];

        // Look for repeated expense descriptions.
        const descriptionTotals = {};

        expenses.forEach(transaction => {
            const key = transaction.description.trim().toLowerCase();

            if (!descriptionTotals[key]) {
                descriptionTotals[key] = {
                    name: transaction.description,
                    count: 0,
                    total: 0
                };
            }

            descriptionTotals[key].count++;
            descriptionTotals[key].total += Number(transaction.amount || 0);
        });

        Object.values(descriptionTotals).forEach(item => {
            if (item.count >= 3) {
                alerts.push({
                    title: `Repeated expense: ${item.name}`,
                    detail: `${item.count} transactions this month, totaling ${money(item.total)}. Check whether all were necessary.`
                });
            }
        });

        // Flag categories with relatively high spending.
        const categoryTotals = {};

        expenses.forEach(transaction => {
            const category = transaction.category || "Other";
            categoryTotals[category] = (categoryTotals[category] || 0) +
                Number(transaction.amount || 0);
        });

        Object.entries(categoryTotals).forEach(([category, total]) => {
            if (total >= 5000) {
                alerts.push({
                    title: `High spending: ${category}`,
                    detail: `You spent ${money(total)} in this category this month. Review the transactions to see whether you can reduce them.`
                });
            }
        });

        // Flag flexible expenses that form a large monthly total.
        const flexibleTotal = expenses
            .filter(transaction => transaction.necessity === "flexible")
            .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

        if (flexibleTotal >= 3000) {
            alerts.push({
                title: "Flexible spending to review",
                detail: `Flexible expenses total ${money(flexibleTotal)} this month. Consider whether some can be reduced.`
            });
        }

        // Subscriptions are included as a reminder, not as a second expense total.
        const annualSubscriptions = data.subscriptions.reduce((sum, sub) => {
            return sum + Number(sub.amount || 0) * frequencyMultiplier(sub.frequency);
        }, 0);

        if (annualSubscriptions > 0) {
            alerts.push({
                title: "Recurring subscriptions",
                detail: `Your listed subscriptions may cost ${money(annualSubscriptions)} per year. Check which ones you still use.`
            });
        }

        if (leakCountEl) leakCountEl.textContent = String(alerts.length);

        if (!alerts.length) {
            radarResults.innerHTML = `
                <div class="insight-item">
                    <strong>No potential leaks detected yet.</strong>
                    <p>Add your transactions to discover repeated spending and categories to review.</p>
                </div>
            `;
            return;
        }

        radarResults.innerHTML = alerts.map(alert => `
            <div class="insight-item">
                <strong>${escapeHTML(alert.title)}</strong>
                <p>${escapeHTML(alert.detail)}</p>
            </div>
        `).join("");
    }

    // ---------- SUBSCRIPTIONS ----------
    function frequencyMultiplier(frequency) {
        const multipliers = {
            weekly: 52,
            monthly: 12,
            quarterly: 4,
            yearly: 1
        };

        return multipliers[frequency] || 12;
    }

    function renderSubscriptions() {
        if (subscriptionList) {
            if (!data.subscriptions.length) {
                subscriptionList.innerHTML = `
                    <tr>
                        <td colspan="5">No subscriptions added yet.</td>
                    </tr>
                `;
            } else {
                subscriptionList.innerHTML = data.subscriptions.map(sub => `
                    <tr>
                        <td>${escapeHTML(sub.name)}</td>
                        <td>${escapeHTML(sub.frequency)}</td>
                        <td>${escapeHTML(sub.nextDate || "Not set")}</td>
                        <td>Active</td>
                        <td>
                            <button
                                type="button"
                                class="delete-btn"
                                data-delete-subscription="${escapeHTML(sub.id)}"
                            >Delete</button>
                        </td>
                    </tr>
                `).join("");
            }
        }

        const annualCost = data.subscriptions.reduce((total, sub) => {
            return total + Number(sub.amount || 0) * frequencyMultiplier(sub.frequency);
        }, 0);

        if (subscriptionAnnualEl) {
            subscriptionAnnualEl.textContent = money(annualCost);
        }
    }

    if (subscriptionForm) {
        if (subDateInput && !subDateInput.value) {
            subDateInput.value = localDateString();
        }

        subscriptionForm.addEventListener("submit", event => {
            event.preventDefault();

            const name = subNameInput.value.trim();
            const amount = Number(subAmountInput.value);
            const frequency = subFrequencyInput.value;
            const nextDate = subDateInput.value;

            if (!name || !validAmount(amount) || !nextDate) {
                alert("Please enter a subscription name, a valid amount, and a payment date.");
                return;
            }

            data.subscriptions.push({
                id: createId(),
                name,
                amount,
                frequency,
                nextDate
            });

            saveData();
            subscriptionForm.reset();

            if (subDateInput) subDateInput.value = localDateString();

            refreshDashboard();
        });
    }

    if (subscriptionList) {
        subscriptionList.addEventListener("click", event => {
            const button = event.target.closest("[data-delete-subscription]");
            if (!button) return;

            const id = button.dataset.deleteSubscription;

            if (!confirm("Delete this subscription?")) return;

            data.subscriptions = data.subscriptions.filter(sub => sub.id !== id);
            saveData();
            refreshDashboard();
        });
    }

    // ---------- 12-MONTH FORECAST ----------
    function renderForecast() {
        if (!forecastList) return;

        const now = new Date();
        const months = [];

        for (let offset = 0; offset < 12; offset++) {
            const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            const key = monthKey(localDateString(date));

            const actualExpenses = sumTransactions(
                getMonthlyTransactions(key),
                "expense"
            );

            const hasPlan = Object.prototype.hasOwnProperty.call(data.monthlyPlans, key);
            const plannedExpenses = hasPlan ? Number(data.monthlyPlans[key]) : null;

            // A plan replaces the estimate for that month; it is not added
            // on top of actual expenses.
            const estimatedExpenses = hasPlan ? plannedExpenses : actualExpenses;

            months.push({
                key,
                label: monthLabel(key),
                actualExpenses,
                plannedExpenses,
                estimatedExpenses,
                hasPlan
            });
        }

        forecastList.innerHTML = months.map(month => `
            <tr>
                <td>${escapeHTML(month.label)}</td>
                <td>${money(month.actualExpenses)}</td>
                <td>${month.hasPlan ? money(month.plannedExpenses) : "Not set"}</td>
                <td>${money(month.estimatedExpenses)}</td>
            </tr>
        `).join("");

        const totalEstimated = months.reduce(
            (sum, month) => sum + month.estimatedExpenses,
            0
        );

        if (forecastSummary) {
            forecastSummary.textContent =
                `Estimated expenses for the next 12 months: ${money(totalEstimated)}. ` +
                `For months with a plan, the planned amount is used; otherwise, recorded expenses are used. ` +
                `Future months without a plan or recorded expenses show ₹0, so add plans for a more useful forecast.`;
        }
    }

    if (planForm) {
        if (planMonthInput && !planMonthInput.value) {
            planMonthInput.value = localDateString().slice(0, 7);
        }

        planForm.addEventListener("submit", event => {
            event.preventDefault();

            const month = planMonthInput.value;
            const amount = Number(planAmountInput.value);

            if (!month || !validAmount(amount)) {
                alert("Please choose a month and enter a planned expense greater than zero.");
                return;
            }

            data.monthlyPlans[month] = amount;

            saveData();
            planForm.reset();

            if (planMonthInput) {
                planMonthInput.value = localDateString().slice(0, 7);
            }

            refreshDashboard();
        });
    }

    // ---------- SAVINGS SIMULATOR ----------
    function renderSavingsSimulator() {
        if (!reductionInput) return;

        const reductionPercent = Number(reductionInput.value) || 0;
        const currentMonth = localDateString().slice(0, 7);

        const flexibleExpenses = getMonthlyTransactions(currentMonth)
            .filter(transaction =>
                transaction.type === "expense" &&
                transaction.necessity === "flexible"
            )
            .reduce((total, transaction) =>
                total + Number(transaction.amount || 0), 0
            );

        const monthlySaving = flexibleExpenses * reductionPercent / 100;
        const annualSaving = monthlySaving * 12;

        if (reductionLabel) {
            reductionLabel.textContent = `${reductionPercent}%`;
        }

        if (monthlySavingEl) {
            monthlySavingEl.textContent = money(monthlySaving);
        }

        if (annualSavingEl) {
            annualSavingEl.textContent = money(annualSaving);
        }
    }

    if (reductionInput) {
        reductionInput.addEventListener("input", renderSavingsSimulator);
    }
    if (chartPeriodInput) {
        chartPeriodInput.addEventListener("change", renderPeriodChart);
    }

    // ---------- NAVIGATION ----------
    document.querySelectorAll(".sidebar a[href^='#']").forEach(link => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".sidebar a").forEach(item => {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });
    });

    // ---------- REFRESH EVERYTHING ----------
    function refreshDashboard() {
        renderTransactions();
        renderSummary();
        renderPeriodChart();
        renderCategoryChart();
        renderRadar();
        renderSubscriptions();
        renderForecast();
        renderSavingsSimulator();
        detectMoneyLeaks();
        detectFinancialAnomalies();
        updateSavingsChallenge();
    }

    // First display when the page opens.
    refreshDashboard();
});
// ---------- MONEY LEAK DETECTIVE LOGIC ----------
function detectMoneyLeaks() {
    const leakAlertsList = document.getElementById("leakAlertsList");
    const leakScoreEl = document.getElementById("leakScore");
  let rawTx = (typeof data !== "undefined" && data && Array.isArray(data.transactions)) ? data.transactions : (typeof transactions !== "undefined" && Array.isArray(transactions) ? transactions : []); let txArray = Array.isArray(rawTx) ? rawTx : [];
    if (!leakAlertsList || txArray.length === 0) {
        if (leakScoreEl) leakScoreEl.textContent = "0";
        if (leakAlertsList) {
            leakAlertsList.innerHTML = `<div class="no-leaks">Add your first transaction to start scanning for leaks.</div>`;
        }
        return;
    }

    leakAlertsList.innerHTML = "";
    let detectedLeaks = [];
    let leakPoints = 0;

    const expenses = txArray.filter(t => t.type === "expense");
    // 1. Repeated Small Micro-Purchases (bought >= 5 times)
    const merchantCounts = {};
    expenses.forEach(t => {
        const desc = (t.description || "").toLowerCase().trim();
        if (!merchantCounts[desc]) {
            merchantCounts[desc] = { count: 0, totalAmount: 0, rawName: t.description };
        }
        merchantCounts[desc].count += 1;
        merchantCounts[desc].totalAmount += Number(t.amount || 0);
    });

    for (let desc in merchantCounts) {
        const item = merchantCounts[desc];
        if (item.count >= 5 && (item.totalAmount / item.count) <= 200) {
            const monthlyEst = item.totalAmount;
            const annualCost = monthlyEst * 12;
            leakPoints += 25;
            detectedLeaks.push({
                icon: "☕",
                title: `Repeated Small Purchases: "${item.rawName}"`,
                desc: `You bought this ${item.count} times. That's approx <strong>₹${monthlyEst.toLocaleString("en-IN")}/month</strong> or <span class="leak-impact">₹${annualCost.toLocaleString("en-IN")}/year</span>.`
            });
        }
    }

    // 2. Duplicate Recurring Subscriptions
    const amountMap = {};
    expenses.forEach(t => {
        const amt = Number(t.amount);
        if (t.necessity === "non-essential" || t.category === "Subscriptions") {
            if (!amountMap[amt]) amountMap[amt] = [];
            amountMap[amt].push(t.description);
        }
    });

    for (let amt in amountMap) {
        if (amountMap[amt].length > 1) {
            const duplicates = [...new Set(amountMap[amt])].join(", ");
            const annualCost = Number(amt) * 12 * amountMap[amt].length;
            leakPoints += 30;
            detectedLeaks.push({
                icon: "🔄",
                title: `Possible Duplicate Subscriptions (₹${amt})`,
                desc: `Multiple recurring charges found for: <strong>${duplicates}</strong>. Combined annual cost: <span class="leak-impact">₹${annualCost.toLocaleString("en-IN")}/year</span>.`
            });
        }
    }

    // 3. High Discretionary Spending Ratio (>40% non-essential)
    const totalExpensesSum = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const nonEssentialSum = expenses
        .filter(t => t.necessity === "non-essential")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    if (totalExpensesSum > 0 && (nonEssentialSum / totalExpensesSum) > 0.4) {
        const ratioPct = Math.round((nonEssentialSum / totalExpensesSum) * 100);
        const annualLeak = nonEssentialSum * 12;
        leakPoints += 35;
        detectedLeaks.push({
            icon: "💸",
            title: `High Discretionary Spending (${ratioPct}% of total)`,
            desc: `Non-essential items account for ₹${nonEssentialSum.toLocaleString("en-IN")}. If unadjusted, this leaks <span class="leak-impact">₹${annualLeak.toLocaleString("en-IN")}/year</span>.`
        });
    }

    // Render score and list
    const finalScore = Math.min(leakPoints, 100);
    if (leakScoreEl) leakScoreEl.textContent = finalScore;

    if (detectedLeaks.length === 0) {
        leakAlertsList.innerHTML = `<div class="no-leaks">🎉 Great job! No major money leaks detected.</div>`;
    } else {
        detectedLeaks.forEach(leak => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "leak-item";
            itemDiv.innerHTML = `
                <div class="leak-icon">${leak.icon}</div>
                <div class="leak-details">
                    <div class="leak-title">${leak.title}</div>
                    <div class="leak-desc">${leak.desc}</div>
                </div>
            `;
            leakAlertsList.appendChild(itemDiv);
        });
    }
}
// --- MONEY AI CHATBOT LOGIC ---
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const closeChatBtn = document.getElementById("closeChatBtn");
const aiChatbot = document.getElementById("aiChatbot");

if (closeChatBtn && aiChatbot) {
    closeChatBtn.addEventListener("click", () => {
        aiChatbot.style.display = "none";
    });
}

if (sendBtn && userInput) {
    sendBtn.addEventListener("click", handleUserMessage);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleUserMessage();
    });
}

function handleUserMessage() {
    const query = userInput.value.trim();
    if (!query) return;

    appendMessage(query, "user-msg");
    userInput.value = "";

    try {
        const response = processMoneyQuery(query);
        setTimeout(() => {
            appendMessage(response, "bot-msg");
        }, 300);
    } catch (err) {
        console.error("Chatbot Error:", err);
        setTimeout(() => {
            appendMessage("Sorry, I encountered an error reading your data.", "bot-msg");
        }, 300);
    }
}

function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.className = className;
    msgDiv.innerHTML = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processMoneyQuery(q) {
    const query = q.toLowerCase().trim();
    
    // 1. Get ALL transactions directly
    let transactions = [];
    try {
        if (typeof state !== 'undefined' && state.transactions) {
            transactions = state.transactions;
        } else if (typeof transactions !== 'undefined' && Array.isArray(transactions)) {
            transactions = window.transactions || transactions;
        } else {
            const stored = localStorage.getItem("rupees_lens_data") || localStorage.getItem("transactions");
            if (stored) {
                const parsed = JSON.parse(stored);
                transactions = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
            }
        }
    } catch (e) {
        transactions = [];
    }

    // 2. Compute dynamic financial metrics
    let totalIncome = 0;
    let totalExpenses = 0;
    let nonEssential = 0;
    let essential = 0;
    const categoryTotals = {};

    transactions.forEach(t => {
        const amt = Number(t.amount || 0);
        const type = (t.type || "").toLowerCase();
        
        if (type === "income") {
            totalIncome += amt;
        } else if (type === "expense" && !t.isTransfer && !t.isRefund) {
            totalExpenses += amt;
            
            if (t.necessity === "non-essential" || t.category === "Want") {
                nonEssential += amt;
            } else {
                essential += amt;
            }

            const cat = t.category || "General";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        }
    });

    
    // Income
    function processMoneyQuery(q) {
    try {
        const query = q.toLowerCase().trim();

        // Safely retrieve stored transactions
        const txArray = (typeof data !== "undefined" && data && Array.isArray(data.transactions))
            ? data.transactions
            : [];

        // Calculate totals dynamically
        let totalIncome = 0;
        let totalExpenses = 0;

        txArray.forEach(t => {
            const amt = Number(t.amount) || 0;
            const type = (t.type || "expense").toLowerCase();
            if (type === "income") {
                totalIncome += amt;
            } else {
                totalExpenses += amt;
            }
        });

        const netBalance = totalIncome - totalExpenses;

        // Route intent
        if (query.includes("balance") || query.includes("remaining") || query.includes("left")) {
            return `Your net balance is <b>₹${netBalance.toFixed(2)}</b> (Total Income: ₹${totalIncome.toFixed(2)}, Expenses: ₹${totalExpenses.toFixed(2)}).`;
        }

        if (query.includes("income") || query.includes("earn") || query.includes("made")) {
            return `Your total recorded income is <b>₹${totalIncome.toFixed(2)}</b>.`;
        }

        if (query.includes("expense") || query.includes("spent") || query.includes("spending")) {
            return `You have spent a total of <b>₹${totalExpenses.toFixed(2)}</b> across ${txArray.length} transaction(s).`;
        }

        if (query.includes("leak") || query.includes("waste") || query.includes("save")) {
            if (totalExpenses === 0) {
                return `No money leaks detected! You currently have ₹0.00 in expenses.`;
            }
            return `Your current total expense under analysis is <b>₹${totalExpenses.toFixed(2)}</b>. Check your Money Leak Detective card for breakdown.`;
        }

        if (query.includes("hi") || query.includes("hello") || query.includes("hey")) {
            return `Hello! I'm your Money AI. Ask me about your remaining balance, total spending, or money leaks!`;
        }

        // Default response summary
        return `Here is your financial snapshot:<br>` +
               `• <b>Net Balance:</b> ₹${netBalance.toFixed(2)}<br>` +
               `• <b>Total Spent:</b> ₹${totalExpenses.toFixed(2)}<br>` +
               `• <b>Total Income:</b> ₹${totalIncome.toFixed(2)}`;

    } catch (err) {
        console.error("Chatbot processing error:", err);
        return "Sorry, I encountered an error reading your data.";
    }
}

    // Balance
    


    // Non-essential spending
    if (query.includes("non-essential") || query.includes("want") || query.includes("discretionary") || query.includes("extra")) {
        return `You spent <b>₹${nonEssential.toFixed(2)}</b> on non-essential items out of ₹${totalExpenses.toFixed(2)} total expenses.`;
    }

    // Category breakdown
    if (query.includes("category") || query.includes("where") || query.includes("breakdown") || query.includes("top")) {
        const categories = Object.keys(categoryTotals);
        if (categories.length === 0) return `No category data available yet. Add some expenses to see a breakdown!`;
        let topCat = categories.reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
        return `Top spending category: <b>${topCat}</b> (₹${categoryTotals[topCat].toFixed(2)}).`;
    }

    // Summary / Status
    if (query.includes("summary") || query.includes("overview") || query.includes("status") || query.includes("all") || query.includes("transaction")) {
        return `<b>Rupees Lens Financial Overview:</b><br>` +
               `• Total Income: ₹${totalIncome.toFixed(2)}<br>` +
               `• Total Expenses: ₹${totalExpenses.toFixed(2)}<br>` +
               `• Net Balance: ₹${netBalance.toFixed(2)}<br>` +
               `• Total Transactions: ${totalCount}`;
    }

    // Greetings
    if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("help") || query.includes("bot")) {
        return `Hello! I'm your Money AI. Ask me anything like:<br>` +
               `• <i>"What is my net balance?"</i><br>` +
               `• <i>"How much did I spend in total?"</i><br>` +
               `• <i>"Do I have any money leaks?"</i>`;
    }

    // Natural fallback for any other phrase
    return `Here is your current snapshot:<br>` +
           `• Net Balance: <b>₹${netBalance.toFixed(2)}</b><br>` +
           `• Total Spent: <b>₹${totalExpenses.toFixed(2)}</b><br>` +
           `Ask me about your <b>income</b>, <b>expenses</b>, <b>savings</b>, or <b>leaks</b>!`;
}
// ---------- FINANCIAL ANOMALY RADAR LOGIC ----------
// ------------ FINANCIAL ANOMALY RADAR LOGIC ------------
function detectFinancialAnomalies() {
    const anomalyResults = document.getElementById("anomalyResults");
    if (!anomalyResults) return;

    // Load fresh data directly from localStorage or global array
    let currentTransactions = [];
    if (typeof data !== "undefined" && Array.isArray(data.transactions)) {
        currentTransactions = data.transactions;
    } else {
        const stored = localStorage.getItem("rupeesLensData");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                currentTransactions = parsed.transactions || [];
            } catch (e) {
                currentTransactions = [];
            }
        }
    }

    if (currentTransactions.length === 0) {
        anomalyResults.innerHTML = `<div class="insight-item"><strong>No transactions available to analyze.</strong></div>`;
        return;
    }

    const anomalies = [];

    // Duplicate detection logic
    currentTransactions.forEach((tx, index) => {
        const isDuplicate = currentTransactions.some((otherTx, otherIndex) => 
            index !== otherIndex && 
            Number(tx.amount) === Number(otherTx.amount) && 
            tx.description.toLowerCase().trim() === otherTx.description.toLowerCase().trim()
        );

        if (isDuplicate) {
            const exists = anomalies.some(a => a.detail.includes(tx.description));
            if (!exists) {
                anomalies.push({
                    icon: "⚠️",
                    title: "Duplicate Expense Detected",
                    detail: `Possible duplicate found for "${tx.description}" of ₹${tx.amount}.`
                });
            }
        }
    });

    // Render results
    if (anomalies.length === 0) {
        anomalyResults.innerHTML = `
            <div class="insight-item">
                <strong>✅ No spending anomalies detected.</strong>
                <p>All recorded transactions match your normal spending baseline.</p>
            </div>
        `;
    } else {
        anomalyResults.innerHTML = anomalies.map(item => `
            <div class="insight-item" style="border-left: 4px solid #ef4444; padding: 10px; margin-top: 5px;">
                <strong>${item.icon} ${item.title}</strong>
                <p style="margin: 4px 0 0 0;">${item.detail}</p>
            </div>
        `).join("");
    }
}
// ------------ SMART SAVINGS CHALLENGE LOGIC ------------
function updateSavingsChallenge() {
    const progressText = document.getElementById("challengeProgressText");
    const progressBar = document.getElementById("challengeProgressBar");
    const badgeContainer = document.getElementById("badgeContainer");

    if (!progressText || !progressBar || !badgeContainer) return;

    // Load active transactions safely
    const txArray = (typeof data !== "undefined" && data && Array.isArray(data.transactions))
        ? data.transactions
        : [];

    let totalIncome = 0;
    let totalExpenses = 0;

    txArray.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        if ((tx.type || "expense").toLowerCase() === "income") {
            totalIncome += amt;
        } else {
            totalExpenses += amt;
        }
    });

    const totalSaved = Math.max(0, totalIncome - totalExpenses);
    const targetGoal = 5000;
    const percentage = Math.min(100, Math.round((totalSaved / targetGoal) * 100));

    // Update Progress UI
    progressText.textContent = `₹${totalSaved.toFixed(2)} / ₹${targetGoal.toLocaleString()}`;
    progressBar.style.width = `${percentage}%`;

    // Badges list
    const badges = [
        { name: "First Step", icon: "🌱", description: "Added 1st transaction", earned: txArray.length > 0 },
        { name: "Saver", icon: "💰", description: "Saved ₹1,000", earned: totalSaved >= 1000 },
        { name: "Goal Crusher", icon: "🎯", description: "Saved ₹5,000", earned: totalSaved >= 5000 },
        { name: "Leak Ninja", icon: "🛡️", description: "Tracked expenses", earned: totalExpenses > 0 }
    ];

    // Render Badges dynamically
    badgeContainer.innerHTML = badges.map(b => `
        <div style="
            padding: 10px 14px; 
            border-radius: 8px; 
            border: 1px solid ${b.earned ? '#22c55e' : '#cbd5e1'};
            background: ${b.earned ? '#f0fdf4' : '#f8fafc'};
            opacity: ${b.earned ? '1' : '0.5'};
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        ">
            <span style="font-size: 1.2rem;">${b.icon}</span>
            <div>
                <strong>${b.name}</strong>
                <div style="font-size: 0.75rem; color: #64748b;">${b.description}</div>
            </div>
        </div>
    `).join("");
}
// ------------ SMART SAVINGS CHALLENGE LOGIC ------------
// ------------ SMART SAVINGS CHALLENGE LOGIC ------------
function updateSavingsChallenge() {
    const progressText = document.getElementById("challengeProgressText");
    const progressBar = document.getElementById("challengeProgressBar");
    const badgeContainer = document.getElementById("badgeContainer");

    if (!progressText || !progressBar || !badgeContainer) return;

    // Retrieve active transactions safely
    const txArray = (typeof data !== "undefined" && data && Array.isArray(data.transactions))
        ? data.transactions
        : [];

    let totalIncome = 0;
    let totalExpenses = 0;

    txArray.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        if ((tx.type || "expense").toLowerCase() === "income") {
            totalIncome += amt;
        } else {
            totalExpenses += amt;
        }
    });

    // Calculate net positive savings
    const netSaved = totalIncome - totalExpenses;
    const displaySaved = Math.max(0, netSaved);
    const targetGoal = 5000;
    const percentage = Math.min(100, Math.round((displaySaved / targetGoal) * 100));

    // Update Progress UI
    progressText.textContent = `₹${displaySaved.toFixed(2)} / ₹${targetGoal.toLocaleString()}`;
    progressBar.style.width = `${percentage}%`;

    // Badges definitions
    const badges = [
        { name: "First Step", icon: "🌱", description: "Added 1st transaction", earned: txArray.length > 0 },
        { name: "Saver", icon: "💰", description: "Saved ₹1,000", earned: netSaved >= 1000 },
        { name: "Goal Crusher", icon: "🎯", description: "Saved ₹5,000", earned: netSaved >= 5000 },
        { name: "Leak Ninja", icon: "🛡️", description: "Tracked expenses", earned: totalExpenses > 0 }
    ];

    // Render Badges dynamically
    badgeContainer.innerHTML = badges.map(b => `
        <div style="
            padding: 10px 14px; 
            border-radius: 8px; 
            border: 1px solid ${b.earned ? '#22c55e' : '#cbd5e1'};
            background: ${b.earned ? '#f0fdf4' : '#f8fafc'};
            opacity: ${b.earned ? '1' : '0.5'};
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        ">
            <span style="font-size: 1.2rem;">${b.icon}</span>
            <div>
                <strong>${b.name}</strong>
                <div style="font-size: 0.75rem; color: #64748b;">${b.description}</div>
            </div>
        </div>
    `).join("");
}