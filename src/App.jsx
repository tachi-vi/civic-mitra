import React, { useState } from "react";
import "./App.css";
import MyIssues from "./pages/MyIssues";
import Community from "./pages/Community";
import Account from "./pages/Account";
import { FiHome, FiMessageSquare, FiUser } from "react-icons/fi";

function App() {
  const [page, setPage] = useState("myissues");

  return (
    <div className="app">
      <main className="content">
        {page === "myissues" && <MyIssues />}
        {page === "community" && <Community />}
        {page === "account" && <Account />}
      </main>

      <nav className="bottom-nav">
        <button onClick={() => setPage("myissues")} className={page === "myissues" ? "selected" : ""}>
          <FiHome />
          <span>My Issues</span>
        </button>
        <button onClick={() => setPage("community")} className={page === "community" ? "selected" : ""}>
          <FiMessageSquare />
          <span>Community</span>
        </button>
        <button onClick={() => setPage("account")} className={page === "account" ? "selected" : ""}>
          <FiUser />
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
