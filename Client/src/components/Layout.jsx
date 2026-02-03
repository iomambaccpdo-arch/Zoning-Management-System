import React from 'react'
import Sidebar from './Sidebar'

/**
 * Pure shell: Sidebar + children. No route checks, no auth guards, no <main> wrapper.
 * Always renders {children}; never blocks or hides them.
 */
function Layout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div
        className="layout__content"
        style={{ minWidth: 0, overflow: 'auto' }}
      >
        {children}
      </div>
    </div>
  )
}

export default Layout
