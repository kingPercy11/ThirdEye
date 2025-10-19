import React from 'react'
import WebsiteCard from './WebsiteCard'

function WebsiteGrid({ websites }) {
  return (
    <div className="grid gap-6">
      {websites.map(website => (
        <WebsiteCard key={website._id} website={website} />
      ))}
    </div>
  )
}

export default WebsiteGrid
