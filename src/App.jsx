import { useEffect, useMemo, useState } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import './App.css'

const STORAGE_KEY = 'pockettrack-expenses'

function loadExpenses() {
  try {
    const savedExpenses = localStorage.getItem(STORAGE_KEY)

    if (!savedExpenses) return []

    const parsedExpenses = JSON.parse(savedExpenses)

    if (!Array.isArray(parsedExpenses)) return []

    return parsedExpenses.filter(
      (expense) =>
        expense &&
        typeof expense.id === 'string' &&
        typeof expense.amount === 'number' &&
        Number.isFinite(expense.amount) &&
        expense.amount > 0 &&
        typeof expense.category === 'string' &&
        typeof expense.date === 'string' &&
        typeof expense.note === 'string'
    )
  } catch (error) {
    console.error('Could not load PocketTrack expenses:', error)
    return []
  }
}

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const color = item.payload?.fill || item.color || '#35649A';

  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(item.value) || 0);

  return (
    <div
      style={{
        backgroundColor: color,
        border: `1px solid ${color}`,
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(38, 59, 83, 0.15)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {item.name}: {formattedAmount}
    </div>
  );
};

function App() {
  const today = new Date().toLocaleDateString('en-CA')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [expenses, setExpenses] = useState(loadExpenses)
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedDate, setSelectedDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    } catch (error) {
      console.error('Could not save PocketTrack expenses:', error)
    }
  }, [expenses])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)

  const todaysTotal = expenses
    .filter((expense) => expense.date === today)
    .reduce((total, expense) => total + expense.amount, 0)


  const filteredExpenses = useMemo(() => {
    const now = new Date()
    let fromDate
    let toDate

    if (dateFilter === 'today') {
      fromDate = today
      toDate = today
    } else if (dateFilter === 'day') {
      fromDate = selectedDate
      toDate = selectedDate
    } else if (dateFilter === 'week') {
      const day = now.getDay()
      const mondayOffset = day === 0 ? -6 : 1 - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      fromDate = monday.toLocaleDateString('en-CA')
      toDate = sunday.toLocaleDateString('en-CA')
    } else if (dateFilter === 'month') {
      fromDate = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-01`

      toDate = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${String(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      ).padStart(2, '0')}`
    } else {
      fromDate = startDate
      toDate = endDate
    }

    if (fromDate > toDate) return []

    return expenses.filter(
      (expense) =>
        expense.date >= fromDate &&
        expense.date <= toDate
    )
  }, [expenses, dateFilter, selectedDate, startDate, endDate])

  const filteredTotal = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  )

  const categoryData = Object.values(
    filteredExpenses.reduce((categories, expense) => {
      if (!categories[expense.category]) {
        categories[expense.category] = {
          name: expense.category,
          value: 0,
        }
      }

      categories[expense.category].value += expense.amount
      return categories
    }, {})
  )


  function handleAddExpense(event) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const amount = Number(formData.get('amount'))

    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    const newExpense = {
      id: crypto.randomUUID(),
      amount,
      category: formData.get('category'),
      date: formData.get('date'),
      note: String(formData.get('note') || '').trim(),
    }

    setExpenses((currentExpenses) => [
      newExpense,
      ...currentExpenses,
    ])

    form.reset()
    setIsFormOpen(false)
  }

  function handleDeleteExpense(id) {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id)
    )
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">₱</span>
          <span>PocketTrack</span>
        </a>

        <span className="topbar-label">
          Personal Expense Tracker
        </span>
      </header>

      <section className="dashboard">
        <div className="welcome">
          <div>
            <p className="eyebrow">YOUR MONEY, MADE CLEAR</p>
            <h1>Expense Tracker</h1>
            <p className="subtitle">
              Keep track of your spending, one expense at a time.
            </p>
          </div>

          <button
            className="add-button"
            type="button"
            onClick={() => setIsFormOpen(true)}
          >
            <span>＋</span> Add Expense
          </button>
        </div>

        <section className="summary-card">
          <div>
            <p className="summary-label">TOTAL SPENT TODAY</p>
            <h2>{formatCurrency(todaysTotal)}</h2>
            <p className="summary-caption">
              {todaysTotal > 0
                ? 'Your spending for today, all in one place.'
                : 'Your spending summary will appear here.'}
            </p>
          </div>

          <div className="summary-icon" aria-hidden="true">
            ₱
          </div>
        </section>


        <section className="insights-section">
          <div className="section-heading">
            <div>
              <h2>Expense Insights</h2>
              <p>Explore your spending over time</p>
            </div>
          </div>

          <div className="date-filter-controls">
            <label htmlFor="dateFilter">View expenses</label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="day">Specific Date</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === 'day' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label="Choose a date"
              />
            )}

            {dateFilter === 'custom' && (
              <div className="custom-date-range">
                <label>
                  From
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>

                <label>
                  To
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="insights-summary">
            <div>
              <p className="summary-label">TOTAL SPENT</p>
              <h2>{formatCurrency(filteredTotal)}</h2>
            </div>
            <div>
              <p className="summary-label">TRANSACTIONS</p>
              <h2>{filteredExpenses.length}</h2>
            </div>
          </div>


          <div className="category-chart-section">
            <div className="category-chart-heading">
              <h3>Spending by Category</h3>
              <p>See where your money goes</p>
            </div>

            {categoryData.length > 0 && filteredTotal > 0 ? (
              <div className="category-chart-content">
                <div className="category-donut-chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => {
                          const colors = [
                            '#35649A',
                            '#5BA7A7',
                            '#F0B35A',
                            '#8B78C6',
                            '#E17B77',
                          ]

                          return (
                            <Cell
                              key={entry.name}
                              fill={colors[index % colors.length]}
                            />
                          )
                        })}
                      </Pie>
                      
                      <Tooltip
                        content={<CategoryTooltip />}
                        cursor={false}
                        allowEscapeViewBox={{ x: true, y: true }}
                        position={{ x: 20, y: 20 }}
                      />

                    </PieChart>
                  </ResponsiveContainer>

                  <div className="category-chart-center">
                    <span>Total Spent</span>
                    <strong>{formatCurrency(filteredTotal)}</strong>
                  </div>
                </div>

                <div className="category-legend">
                  {categoryData.map((category, index) => {
                    const colors = [
                      '#35649A',
                      '#5BA7A7',
                      '#F0B35A',
                      '#8B78C6',
                      '#E17B77',
                    ]

                    const percentage =
                      filteredTotal > 0
                        ? (category.value / filteredTotal) * 100
                        : 0

                    return (
                      <div className="category-legend-item" key={category.name}>
                        <span
                          className="category-legend-dot"
                          style={{
                            backgroundColor:
                              colors[index % colors.length],
                          }}
                        />

                        <div className="category-legend-details">
                          <span>{category.name}</span>
                          <strong>{formatCurrency(category.value)}</strong>
                          <small>{percentage.toFixed(1)}% of spending</small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="category-chart-empty">
                <p>No expenses for this period yet.</p>
                <span>Add an expense to see your spending breakdown.</span>
              </div>
            )}
          </div>

        </section>


        <section className="expenses-section">
          <div className="section-heading">
            <div>
              <h2>Recent Expenses</h2>
              <p>Your latest spending activity</p>
            </div>

            <span className="expense-count">
              {expenses.length}{' '}
              {expenses.length === 1 ? 'expense' : 'expenses'}
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                ₱
              </div>

              <h3>No expenses yet</h3>

              <p>
                Start tracking your money by adding your first expense.
              </p>

              <button
                className="empty-button"
                type="button"
                onClick={() => setIsFormOpen(true)}
              >
                ＋ Add your first expense
              </button>
            </div>
          ) : (
            <div className="expense-list">
              {expenses.map((expense) => (
                <article className="expense-item" key={expense.id}>
                  <div
                    className="expense-item-icon"
                    aria-hidden="true"
                  >
                    ₱
                  </div>

                  <div className="expense-item-details">
                    <h3>{expense.note || expense.category}</h3>
                    <p>
                      {expense.category} · {expense.date}
                    </p>
                  </div>

                  <div className="expense-item-actions">
                    <strong>
                      {formatCurrency(expense.amount)}
                    </strong>

                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => handleDeleteExpense(expense.id)}
                      aria-label={`Delete ${
                        expense.note || expense.category
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {isFormOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsFormOpen(false)
            }
          }}
        >
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">RECORD YOUR SPENDING</p>
                <h2 id="expense-form-title">Add Expense</h2>
              </div>

              <button
                className="close-button"
                type="button"
                aria-label="Close form"
                onClick={() => setIsFormOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="expense-form"
              onSubmit={handleAddExpense}
            >
              <div className="form-field">
                <label htmlFor="amount">Amount (₱)</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  defaultValue="Food"
                  required
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Bills">Bills</option>
                  <option value="Fun">Fun</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="note">
                  Note <span className="optional-label">(optional)</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows="3"
                  placeholder="What did you spend on?"
                />
              </div>

              <div className="form-actions">
                <button
                  className="cancel-button"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="add-button save-button"
                  type="submit"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="footer">
        <p>PocketTrack · Your personal spending companion</p>
      </footer>
    </main>
  )
}

export default App
