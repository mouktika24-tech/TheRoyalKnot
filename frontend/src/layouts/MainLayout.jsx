import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar.jsx'
import Sidebar from '../components/common/Sidebar.jsx'

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-creamIvory text-slateNavy">
      <Navbar />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
