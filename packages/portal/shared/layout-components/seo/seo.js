import React from 'react'
import Head from "next/head"
import favicon from "../../../public/assets/img/brand/favicon.png"

const Seo = ({title}) => {
  let i = `siberSIM - ${title}`
  return (
    <Head>
        <title>{i}</title>
        <link rel="icon" href={favicon.src} />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
    </Head>
  )
}

export default Seo