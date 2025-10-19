import React from 'react'

const toastStyles = {
  success: 'bg-green-500/90',
  error: 'bg-red-500/90',
  info: 'bg-blue-500/90'
}

function Toast({ message, type }) {
  return (
    <div className={`fixed top-4 right-4 ${toastStyles[type]} text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm z-50 animate-slide-in`}>
      {message}
    </div>
  )
}

export default Toast
