import React from 'react'
import { Row, Col } from "react-bootstrap";


const CalendarComponent = (props) => {
  const {dates} = props
  // Convert the date strings to Date objects
  const dateObjects = dates.map(dateString => new Date(dateString));

  // Organize data by month
  const monthsData = dateObjects.reduce((acc, date) => {
    const month = date.getMonth();
    const year = date.getFullYear()
    if (!acc[month]) {
      acc[month] = { days: {}, monthName: date.toLocaleString('en-GB', { month: 'short' }), yearName : year };
    }
    const dayOfWeek = date.toLocaleString('en-GB', { weekday: 'short' });
    if (!acc[month].days[dayOfWeek]) {
      acc[month].days[dayOfWeek] = [];
    }
    acc[month].days[dayOfWeek].push(date.getDate());
    return acc;
  }, {});

  return (
    <>
    <Row>
      {Object.values(monthsData).map((monthData, index) => (
         <Col key={index} md={Object.keys(monthData.days).length > 4 ? 4 : Object.keys(monthData.days).length <= 3 ? 2 : 3} className='mb-2'>
         <table className='table-bordered mg-t-10  wd-100p'>
               <tbody style={{verticalAlign:'top'}}>
               <tr className=''>
                 <td colSpan='7' className='text-center tx-10 text-primary main-content-label pd-3'>{monthData.monthName} {monthData.yearName}</td>
               </tr>
               <tr className='text-dark bg-primary-transparent'>
                 {Object.keys(monthData.days).map((dayOfWeek, dayIndex) => (
                   <td key={dayIndex} className='text-center tx-9 main-content-label pd-2'>{dayOfWeek}</td>
                 ))}
               </tr> 
           
               <tr className='text-dark bg-transparent'>
                 {Object.values(monthData.days).map((dates, dayIndex) => (
                   <td key={dayIndex} className='text-center'>
                     {dates.map((day, subIndex) => (
                       <div key={subIndex} className='pd-3 tx-11'>{day}</div>
                     ))}
                   </td>
                 ))}
               </tr>
             </tbody>
           </table> 
       </Col>
      ))}
      </Row> 
    </>
  );
};


export default CalendarComponent