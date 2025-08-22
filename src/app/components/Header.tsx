import React from 'react'
import { PrimaryButton } from './Button'

export default function Header() {
  return (<div>
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-6">
          <div className="w-8 h-8 grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-black rounded-full"></div>
            ))}
          </div>
          <span className="text-xl font-medium text-black">MYLE AI </span>
        </div>
       <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex space-x-8 text-sm">
          <a href="#features" className="cursor-pointer  text-black hover:text-gray-700">Product</a>
          <a href="#criteria" className="cursor-pointer  text-black hover:text-gray-700">Criteria</a>
          <a href="#about" className="cursor-pointer     text-black hover:text-gray-700">About</a>
        </nav>

        <a href="#features" className="no-underline">
          <PrimaryButton>
            Analyze Now
          </PrimaryButton>
        </a>
      </header>

  </div>
  )
}
