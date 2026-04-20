import { useState } from "react"

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.icon}>🔍</div>
      <input
        type="text"
        placeholder="Cari berdasarkan nama atau deskripsi..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
      />
      <button type="submit" style={styles.btnSearch}>
        Cari
      </button>
      {query && (
        <button type="button" style={styles.btnReset} onClick={() => { setQuery(""); onSearch(""); }}>
          Reset
        </button>
      )}
    </form>
  )
}

const styles = {
  form: {
    backgroundColor: "white",
    padding: "0.8rem 1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "1px solid #e0e0e0",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
  },
  icon: {
    padding: "0 0.5rem",
    fontSize: "1.2rem",
    color: "#888",
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.5rem",
    fontSize: "1rem",
    outline: "none",
  },
  btnSearch: {
    padding: "0.6rem 1.5rem",
    backgroundColor: "#1F4E79",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnReset: {
    padding: "0.6rem 1.5rem",
    backgroundColor: "#f0f2f5",
    color: "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }
}

export default SearchBar