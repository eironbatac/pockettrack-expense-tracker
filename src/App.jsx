
import { useEffect, useState } from 'react'
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

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [expenses, setExpenses] = useState(loadExpenses)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    } catch (error) {
      console.error('Could not save PocketTrack expenses:', error)
    }
  }, [expenses])

  const today = new Date().toLocaleDateString('en-CA')

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)

  const todaysTotal = expenses
    .filter((expense) => expense.date === today)
    .reduce((total, expense) => total + expense.amount, 0)

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
