import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import OrganizationsPage from './pages/OrganizationsPage'
import CreateOrganizationPage from './pages/CreateOrganizationPage'
import OrganizationsListPage from './pages/OrganizationsListPage'
import OrganizationDetailsPage from './pages/OrganizationDetailsPage'
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
                            <Route path="/organizations/new" element={<CreateOrganizationPage />} />
                            <Route path="/organizations/list" element={<OrganizationsListPage />} />
                            <Route path="/organizations/details/:id" element={<OrganizationDetailsPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    )
}

export default App