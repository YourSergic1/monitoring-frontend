import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import OrganizationsPage from './pages/OrganizationsPage'
import './App.css'

function App() {
    return (
        <ThemeProvider>
            <Router>
                <div className="app-wrapper">
                    <Header />
                    <main className="app-content">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/organizations" element={<OrganizationsPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    )
}

export default App