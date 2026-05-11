import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import OrganizationsPage from './pages/OrganizationsPage'
import CreateOrganizationPage from './pages/CreateOrganizationPage'
import OrganizationsListPage from './pages/OrganizationsListPage'
import OrganizationDetailsPage from './pages/OrganizationDetailsPage'
import OrganizationEditPage from './pages/OrganizationEditPage'
import OrganizationsMetricsPage from './pages/OrganizationsMetricsPage'
import AgentsPage from './pages/AgentsPage'
import AgentMetricsPage from './pages/AgentMetricsPage'
import DutyCalendarPage from './pages/DutyCalendarPage'
import UsersListPage from './pages/UsersListPage'
import CreateUserPage from './pages/CreateUserPage'
import UsersPage from './pages/UsersPage'
import UserDetailsPage from './pages/UserDetailsPage'
import EditUserPage from './pages/EditUserPage'
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
                            <Route path="/organizations/edit/:id" element={<OrganizationEditPage />} />
                            <Route path="/organizations/metrics" element={<OrganizationsMetricsPage/>} />
                            <Route path="/organizations/:orgId/agents" element={<AgentsPage />} />
                            <Route path="/agents/:agentId/metrics" element={<AgentMetricsPage />} />
                            <Route path="/calendar" element={<DutyCalendarPage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/users/list" element={<UsersListPage />} />
                            <Route path="/users/create" element={<CreateUserPage />} />
                            <Route path="/users/:userId" element={<UserDetailsPage />} />
                            <Route path="/users/:userId/edit" element={<EditUserPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ThemeProvider>
    )
}

export default App