import React from 'react'
import loadingSvg from "../../../public/assets/img/loader.svg"

const MainLoader =({message})=>{
    return(
        <div className='main-loader d-flex flex-column'>
        <img src={loadingSvg.src}/>
        </div>

    )
}

export default MainLoader;
