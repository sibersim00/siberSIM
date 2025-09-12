import React from 'react'

export const y_m_d = (date) => {
    const selectedDate = new Date(date);
    const formattedDate = selectedDate.getFullYear()+"-"+("0" + (selectedDate.getMonth() + 1)).slice(-2)+"-"+("0" + selectedDate.getDate()).slice(-2);
    return formattedDate;
}

export const y_m_d_h_m_s = (date) => {
    const selectedDate = new Date(date);
    const formattedDate = selectedDate.getFullYear()+"-"+("0" + (selectedDate.getMonth() + 1)).slice(-2)+"-"+("0" + selectedDate.getDate()).slice(-2)+" "+selectedDate.getHours()+":"+selectedDate.getMinutes()+":"+selectedDate.getSeconds();
    return formattedDate;
  };

export const y_m = (date) => {
    const selectedDate = new Date(date);
    const formattedDate = selectedDate.getFullYear()+"-"+("0" + (selectedDate.getMonth() + 1)).slice(-2);
    return formattedDate;
}


export const d_m_y_h_m_s = (date='') => {
    let dt = date ? new Date(date) : new Date()

    const selectedDate = dt;

    const formattedDate = ("0" + selectedDate.getDate()).slice(-2)+"-"+("0" + (selectedDate.getMonth() + 1)).slice(-2)+"-"+selectedDate.getFullYear()+" "+selectedDate.getHours()+"_"+selectedDate.getMinutes()+"_"+selectedDate.getSeconds();
    return formattedDate;
  };

  export const d_m_y_h_m_am_pm = (date='') => {
    let dt = date ? new Date(date) : new Date();

    const selectedDate = dt;

    const day = ("0" + selectedDate.getDate()).slice(-2);
    const month = ("0" + (selectedDate.getMonth() + 1)).slice(-2);
    const year = selectedDate.getFullYear();
    let hours = selectedDate.getHours();
    const minutes = ("0" + selectedDate.getMinutes()).slice(-2);
    const seconds = ("0" + selectedDate.getSeconds()).slice(-2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;

    return formattedDate;
};

export const d_m_y= (date) => {
    const selectedDate = new Date(date);
    const formattedDate = ("0" + selectedDate.getDate()).slice(-2)+"-"+("0" + (selectedDate.getMonth() + 1)).slice(-2)+"-"+selectedDate.getFullYear();
    return formattedDate;
}
export const d_mmm_y= (date) => {
  const selectedDate = new Date(date); 
  const day = ("0" + selectedDate.getDate()).slice(-2);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[selectedDate.getMonth()];
  const year = selectedDate.getFullYear();
  
  const formattedDate = `${day} ${month} ${year}`;
    return formattedDate;
}

export const d_mmm= (date) => {
  const selectedDate = new Date(date); 
  const day = ("0" + selectedDate.getDate()).slice(-2);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[selectedDate.getMonth()];
  
  
  const formattedDate = `${day} ${month}`;
    return formattedDate;
}