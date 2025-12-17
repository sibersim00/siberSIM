import dynamic from 'next/dynamic';
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'

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