import React, { useEffect } from 'react'

const Authenticationlayout = ({ children }) => {
  useEffect(()=>{
    document.querySelector("body").classList.add("ltr", "main-body", "leftmenu", "error-1")
  })
  return (
    <>
    <div>{ children }</div>
    </>
  )
}

export default Authenticationlayout